**Duración sugerida:** 2 semanas
**Stack principal:** Appwrite · React (Vite + JavaScript) · TailwindCSS · Framer Motion · Lucide Icons

> Este documento define objetivos, alcance, tareas y criterios de aceptación para la **Fase 0 (equivalente a Sprint 1)** del proyecto Sayulita Travel. La meta es dejar listo el núcleo técnico para publicar _listings_ básicos y sentar bases de UI/UX, permisos y **multilenguaje (i18n)**.

---

## **1) Objetivo del Sprint**

- Preparar infraestructura mínima en **Appwrite** (DB, Storage, Functions stubs, permisos base).
- Iniciar **Frontend** con arquitectura basada en **módulos/carpetas actuales (no atómica)**, routing, autenticación e **i18n (es/en)**.
- Habilitar **MVP de anuncios**: creación y listado público con paginación/búsqueda simple.

**Definition of Done (DoD) del Sprint:**

- Repos frontend y backend construyen sin errores (`build` OK), con lint configurado.
- Base de datos `travel` creada con colecciones núcleo y permisos mínimos operativos.
- Login/Logout funcionando contra Appwrite; rutas públicas/privadas protegidas.
- Se puede crear un **listing** como partner y verlo públicamente en el catálogo.
- **i18n** habilitado con selector de idioma (es/en) y persistencia.
- Documentación de setup y scripts en `README`.

---

## **2) Alcance (Deliverables)**

### **Backend (Appwrite)**

1. **Database** `travel` con colecciones iniciales:
   - `users_profile`, `orgs`, `org_members`, `listings`, `listing_units`, `rate_plans`.
2. **Storage buckets**:
   - `media` (lectura pública de imágenes), `docs` (privado).
3. **Functions (stubs)**:
   - `availability-check`, `pricing-quote`, `booking-create-hold`.
4. **Permisos base**:
   - Lectura pública de `listings` activos; escritura limitada a equipo del partner y admin.
5. **Plantillas de mensajería (mínimas)**:
   - Emails para verificación y notificaciones básicas (placeholder).

### **Frontend (React + Vite + JS)**

1. **Arquitectura & tooling (estructura actual)**  
   Vite + React (JavaScript), ESLint/Prettier, alias de paths, variables de entorno. Se documenta la estructura activa:

   ```
   /src
     /api
     /assets
     /components
       /common        # botones, inputs, modales, cards, form fields
       /loaders       # spinner, skeletons
       /navigation    # navbar, sidebar, drawer, footer, language switcher, theme toggle
     /contexts        # auth, ui (tema/idioma), etc.
     /features
       /listings      # catálogo, creación, detalle
       /user          # perfil y utilidades de usuario
     /hooks
     /i18n            # es.json, en.json, inicializador i18next
     /layouts         # MainLayout, AuthLayout, DashboardLayout
     /pages           # Home, Login, Register, Dashboard, ListingDetail, 404
     /providers       # App providers (AuthProvider, UIProvider, Query/Appwrite)
     /routes          # AppRoutes, ProtectedRoute
     /services        # formatters, validators, storage/localStorage helpers
     /store           # reservado para Redux/Zustand si se adopta
     /styles          # global.css, tailwind.css, variables.css
     /utils           # constants, pagination, error handlers
   ```

2. **UI compartida (no atómica)**  
   Componentes comunes mínimos: `Button`, `Input`, `Modal`, `Card`, `FormField`, `Badge`, `Avatar`, `Spinner`, `Tooltip`, `LanguageSwitcher`, `ThemeToggle`.

3. **Autenticación**  
   Pantallas de login y registro; persistencia de sesión y logout; guardas de rutas.

4. **Vistas base**  
   Home (listado de anuncios), Dashboard partner (mis anuncios), Crear Anuncio (modal/drawer).

5. **Multilenguaje (i18n)**  
   Configuración con `i18next` (es/en), detección de navegador y persistencia en `localStorage`.

6. **Integraciones**  
   TailwindCSS, Framer Motion (transiciones básicas), Lucide Icons.

---

## **3) Historias de Usuario (HU) y Criterios de Aceptación**

### **HU-001 · Como _partner_ quiero crear un anuncio básico**

**Criterios (Gherkin):**

- Dado que estoy autenticado como `partner`
  Cuando completo título, descripción, imágenes y precio base
  Entonces se guarda un `listing` con estado `draft` y aparece en “Mis Anuncios”.

