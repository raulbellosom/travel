# 04_DESIGN_SYSTEM_MOBILE_FIRST – REAL ESTATE SAAS PLATFORM

## Referencia

Este documento se rige estrictamente por:

- 00_ai_project_context.md
- 00_project_brief.md
- 01_frontend_requirements.md

Define el **Design System Mobile-First** para garantizar coherencia visual,
usabilidad profesional y compatibilidad con agentes de IA en VS Code.

---

## 1. Principios de UX

### 1.1 Mobile-First (Obligatorio)

- **Diseño base**: Teléfonos móviles (360px - 640px)
- **Expansión**: Tablets (641px - 1024px)
- **Adaptación**: Desktop (1025px+)

Todo componente, página y flujo debe diseñarse primero para móvil.

### 1.2 Principios de Diseño

- **Claridad**: Interfaces limpias y directas
- **Consistencia**: Patrones repetibles en toda la app
- **Eficiencia**: Mínimos clics/taps para tareas comunes
- **Accesibilidad**: WCAG AA mínimo
- **Performance**: Rápido en conexiones lentas
- **Touch-First**: Optimizado para dedos, no mouse

---

## 2. Breakpoints

Definidos para TailwindCSS 4.1:

```css
/* Mobile (base) */
default: 360px – 640px

/* Tablet */
md: 641px – 1024px

/* Desktop */
lg: 1025px – 1440px
xl: 1441px+
```

**Regla**: El diseño **siempre** parte de Mobile y se expande hacia arriba.

---

## 3. Paleta de Colores

### 3.1 Colores Brand (Principal)

```css
--color-primary-50: #f0f9ff;
--color-primary-100: #e0f2fe;
--color-primary-200: #bae6fd;
--color-primary-300: #7dd3fc;
--color-primary-400: #38bdf8;
--color-primary-500: #0ea5e9; /* Primary */
--color-primary-600: #0284c7;
--color-primary-700: #0369a1;
--color-primary-800: #075985;
--color-primary-900: #0c4a6e;
```

### 3.2 Colores Neutrales (Grises)

```css
/* Light Mode */
--color-slate-50: #f8fafc;
--color-slate-100: #f1f5f9;
--color-slate-200: #e2e8f0;
--color-slate-300: #cbd5e1;
--color-slate-400: #94a3b8;
--color-slate-500: #64748b;
--color-slate-600: #475569;
--color-slate-700: #334155;
--color-slate-800: #1e293b;
--color-slate-900: #0f172a; /* Dark backgrounds */
```

### 3.3 Colores Semánticos

```css
/* Success */
--color-success: #10b981;
--color-success-light: #d1fae5;
--color-success-dark: #059669;

/* Warning */
--color-warning: #f59e0b;
--color-warning-light: #fef3c7;
--color-warning-dark: #d97706;

/* Error */
--color-error: #ef4444;
--color-error-light: #fee2e2;
--color-error-dark: #dc2626;

/* Info */
--color-info: #3b82f6;
--color-info-light: #dbeafe;
--color-info-dark: #2563eb;
```

### 3.4 Dark Mode

```css
.dark {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-tertiary: #334155;

  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-tertiary: #94a3b8;

  --color-border: #334155;
  --color-border-hover: #475569;
}
```

---

## 4. Tipografía

### 4.1 Fuentes

**Primaria**: Inter (sans-serif moderna, legible)

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");

font-family:
  "Inter",
  system-ui,
  -apple-system,
  sans-serif;
```

### 4.2 Escala Tipográfica

```css
/* Mobile (base) */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
--text-5xl: 3rem; /* 48px */

/* Desktop (ajustado) */
@media (min-width: 1024px) {
  --text-base: 1.125rem; /* 18px */
  --text-lg: 1.25rem; /* 20px */
  /* ... escalado proporcional */
}
```

### 4.3 Line Heights

```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### 4.4 Font Weights

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

---

## 5. Espaciados y Layout

### 5.1 Escala de Espaciado

