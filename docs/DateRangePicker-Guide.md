# DateRangePicker - Guía Completa de Uso

El `DateRangePicker` es un componente unificado que puede manejar tanto selección de rango de fechas como fecha única. Ha sido completamente refactorizado para ofrecer máxima flexibilidad y facilidad de uso.

## 🎯 Características Principales

- **Modo Dual**: Soporta tanto selección de rango (`range`) como fecha única (`single`)
- **Responsive**: Se adapta automáticamente a dispositivos móviles y desktop
- **Internacionalización**: Soporte completo para español e inglés
- **Precios**: Muestra precios por noche en cada fecha
- **Fechas Restringidas**: Control de fechas mínimas, máximas, disponibles y deshabilitadas
- **Trigger Personalizable**: Botón de activación completamente personalizable
- **Modo Inline**: Calendario siempre visible sin trigger
- **Accesibilidad**: Navegación completa por teclado y screen readers

## 🔧 Props del Componente

### Props Principales

| Prop             | Tipo                                   | Default   | Descripción                             |
| ---------------- | -------------------------------------- | --------- | --------------------------------------- |
| `mode`           | `'range' \| 'single'`                  | `'range'` | Modo de selección                       |
| `value`          | `{startDate, endDate} \| Date \| null` | -         | Valor controlado                        |
| `onChange`       | `(value) => void`                      | -         | Callback cuando cambia la selección     |
| `placeholder`    | `string`                               | -         | Texto placeholder del input             |
| `inline`         | `boolean`                              | `false`   | Si true, muestra calendario sin trigger |
| `numberOfMonths` | `1 \| 2`                               | Auto      | Número de meses a mostrar               |
| `closeOnSelect`  | `boolean`                              | Auto      | Si se cierra al seleccionar             |

### Props de Restricciones

| Prop             | Tipo     | Descripción                           |
| ---------------- | -------- | ------------------------------------- |
| `minDate`        | `Date`   | Fecha mínima seleccionable            |
| `maxDate`        | `Date`   | Fecha máxima seleccionable            |
| `disabledDates`  | `Date[]` | Fechas específicas deshabilitadas     |
| `availableDates` | `Date[]` | Solo permite estas fechas específicas |

### Props de Precios

| Prop         | Tipo                       | Descripción                         |
| ------------ | -------------------------- | ----------------------------------- |
| `pricing`    | `{ 'YYYY-MM-DD': number }` | Precios por fecha                   |
| `showPrices` | `boolean`                  | Si mostrar precios en el calendario |

### Props de Personalización

| Prop            | Tipo                                       | Descripción            |
| --------------- | ------------------------------------------ | ---------------------- |
| `renderTrigger` | `({open, toggle, formatted}) => ReactNode` | Trigger personalizado  |
| `className`     | `string`                                   | Clases CSS adicionales |

## 📝 Ejemplos de Uso

### 1. DatePicker Básico (Rango)

```jsx
import { useState } from "react";
import { DateRangePicker } from "./components";

function App() {
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
```

### 2. DatePicker de Fecha Única

```jsx
const [singleDate, setSingleDate] = useState(null);

<DateRangePicker
  mode="single"
  value={singleDate}
  onChange={setSingleDate}
  placeholder="Seleccionar fecha"
  closeOnSelect={true} // Se cierra automáticamente
/>;
```

### 3. DatePicker con Precios

```jsx
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
  value={dateRange}
  onChange={setDateRange}
  pricing={samplePricing}
  showPrices={true}
  placeholder="Seleccionar fechas con precios"
/>;
```

### 4. Control de Número de Meses

```jsx
// Un solo mes
<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  numberOfMonths={1}
  placeholder="Un solo mes"
/>

// Dos meses
<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  numberOfMonths={2}
  placeholder="Dos meses"
/>
```

### 5. DatePicker con Fechas Deshabilitadas

```jsx
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
/>;
```

### 6. DatePicker Inline (Embebido)

```jsx
<DateRangePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  inline={true}
  numberOfMonths={2}
/>
```

### 7. DatePicker con Trigger Personalizado

```jsx
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
```

### 8. DatePicker con Restricciones de Fecha

```jsx
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
/>;
```

### 9. DatePicker con Fechas Disponibles Específicas

```jsx
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
/>;
```

## 🎨 Comportamiento del Componente

### Modo Range (Rango)

- **Primer click**: Selecciona fecha de inicio
- **Segundo click**: Completa el rango con fecha de fin
- **Tercer click**: Reinicia y selecciona nueva fecha de inicio
- **Click en misma fecha**: Reinicia selección

### Modo Single (Fecha Única)

- **Click**: Selecciona la fecha
- **`closeOnSelect=true`**: Cierra automáticamente al seleccionar
- **Click en otra fecha**: Cambia la selección

### Responsividad Automática

- **Mobile (<768px)**: 1 mes automáticamente
- **Desktop (≥768px)**: 2 meses automáticamente
- **Override**: Usar `numberOfMonths` para forzar un comportamiento

### Control de Estados

- **Controlado**: Pasa `value` y `onChange`
- **No controlado**: El componente maneja su propio estado interno

## 🌐 Internacionalización

El componente usa `react-i18next` para traducir:

- Nombres de meses
- Días de la semana
- Botones y textos
- Formatos de fecha

Idiomas soportados: Español (es) e Inglés (en)

## 📱 Responsive Design

El componente se adapta automáticamente:

- **Dropdown**: Ancho fijo en desktop, full-width en móvil
- **Número de meses**: Auto-detección basada en ancho de pantalla
- **Controles**: Optimizados para touch en móviles

## ♿ Accesibilidad

- **Navegación por teclado**: Arrows, Tab, Enter, Escape
- **Screen readers**: Labels y roles ARIA apropiados
- **Focus management**: Manejo correcto del foco
- **Color contrast**: Cumple con WCAG 2.1 AA

## 🔄 Migración desde Versión Anterior

### Cambios en Props

| Prop Anterior  | Prop Nueva        | Migración                          |
| -------------- | ----------------- | ---------------------------------- |
| `startDate`    | `value.startDate` | Usar objeto `{startDate, endDate}` |
| `endDate`      | `value.endDate`   | Usar objeto `{startDate, endDate}` |
| `onDateChange` | `onChange`        | Cambiar nombre del callback        |

### Ejemplo de Migración

```jsx
// ❌ Versión anterior
<DateRangePicker
  startDate={startDate}
  endDate={endDate}
  onDateChange={handleDateChange}
/>

// ✅ Nueva versión
<DateRangePicker
  mode="range"
  value={{ startDate, endDate }}
  onChange={handleDateChange}
/>
```

## 🚀 Conclusión

El nuevo `DateRangePicker` es un componente mucho más potente y flexible que su predecesor. Con soporte para múltiples modos, internacionalización completa, y personalización avanzada, es perfecto para cualquier aplicación que necesite selección de fechas profesional.
