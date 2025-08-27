> **Objetivo:** Definir, con nivel de detalle profesional, los componentes base y compuestos que se requieren para las primeras vistas (Home/Catálogo, Detalle de Propiedad, Perfil de Usuario) según los bocetos compartidos. Todos los componentes deben ser **100% Tailwind-first**, **listos para i18n** (textos externos, formatos de fecha/moneda) y **temas light/dark** (variables/tokens). **Sin código**: este documento describe comportamiento, variantes, props y estados a cubrir.

---

## 0) Fundamentos (aplican a todos)

- **Theming:** tokens de color, espaciado, tipografía, radii y sombras; soporte `dark` vía clase en `<html>`. Evitar hex en línea: usar clases con tokens (p.ej. `bg-surface`, `text-muted`).

- **i18n:** no cadenas fijas; los componentes aceptan `label`/`ariaLabel`/`messages` desde recursos. Números/monedas/fechas renderizados con helpers de formateo.

- **Accesibilidad:** foco visible, roles ARIA correctos, navegable por teclado (Tab/Shift+Tab); `aria-expanded`, `aria-controls`, `aria-current`, `aria-modal`, etc.

- **Responsividad:** mobile-first; breakpoints sm/md/lg/xl/2xl; contenedores con `max-w-7xl` donde aplique.

- **Estados:** default, hover, focus, active, disabled, loading, error/success.

- **Densidades:** `comfortable` y `compact` (clases condicionales).

---

## 1) Componentes Base (Átomos)

1.  **Button**\
    **Rol:** acciones primarias/secundarias.\
    **Variantes:** `primary`, `secondary`, `tertiary/ghost`, `destructive`, `link`, `icon-only` (con tamaño cuadrado).\
    **Tamaños:** `sm`, `md`, `lg`.\
    **Estados:** loading con spinner inline y `aria-busy`.\
    **Teming:** color tokenizable; borde/sombra para énfasis; soporte gradiente para CTA principal.

2.  **Link**\
    **Rol:** navegación textual.\
    **Variantes:** estándar, con ícono leading/trailing, breadcrumb link.\
    **Accesibilidad:** `aria-current="page"` cuando activo.

3.  **IconButton**\
    **Rol:** acción con sólo ícono (p. ej. menú hamburguesa, favoritos).\
    **Estados:** tooltip opcional.

4.  **TextInput**\
    **Rol:** entrada de texto.\
    **Variantes:** con label arriba/izquierda, con helper/error, con prefijo/sufijo (ícono o texto), search.\
    **Estados:** success/error/disabled/readonly.

5.  **NumberInput / Counter**\
    **Rol:** números y contadores (huéspedes, habitaciones).\
    **Variantes:** con stepper +/−, límites min/max.

6.  **CurrencyInput**\
    **Rol:** montos monetarios, formatea según locale y currency.\
    **Props:** `currency`, `min`, `max`, `decimals`.

7.  **Select**\
    **Rol:** lista desplegable.\
    **Variantes:** simple, con íconos, con descripción secundaria, `segmented` (pestañas de categoría).\
    **Accesibilidad:** teclado con flechas y `aria-activedescendant`.

8.  **DateInput / DateRangeInput**\
    **Rol:** fechas/rango (check-in/check-out).\
    **Estados:** invalidez por políticas (minStay) y bloqueos.

9.  **Checkbox**\
    **Rol:** selección múltiple, filtros.\
    **Variantes:** estándar, con descripción.

10. **Radio**\
    **Rol:** selección única.\
    **Variantes:** botón tipo "pill" (chips).

11. **Switch (Toggle)**\
    **Rol:** on/off (p. ej. visibilidad, notificaciones).\
    **Accesibilidad:** `role="switch"`, `aria-checked`.

12. **Badge**\
    **Rol:** estatus y etiquetas (Premium, Destacado).\
    **Variantes:** `info`, `success`, `warning`, `danger`, `brand`.

13. **Chip / FilterChip**\
    **Rol:** filtros rápidos ("Frente al mar", "Lujo").\
    **Estados:** seleccionado/deseleccionado, con contador.

14. **Tag**\
    **Rol:** categorías pequeñas, con ícono opcional.

15. **Avatar**\
    **Rol:** usuario/host; fallback iniciales.\
    **Tamaños:** xs/sm/md/lg.