```css
--spacing-0: 0;
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-5: 1.25rem; /* 20px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-10: 2.5rem; /* 40px */
--spacing-12: 3rem; /* 48px */
--spacing-16: 4rem; /* 64px */
--spacing-20: 5rem; /* 80px */
```

### 5.2 Touch Targets

**Regla fundamental**: Todos los elementos interactivos deben tener **mínimo 44x44px** en móvil.

```css
/* Botones, Links, Inputs */
min-height: 44px;
min-width: 44px;
```

### 5.3 Container Widths

```css
/* Mobile */
max-width: 100%;
padding: 0 1rem; /* 16px lateral */

/* Tablet */
@media (min-width: 768px) {
  max-width: 768px;
  padding: 0 2rem;
}

/* Desktop */
@media (min-width: 1024px) {
  max-width: 1280px;
  padding: 0 3rem;
}
```

---

## 6. Radios y Bordes

### 6.1 Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem; /* 4px */
--radius-md: 0.5rem; /* 8px */
--radius-lg: 0.75rem; /* 12px */
--radius-xl: 1rem; /* 16px */
--radius-2xl: 1.5rem; /* 24px */
--radius-full: 9999px; /* Circular */
```

### 6.2 Borders

```css
--border-width: 1px;
--border-color: var(--color-slate-200);
--border-color-dark: var(--color-slate-700);
```

---

## 7. Sombras (Shadows)

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

**Uso**:

- Cards: `shadow-md`
- Modals: `shadow-xl`
- Dropdowns: `shadow-lg`
- Hover states: `shadow-lg`

---

## 8. Iconografía

### 8.1 Librería

**Lucide React** (https://lucide.dev)

```jsx
import { Home, Search, Heart, User, Menu } from "lucide-react";
```

### 8.2 Tamaños de Iconos

```css
--icon-xs: 14px;
--icon-sm: 16px;
--icon-md: 20px;
--icon-lg: 24px;
--icon-xl: 32px;
--icon-2xl: 48px;
```

### 8.3 Prohibido

- ❌ Emojis como iconos de UI
- ❌ Iconos rasterizados (PNG/JPG)
- ❌ Librerías de iconos desactualizadas

---

## 9. Componentes Base

### 9.1 Button (Botón)

**Variantes**:

- `primary`: Acción principal (fondo primary)
- `secondary`: Acción secundaria (outline)
- `tertiary`: Acción terciaria (ghost/link)
- `destructive`: Acción destructiva (fondo error)

**Tamaños**:

- `sm`: 36px altura, 12px padding
- `md`: 44px altura, 16px padding (default)
- `lg`: 52px altura, 20px padding

**Estados**:

- Default
- Hover
- Active
- Disabled
- Loading

**Ejemplo**:

```jsx
<Button variant="primary" size="md">
  Guardar Propiedad
</Button>
```

---

### 9.2 Input (Campo de texto)

**Tipos**:

- Text
- Email
- Tel
- Number
- URL
- Password
- Textarea

**Características**:

- Label flotante o fijo
- Placeholder
- Prefijo/Sufijo (ej: $, m²)
- Estado de error con mensaje
- Estado de éxito
- Contador de caracteres (textarea)

**Altura mínima**: 44px

---

### 9.3 Select (Desplegable)

- Altura mínima: 44px
- Navegación por teclado
- Búsqueda inline (para listas largas)
- Multi-select (opcional)

---

### 9.4 Checkbox y Radio

- Área de toque: 44x44px
- Caja visual: 20x20px
- Label asociado siempre
- Checked/Unchecked claros
- Disabled state

---

### 9.5 Card (Tarjeta)

**Uso**: Contenedor visual para información agrupada

```jsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardBody>Contenido</CardBody>
  <CardFooter>Acciones</CardFooter>
