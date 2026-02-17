# 07_FRONTEND_ROUTES_AND_FLOWS.md - REAL ESTATE SAAS PLATFORM

## Referencia

- `01_frontend_requirements.md`
- `05_permissions_and_roles.md`
- `06_appwrite_functions_catalog.md`

---

## 1. Principios de Navegacion

1. Mobile-first.
2. Seguridad por backend + permisos Appwrite.
3. Guards de frontend como UX, no como seguridad unica.
4. Estados explicitos: loading, empty, error, success.

---

## 2. Guards Globales

## 2.1 `ProtectedRoute`

- Requiere sesion activa.
- Si no hay sesion -> `/login`.

## 2.2 `InternalRoute`

- Requiere sesion activa + rol interno (`root`,`owner`,`staff_*`).
- Si el usuario es `client` -> `/error/403`.

## 2.3 `RoleRoute`

- Valida rol minimo (`owner`, `staff_*`, `root`).
- Si no cumple -> `/forbidden`.

## 2.4 `ScopeRoute`

- Valida scope de modulo (`reservations.read`, `staff.manage`, etc.).

## 2.5 `RootRoute`

- Solo para usuario `root`.
- Bloquea acceso al panel oculto de auditoria.

## 2.6 `OwnerRoute`

- Requiere `user.role === owner`.
- Uso recomendado para modulos de negocio sensibles como listados de clientes.

---

## 3. Rutas Publicas

| Ruta                  | Descripcion                                      |
| --------------------- | ------------------------------------------------ |
| `/`                   | Home/catalogo publico                            |
| `/propiedades/:slug`  | Detalle de propiedad                             |
| `/reservar/:slug`     | Flujo de reserva (requiere login para confirmar) |
| `/voucher/:code`      | Consulta publica opcional de voucher             |
| `/login`              | Inicio de sesion                                 |
| `/register`           | Registro                                         |
| `/recuperar-password` | Recovery                                         |
| `/reset-password`     | Reset                                            |

### 3.1 Flujo `/reservar/:slug`

1. Usuario elige fechas y huespedes.
2. Si no tiene sesion, frontend redirige a `/login`.
3. Si no tiene email verificado, frontend bloquea y solicita verificar.
4. Frontend llama `create-reservation-public`.
5. Frontend llama `create-payment-session`.
6. Usuario paga en Stripe/Mercado Pago.
7. Webhook confirma pago.
8. Usuario recibe mensaje de confirmacion + voucher.

### 3.2 Landing Page Toggle (`FEATURE_MARKETING_SITE`)

La ruta `/` muestra contenido diferente dependiendo de `FEATURE_MARKETING_SITE`:

| Valor   | Ruta `/` muestra                             | Caso de uso                             |
| ------- | -------------------------------------------- | --------------------------------------- |
| `true`  | `LandingTemplate` — marketing del CRM        | Tú (dueño del CRM) anuncias el producto |
| `false` | Catálogo de propiedades (`Home` con filtros) | Tu cliente anuncia sus inmuebles        |

**Flujo técnico:**

1. `vite.config.js` → inyecta la variable en `globalThis.__TRAVEL_ENV__`
2. `src/env.js` → expone como `env.features.marketingSite`
3. `src/pages/Home.jsx` → si `true` y sin filtros activos, renderiza `LandingTemplate`

**Tres capas de la plataforma:**

- **Marketing CRM** (`true`): Landing con `MarketingNavbar` + `LandingTemplate`
- **Panel administrativo** (`/app/*`): Dashboard para clientes que compraron el CRM
- **Catálogo público** (`false`): Landing con `MainLayout` + propiedades del cliente

---

## 4. Rutas Privadas de Operacion

| Ruta                       | Guard          | Rol/Scope                 |
| -------------------------- | -------------- | ------------------------- |
| `/app/dashboard`           | InternalRoute  | cualquier usuario interno |
| `/app/my-properties`       | ScopeRoute     | `properties.read`         |
| `/app/properties/new`      | ScopeRoute     | `properties.write`        |
| `/app/properties/:id/edit` | ScopeRoute     | `properties.write`        |
| `/app/leads`               | ScopeRoute     | `leads.read`              |
| `/app/clients`             | OwnerRoute     | `owner`                   |
| `/app/reservations`        | ScopeRoute     | `reservations.read`       |
| `/app/calendar`            | ScopeRoute     | `reservations.read`       |
| `/app/payments`            | ScopeRoute     | `payments.read`           |
| `/app/reviews`             | ScopeRoute     | `reviews.moderate`        |
| `/app/team`                | ScopeRoute     | `staff.manage`            |
| `/perfil`                  | ProtectedRoute | usuario autenticado       |
| `/app/settings`            | RoleRoute      | `owner` o `root`          |

