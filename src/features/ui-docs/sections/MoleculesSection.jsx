import { useState } from "react";
import {
  DateRangePicker,
  Carousel,
  ComponentDemo,
} from "../../../components/common";
import { ComponentSection } from "../components";
import { useUIDocsTranslation } from "../../../hooks/useUIDocsTranslation";

export default function MoleculesSection({ selectedSize, id = "molecules" }) {
  const { t } = useUIDocsTranslation();

  // Estados para diferentes variantes del DatePicker
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [singleDate, setSingleDate] = useState(null);
  const [dateWithPricing, setDateWithPricing] = useState({
    startDate: null,
    endDate: null,
  });

  // Datos de ejemplo para precios
  const samplePricing = {
    "2025-08-28": 120,
    "2025-08-29": 135,
    "2025-08-30": 150,
    "2025-08-31": 95,
    "2025-09-01": 110,
    "2025-09-02": 125,
    "2025-09-03": 140,
  };

  // Fechas deshabilitadas de ejemplo
  const disabledDates = [
    new Date(2025, 7, 25), // 25 de agosto
    new Date(2025, 7, 26), // 26 de agosto
  ];

  const carouselImages = [
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502775789162-9f8e7bb65ab2?w=800&h=600&fit=crop",
  ];

  return (
    <ComponentSection
      id={id}
      title={t("sections.molecules.title")}
      description={t("sections.molecules.description")}
      className="scroll-mt-8"
    >
      {/* DatePicker Básico (Rango) */}
      <ComponentDemo
        id="molecules-dateRangePicker-basic"
        title={t("sections.molecules.components.dateRangePicker.title")}
        description={t(
          "sections.molecules.components.dateRangePicker.description"
        )}
        code={`// DatePicker en modo rango (por defecto)
const [dateRange, setDateRange] = useState({
  startDate: null,
  endDate: null
});

<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  placeholder="Seleccionar fechas"
/>`}
        size={selectedSize}
      >
        <div className="space-y-4">
          <DateRangePicker
            mode="range"
            value={dateRange}
            onChange={setDateRange}
            placeholder="Seleccionar fechas"
          />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dateRange.startDate
              ? `Desde: ${dateRange.startDate.toLocaleDateString()} ${
                  dateRange.endDate
                    ? `- Hasta: ${dateRange.endDate.toLocaleDateString()}`
                    : ""
                }`
              : "No hay fechas seleccionadas"}
          </div>
        </div>
      </ComponentDemo>

      {/* DatePicker Fecha Única */}
      <ComponentDemo
        id="molecules-dateRangePicker-single"
        title="DatePicker - Fecha Única"
        description="Selector de fecha única con cierre automático al seleccionar"
        code={`// DatePicker en modo fecha única
const [singleDate, setSingleDate] = useState(null);

<DateRangePicker
  mode="single"
  value={singleDate}
  onChange={setSingleDate}
  placeholder="Seleccionar fecha"
  closeOnSelect={true} // Se cierra automáticamente
/>`}
        size={selectedSize}
      >
        <div className="space-y-4">
          <DateRangePicker
            mode="single"
            value={singleDate}
            onChange={setSingleDate}
            placeholder="Seleccionar fecha"
            closeOnSelect={true}
          />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {singleDate
              ? `Fecha seleccionada: ${singleDate.toLocaleDateString()}`
              : "No hay fecha seleccionada"}
          </div>
        </div>
      </ComponentDemo>

      {/* DatePicker con Precios */}
      <ComponentDemo
        id="molecules-dateRangePicker-pricing"
        title="DatePicker - Con Precios"
        description="DatePicker que muestra precios por noche en cada fecha"
        code={`// DatePicker con precios por fecha
const samplePricing = {
  "2025-08-28": 120,
  "2025-08-29": 135,
  "2025-08-30": 150,
  "2025-08-31": 95,
  "2025-09-01": 110,
  "2025-09-02": 125,
  "2025-09-03": 140,
};

<DateRangePicker
  mode="range"
  value={dateWithPricing}
  onChange={setDateWithPricing}
  pricing={samplePricing}
  showPrices={true}
  placeholder="Seleccionar fechas con precios"
/>`}
        size={selectedSize}
      >
        <div className="space-y-4">
          <DateRangePicker
            mode="range"
            value={dateWithPricing}
            onChange={setDateWithPricing}
            pricing={samplePricing}
            showPrices={true}
            placeholder="Seleccionar fechas con precios"
          />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {dateWithPricing.startDate && dateWithPricing.endDate
              ? `Fechas: ${dateWithPricing.startDate.toLocaleDateString()} - ${dateWithPricing.endDate.toLocaleDateString()}`
              : "Selecciona un rango para ver el total"}
          </div>
        </div>
      </ComponentDemo>

      {/* DatePicker Un Solo Mes */}
      <ComponentDemo
        id="molecules-dateRangePicker-single-month"
        title="DatePicker - Un Solo Mes"
        description="DatePicker configurado para mostrar solo un mes"
        code={`// DatePicker con un solo mes
<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  numberOfMonths={1}
  placeholder="Un solo mes"
/>`}
        size={selectedSize}
      >
        <DateRangePicker
          mode="range"
          value={dateRange}
          onChange={setDateRange}
          numberOfMonths={1}
          placeholder="Un solo mes"
        />
      </ComponentDemo>

      {/* DatePicker Dos Meses */}
      <ComponentDemo
        id="molecules-dateRangePicker-double-month"
        title="DatePicker - Dos Meses"
        description="DatePicker configurado para mostrar dos meses lado a lado"
        code={`// DatePicker con dos meses
<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  numberOfMonths={2}
  placeholder="Dos meses"
/>`}
        size={selectedSize}
      >
        <DateRangePicker
          mode="range"
          value={dateRange}
          onChange={setDateRange}
          numberOfMonths={2}
          placeholder="Dos meses"
        />
      </ComponentDemo>

      {/* DatePicker con Fechas Deshabilitadas */}
      <ComponentDemo
        id="molecules-dateRangePicker-disabled-dates"
        title="DatePicker - Fechas Deshabilitadas"
        description="DatePicker con fechas específicas deshabilitadas"
        code={`// DatePicker con fechas deshabilitadas
const disabledDates = [
  new Date(2025, 7, 25), // 25 de agosto
  new Date(2025, 7, 26), // 26 de agosto
];

<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  disabledDates={disabledDates}
  placeholder="Con fechas deshabilitadas"
/>`}
        size={selectedSize}
      >
        <DateRangePicker
          mode="range"
          value={dateRange}
          onChange={setDateRange}
          disabledDates={disabledDates}
          placeholder="Con fechas deshabilitadas"
        />
      </ComponentDemo>

      {/* DatePicker Inline (Embebido) */}
      <ComponentDemo
        id="molecules-dateRangePicker-inline"
        title="DatePicker - Inline (Embebido)"
        description="DatePicker embebido sin trigger, siempre visible"
        code={`// DatePicker embebido (siempre visible)
<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  inline={true}
  numberOfMonths={2}
/>`}
        size={selectedSize}
      >
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <DateRangePicker
            mode="range"
            value={dateRange}
            onChange={setDateRange}
            inline={true}
            numberOfMonths={2}
          />
        </div>
      </ComponentDemo>

      {/* DatePicker con Trigger Personalizado */}
      <ComponentDemo
        id="molecules-dateRangePicker-custom-trigger"
        title="DatePicker - Trigger Personalizado"
        description="DatePicker con botón trigger completamente personalizado"
        code={`// DatePicker con trigger personalizado
<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  renderTrigger={({ open, toggle, formatted }) => (
    <button
      onClick={toggle}
      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
    >
      {formatted || "Abrir Calendario"} 
      {open ? " 📅" : " 🗓️"}
    </button>
  )}
/>`}
        size={selectedSize}
      >
        <DateRangePicker
          mode="range"
          value={dateRange}
          onChange={setDateRange}
          renderTrigger={({ open, toggle, formatted }) => (
            <button
              onClick={toggle}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              {formatted || "Abrir Calendario"}
              {open ? " 📅" : " 🗓️"}
            </button>
          )}
        />
      </ComponentDemo>

      {/* DatePicker con Restricciones de Fecha */}
      <ComponentDemo
        id="molecules-dateRangePicker-date-restrictions"
        title="DatePicker - Con Restricciones"
        description="DatePicker con fechas mínimas y máximas permitidas"
        code={`// DatePicker con restricciones de fecha
const minDate = new Date(); // Hoy
const maxDate = new Date();
maxDate.setMonth(maxDate.getMonth() + 6); // 6 meses desde hoy

<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  minDate={minDate}
  maxDate={maxDate}
  placeholder="Solo próximos 6 meses"
/>`}
        size={selectedSize}
      >
        <DateRangePicker
          mode="range"
          value={dateRange}
          onChange={setDateRange}
          minDate={new Date()}
          maxDate={(() => {
            const max = new Date();
            max.setMonth(max.getMonth() + 6);
            return max;
          })()}
          placeholder="Solo próximos 6 meses"
        />
      </ComponentDemo>

      {/* DatePicker con Fechas Disponibles Específicas */}
      <ComponentDemo
        id="molecules-dateRangePicker-available-dates"
        title="DatePicker - Fechas Disponibles"
        description="DatePicker que solo permite seleccionar fechas específicas"
        code={`// DatePicker con fechas disponibles específicas
const availableDates = [
  new Date(2025, 7, 28),
  new Date(2025, 7, 29),
  new Date(2025, 7, 30),
  new Date(2025, 8, 1),
  new Date(2025, 8, 2),
  new Date(2025, 8, 5),
];

<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  availableDates={availableDates}
  placeholder="Solo fechas específicas"
/>`}
        size={selectedSize}
      >
        <DateRangePicker
          mode="range"
          value={dateRange}
          onChange={setDateRange}
          availableDates={[
            new Date(2025, 7, 28),
            new Date(2025, 7, 29),
            new Date(2025, 7, 30),
            new Date(2025, 8, 1),
            new Date(2025, 8, 2),
            new Date(2025, 8, 5),
          ]}
          placeholder="Solo fechas específicas"
        />
      </ComponentDemo>

      <ComponentDemo
        id="molecules-carousel"
        title={t("sections.molecules.components.carousel.title")}
        description={t("sections.molecules.components.carousel.description")}
        code={`// Carrusel básico con controles
<Carousel
  images={carouselImages}
  aspectRatio="16/9"
  showDots
  showArrows
  autoPlay={false}
  loop
/>

// Carrusel automático con control de velocidad
<Carousel
  images={carouselImages}
  aspectRatio="4/3"
  showDots={true}
  showArrows={true}
  autoPlay={true}
  autoPlayInterval={5000}
  loop
/>

// Carrusel con miniaturas
<Carousel
  images={carouselImages}
  aspectRatio="16/9"
  showThumbnails
  showDots={false}
  showArrows
/>

// Carrusel responsivo
<Carousel
  images={carouselImages}
  aspectRatio="1/1"
  showDots
  showArrows
  autoPlay={false}
  className="md:aspect-video"
  loop
/>`}
        size={selectedSize}
      >
        <div className="space-y-8">
          {/* Carrusel con controles completos */}
          <div className="w-full max-w-2xl">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Carrusel completo con controles y puntos
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="16/9"
              showDots
              showArrows
              autoPlay={false}
              loop={false}
            />
          </div>

          {/* Carrusel automático con control de velocidad */}
          <div className="w-full max-w-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Autoplay con controles de velocidad
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="4/3"
              showDots={true}
              showArrows={true}
              autoPlay={true}
              autoPlayInterval={5000}
              loop
            />
          </div>

          {/* Carrusel con miniaturas */}
          <div className="w-full max-w-2xl">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Con miniaturas navegables
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="16/9"
              showThumbnails
              showDots={false}
              showArrows
            />
          </div>

          {/* Carrusel cuadrado para móviles */}
          <div className="w-full max-w-md">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Formato cuadrado (ideal móviles)
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="1/1"
              showDots
              showArrows
              autoPlay={false}
              loop
            />
          </div>

          {/* Información adicional */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              📝 Características del Carousel:
            </h5>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• ✨ Soporte para touch/swipe en móviles</li>
              <li>• 🎯 Navegación con teclado (arrows, tab)</li>
              <li>• 📱 Completamente responsivo</li>
              <li>• ⚡ Lazy loading de imágenes</li>
              <li>• 🔄 Autoplay configurable con velocidad</li>
              <li>• ⏸️ Botón play/pause en autoplay</li>
              <li>• 🖼️ Miniaturas opcionales</li>
              <li>• ♾️ Loop infinito</li>
              <li>• 🎨 Múltiples aspectos de ratio</li>
              <li>• 🖱️ Pause automático al hover</li>
            </ul>
          </div>
        </div>
      </ComponentDemo>
    </ComponentSection>
  );
}
