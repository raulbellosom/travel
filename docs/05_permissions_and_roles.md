# 05_PERMISSIONS_AND_ROLES.md – REAL ESTATE SAAS PLATFORM

## Referencia

Este documento se rige estrictamente por:

- 00_ai_project_context.md
- 02_backend_appwrite_requirements.md
- 03_appwrite_db_schema.md

Define un modelo **completo, no resumido**, de roles y permisos usando únicamente el sistema nativo de Appwrite.

---

## 1. Objetivo

1. Proteger datos de usuarios y propiedades
2. Mantener control centralizado en Appwrite (el frontend no "simula" permisos)
3. Habilitar operación SaaS multi-tenant desde arquitectura
4. Dejar reglas explícitas para que un agente de IA pueda:
   - Crear collections con permisos correctos
   - Configurar permissions por documento
   - Implementar guards en frontend
     sin inventar reglas

---

## 2. Conceptos y Primitivas de Appwrite

### 2.1 Permisos (Permissions)

Appwrite define permisos por documento/colección usando combinaciones de:

- **Read**: Leer documento
- **Create**: Crear documento
- **Update**: Actualizar documento
- **Delete**: Eliminar documento

Los permisos deben aplicarse con el principio de **mínimo privilegio**.

### 2.2 Roles (Roles)

Los permisos se asignan a roles nativos:

- `Role.any()` - Cualquier usuario (público, no autenticado)
- `Role.users()` - Cualquier usuario autenticado
- `Role.user(userId)` - Usuario específico
- `Role.users(verified)` - Solo usuarios con email verificado
- `Role.team(teamId)` - Miembros de un team
- `Role.team(teamId, role)` - Miembros con rol específico en team

---

## 3. Roles del Sistema (Negocio)

El sistema maneja estos roles de negocio en **Fase 0**:

1. **Admin/Agent**: Propietario de la cuenta
   - Gestiona sus propias propiedades
   - Gestiona sus leads
   - Accede a dashboard

2. **Public/Visitor**: Usuario no autenticado
   - Ve catálogo público
   - Ve detalle de propiedades publicadas
   - Envía formularios de contacto

**Fase 1** (Multi-Tenant):

3. **Organization Owner**: Dueño de organización
   - Admin supremo de su organización
   - Gestiona miembros
   - Ve todas las propiedades de su org

4. **Organization Member**: Agente miembro
   - Gestiona sus propiedades asignadas
   - Ve leads de sus propiedades
   - Acceso limitado al dashboard

---

## 4. Estructura de Teams en Appwrite

### 4.1 Fase 0 (MVP - Sin Multi-Tenant Real)

En Fase 0, **NO se usan Teams**.
Cada usuario es independiente y gestiona solo sus recursos.

### 4.2 Fase 1 (Multi-Tenant)

Se introducen **Teams**:

- Un Team por organización
- Team ID = Organization ID
- Miembros del team con roles:
  - `owner` - Dueño de la organización
  - `admin` - Administrador
  - `member` - Agente regular

Reglas:

- Un usuario puede pertenecer a múltiples teams (si es agente freelance + miembro de agencia)
- El rol efectivo se determina por membresía de team

---

## 5. Collection: users (Perfiles)

### 5.1 Permisos por Documento

Cada documento de `users` tiene:

```javascript
{
  "$permissions": [
    Permission.read(Role.user(authId)),     // Solo el usuario puede leer su perfil
    Permission.update(Role.user(authId)),   // Solo el usuario puede actualizar su perfil
    Permission.delete(Role.user(authId))    // Solo el usuario puede eliminar su perfil
  ]
}
```

### 5.2 Creación de Perfil

La creación se hace vía **Appwrite Function** al registrarse:

```javascript
// Function: user-create-profile
// Trigger: users.*.create (Auth event)

const profile = await databases.createDocument(
  databaseId,
  "users",
  authUserId, // Document ID = Auth User ID
  {
    authId: authUserId,
    email: userEmail,
    firstName: data.firstName,
    lastName: data.lastName,
    role: "agent", // Default
    enabled: true,
    onboardingCompleted: false,
  },
  [
    Permission.read(Role.user(authUserId)),
    Permission.update(Role.user(authUserId)),
    Permission.delete(Role.user(authUserId)),
  ],
);
```

### 5.3 Campo 'role'

El campo `role` en el perfil es **informativo**, NO otorga permisos.
Los permisos reales están en los `$permissions` del documento.

Valores:

- `admin` - Administrador/dueño (Fase 0)
- `agent` - Agente (Fase 0)

---

## 6. Collection: properties (Propiedades)

### 6.1 Estrategia de Permisos

**Lectura**:

- Público (`Role.any()`) SOLO si:
  - `status === 'published'`
  - `enabled === true`
- Propietario (`Role.user(userId)`) siempre

**Escritura** (Create/Update/Delete):

- Solo propietario (`Role.user(userId)`)

### 6.2 Permisos por Documento

Al crear una propiedad:

