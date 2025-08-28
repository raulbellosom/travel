import { useState } from "react";
import {
  DateRangePicker,
  Carousel,
  ComponentDemo,
  FormField,
  SearchBar,
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
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
  ];

  // Estados para FormField
  const [formFieldValue, setFormFieldValue] = useState("");
  const [formFieldError, setFormFieldError] = useState("");
  const [numberValue, setNumberValue] = useState(1);
  const [currencyValue, setCurrencyValue] = useState("");

  // Estados para SearchBar
  const [searchData, setSearchData] = useState(null);
  const [searchBarCollapsed, setSearchBarCollapsed] = useState(false);

  // Handlers para FormField
  const handleFormFieldChange = (value) => {
    setFormFieldValue(value);
    if (formFieldError) setFormFieldError("");
  };

  const handleFormFieldBlur = () => {
    if (!formFieldValue.trim()) {
      setFormFieldError("Este campo es obligatorio");
    }
  };

  // Handlers para SearchBar
  const handleSearch = (data) => {
    setSearchData(data);
    console.log("Search data:", data);
  };

  const handleTabChange = (tabId) => {
    console.log("Tab changed to:", tabId);
  };

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
        code={`// Carrusel completo con todos los controles
<Carousel
  images={carouselImages}
  aspectRatio="16/9"
  variant="default"
  showDots
  showArrows
  showCounter
  showPlayPause
  autoPlay={false}
/>

// Carrusel compacto para listings
<Carousel
  images={carouselImages}
  aspectRatio="4/3"
  variant="listing"
  showArrows
  showCounter
  autoPlay={false}
/>

// Carrusel mínimo sin controles
<Carousel
  images={carouselImages}
  aspectRatio="1/1"
  variant="minimal"
/>

// Carrusel con autoplay pausable
<Carousel
  images={carouselImages}
  aspectRatio="16/9"
  showDots
  showArrows
  showPlayPause
  autoPlay={true}
  autoPlayInterval={4000}
/>`}
        size={selectedSize}
      >
        <div className="space-y-8">
          {/* Carrusel Completo */}
          <div className="w-full max-w-2xl">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Carrusel Completo - Todos los Controles
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="16/9"
              variant="default"
              showDots
              showArrows
              showCounter
              showPlayPause
              autoPlay={false}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              ✨ Incluye flechas, puntos, contador y botón play/pause
            </p>
          </div>

          {/* Carrusel para Listings */}
          <div className="w-full max-w-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Carrusel para Listings - Optimizado
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="4/3"
              variant="listing"
              showArrows
              showCounter
              autoPlay={false}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              🏠 Perfecto para propiedades y productos
            </p>
          </div>

          {/* Carrusel Compacto */}
          <div className="w-full max-w-md">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Carrusel Compacto - Solo Esencial
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="3/2"
              variant="compact"
              showArrows
              showCounter
              autoPlay={false}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              📱 Ideal para espacios reducidos
            </p>
          </div>

          {/* Carrusel Mínimo */}
          <div className="w-full max-w-sm">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Carrusel Mínimo - Sin Controles
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="1/1"
              variant="minimal"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              🎯 Solo navegación táctil/swipe
            </p>
          </div>

          {/* Carrusel con AutoPlay */}
          <div className="w-full max-w-xl">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Carrusel con AutoPlay Pausable
            </h4>
            <Carousel
              images={carouselImages}
              aspectRatio="16/9"
              variant="default"
              showDots
              showArrows
              showCounter
              showPlayPause
              autoPlay={true}
              autoPlayInterval={4000}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              ⏯️ AutoPlay con control manual de pausa/reproducción
            </p>
          </div>

          {/* Información de Características */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
            <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <span className="text-xl">🎠</span>
              Características del Nuevo Carousel
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h6 className="font-medium text-blue-800 dark:text-blue-200">
                  🎯 Transiciones Mejoradas
                </h6>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                  <li>• ✨ Efecto de deslizamiento suave (sin fade)</li>
                  <li>• 🔄 Transiciones direccionales inteligentes</li>
                  <li>• 📱 Optimizado para touch/swipe</li>
                  <li>• ⚡ Animaciones fluidas con Framer Motion</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h6 className="font-medium text-blue-800 dark:text-blue-200">
                  🎨 Controles Rediseñados
                </h6>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                  <li>• 🎯 Flechas con diseño glassmorphism</li>
                  <li>• 📊 Contador estilizado y moderno</li>
                  <li>• 🔘 Puntos indicadores mejorados</li>
                  <li>• ⏯️ Botón play/pause integrado</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h6 className="font-medium text-blue-800 dark:text-blue-200">
                  🔧 Variantes Flexibles
                </h6>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                  <li>
                    • 🏠 <code>listing</code>: Para propiedades
                  </li>
                  <li>
                    • 📱 <code>compact</code>: Para espacios pequeños
                  </li>
                  <li>
                    • 🎯 <code>minimal</code>: Solo swipe
                  </li>
                  <li>
                    • 🎨 <code>default</code>: Funcionalidad completa
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h6 className="font-medium text-blue-800 dark:text-blue-200">
                  ♿ Accesibilidad
                </h6>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                  <li>• ⌨️ Navegación completa por teclado</li>
                  <li>• 🔊 Labels ARIA apropiados</li>
                  <li>• 🎯 Focus management optimizado</li>
                  <li>• 📱 Soporte completo para screen readers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ejemplo de Uso en Listing */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              💡 Ejemplo: Uso en Listing de Propiedades
            </h5>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="w-full max-w-xs mx-auto">
                <Carousel
                  images={carouselImages}
                  aspectRatio="4/3"
                  variant="listing"
                  showArrows
                  showCounter
                  autoPlay={false}
                  className="mb-3"
                />
                <div className="space-y-2">
                  <h6 className="font-semibold text-gray-900 dark:text-gray-100">
                    Casa Moderna en el Centro
                  </h6>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    3 hab • 2 baños • 120m²
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    $450,000
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ComponentDemo>

      {/* FormField */}
      <ComponentDemo
        id="molecules-formField-basic"
        title="FormField - Campo de Formulario Completo"
        description="Wrapper completo para campos de formulario con label, helper text, errores y estados de validación"
        code={`import { FormField, TextInput, NumberInput, CurrencyInput } from "../../../components/common";

// Uso básico con TextInput
<FormField
  label="Nombre completo"
  helperText="Ingresa tu nombre completo"
  error={error}
  required
>
  <TextInput
    value={value}
    onChange={setValue}
    placeholder="Juan Pérez"
  />
</FormField>

// Con NumberInput
<FormField
  label="Número de huéspedes"
  helperText="Máximo 10 personas"
>
  <NumberInput
    value={guests}
    onChange={setGuests}
    min={1}
    max={10}
  />
</FormField>

// Con CurrencyInput
<FormField
  label="Precio por noche"
  helperText="Monto en USD"
>
  <CurrencyInput
    value={price}
    onChange={setPrice}
    currency="USD"
    locale="en-US"
  />
</FormField>`}
        size={selectedSize}
      >
        <div className="space-y-6">
          {/* TextInput con FormField */}
          <FormField
            label="Nombre completo"
            helperText="Ingresa tu nombre completo"
            error={formFieldError}
            required
          >
            <input
              type="text"
              value={formFieldValue}
              onChange={(e) => handleFormFieldChange(e.target.value)}
              onBlur={handleFormFieldBlur}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </FormField>

          {/* NumberInput con FormField */}
          <FormField
            label="Número de huéspedes"
            helperText="Máximo 10 personas"
          >
            <input
              type="number"
              value={numberValue}
              onChange={(e) => setNumberValue(Number(e.target.value))}
              min={1}
              max={10}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </FormField>

          {/* CurrencyInput con FormField */}
          <FormField label="Precio por noche" helperText="Monto en USD">
            <input
              type="text"
              value={currencyValue}
              onChange={(e) => setCurrencyValue(e.target.value)}
              placeholder="$0.00"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </FormField>
        </div>
      </ComponentDemo>

      {/* SearchBar */}
      <ComponentDemo
        id="molecules-searchBar-basic"
        title="SearchBar - Barra de Búsqueda con Pestañas"
        description="Componente de búsqueda avanzado con pestañas, selector de fechas y configuración de huéspedes"
        code={`import { SearchBar } from "../../../components/common";

const [searchData, setSearchData] = useState(null);
const [collapsed, setCollapsed] = useState(false);

<SearchBar
  onSearch={(data) => {
    console.log("Search:", data);
    setSearchData(data);
  }}
  onTabChange={(tabId) => console.log("Tab:", tabId)}
  collapsed={collapsed}
  onToggleCollapse={setCollapsed}
  defaultTab="rentals"
/>

// Los datos incluyen:
// - tab: "rentals" | "real-estate" | "services"
// - query: string de búsqueda
// - guests: número de huéspedes
// - dateRange: { startDate, endDate }`}
        size={selectedSize}
      >
        <div className="space-y-4">
          <SearchBar
            onSearch={handleSearch}
            onTabChange={handleTabChange}
            collapsed={searchBarCollapsed}
            onToggleCollapse={setSearchBarCollapsed}
            defaultTab="rentals"
          />

          {/* Resultados de búsqueda */}
          {searchData && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Última búsqueda:
              </h4>
              <pre className="text-sm text-gray-600 dark:text-gray-400">
                {JSON.stringify(searchData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </ComponentDemo>
    </ComponentSection>
  );
}