</Card>
```

**Variantes**:

- Default: Fondo blanco, borde sutil
- Elevated: Con sombra
- Outlined: Solo borde
- Flat: Sin borde ni sombra

---

### 9.6 Modal (Diálogo)

**Características**:

- Overlay oscuro (backdrop)
- Centrado en viewport
- Cerrable con X, ESC, clic fuera
- Scroll interno si contenido excede altura
- Animación de entrada/salida

**Tamaños**:

- sm: 400px max-width
- md: 600px max-width
- lg: 800px max-width
- full: 95vw max-width

---

### 9.7 Badge (Etiqueta)

**Uso**: Indicadores de estado, categorías, tags

**Variantes**:

- Default (neutral)
- Success (verde)
- Warning (amarillo)
- Error (rojo)
- Info (azul)

**Tamaños**:

- sm: 20px altura
- md: 24px altura
- lg: 28px altura

---

### 9.8 Avatar (Foto de perfil)

**Tamaños**:

- xs: 24px
- sm: 32px
- md: 40px
- lg: 56px
- xl: 80px
- 2xl: 120px

**Fallback**: Iniciales del nombre sobre fondo de color

---

### 9.9 Spinner (Loader)

**Uso**: Estados de carga

**Tamaños**:

- sm: 16px
- md: 24px
- lg: 32px
- xl: 48px

**Variantes**:

- Circular (predeterminado)
- Dots (3 puntos animados)

---

## 10. Componentes Específicos de Inmobiliaria

### 10.1 PropertyCard (Tarjeta de Propiedad)

**Elementos**:

- Imagen principal (16:9 ratio)
- Badge de operación (Venta/Renta)
- Precio destacado
- Título de propiedad
- Ubicación (ciudad, estado)
- Características: recámaras, baños, m²
- Avatar del agente (opcional)
- Botón favorito (corazón)

**Referencia visual**: `refs/v3.png`

---

### 10.2 PropertyGallery (Galería de Imágenes)

**Características**:

- Imagen principal grande
- Thumbnails navegables
- Lightbox para fullscreen
- Swipe en móvil
- Flechas navegación en desktop
- Contador de imágenes (3/12)
- Botón de cerrar en lightbox

---

### 10.3 PropertyDetail (Detalle de Propiedad)

**Secciones**:

1. Galería de imágenes
2. Información principal
   - Título
   - Precio
   - Ubicación
   - Operación y tipo
3. Características
   - Recámaras, baños, estacionamientos
   - Superficie total y construida
   - Año de construcción
4. Descripción completa
5. Amenidades (chips/tags)
6. Mapa de ubicación
7. Información del agente
8. Formulario de contacto

**Referencia visual**: `refs/details.png`

---

### 10.4 SearchBar (Barra de Búsqueda)

**Campos**:

- Ubicación (ciudad/estado)
- Tipo de operación (Venta/Renta)
- Tipo de propiedad
- Rango de precio
- Recámaras (mínimo)
- Más filtros (collapsible)

**Comportamiento**:

- Mobile: Full width, campos apilados verticalmente
- Desktop: Horizontal, campos en línea

---

### 10.5 ContactForm (Formulario de Contacto)

**Campos**:

- Nombre (requerido)
- Email (requerido)
- Teléfono (opcional)
- Mensaje (requerido)

**Acciones**:

- Enviar por email
- Enviar por WhatsApp
- Agendar visita (futuro)

---

## 11. Patrones de Interacción

### 11.1 Navegación Mobile

**Patrón**: Bottom Navigation Bar

**Elementos**:

- Home (inicio/catálogo)
- Search (búsqueda)
- Favorites (favoritos)
- Profile (perfil/dashboard)

**Altura**: 64px

---

### 11.2 Navegación Desktop

**Patrón**: Top Navbar + Sidebar (dashboard)

**Navbar elementos**:

- Logo
- Búsqueda rápida
- Menú principal
- Selector de idioma
- Selector de tema (light/dark)
- Avatar de usuario

---

### 11.3 Formularios

**Patrón**:

- Un campo por línea en móvil
- 2-3 campos por línea en desktop (cuando tenga sentido)
- Labels siempre visibles
- Validación inline
- Mensajes de error debajo del campo
- Botón de submit al final, full width en móvil

---

### 11.4 Listas y Grids

**Mobile**:

- Lista vertical (1 columna)
- Cards full width

**Tablet**:

- Grid de 2 columnas

**Desktop**:

- Grid de 3-4 columnas

**Paginación**:

- Números de página
- Anterior/Siguiente
- Infinite scroll (opcional)

---

## 12. Animaciones

### 12.1 Librería

**Framer Motion**: Para transiciones y animaciones

### 12.2 Principios

- **Sutiles**: No distraer
- **Rápidas**: < 300ms generalmente
- **Propósito**: Mejorar UX, no adornar
- **Respeto**: `prefers-reduced-motion`

### 12.3 Animaciones Comunes

**Fade in/out**:

```jsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
```

**Slide in**:

```jsx
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
```

**Scale (modals)**:

```jsx
<motion.div
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0.9, opacity: 0 }}
>
```

---

## 13. Accesibilidad (A11Y)

### 13.1 Contraste

- **WCAG AA**: Contraste mínimo 4.5:1 (texto normal)
- **WCAG AA**: Contraste mínimo 3:1 (texto grande, iconos, controles)

### 13.2 Navegación por Teclado

- Tab order lógico
- Focus visible (outline)
- Skip to content link
- Escape para cerrar modales

### 13.3 Screen Readers

- Landmark roles (header, nav, main, footer)
- ARIA labels cuando sea necesario
- Alt text en imágenes
- Labels en inputs

### 13.4 Responsive y Touch

- Targets táctiles >= 44x44px
- Spacing entre elementos
- Zoom permitido (no user-scalable=no)

---

## 14. Estados del Sistema

### 14.1 Loading

- Spinner centrado
- Skeleton screens (preferido para contenido)
- Progress bar (para procesos largos)

### 14.2 Empty States

- Ilustración o ícono
- Título descriptivo
- Texto explicativo
- Call to action

**Ejemplo**:

```
[Ícono de casa]
No tienes propiedades aún
Crea tu primera propiedad para comenzar
[Botón: Crear Propiedad]
```

### 14.3 Error States

- Mensaje claro y accionable
- Icono de error
- Botón de retry o acción correctiva

### 14.4 Success States

- Toast notification (preferido)
- Mensaje inline
- Redirección automática (cuando aplique)

---

## 15. Responsive Images

### 15.1 Aspect Ratios para Propiedades

- **Card principal**: 16:9
- **Thumbnail**: 4:3 o 1:1
- **Hero/Banner**: 21:9 o 16:9

### 15.2 Lazy Loading

```jsx
<img loading="lazy" src="..." alt="..." />
```

### 15.3 Responsive Images

```jsx
<img
  src="image-800.jpg"
  srcSet="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  alt="..."
/>
```

---

## 16. Tokens CSS (Variables)

Archivo: `src/styles/tokens.css`

```css
:root {
  /* Colors - Primary */
  --color-primary: #0ea5e9;
  --color-primary-hover: #0284c7;
  --color-primary-active: #0369a1;

  /* Colors - Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Typography */
  --font-family-base: "Inter", system-ui, sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.5;

  /* Spacing */
  --spacing-unit: 0.25rem; /* 4px */

  /* Shadows */
  --shadow-card: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-modal: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;
}

.dark {
  /* Dark mode overrides */
  --color-bg-primary: #0f172a;
  --color-text-primary: #f8fafc;
  /* ... */
}
```

---

## 17. Relación con Documentos Posteriores

Este documento habilita:

- Generación de componentes por IA siguiendo estándares
- Consistencia visual en todo el sistema
- Base para 07_frontend_routes_and_flows.md

---

## 18. Estado del Documento

Este documento es:

- ✅ Definitivo para Fase 0
- 📝 Puede refinarse con feedback de usuarios
- 🔒 Principios Mobile-First no negociables

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
