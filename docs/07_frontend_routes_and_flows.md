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

## 2.2 `RoleRoute`

- Valida rol minimo (`owner`, `staff_*`, `root`).
- Si no cumple -> `/forbidden`.

## 2.3 `ScopeRoute`

- Valida scope de modulo (`reservations.read`, `staff.manage`, etc.).

## 2.4 `RootRoute`

- Solo para usuario `root`.
- Bloquea acceso al panel oculto de auditoria.

---

## 3. Rutas Publicas

| Ruta | Descripcion |
| ---- | ----------- |
| `/` | Home/catalogo publico |
| `/propiedades/:slug` | Detalle de propiedad |
| `/reservar/:slug` | Flujo de reserva publica |
| `/voucher/:code` | Consulta publica opcional de voucher |
| `/login` | Inicio de sesion |
| `/register` | Registro |
| `/recuperar-password` | Recovery |
| `/reset-password` | Reset |

### 3.1 Flujo `/reservar/:slug`

1. Usuario elige fechas y huespedes.
2. Frontend llama `create-reservation-public`.
3. Frontend llama `create-payment-session`.
4. Usuario paga en Stripe/Mercado Pago.
5. Webhook confirma pago.
6. Usuario recibe mensaje de confirmacion + voucher.

---

## 4. Rutas Privadas de Operacion

| Ruta | Guard | Rol/Scope |
| ---- | ----- | --------- |
| `/dashboard` | ProtectedRoute | cualquier usuario interno |
| `/mis-propiedades` | ScopeRoute | `properties.read` |
| `/crear-propiedad` | ScopeRoute | `properties.write` |
| `/editar-propiedad/:id` | ScopeRoute | `properties.write` |
| `/leads` | ScopeRoute | `leads.read` |
| `/reservas` | ScopeRoute | `reservations.read` |
| `/pagos` | ScopeRoute | `payments.read` |
| `/resenas` | ScopeRoute | `reviews.moderate` |
| `/equipo` | ScopeRoute | `staff.manage` |
| `/perfil` | ProtectedRoute | usuario autenticado |
| `/configuracion` | RoleRoute | `owner` o `root` |

En `/dashboard` se deben mostrar visualizaciones minimas:

- Leads por periodo.
- Reservas por estado.
- Ingresos aprobados (Stripe/Mercado Pago).

---

## 5. Ruta Oculta Root

| Ruta | Guard | Visible en menu |
| ---- | ----- | --------------- |
| `/__root/activity` | RootRoute | No |

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

1. Visitante crea reserva.
2. Paga en pasarela.
3. Webhook confirma pago.
4. Sistema confirma reserva.
5. Sistema genera voucher.
6. Owner/staff ve reserva en dashboard.

## 7.4 Gestion de staff

1. Owner entra a `/equipo`.
2. Crea usuario staff.
3. Asigna rol/scopes.
4. Cambios quedan en ActivityLog.

## 7.5 Auditoria root

1. Root accede manualmente a `/__root/activity`.
2. Filtra por entidad (ej. `reservations`).
3. Revisa before/after de cambios.

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

## 10. Estado del Documento

- Definitivo para rutas y flujos MVP con reservas/pagos/staff/root.
- Extensible por personalizaciones visuales por cliente.

---

Ultima actualizacion: 2026-02-10
Version: 2.0.0
