# Atomic Design Components

Esta carpeta contiene los componentes base del sistema de diseño de Sayulita Travel, organizados siguiendo la metodología Atomic Design.

## Estructura

```
atoms/          # Componentes básicos e indivisibles
molecules/      # Combinaciones de átomos
organisms/      # Combinaciones de moléculas y átomos
templates/      # Layouts y estructuras de página
```

## Principios

- **Tailwind-first**: Todos los estilos usando Tailwind CSS
- **i18n ready**: Textos externalizados para internacionalización
- **Tema adaptable**: Soporte para modo claro/oscuro
- **Accesibilidad**: Cumplimiento de estándares WCAG AA
- **Responsividad**: Mobile-first design
- **Performance**: Optimizado para carga y rendering

## Tokens de Diseño

Los componentes utilizan tokens CSS personalizados definidos en `src/styles/tokens.css`:

- Colores: `--color-brand`, `--color-surface`, etc.
- Espaciado: `--spacing-xs` a `--spacing-2xl`
- Radios: `--radius-sm` a `--radius-2xl`
- Sombras: `--shadow-sm` a `--shadow-xl`
- Tipografía: `--font-size-xs` a `--font-size-4xl`

## Estados de Componentes

Todos los componentes soportan los siguientes estados:

- **Default**: Estado normal
- **Hover**: Interacción con mouse
- **Focus**: Navegación con teclado
- **Active**: Elemento presionado/activo
- **Disabled**: Elemento deshabilitado
- **Loading**: Estado de carga
- **Error/Success**: Estados de validación

## Uso

```jsx
import Button from './components/common/atoms/Button';
import TextInput from './components/common/atoms/TextInput';

// Uso básico
<Button variant="primary" size="md">
  Click me
</Button>

// Con i18n
<Button variant="primary" size="md">
  {t('common.submit')}
</Button>
```