- Dado un `listing` en `draft`
  Cuando lo publico a `active`
  Entonces aparece en el catálogo público (si `visibility=public`).

**Notas:** Soportar al menos 1 `rate_plan` con `basePrice` y `currency`.

---

### **HU-002 · Como visitante quiero explorar el catálogo**

**Criterios:**

- Dado que hay `listings` en estado `active`
  Cuando abro Home
  Entonces veo tarjetas con título, imagen principal y precio base.

- Dado que existen muchos `listings`
  Cuando uso el buscador por texto
  Entonces la lista filtra por `title`/`searchText` (búsqueda simple).

---

### **HU-003 · Como usuario quiero iniciar sesión y mantener mi sesión**

**Criterios:**

- Dado que ingreso credenciales válidas
  Cuando hago login
  Entonces soy redirigido a Home o Dashboard y mi sesión persiste tras refrescar.

- Dado que mi sesión expira
  Cuando vuelvo a la app
  Entonces se me redirige a `/login` con un mensaje claro.

---

## **4) Backlog del Sprint (tareas con DoD)**

### **B-01 · Backend: Crear DB** `travel` **y colecciones núcleo**

**Descripción:** Crear la base de datos y colecciones: `users_profile`, `orgs`, `org_members`, `listings`, `listing_units`, `rate_plans`.
**Entregables:** Estructuras creadas con atributos requeridos, índices y defaults.
**DoD:** Colecciones creadas, export de esquema (JSON) y capturas en README.

### **B-02 · Backend: Storage buckets (`media`, `docs`)**

**Descripción:** Configurar buckets; `media` con lectura pública, `docs` privado.
**DoD:** Subida y lectura de una imagen de prueba desde frontend.

### **B-03 · Backend: Functions stubs**

**Descripción:** Crear functions `availability-check`, `pricing-quote`, `booking-create-hold` con respuesta simulada.
**DoD:** Despliegue y variables de entorno; logs visibles al invocar desde Postman.

### **B-04 · Backend: Permisos base por documento**

**Descripción:** Reglas: `listings.active` lectura pública; escritura por equipo del partner (team/org) y admin.
**DoD:** Pruebas de lectura/creación/actualización con usuarios de rol distinto.

### **F-01 · Frontend: Bootstrap + estructura actual**

**Descripción:** Inicializar proyecto; ESLint/Prettier; alias; `.env`; reflejar estructura actual en README.
**DoD:** `npm run dev` y `npm run build` exitosos; guía rápida en README.

### **F-02 · Frontend: Router + Layouts + Navegación**

**Descripción:** Definir rutas públicas/protegidas (`/`, `/login`, `/register`, `/dashboard`), layouts y componentes de navegación (`Navbar`, `Sidebar`, `Footer`, `ThemeToggle`, `LanguageSwitcher`).
**DoD:** `ProtectedRoute` redirige a `/login` si no hay sesión; navegación responsiva.

### **F-03 · Frontend: i18n (es/en)**

**Descripción:** Integrar `i18next` con detección de idioma y persistencia. Archivos `/i18n/es.json` y `/i18n/en.json`; componente `LanguageSwitcher` en Navbar.
**DoD:** Cambio de idioma sin recargar; textos clave traducidos (Navbar, Home, Auth, Dashboard).

### **F-03.5 · Frontend: Biblioteca de Componentes UI (Base + Compuestos)**

**Descripción:**Diseñar y documentar la biblioteca de componentes reutilizables del proyecto (átomos, moléculas, organismos y templates) para las vistas iniciales (Home/Catálogo, Detalle de Propiedad, Perfil de Usuario). Implementación Tailwind-first, tematizable (light/dark) y lista para i18n.\
**Alcance:** Componentes listados en “F-03.5 · Especificación de Componentes UI (Sayulita Travel)” (documento de referencia).\
**Entregables:**

- Carpeta `/src/components/common/` con estructura `atoms/`, `molecules/`, `organisms/`, `templates/` (nombres y contratos definidos).

- Página de documentación `/ui` con ejemplos visuales y estados (sin lógica de negocio).

- Checklist de accesibilidad aplicada a 5 componentes clave (Button, TextInput, Select, Modal, Navbar).\
  **DoD:**

- Tokens de diseño (F-02) aplicados; modo claro/oscuro consistente.

- Textos externalizados para i18n; formatos de fecha/moneda parametrizables.

- Estados de interacción (hover/focus/active/disabled/loading) visibles y testeados con teclado.