16. **RatingStars**\
    **Rol:** visualización de rating (0–5) + conteo reseñas.\
    **Variantes:** compacto y detallado.

17. **ProgressBar**\
    **Rol:** progreso de perfil (completado %).\
    **Accesibilidad:** `aria-valuenow`/`min`/`max`.

18. **Tooltip**\
    **Rol:** ayuda contextual; `aria-describedby`.

19. **Spinner / Skeleton**\
    **Rol:** estados de carga; skeleton para tarjetas y formularios.

20. **Divider / Separator**\
    **Rol:** separación visual en paneles y cards.

21. **Breadcrumb**\
    **Rol:** navegación jerárquica (Detalle → Volver).\
    **Accesibilidad:** `nav[aria-label="breadcrumb"]`.

22. **Pagination**\
    **Rol:** control paginado con botones y total.

---

## 2) Componentes Compuestos (Moléculas)

1.  **FormField**\
    Combina Label + Control + Helper/Error; alinea densidades; estados accesibles.

2.  **SearchBar (Tabbed)**\
    Campo de búsqueda con pestañas de vertical (Rentas, Bienes Raíces, Servicios). Incluye `DateRangeInput`, `Select` de huéspedes/habitaciones y botón Buscar. Debe poder contraerse en mobile.

3.  **PriceBadge**\
    Muestra precio base (p. ej. `$650 USD / noche`) con moneda del locale; soporta tooltip con desglose.

4.  **AmenityItem**\
    Ícono + texto; estados enable/disable; layout en grid responsivo.

5.  **StatItem**\
    Pequeñas métricas (Reservas, Rating, Años). Ícono + valor + etiqueta.

6.  **ContactRow**\
    Línea de contacto (teléfono, email, WhatsApp) con ícono y acción.

7.  **FilterGroup**\
    Grupo de `FilterChip` + título; colapsable.

8.  **ReviewSummary**\
    Promedio, barras por categoría (Limpieza, Ubicación, etc.), conteo reseñas.

9.  **ReviewItem**\
    Avatar + nombre + fecha + rating + texto + votos de utilidad.

10. **PolicyList**\
    Lista de políticas (check-in/out, cancelación, depósito) con íconos.

11. **InfoAlert / Tip**\
    Avisos informativos discretos (p. ej. "No se te cobrará todavía").

12. **NewsletterInline**\
    Campo email + botón suscribirse + feedback de validación.

13. **BackLink**\
    Enlace con ícono para regresar; comportamiento de historial.

---

## 3) Componentes Complejos (Organismos)

1.  **Navbar**\
    Logotipo, navegación primaria con categorías y **MegaMenu** (subsecciones con descripción), buscador rápido, selector de idioma, acciones de usuario (login/avatar) y CTA "Publicar Anuncio". Sticky, con fondo translúcido y blur.

2.  **MegaMenu**\
    Panel drop-down de ancho medio con 2–3 columnas: título, descripción corta por subcategoría e íconos. Cierra con `Esc`/click fuera; foco cíclico.

3.  **HeroCarousel**\
    Carrusel grande con imágenes destacadas; overlay con Card destacada (título, ubicación, amenidades clave/ratings, PriceBadge, CTA). Navegación con flechas y bullets accesibles.

4.  **SearchDock**\
    Barra de búsqueda flotante bajo el hero; incluye **SearchBar (Tabbed)**; en mobile se convierte en botón que abre Drawer.

5.  **FilterBar**\
    Lista horizontal de **FilterChip** (Todos, Frente al mar, Lujo, etc.) con scroll-x y sombras en extremos.

6.  **ListingCard**\
    Card de propiedad/servicio: imagen con badges (Premium/Destacado), título, ubicación, meta (huéspedes, cuartos, m²), **RatingStars**, **PriceBadge** y CTA "Ver detalles". Estados: hover con lift y sombra.

7.  **ListingGrid**\
    Grid responsivo de `ListingCard` con paginación/infinite-scroll y placeholders Skeleton.

8.  **Footer**\
    3–4 columnas: descripción del portal, categorías, enlaces útiles, suscripción (NewsletterInline) y contacto; franja legal inferior. Fondo con patrón sutil.

9.  **ProfileHeader**\
    Encabezado del perfil con **Avatar**, nombre, verificación (Badge), ubicación, progreso de perfil (**ProgressBar**), y stats (reservas, rating, años). Botón "Editar Perfil".

