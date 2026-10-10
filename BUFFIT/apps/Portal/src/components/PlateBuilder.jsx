import { useState } from 'react';

export function PlateBuilder({ menuOptions, onSubmitOrder }) {
  const [plate, setPlate] = useState({
    protein: '',
    carbs: [],
    pickupLocation: 'Comedor Central',
    pickupTimeRange: '12:00 - 12:30 PM',
  });

  const handleCarbsChange = (option) => {
    if (plate.carbs.includes(option)) {
      setPlate({ ...plate, carbs: plate.carbs.filter((item) => item !== option) });
    } else if (plate.carbs.length < 2) {
      setPlate({ ...plate, carbs: [...plate.carbs, option] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!plate.protein || plate.carbs.length === 0) {
      alert('Por favor arma tu plato completo (1 proteína y al menos 1 carbohidrato)');
      return;
    }
    onSubmitOrder(plate);
  };

  return (
    <form className="plate-builder-card" onSubmit={handleSubmit}>
      <h3>Arma tu Plato BUFF/T</h3>

      {/* Selección de Proteína (Máximo 1) */}
      <div className="section">
        <h4>1. Selecciona tu Proteína (1 porción):</h4>
        {menuOptions.proteins.map((item) => (
          <label key={item.id} className="radio-label">
            <input
              type="radio"
              name="protein"
              value={item.name}
              onChange={(e) => setPlate({ ...plate, protein: e.target.value })}
            />
            {item.name}
          </label>
        ))}
      </div>

      {/* Selección de Carbohidratos (Máximo 2) */}
      <div className="section">
        <h4>2. Selecciona tus Carbohidratos (Hasta 2 porciones):</h4>
        {menuOptions.carbs.map((item) => (
          <label key={item.id} className="checkbox-label">
            <input
              type="checkbox"
              value={item.name}
              checked={plate.carbs.includes(item.name)}
              onChange={() => handleCarbsChange(item.name)}
            />
            {item.name}
          </label>
        ))}
      </div>

      {/* Detalles de Recogida */}
      <div className="section">
        <h4>3. Datos de Recogida:</h4>
        <select
          value={plate.pickupLocation}
          onChange={(e) => setPlate({ ...plate, pickupLocation: e.target.value })}
        >
          <option value="Comedor Central">Comedor Central (UNAL)</option>
          <option value="Comedor Hemeroteca">Comedor Hemeroteca</option>
        </select>

        <select
          value={plate.pickupTimeRange}
          onChange={(e) => setPlate({ ...plate, pickupTimeRange: e.target.value })}
        >
          <option value="11:30 - 12:00 PM">11:30 AM - 12:00 PM</option>
          <option value="12:00 - 12:30 PM">12:00 PM - 12:30 PM</option>
          <option value="12:30 - 01:00 PM">12:30 PM - 01:00 PM</option>
        </select>
      </div>

      <button type="submit" className="btn-primary">
        Confirmar y Generar Orden
      </button>
    </form>
  );
}