```javascript
const property = await databases.createDocument(
  databaseId,
  "properties",
  ID.unique(),
  {
    userId: currentUser.$id,
    title: "Casa en venta",
    status: "draft", // Inicia como draft, no público
    enabled: true,
    // ... demás campos
  },
  [
    Permission.read(Role.user(currentUser.$id)), // Propietario siempre puede leer
    Permission.update(Role.user(currentUser.$id)), // Propietario puede editar
    Permission.delete(Role.user(currentUser.$id)), // Propietario puede eliminar
  ],
);
```

### 6.3 Cambio a "Published"

Cuando el usuario publica la propiedad (`status = 'published'`):

```javascript
// UpdateProperty
await databases.updateDocument(
  databaseId,
  "properties",
  propertyId,
  {
    status: "published",
    publishedAt: new Date().toISOString(),
  },
  [
    Permission.read(Role.any()), // ✅ Ahora ES público
    Permission.update(Role.user(currentUser.$id)),
    Permission.delete(Role.user(currentUser.$id)),
  ],
);
```

**Importante**: El cambio de permisos debe ser **explícito**.

### 6.4 Consulta Pública (Frontend)

```javascript
// Obtener propiedades publicadas (cualquier usuario)
const properties = await databases.listDocuments(databaseId, "properties", [
  Query.equal("status", "published"),
  Query.equal("enabled", true),
  Query.orderDesc("createdAt"),
  Query.limit(20),
]);
```

Appwrite automáticamente filtra documentos sin permiso de lectura.

### 6.5 Consulta Privada (Dashboard de Usuario)

```javascript
// Obtener MIS propiedades (todas, incluso drafts)
const myProperties = await databases.listDocuments(databaseId, "properties", [
  Query.equal("userId", currentUser.$id),
  Query.orderDesc("createdAt"),
]);
```

---

## 7. Collection: property_images

### 7.1 Permisos por Documento

Las imágenes "heredan" visibilidad de la propiedad:

```javascript
const propertyImage = await databases.createDocument(
  databaseId,
  "property_images",
  ID.unique(),
  {
    propertyId: propertyId,
    fileId: uploadedFileId,
    order: 1,
    enabled: true,
  },
  [
    Permission.read(Role.any()), // Público (asumiendo propiedad publicada)
    Permission.update(Role.user(property.userId)), // Solo dueño de propiedad
    Permission.delete(Role.user(property.userId)),
  ],
);
```

**Alternativa más segura** (Fase 1):
Usar `Role.user(property.userId)` para lectura también, y en frontend verificar `property.status` antes de mostrar.

---

## 8. Collection: leads (Contactos)

### 8.1 Estrategia de Permisos

**Lectura**:

- Solo propietario de la propiedad (`Role.user(propertyOwnerId)`)

**Escritura**:

- Crear: Público (`Role.any()`) - formulario de contacto
- Actualizar/Eliminar: Solo propietario

### 8.2 Permisos por Documento

```javascript
const lead = await databases.createDocument(
  databaseId,
  "leads",
  ID.unique(),
  {
    propertyId: propertyId,
    propertyOwnerId: property.userId, // ⚠️ Duplicar para permisos
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    message: formData.message,
    source: "web_form",
    status: "new",
    enabled: true,
  },
  [
    Permission.read(Role.user(property.userId)), // Solo dueño de propiedad
    Permission.update(Role.user(property.userId)),
    Permission.delete(Role.user(property.userId)),
  ],
);
```

**Nota crítica**:
Para crear el lead, el frontend usa **Appwrite Function** con API Key, no SDK del usuario.
Así el formulario público puede crear leads sin autenticación, pero con permisos correctos.

---

## 9. Collection: user_preferences

### 9.1 Permisos por Documento

```javascript
const preferences = await databases.createDocument(
  databaseId,
  "user_preferences",
  ID.unique(),
  {
    userId: currentUser.$id,
    theme: "system",
    locale: "es",
    // ... demás preferencias
  },
  [
    Permission.read(Role.user(currentUser.$id)),
    Permission.update(Role.user(currentUser.$id)),
    Permission.delete(Role.user(currentUser.$id)),
  ],
);
```

---

## 10. Storage Buckets

### 10.1 Bucket: property-images

**Configuración**:

- Lectura: `Role.any()` (público)
- Escritura: `Role.users()` (cualquier autenticado)

**Permisos por archivo**:

```javascript
const file = await storage.createFile(
  "property-images",
  ID.unique(),
  inputFile,
  [
    Permission.read(Role.any()), // Público
    Permission.update(Role.user(currentUser.$id)), // Solo uploader
    Permission.delete(Role.user(currentUser.$id)),
  ],
);
```

### 10.2 Bucket: avatars

**Configuración**:

- Lectura: `Role.users()` (autenticados)
- Escritura: `Role.users()` (autenticados)

**Permisos por archivo**:

```javascript
const avatar = await storage.createFile("avatars", ID.unique(), inputFile, [
  Permission.read(Role.users()), // Solo autenticados
  Permission.update(Role.user(currentUser.$id)),
  Permission.delete(Role.user(currentUser.$id)),
]);
```

---

## 11. Guards en Frontend

### 11.1 AuthGuard (Rutas Privadas)