10. **ProfileSidebarNav**\
    Menú vertical de secciones (Información personal, Dirección, Preferencias, Contacto de emergencia, Identificación, Privacidad). Ícono + etiqueta; activo/hover; colapsable en mobile.

11. **ProfileSectionCard**\
    Contenedor con título/separadores y formulario interno compuesto por **FormField**. Estados guardando/guardado/error.

12. **ListingDetailGallery**\
    Galería principal con miniaturas; soporte de **ImageViewer** (lightbox) con zoom/teclas y swipe en mobile.

13. **BookingStickyCard**\
    Card fija en el lateral (desktop) o sticky-bottom (mobile) con **PriceBadge**, **DateRangeInput**, selector de huéspedes, botón "Reservar ahora" y link "Consultar disponibilidad". Incluye desglose de precios (fees/impuestos) y total.

14. **AmenitiesGrid**\
    Grid de **AmenityItem** con encabezado "Lo que ofrece este lugar" y botón "Mostrar más".

15. **ReviewsPanel**\
    Encabezado con **ReviewSummary** y listado de **ReviewItem** paginable. Ordenar por reciente/mejor valoradas.

16. **MapSection**\
    Contenedor para mapa embebido (más adelante real). Incluye dirección y puntos cercanos listados.

17. **HostCard**\
    Card del anfitrión con Avatar, nombre, badges (Superhost/Verificado), KPIs (tiempo y tasa de respuesta) y botón "Contactar".

18. **SimilarListingsCarousel**\
    Carrusel de `ListingCard` compactas al final del detalle.

19. **EmptyState**\
    Estado vacío con ilustración/ícono, título, texto y CTA (p. ej. "No hay resultados").

20. **ErrorState**\
    Mensaje de error recuperable con acción secundaria (reintentar / volver a inicio).

21. **Toast / Notification**\
    Sistema no bloqueante para confirmaciones/errores (guardado de perfil, favorito añadido, etc.).

22. **Modal**\
    Diálogo centrado para acciones de confirmación/edición puntual. Trap de foco, cierre con `Esc`.

23. **Drawer**\
    Panel deslizante para flujos secundarios (búsqueda en mobile, filtros avanzados).

24. **DropdownMenu**\
    Menú contextual (avatar del usuario, opciones de card). Teclado y roles ARIA correctos.

25. **Tabs**\
    Conmutador de secciones en cards/páginas (p. ej. "Propiedades Destacadas" / "Servicios Destacados").

26. **Steps/Stepper (más adelante)**\
    Para wizard de publicación de anuncio. Fuera de alcance inmediato, pero considerar tokens.

---

## 4) Bloques/Secciones (Templates)

1. **HomeTemplate**\
   Estructura: Navbar → HeroCarousel → SearchDock → FilterBar → ListingGrid → Footer.

2. **ListingDetailTemplate**\
   Estructura: Navbar → Gallery + (contenido) Título/meta/amenities/reviews/mapa → Sidebar con BookingStickyCard → SimilarListingsCarousel → Footer.

3. **ProfileTemplate**\
   Estructura: Navbar → ProfileHeader → (grid) ProfileSidebarNav + ProfileSectionCard(s) → Footer.

---

## 5) Tokens sugeridos (nombres)

- **Color:** `brand`, `brand-foreground`, `accent`, `accent-foreground`, `success`, `warning`, `danger`, `muted`, `muted-foreground`, `surface`, `surface-elevated`, `border`, `ring`. Gradiente CTA: `brand-gradient`.

- **Radii:** `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl` (cards, inputs, botones).

- **Sombras:** `shadow-sm`, `shadow`, `shadow-lg`, `shadow-xl` (hover en cards y navbar sticky).

---

## 6) Entregables F-03.5

- Biblioteca inicial en `/src/components/common/` estructurada por **Átomos**, **Moléculas**, **Organismos** (sólo nombres y contratos).

- Story/Docs local `/ui` con listado y estados (sin lógica avanzada aún).

- Checklist de accesibilidad validada en 5 componentes clave: Button, TextInput, Select, Modal, Navbar.

---

## 7) Dependencias/Relación con otras tareas

- **Depende de:** F-02 (tokens/tema), F-03 (átomos mínimos).