- Contrastes AA mínimos y roles ARIA correctos en componentes interactivos.

- Integración de muestra: `ListingCard` en Home, `BookingStickyCard` en Detalle, `ProfileSectionCard` en Perfil renderizando sin errores.\
  **Dependencias:** F-02 (tokens/tema), F-03 (átomos iniciales).\
  **Desbloquea:** F-05 (Home), F-06 (Dashboard/Crear anuncio) y vistas de Detalle.\
  **Labels:** `frontend`, `design-system`, `ui`, `accessibility`, `docs`.

### **F-04 · Frontend: Autenticación (login/register/logout)**

**Descripción:** Implementar con Appwrite; persistencia de sesión; manejo de errores con toasts.
**DoD:** Happy path probado; guardas de ruta; expiración de sesión redirige a `/login`.

### **F-05 · Frontend: Home (catálogo público)**

**Descripción:** Grid de `listings` activos con tarjeta (imagen, título, precio), búsqueda por texto y paginación; skeletons y transiciones.
**DoD:** Datos reales de Appwrite; empty state; framer-motion en mounting/hover.

### **F-06 · Frontend: Dashboard partner + Crear anuncio**

**Descripción:** Vista “Mis Anuncios”; modal/drawer “Nuevo Anuncio” → crea `draft`; acción “Publicar” → `active`.
**DoD:** Crear guarda en `draft` (mínimo `title`, `description`, `basePrice`, `currency`); publicar lo muestra en Home.

### **OPS-01 · CI mínimo**

**Descripción:** Workflow de GitHub Actions (install, lint, build).
**DoD:** PR bloquea si falla lint/build; badge en README.

---

## **5) Labels, Tipos y Estados (para Plane)**

- **Tipos:** Epic, Feature, Task, Bug, Chore, Spike.
- **Labels:** `backend`, `frontend`, `auth`, `rbac`, `ui`, `ux`, `api`, `storage`, `functions`, `permissions`, `docs`, `tests`, `ops`, `i18n`.
- **Estados:** Backlog → Ready → In Progress → Code Review → QA → Done.
- **Prioridad:** P0 crítico, P1 alto, P2 medio, P3 bajo.

---

## **6) Arquitectura Frontend sugerida (estructura actual)**

```
/src
  /api
  /assets
  /components
    /common
    /loaders
    /navigation
  /contexts
  /features
    /listings
    /user
  /hooks
  /i18n
  /layouts
  /pages
  /providers
  /routes
  /services
  /store
  /styles
  /utils
```

- **Componentes comunes** en `components/common` (no atómico).
- **Navegación** en `components/navigation` (Navbar/Sidebar/LanguageSwitcher/ThemeToggle).
- **i18n** centralizado en `/i18n` con inicializador y recursos.

---

## **7) Decisiones y Estándares**

- **Lenguaje:** JavaScript (sin TypeScript en Fase 0).
- **Convenciones de commits:** Conventional Commits.
- **Ramas:** `main`, `develop`, `feat/*`, `fix/*`.
- **Accesibilidad:** enfoque en teclado y estados de foco.
- **DRY:** priorizar componentes compartidos (`components/common`) y helpers en `services/utils`.

---

## **8) Riesgos y Mitigaciones**

- **Búsqueda limitada:** usar filtro simple en Fase 0; planificar Typesense/OpenSearch en Fase 1.
- **Pagos:** posponer a Sprint 2; dejar functions stub listas para integrar.
- **Permisos complejos:** empezar con patrón mínimo (lectura pública de activos).

---

## **9) Métricas de éxito del Sprint**

- Tiempo de _First Meaningful Paint_ aceptable en Home (sin optimización avanzada).
- Crear y publicar un anuncio en < 3 minutos.
- Tasa de errores 4xx/5xx < 2% en endpoints usados por el frontend demo.

---

## **10) Checklist de cierre (DoD del Sprint)**

- Todos los issues del sprint en estado **Done** y enlazados a PRs.
- README actualizado (setup + scripts + decisiones clave).
- Capturas/gifs cortos de las vistas entregadas.
- Demo interna ejecutada y retro documentada.

---

**Anexos**

- Glosario breve:
  - _Listing_: Anuncio publicable (propiedad, auto, servicio…).
  - _Rate Plan_: Configuración de cobro (precio base, moneda, reglas).
  - _Draft/Active_: Estados del anuncio (borrador vs público).