En `/app/dashboard` se deben mostrar visualizaciones minimas:

- Leads por periodo.
- Reservas por estado.
- Ingresos aprobados (Stripe/Mercado Pago).

---

## 5. Ruta Oculta Root

| Ruta             | Guard     | Visible en menu |
| ---------------- | --------- | --------------- |
| `/app/activity`  | RootRoute | Si (solo root)  |
| `/app/amenities` | RootRoute | Si (solo root)  |

Panel `ActivityLog`:

- Filtro por fecha, actor, entidad, accion.
- Vista de before/after.
- Export CSV/JSON (futuro).
- Nunca se muestra al owner/staff.

---

## 6. Layouts

## 6.1 `MainLayout` (publico)

- Navbar
- Contenido publico
- Footer

## 6.2 `DashboardLayout` (interno)

- Sidebar segun scopes.
- Navbar superior.
- Contenido.

Regla:

- Items de menu se construyen por rol/scope.
- No renderizar opcion root salvo rol `root`.

---

## 7. Flujos Criticos

## 7.1 Publicar propiedad

1. Owner/staff_editor crea propiedad.
2. Guarda draft.
3. Publica.
4. Se registra `activity_logs` con before/after.

## 7.2 Atender lead

1. Visitante envia formulario.
2. Owner/staff_support recibe notificacion.
3. Cambia estado de lead.
4. Cada cambio queda auditado.

## 7.3 Reserva + pago + voucher

1. Cliente autenticado crea reserva.
2. Paga en pasarela.
3. Webhook confirma pago.
4. Sistema confirma reserva.
5. Sistema genera voucher.
6. Owner/staff ve reserva en dashboard.

## 7.4 Gestion de staff

1. Owner entra a `/app/team`.
2. Crea usuario staff.
3. Asigna rol/scopes.
4. Cambios quedan en ActivityLog.

## 7.5 Auditoria root

1. Root accede al modulo interno `/app/activity`.
2. Filtra por entidad (ej. `reservations`).
3. Revisa before/after de cambios.

## 7.6 Calendario de reservaciones

1. Owner/staff accede a `/app/calendar`.
2. Visualiza reservaciones en vistas de día, semana, mes o año.
3. Filtra por propiedad, estado de reservación o estado de pago.
4. Hace clic en una reservación para ver detalle en modal.
5. Navega entre fechas con controles de navegación.

## 7.7 Calendario de disponibilidad (público)

1. Cliente visita `/propiedades/:slug` de tipo `vacation_rental`.
2. Ve calendario de disponibilidad con precio por noche en cada día.
3. Selecciona rango de fechas (check-in → check-out).
4. Ve resumen de reserva: noches, desglose de precio, total.
5. Confirma con CTA "Continuar al pago" → redirige a `/reservar/:slug`.

---

## 8. Estados y Errores

- `403`: sin rol/scope.
- `404`: recurso no encontrado.
- `409`: conflicto de estado (reserva ya confirmada, webhook duplicado).
- `422`: validacion de datos.
- `500`: error interno.

---

## 9. SEO Publico

Aplicar SEO en:

- `/`
- `/propiedades/:slug`
- `/reservar/:slug`

Rutas privadas y root no indexables.

---

## 10. Comportamiento del Detalle de Propiedad por Tipo de Operación

La ruta `/propiedades/:slug` muestra el detalle público de una propiedad.
Los campos, secciones y acciones varían según `operationType`.

### 10.1 Venta (`sale`)

**CTA Principal:** "Agendar visita" — enlace a formulario de contacto con mensaje prefijado.
No existe flujo de reservación ni pago online para ventas.

**Campos visibles:**