- **Desbloquea:** F-05 (Home), F-06 (Dashboard/Crear anuncio), futuras vistas de detalle.

---

## 8) Notas de implementación

- Evitar CSS ad-hoc; priorizar utilidades Tailwind y variables.

- Íconos: Lucide (consistencia grosores).

- Transiciones sutiles con Framer Motion solo en organismos interactivos (Navbar, Cards, Drawers, Carousels).

- Preparar wrappers para DateRange y Gallery con posibilidad de reemplazo futuro sin romper contratos.

src/

components/

common/

atoms/

Avatar/

Avatar.jsx

index.js

Badge/

Badge.jsx

index.js

Breadcrumb/

Breadcrumb.jsx

index.js

Button/

Button.jsx

index.js

Chip/

Chip.jsx

index.js

Checkbox/

Checkbox.jsx

index.js

CurrencyInput/

CurrencyInput.jsx

index.js

DateInput/

DateInput.jsx

index.js

DateRangeInput/

DateRangeInput.jsx

index.js

Divider/

Divider.jsx

index.js

IconButton/

IconButton.jsx

index.js

Link/

Link.jsx

index.js

NumberInput/

NumberInput.jsx

index.js

Pagination/

Pagination.jsx

index.js

ProgressBar/

ProgressBar.jsx

index.js

Radio/

Radio.jsx

index.js

RatingStars/

RatingStars.jsx

index.js

Select/

Select.jsx

index.js

Skeleton/

Skeleton.jsx

index.js

Spinner/

Spinner.jsx

index.js

Switch/

Switch.jsx

index.js

Tag/

Tag.jsx

index.js

TextInput/

TextInput.jsx

index.js

Tooltip/

Tooltip.jsx

index.js

index.js

README.md

molecules/

AmenityItem/

AmenityItem.jsx

index.js

BackLink/

BackLink.jsx

index.js

ContactRow/

ContactRow.jsx

index.js

FilterGroup/

FilterGroup.jsx

index.js

FormField/

FormField.jsx

index.js

InfoAlert/

InfoAlert.jsx

index.js

NewsletterInline/

NewsletterInline.jsx

index.js

PriceBadge/

PriceBadge.jsx

index.js

ReviewItem/

ReviewItem.jsx

index.js

ReviewSummary/

ReviewSummary.jsx

index.js

SearchBar/

SearchBar.jsx

index.js

StatItem/

StatItem.jsx

index.js

PolicyList/

PolicyList.jsx

index.js

index.js

README.md

organisms/

AmenitiesGrid/

AmenitiesGrid.jsx

index.js

BookingStickyCard/

BookingStickyCard.jsx

index.js

Drawer/

Drawer.jsx

index.js

DropdownMenu/

DropdownMenu.jsx

index.js

EmptyState/

EmptyState.jsx

index.js

ErrorState/

ErrorState.jsx

index.js

Footer/

Footer.jsx

index.js

HeroCarousel/

HeroCarousel.jsx

index.js

HostCard/

HostCard.jsx

index.js

ImageViewer/

ImageViewer.jsx

index.js

ListingCard/

ListingCard.jsx

index.js

ListingDetailGallery/

ListingDetailGallery.jsx

index.js

ListingGrid/

ListingGrid.jsx

index.js

MapSection/

MapSection.jsx

index.js

MegaMenu/

MegaMenu.jsx

index.js

Modal/

Modal.jsx

index.js

Navbar/

Navbar.jsx

index.js

ProfileHeader/

ProfileHeader.jsx

index.js

ProfileSectionCard/

ProfileSectionCard.jsx

index.js

ProfileSidebarNav/

ProfileSidebarNav.jsx

index.js

ReviewsPanel/

ReviewsPanel.jsx

index.js

SearchDock/

SearchDock.jsx

index.js

SimilarListingsCarousel/

SimilarListingsCarousel.jsx

index.js

Tabs/

Tabs.jsx

index.js

Toast/

Toast.jsx

index.js

FilterBar/

FilterBar.jsx

index.js

Stepper/

Stepper.jsx

index.js

index.js

README.md

templates/

HomeTemplate/

HomeTemplate.jsx

index.js

ListingDetailTemplate/

ListingDetailTemplate.jsx

index.js

ProfileTemplate/

ProfileTemplate.jsx

index.js

index.js

README.md
