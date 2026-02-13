# 01_FRONTEND_REQUIREMENTS - REAL ESTATE SAAS PLATFORM

## Referencia

- `00_ai_project_context.md`
- `00_project_brief.md`
- `05_permissions_and_roles.md`
- `07_frontend_routes_and_flows.md`

---

## 1. Objetivo

Definir estandar frontend para una **instancia dedicada por cliente** con:

- catalogo publico
- dashboard de operacion
- reservas y pagos
- staff con permisos restringidos
- panel root oculto de auditoria

---

## 2. Stack

- React + Vite
- JavaScript (sin TypeScript)
- TailwindCSS
- React Router
- i18n (es/en)

No permitido:

- mock/fake data en flujos reales
- acceso directo a secretos

---

## 3. Principios de Arquitectura

1. Mobile-first.
2. Modular por dominio.
3. Backend-first security.
4. Feature flags por instancia.
5. Branding configurable por variables.

---

## 4. Estructura Sugerida

```text
src/
  app/
  routes/
  layouts/
  pages/
  components/
  features/
    auth/
    properties/
    leads/
    reservations/
    payments/
    reviews/
    staff/
    activity-log/
  services/
  contexts/
  utils/
  i18n/
```

---

## 5. Entorno y Configuracion

Uso obligatorio de `src/env.js`.

Variables clave:

- IDs de colecciones Appwrite
- IDs de functions de lead/reserva/pago/review
- Configuración de pagos (Stripe/MercadoPago public keys)
- Feature flags

---

## 6. Rutas Minimas

Publicas:

- `/`
- `/propiedades/:slug`
- `/reservar/:slug`
- `/login`
- `/register`

Privadas:

- `/app/dashboard`
- `/app/my-properties`
- `/app/leads`
- `/app/reservations`
- `/app/payments`
- `/app/reviews`
- `/app/team`
- `/perfil`

Root oculta:

- `/app/activity`
- `/app/amenities`

---

## 7. Guards

- `ProtectedRoute`: sesion valida.
- `RoleRoute`: valida rol.
- `ScopeRoute`: valida permisos finos.
- `RootRoute`: solo root.

---

## 8. Dominios Funcionales Frontend

## 8.1 Properties

- Listado, detalle, CRUD interno.
- Publicar/despublicar con feedback de auditoria.

## 8.2 Leads

- Inbox de contactos.
- Estados y notas.

## 8.3 Reservations

- Timeline de reservas.
- Estados y filtros.

## 8.4 Payments

- Estado por reserva.
- Indicadores `pending/approved/rejected/refunded`.

## 8.5 Reviews

- Moderacion (`pending/published/rejected`).

## 8.6 Staff

- Alta/baja staff.
- Asignacion de rol y scopes.

## 8.7 ActivityLog (root)

- Filtros por actor, entidad, fecha, accion.
- Diff before/after.

---

## 9. UX y UI

- Carga progresiva y skeletons.
- Estados vacios por modulo.
- Mensajes de error claros (`403`, `404`, `409`, `422`, `500`).
- Copy orientado a usuario final: lenguaje simple, accionable y sin jerga tecnica.
- No exponer terminos internos (`root`, `owner`, `client`, `scope`, IDs tecnicos, restricciones de backend) en vistas no-root.
- Componentes reutilizables de tabla, filtros y formularios.

---

## 10. Seguridad Frontend

- Nunca exponer API keys.
- Nunca confiar en estado local para autorizar.
- Ocultar acciones no permitidas segun scope.
- Validar respuestas de backend antes de renderizar datos sensibles.

---

## 11. Performance

- Lazy loading por ruta.
- Listados paginados.
- Memoizacion selectiva en dashboards.
- Carga diferida de modulos root y admin avanzado.

---

## 12. Testing Minimo

- Navegacion publica.
- Auth y guards.
- Reserva + pago (sandbox).
- Staff permission checks.
- Acceso root panel bloqueado para no-root.

---

## 13. Estado del Documento

- Definitivo para frontend MVP de instancia dedicada.
- Alineado con reservas, pagos, staff restringido y auditoria root.

---

Ultima actualizacion: 2026-02-12
Version: 2.0.1