| Campo                     | Obligatorio |
| ------------------------- | ----------- |
| `price` (total)           | sí          |
| `currency`                | sí          |
| `pricePerUnit`            | si aplica   |
| `priceNegotiable`         | sí          |
| `bedrooms`                | sí          |
| `bathrooms`               | sí          |
| `parkingSpaces`           | sí          |
| `totalArea` / `builtArea` | sí          |
| `floors`                  | sí          |
| `yearBuilt`               | si existe   |
| `furnished`               | si existe   |
| `propertyType`            | sí          |

**Etiqueta de precio:** "Precio de venta"
**Secciones ocultas:** reservación, check-in/out, estancia mínima/máxima, maxGuests.

### 10.2 Renta a largo plazo (`rent`)

**CTA Principal:** "Solicitar información" — enlace a formulario de contacto.
Se permite agendar visita. Las reservaciones de renta se manejan vía contacto directo,
no con el flujo online de pago+voucher.

**Campos visibles:**

| Campo                                        | Obligatorio |
| -------------------------------------------- | ----------- |
| `price` (por periodo)                        | sí          |
| `currency`                                   | sí          |
| `rentPeriod` (`monthly`, `yearly`, `weekly`) | sí          |
| `priceNegotiable`                            | sí          |
| `bedrooms`                                   | sí          |
| `bathrooms`                                  | sí          |
| `parkingSpaces`                              | sí          |
| `totalArea` / `builtArea`                    | sí          |
| `floors`                                     | sí          |
| `furnished`                                  | sí          |
| `petsAllowed`                                | sí          |
| `propertyType`                               | sí          |

**Etiqueta de precio:** "Precio de renta" + sufijo del periodo (ej: "/mes", "/año", "/semana").
**Secciones ocultas:** check-in/out, estancia mínima/máxima (en noches), maxGuests, reservación online.

### 10.3 Renta vacacional (`vacation_rental`)

**CTA Principal:** "Reservar ahora" — enlace a `/reservar/:slug`.
Flujo completo de reservación online con pago y voucher digital.

**Campos visibles:**

| Campo                     | Obligatorio |
| ------------------------- | ----------- |
| `price` (por noche)       | sí          |
| `currency`                | sí          |
| `maxGuests`               | sí          |
| `bedrooms`                | sí          |
| `bathrooms`               | sí          |
| `parkingSpaces`           | sí          |
| `totalArea` / `builtArea` | si existe   |
| `minStayNights`           | sí          |
| `maxStayNights`           | sí          |
| `checkInTime`             | sí          |
| `checkOutTime`            | sí          |
| `furnished`               | sí          |
| `petsAllowed`             | sí          |
| `propertyType`            | sí          |

**Etiqueta de precio:** "Precio por noche" o "Desde $X /noche".
**Secciones adicionales:** Reglas de la casa (check-in, check-out, estancia mín/máx, huéspedes máx).

**Calendario de disponibilidad:**

- Se muestra un calendario interactivo con precio por noche en cada día disponible.
- Días con reservas confirmadas aparecen deshabilitados.
- El usuario selecciona rango de fechas (check-in → check-out).
- Se muestra un resumen de reserva con desglose: noches × precio, impuestos, total.
- CTA "Continuar al pago" redirige a `/reservar/:slug` con fechas preseleccionadas.

### 10.4 Resumen de CTAs por tipo

| `operationType`   | CTA Principal         | Destino                         | Flujo de pago |
| ----------------- | --------------------- | ------------------------------- | ------------- |
| `sale`            | Agendar visita        | Scroll a formulario de contacto | No            |
| `rent`            | Solicitar información | Scroll a formulario de contacto | No            |
| `vacation_rental` | Reservar ahora        | `/reservar/:slug`               | Sí            |

### 10.5 Secciones comunes a todos los tipos

- Galería de imágenes
- Información principal (título, ubicación, precio, badges)
- Características rápidas (recámaras, baños, área, estacionamiento, tipo)
- Descripción completa
- Amenidades
- Mapa de ubicación
- Información del agente/anfitrión
- Formulario de contacto

---

## 11. Estado del Documento

- Definitivo para rutas y flujos MVP con reservas/pagos/staff/root.
- Extensible por personalizaciones visuales por cliente.

---

Ultima actualizacion: 2026-02-16
Version: 2.3.0
