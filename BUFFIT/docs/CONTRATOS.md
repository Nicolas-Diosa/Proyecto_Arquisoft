# Contratos entre componentes (BUFF/T)

Lo que se acuerda aquí es lo que permite que cada quien programe su parte sin esperar a los demás.
Si algo cambia, se cambia primero en este archivo y se avisa al equipo.

## 0. Flujo y puertos

```
Portal :3000 ──http──> AuthService :5000 ──http──> API gateway :8000 ──http──> gestores
                                                                              ├─ gestor-usuarios   :5001 ── PostgreSQL :5433
                                                                              ├─ gestor-pedidos    :5002 ── PostgreSQL :5434
                                                                              └─ gestor-inventario :5003 ── MongoDB   :27017
gestor-pedidos ──gRPC──> gestor-inventario :50051
```

* Solo el **Portal** y **AuthService** deben ser accesibles desde fuera de la red de Docker.
* Los servicios internos **no validan JWT**: confían en las cabeceras de identidad (sección 1).
* Ninguna URL va escrita en el código: todas salen de variables de entorno (`.env`).

## 1. Identidad entre servicios

AuthService valida el JWT y reenvía al gateway con estas cabeceras. **El gateway debe pasarlas sin modificarlas** y los gestores las leen:

| Cabecera | Valor |
|---|---|
| `X-User-Id` | id del usuario |
| `X-User-Role` | `CONSUMIDOR`, `PERSONAL` o `ADMIN` |
| `X-User-Email` | correo del usuario |

AuthService descarta cualquier `X-User-*` que mande el cliente, así que no se pueden falsificar desde el Portal.

Las llamadas internas de AuthService (login/registro) llevan `X-Internal-Caller: auth-service` y **no** llevan identidad de usuario (todavía no la hay).

## 2. Gestor de usuarios (lo implementa el compañero de usuarios)

Rutas **tal como las ve el gestor** (el gateway enruta `/users/*` hacia él).

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /users/by-email/{email}` | — | `200` usuario · `404` si no existe |
| `POST /users/verify-credentials` | `{"email","password"}` | `200` usuario · `401` si no coincide |
| `POST /users` | `{"email","name","role","category"}` | `201` usuario · `409` si ya existe |

Usuario:
```json
{"id": 7, "email": "ana@unal.edu.co", "name": "Ana", "role": "CONSUMIDOR",
 "status": "ACTIVO", "category": "SIN_CARNET"}
```
* `role`: `CONSUMIDOR` | `PERSONAL` | `ADMIN`
* `status`: `ACTIVO` | `SUSPENDIDO` (la cuenta suspendida no puede iniciar sesión)
* `category` (solo consumidores): `ESTUDIANTE_CON_APOYO` | `CARNET_SIN_APOYO` | `SIN_CARNET`
* **El hash de la contraseña nunca sale del gestor**; por eso existe `verify-credentials`.
* El rol sale siempre de la BD, no del dominio del correo.
* Personal y administradores se crean por datos semilla (o por el administrador); no se auto-registran.

Referencia ejecutable: `apps/auth-service/dev/mock_usuarios.py`.

## 3. AuthService (lo consume el Portal)

| Método y ruta | Quién | Cuerpo | Respuesta |
|---|---|---|---|
| `POST /auth/google` | consumidor | `{"id_token"}` | sesión, o `{"needs_registration": true, "registration_token", "categories": [...]}` |
| `POST /auth/register` | consumidor nuevo | `{"registration_token","category"}` | `201` sesión |
| `POST /auth/login` | personal / admin | `{"email","password"}` | sesión |
| `GET /auth/me` | cualquiera | — | `{id,email,name,role}` |
| `POST /auth/logout` | cualquiera | — | `204` (el Portal descarta el token) |
| `* /api/{ruta}` | cualquiera | lo que corresponda | se reenvía a `GATEWAY_URL/{ruta}` |

Sesión: `{"access_token","token_type":"Bearer","expires_in":28800,"user":{id,email,name,role}}`.
El Portal manda `Authorization: Bearer <access_token>` en todo lo demás. Ejemplo: el Portal pide `GET /api/inventory/comedor-central/2026-10-13/menu`.

Reglas: consumidores solo con Google y `@unal.edu.co`; personal con dominio `@comedores.buffit.test`; administrador con `@admin.buffit.test`. El JWT dura 8 h.

## 4. Gestor de inventario (rutas tal como las ve el gestor; el gateway enruta `/inventory/*`)

| Método y ruta | Rol | Descripción |
|---|---|---|
| `GET /inventory/{comedor}/{fecha}/menu` | cualquiera | menú del día agrupado por categoría, con cantidades |
| `PUT /inventory/{comedor}/{fecha}/items/{producto}` | PERSONAL | crea o edita un producto `{"nombre","categoria","cantidad","precio_cop"}` |
| `DELETE /inventory/{comedor}/{fecha}/items/{producto}` | PERSONAL | retira un producto del menú |
| `POST /inventory/{comedor}/{fecha}/report` | PERSONAL | cierra la jornada y genera el informe de sobrantes |
| `GET /inventory/{comedor}/{fecha}/report` | PERSONAL, ADMIN | consulta el informe |

* `fecha` = `YYYY-MM-DD` (zona America/Bogota). `comedor` y `producto`: minúsculas, números, `-` o `_`.
* **El menú del día es el inventario del día.** Precios en pesos enteros (`precio_cop`).

### gRPC pedidos → inventario (`proto/inventory.proto`)

* `ReserveItems(order_id, comedor_id, fecha, items[])`: descuenta todo o nada. Devuelve cada item con `precio_unitario_cop`, así que **el Gestor de pedidos calcula el total con esos precios**. Errores: `INSUFFICIENT_STOCK` (con `failed_producto_id`), `NOT_FOUND`, `INVALID`, `ALREADY_RELEASED`.
* `ReleaseItems(order_id)`: devuelve el stock. Se llama al cancelar un pedido y como compensación si algo falla después de reservar.
* Ambas son **idempotentes por `order_id`**: se pueden reintentar sin descontar dos veces. Por eso el `order_id` debe existir antes de reservar (generarlo en el Gestor de pedidos).

## 5. Convenciones

* Error: `{"error": {"code": "STOCK_INSUFICIENTE", "message": "texto legible"}}` con el código HTTP que corresponda.
* Estados de pedido (propuesta, a confirmar con quien hace pedidos): `SIN_ENTREGAR` | `ENTREGADA` | `CANCELADA`.
* Fechas y horas en ISO 8601.

## 6. Pendientes por decidir entre todos

1. **Precio según categoría del consumidor** (con apoyo / con carnet sin apoyo / sin carnet): ¿quién lo calcula y de dónde sale?
2. **Comedor asignado al personal**: hoy cualquier `PERSONAL` puede modificar el inventario de cualquier comedor. Cuando pedidos implemente "comedor asignado cada día", inventario debe validarlo.
3. **Cancelación de pedidos** (regla de 30 minutos): no está en los requisitos, pero el README la describe.
4. **Pago y punto de recogida**: ¿dentro o fuera del prototipo?
