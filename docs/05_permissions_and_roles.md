# 05_PERMISSIONS_AND_ROLES.md - REAL ESTATE SAAS PLATFORM

## Referencia

- `02_backend_appwrite_requirements.md`
- `03_appwrite_db_schema.md`

---

## 1. Objetivo

Definir control de acceso completo para una instancia dedicada por cliente,
incluyendo:

1. Roles operativos (`owner`, `staff_*`).
2. Usuario `root` interno y oculto.
3. Reglas de auditoria obligatoria.

---

## 2. Principios de Seguridad

1. **Default deny**: sin permiso explicito no hay acceso.
2. **Least privilege**: staff con acceso minimo.
3. **Backend first**: frontend solo mejora UX, no seguridad.
4. **Audit by default**: acciones criticas siempre en `activity_logs`.

---

## 3. Roles del Sistema

### 3.1 Root (interno proveedor)

- Acceso completo tecnico y funcional.
- Puede consultar panel oculto `ActivityLog`.
- No aparece en listados de usuarios del dashboard normal.

### 3.2 Owner (cliente)

- Control total de negocio en su instancia.
- Puede gestionar propiedades, reservas, pagos, reseñas y staff.
- No puede eliminar o exponer configuracion root.

### 3.3 Staff Manager

- Gestion de contenido + leads + reservas.
- Puede responder mensajes y operar dashboard.
- No puede tocar configuracion critica ni root panel.

### 3.4 Staff Editor

- CRUD de contenido (propiedades, imagenes, reseñas moderadas).
- Sin acceso a pagos ni administracion de usuarios.

### 3.5 Staff Support

- Lectura/gestion de leads y reservas.
- Respuesta de mensajes.
- Sin acceso a configuracion de contenido avanzado.

### 3.6 Visitor

- Acceso publico a catalogo.
- Puede enviar lead, reservar y dejar reseña (si cumple reglas).

---

## 4. Scopes por Modulo

`users.scopesJson` puede incluir scopes finos, por ejemplo:

- `properties.read`
- `properties.write`
- `leads.read`
- `leads.write`
- `reservations.read`
- `reservations.write`
- `payments.read`
- `reviews.moderate`
- `staff.manage`

Regla:

- Los scopes se evaluan en backend/functions antes de mutaciones sensibles.

---

## 5. Reglas por Coleccion

## 5.1 users

- Lectura propia: `Role.user(self)`.
- Update propio: `Role.user(self)`.
- Operaciones de staff management: solo via Function (`owner` o `root`).
- Filtrado obligatorio para ocultar `isHidden=true` en vistas no root.

## 5.2 properties / property_images / property_amenities

- Publico puede leer solo contenido publicado.
- Owner y staff autorizado pueden crear/editar/eliminar.
- Toda publicacion/despublicacion se audita.

## 5.3 leads

- Creacion publica via Function (`create-lead-public`).
- Lectura y gestion: owner + staff con scope de leads.
- Nunca publico.

## 5.4 reservations

- Creacion publica via Function (`create-reservation-public`).
- Lectura/gestion: owner + staff autorizado.
- Cambios de estado se registran en `activity_logs`.

## 5.5 reservation_payments

- System only (webhooks/functions).
- Lectura por dashboard mediante endpoint controlado.
- No editable desde frontend directo.

## 5.6 reservation_vouchers

- Emision automatica por Function.
- Lectura owner/staff autorizado.
- Consulta publica opcional solo por token seguro.

## 5.7 reviews

- Creacion publica controlada (post-reserva).
- Moderacion por owner/staff con scope `reviews.moderate`.
- Publicacion/rechazo auditado.

## 5.8 activity_logs

- Escritura exclusiva por backend/functions.
- Lectura completa solo root.
- Owner puede tener vista resumida opcional sin before/after completo.

---

## 6. Matriz de Permisos (Resumen)

| Modulo                 | Root | Owner | Staff Manager | Staff Editor | Staff Support | Visitor |
| ---------------------- | ---- | ----- | ------------- | ------------ | ------------- | ------- |
| Dashboard general      | Yes  | Yes   | Yes           | Yes          | Yes           | No      |
| Propiedades CRUD       | Yes  | Yes   | Yes           | Yes          | No            | No      |
| Leads gestion          | Yes  | Yes   | Yes           | No           | Yes           | No      |
| Reservas gestion       | Yes  | Yes   | Yes           | No           | Yes           | No      |
| Pagos vista            | Yes  | Yes   | Optional      | No           | No            | No      |
| Staff management       | Yes  | Yes   | No            | No           | No            | No      |
| ActivityLog oculto     | Yes  | No    | No            | No           | No            | No      |
| Formulario contacto    | No   | No    | No            | No           | No            | Yes     |
| Crear reservacion web  | No   | No    | No            | No           | No            | Yes     |
| Crear reseña publica   | No   | No    | No            | No            | No            | Yes*    |

`Yes*`: solo si existe reservacion elegible y reglas anti-abuso.

---

## 7. Guardas de Frontend (UX)

Guardas recomendadas:

- `ProtectedRoute` para sesion activa.
- `RoleRoute` para validar rol minimo.
- `ScopeRoute` para modulo especifico.
- `RootRoute` para panel oculto.

Ejemplo simple:

```jsx
if (!user) return <Navigate to="/login" replace />;
if (!hasScope(user, "reservations.read")) return <Navigate to="/forbidden" replace />;
return children;
```

---

## 8. Auditoria Obligatoria

Eventos que SIEMPRE deben loguearse:

- Alta/baja de usuarios staff.
- Cambios de rol/scopes.
- Cambios en propiedades publicadas.
- Cambio de estado de reservacion.
- Confirmacion o reversion de pago.
- Publicacion/rechazo de reseña.
- Intentos de acceso denegado al panel root.

Campos minimos de log:

- `actorUserId`
- `actorRole`
- `action`
- `entityType`
- `entityId`
- `beforeData`
- `afterData`
- `createdAt`

---

## 9. Root User - Reglas Especiales

1. Se crea durante provisioning y se guarda fuera del flujo comercial.
2. `isHidden=true` obligatorio.
3. No editable ni eliminable desde UI de owner.
4. Solo accesible por ruta oculta y guard root.
5. Todas sus acciones quedan auditadas.

---

## 10. Relacion con Otros Documentos

- `06_appwrite_functions_catalog.md`: implementa enforcement de rol/scope.
- `07_frontend_routes_and_flows.md`: traduce permisos a guardas UX.
- `08_env_reference.md`: define variables para root panel y auditoria.

---

## 11. Estado del Documento

- Definitivo para roles/permisos del modelo por instancia dedicada.
- Listo para operacion con staff restringido y root oculto.

---

Ultima actualizacion: 2026-02-10
Version: 2.0.0
