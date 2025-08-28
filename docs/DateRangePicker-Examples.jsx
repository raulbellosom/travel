// DateRangePicker - Ejemplos de Código Listos para Usar

import { useState } from "react";
import { DateRangePicker } from "./components/common";

// ============================================================================
// 1. EJEMPLO BÁSICO - RANGO DE FECHAS
// ============================================================================
function BasicRangeExample() {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  return (
    <DateRangePicker
      mode="range"
      value={dateRange}
      onChange={setDateRange}
      placeholder="Seleccionar fechas"
    />
  );
}

// ============================================================================
// 2. EJEMPLO FECHA ÚNICA CON CIERRE AUTOMÁTICO
// ============================================================================
function SingleDateExample() {
  const [singleDate, setSingleDate] = useState(null);

  return (
    <DateRangePicker
      mode="single"
      value={singleDate}
      onChange={setSingleDate}
      placeholder="Seleccionar fecha"
      closeOnSelect={true}
    />
  );
}

// ============================================================================
// 3. EJEMPLO CON PRECIOS POR NOCHE
// ============================================================================
function PricingExample() {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const pricing = {
    "2025-08-28": 120,
    "2025-08-29": 135,
    "2025-08-30": 150,
    "2025-08-31": 95,
    "2025-09-01": 110,
    "2025-09-02": 125,
    "2025-09-03": 140,
  };

  // Calcular precio total
  const getTotalPrice = () => {
    if (!dateRange.startDate || !dateRange.endDate) return 0;

    let total = 0;
    const current = new Date(dateRange.startDate);

    while (current < dateRange.endDate) {
      const dateKey = current.toISOString().split("T")[0];
      total += pricing[dateKey] || 0;
      current.setDate(current.getDate() + 1);
    }

    return total;
  };

  return (
    <div>
      <DateRangePicker
        mode="range"
        value={dateRange}
        onChange={setDateRange}
        pricing={pricing}
        showPrices={true}
        placeholder="Seleccionar fechas con precios"
      />
      {dateRange.startDate && dateRange.endDate && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold">Resumen de Reserva</h3>
          <p>Desde: {dateRange.startDate.toLocaleDateString()}</p>
          <p>Hasta: {dateRange.endDate.toLocaleDateString()}</p>
          <p className="font-bold">Total: ${getTotalPrice()}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. EJEMPLO CALENDARIO EMBEBIDO (INLINE)
// ============================================================================
function InlineCalendarExample() {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Seleccionar Fechas</h3>
      <DateRangePicker
        mode="range"
        value={dateRange}
        onChange={setDateRange}
        inline={true}
        numberOfMonths={2}
      />
      {dateRange.startDate && (
        <div className="mt-4 text-sm text-gray-600">
          Seleccionado: {dateRange.startDate.toLocaleDateString()}
          {dateRange.endDate && ` - ${dateRange.endDate.toLocaleDateString()}`}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. EJEMPLO CON TRIGGER PERSONALIZADO
// ============================================================================
function CustomTriggerExample() {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  return (
    <DateRangePicker
      mode="range"
      value={dateRange}
      onChange={setDateRange}
      renderTrigger={({ open, toggle, formatted }) => (
        <button
          onClick={toggle}
          className={`
            px-6 py-3 rounded-lg font-medium transition-all duration-200
            ${
              open
                ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-md"
            }
          `}
        >
          <span className="flex items-center gap-2">
            {formatted || "📅 Seleccionar Fechas"}
            <span className="text-lg">{open ? "🗓️" : "📅"}</span>
          </span>
        </button>
      )}
    />
  );
}

// ============================================================================
// 6. EJEMPLO CON RESTRICCIONES DE FECHAS
// ============================================================================
function RestrictedDatesExample() {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // Solo próximos 3 meses
  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  // Fechas específicas deshabilitadas (fines de semana por ejemplo)
  const disabledDates = [];
  const current = new Date();
  for (let i = 0; i < 90; i++) {
    if (current.getDay() === 0 || current.getDay() === 6) {
      // Domingo o Sábado
      disabledDates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return (
    <div>
      <DateRangePicker
        mode="range"
        value={dateRange}
        onChange={setDateRange}
        minDate={minDate}
        maxDate={maxDate}
        disabledDates={disabledDates}
        placeholder="Solo días laborables próximos 3 meses"
      />
      <div className="mt-2 text-sm text-gray-500">
        * Solo se permiten días laborables (Lun-Vie) en los próximos 3 meses
      </div>
    </div>
  );
}

// ============================================================================
// 7. EJEMPLO CON FECHAS DISPONIBLES ESPECÍFICAS
// ============================================================================
function SpecificAvailableDatesExample() {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // Solo fechas específicas disponibles (simulando disponibilidad de hotel)
  const availableDates = [
    new Date(2025, 7, 28), // 28 agosto
    new Date(2025, 7, 29), // 29 agosto
    new Date(2025, 7, 30), // 30 agosto
    new Date(2025, 8, 1), // 1 septiembre
    new Date(2025, 8, 2), // 2 septiembre
    new Date(2025, 8, 5), // 5 septiembre
    new Date(2025, 8, 6), // 6 septiembre
    new Date(2025, 8, 7), // 7 septiembre
  ];

  return (
    <div>
      <DateRangePicker
        mode="range"
        value={dateRange}
        onChange={setDateRange}
        availableDates={availableDates}
        placeholder="Solo fechas disponibles"
      />
      <div className="mt-2 text-sm text-gray-500">
        * Solo las fechas resaltadas están disponibles
      </div>
    </div>
  );
}

// ============================================================================
// 8. EJEMPLO COMPLETO PARA RESERVAS DE HOTEL
// ============================================================================
function HotelBookingExample() {
  const [bookingData, setBookingData] = useState({
    checkIn: null,
    checkOut: null,
    guests: 2,
    room: "standard",
  });

  const roomPricing = {
    "2025-08-28": 150,
    "2025-08-29": 165,
    "2025-08-30": 180,
    "2025-08-31": 120,
    "2025-09-01": 135,
    "2025-09-02": 150,
    "2025-09-03": 165,
  };

  const handleDateChange = (dates) => {
    setBookingData((prev) => ({
      ...prev,
      checkIn: dates.startDate,
      checkOut: dates.endDate,
    }));
  };

  const calculateTotal = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 0;

    let total = 0;
    const current = new Date(bookingData.checkIn);

    while (current < bookingData.checkOut) {
      const dateKey = current.toISOString().split("T")[0];
      total += roomPricing[dateKey] || 100; // precio base 100
      current.setDate(current.getDate() + 1);
    }

    return total;
  };

  const nights =
    bookingData.checkIn && bookingData.checkOut
      ? Math.ceil(
          (bookingData.checkOut - bookingData.checkIn) / (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Reservar Hotel</h2>

      {/* Selector de Fechas */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fechas de Estadía
        </label>
        <DateRangePicker
          mode="range"
          value={{
            startDate: bookingData.checkIn,
            endDate: bookingData.checkOut,
          }}
          onChange={handleDateChange}
          pricing={roomPricing}
          showPrices={true}
          placeholder="Check-in / Check-out"
          numberOfMonths={2}
        />
      </div>

      {/* Selector de Huéspedes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Huéspedes
        </label>
        <select
          value={bookingData.guests}
          onChange={(e) =>
            setBookingData((prev) => ({
              ...prev,
              guests: parseInt(e.target.value),
            }))
          }
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={1}>1 Huésped</option>
          <option value={2}>2 Huéspedes</option>
          <option value={3}>3 Huéspedes</option>
          <option value={4}>4 Huéspedes</option>
        </select>
      </div>

      {/* Tipo de Habitación */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Habitación
        </label>
        <select
          value={bookingData.room}
          onChange={(e) =>
            setBookingData((prev) => ({ ...prev, room: e.target.value }))
          }
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="standard">Estándar</option>
          <option value="deluxe">Deluxe (+$30/noche)</option>
          <option value="suite">Suite (+$80/noche)</option>
        </select>
      </div>

      {/* Resumen */}
      {bookingData.checkIn && bookingData.checkOut && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Resumen de Reserva
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Check-in:</span>
              <span>{bookingData.checkIn.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out:</span>
              <span>{bookingData.checkOut.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Noches:</span>
              <span>{nights}</span>
            </div>
            <div className="flex justify-between">
              <span>Huéspedes:</span>
              <span>{bookingData.guests}</span>
            </div>
            <div className="flex justify-between">
              <span>Habitación:</span>
              <span className="capitalize">{bookingData.room}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${calculateTotal()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Botón de Reserva */}
      <button
        disabled={!bookingData.checkIn || !bookingData.checkOut}
        className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {bookingData.checkIn && bookingData.checkOut
          ? `Reservar por $${calculateTotal()}`
          : "Selecciona las fechas para continuar"}
      </button>
    </div>
  );
}

export {
  BasicRangeExample,
  SingleDateExample,
  PricingExample,
  InlineCalendarExample,
  CustomTriggerExample,
  RestrictedDatesExample,
  SpecificAvailableDatesExample,
  HotelBookingExample,
};