```javascript
// routes/ProtectedRoute.jsx
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

**Rutas protegidas**:

- `/dashboard`
- `/mis-propiedades`
- `/crear-propiedad`
- `/editar-propiedad/:id`
- `/leads`
- `/perfil`
- `/configuracion`

### 11.2 OwnerGuard (Verificar Propiedad Propia)

```javascript
// hooks/useOwnerGuard.js
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function useOwnerGuard(property) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (property && property.userId !== user.$id) {
      // No es el dueño
      navigate("/dashboard", { replace: true });
    }
  }, [property, user]);
}
```

**Uso en EditProperty**:

```javascript
function EditPropertyPage() {
  const { id } = useParams();
  const { data: property } = useProperty(id);

  useOwnerGuard(property); // ← Guard

  // ... resto del componente
}
```

---

## 12. Validación en Backend (Functions)

### 12.1 Validar Propiedad de Recurso

Toda Appwrite Function que modifica recursos debe verificar ownership:

```javascript
// Function: update-property-status
export default async ({ req, res, error }) => {
  const { propertyId, newStatus } = JSON.parse(req.body);
  const userId = req.variables.APPWRITE_FUNCTION_USER_ID; // Usuario que invoca

  // 1. Obtener propiedad
  const property = await databases.getDocument(
    databaseId,
    "properties",
    propertyId,
  );

  // 2. Verificar ownership
  if (property.userId !== userId) {
    return res.json({ success: false, error: "Forbidden" }, 403);
  }

  // 3. Proceder con actualización
  await databases.updateDocument(databaseId, "properties", propertyId, {
    status: newStatus,
  });

  return res.json({ success: true });
};
```

---

## 13. Política Global de Seguridad

### 13.1 Default Deny

**Principio**: Los documentos SIN permisos explícitos son **inaccesibles**.

### 13.2 Least Privilege

**Principio**: Otorgar solo los permisos mínimos necesarios.

Ejemplos:

- ❌ `Role.any()` en todos los leads (expone datos privados)
- ✅ `Role.user(propertyOwnerId)` en leads (solo dueño)

### 13.3 Never Trust Frontend

**Principio**: El frontend NO toma decisiones de seguridad reales.

Guards de frontend son **UX**, no seguridad.
La seguridad real está en:

- Permisos de Appwrite
- Validaciones en Functions

---

## 14. Matriz de Permisos (Resumen)

| Collection             | Lectura             | Creación             | Actualización       | Eliminación         |
| ---------------------- | ------------------- | -------------------- | ------------------- | ------------------- |
| users                  | user(self)          | Function             | user(self)          | user(self)          |
| user_preferences       | user(self)          | user(self)           | user(self)          | user(self)          |
| properties (draft)     | user(owner)         | users()              | user(owner)         | user(owner)         |
| properties (published) | any()               | users()              | user(owner)         | user(owner)         |
| property_images        | any() o user(owner) | users()              | user(owner)         | user(owner)         |
| property_amenities     | any()               | user(owner)          | user(owner)         | user(owner)         |
| amenities              | any()               | admin                | admin               | admin               |
| leads                  | user(propertyOwner) | any() (vía function) | user(propertyOwner) | user(propertyOwner) |

**Leyenda**:

- `any()` = Público
- `users()` = Cualquier autenticado
- `user(X)` = Usuario específico X
- `admin` = Solo vía Functions con API Key

---

## 15. Fase 1: Multi-Tenant con Organizations

### 15.1 Teams de Appwrite

Cada organización tendrá su Team:

```javascript
// Crear organización implica crear Team
const team = await teams.create(ID.unique(), organizationName);

// Agregar dueño como owner
await teams.createMembership(team.$id, ["owner"], userId);
```

### 15.2 Permisos con Teams

Propiedades de organización:

```javascript
const property = await databases.createDocument(
  databaseId,
  "properties",
  ID.unique(),
  {
    userId: currentUser.$id,
    organizationId: team.$id,
    // ... demás campos
  },
  [
    Permission.read(Role.any()), // Si published
    Permission.update(Role.team(team.$id, "owner")), // Solo owners de org
    Permission.update(Role.team(team.$id, "admin")), // O admins
    Permission.delete(Role.team(team.$id, "owner")), // Solo owners
  ],
);
```

### 15.3 Roles en Team

- `owner`: Dueño de la organización
- `admin`: Administrador (puede gestionar propiedades de otros)
- `member`: Agente regular (solo sus propiedades)

---

## 16. Auditoría (Futuro)

Collection `audits` para rastrear acciones críticas:

- Login exitoso/fallido
- Creación/edición/eliminación de propiedades
- Cambios de permisos
- Invitaciones a organizaciones

---

## 17. Relación con Documentos Posteriores

Este documento habilita:

- 06_appwrite_functions_catalog.md (funciones con lógica de permisos)
- 07_frontend_routes_and_flows.md (guards y flujos protegidos)

---

## 18. Estado del Documento

Este documento es:

- ✅ Definitivo para Fase 0
- 📝 Se expandirá en Fase 1 con multi-tenant real
- 🔒 Principio de mínimo privilegio no negociable

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
