# 02_BACKEND_APPWRITE_REQUIREMENTS – REAL ESTATE SAAS PLATFORM

## Referencia

Este documento se rige estrictamente por:

- 00_ai_project_context.md
- 00_project_brief.md
- 01_frontend_requirements.md

---

## 1. Plataforma Backend

- **Appwrite self-hosted** (última versión estable >= 1.5.x)
- **PostgreSQL** como motor de base de datos
- Appwrite como **fuente única de verdad** para datos
- Uso exclusivo de capacidades reales de Appwrite

---

## 2. Servicios de Appwrite Utilizados

### 2.1 Auth (Autenticación)

**Propósito**: Gestión de identidad y sesiones

**Métodos soportados**:

- Email/Password (principal)
- OAuth (futuro): Google, Facebook
- Magic URL (futuro)
- Phone/SMS (futuro)

**Características**:

- Verificación de email obligatoria
- Recuperación de contraseña
- Sesiones persistentes
- Límites de sesiones concurrentes

---

### 2.2 Databases (Base de Datos)

**Propósito**: Almacenamiento de datos estructurados

**Database ID**: `main`

**Colecciones previstas** (ver 03_appwrite_db_schema.md):

- `users` - Perfiles de usuario extendidos
- `properties` - Propiedades/inmuebles
- `property_images` - Imágenes de propiedades
- `property_amenities` - Amenidades por propiedad
- `leads` - Contactos/leads recibidos
- `organizations` - Organizaciones (futuro multi-tenant)
- `organization_members` - Miembros de org (futuro)
- `user_preferences` - Preferencias de usuario
- `audits` - Auditoría de acciones (opcional)

**Características**:

- Relationships entre colecciones
- Índices para búsquedas eficientes
- Full-text search (PostgreSQL)
- Permisos a nivel de documento

---

### 2.3 Storage (Almacenamiento)

**Propósito**: Gestión de archivos multimedia

**Buckets previstos**:

| Bucket ID         | Propósito                   | Max Size | Public | Extensiones          |
| ----------------- | --------------------------- | -------- | ------ | -------------------- |
| `property-images` | Imágenes de propiedades     | 10 MB    | Yes    | jpg, jpeg, png, webp |
| `avatars`         | Avatares de usuarios        | 5 MB     | No     | jpg, jpeg, png, webp |
| `documents`       | Documentos legales (futuro) | 20 MB    | No     | pdf, doc, docx       |

**Características**:

- Compresión automática de imágenes
- Generación de thumbnails
- CDN para servir medios
- Validación de tipos de archivo
- Límites de tamaño por bucket

---

### 2.4 Functions (Funciones Cloud)

**Propósito**: Lógica de negocio, automatizaciones, integraciones

**Runtime**: Node.js >= 18

**SDK**: node-appwrite >= 17.0.0

**Functions previstas** (ver 06_appwrite_functions_catalog.md):

- `send-lead-notification` - Notificar al admin cuando llega lead
- `property-published-webhook` - Acciones cuando se publica propiedad
- `image-processor` - Procesar y optimizar imágenes
- `seo-sitemap-generator` - Generar sitemap.xml (futuro)
- `whatsapp-integration` - Integración WhatsApp (futuro)

**Características**:

- Event triggers (database, storage, auth)
- Scheduled tasks (cron)
- HTTP endpoints
- Variables de entorno por función

---

### 2.5 Messaging (Mensajería)

**Propósito**: Envío de emails y notificaciones

**Providers**:

- SMTP (principal)
- SendGrid (futuro)
- Mailgun (futuro)

**Plantillas de email**:

- Verificación de email
- Recuperación de contraseña
- Nuevo lead recibido
- Propiedad publicada (confirmación)
- Bienvenida (onboarding)

**Características**:

- Templates con variables
- Scheduling
- Tracking de apertura/clicks (futuro)

---

### 2.6 Realtime (Opcional)

**Propósito**: Actualizaciones en tiempo real

**Uso futuro**:

- Notificaciones de nuevos leads
- Actualización de estadísticas
- Chat interno (futuro)

---

## 3. Autenticación y Sesiones

### 3.1 Roles de Aplicación

El sistema maneja roles a nivel de aplicación (no de Appwrite Auth):

- **Admin**: Propietario de la instancia/organización
- **Agent**: Agente inmobiliario (futuro multi-tenant)
- **User**: Usuario público (futuro para favoritos)

Los roles se almacenan en la colección `users` (campo `role`).

### 3.2 Manejo de Sesiones

- Sesiones gestionadas por Appwrite Auth
- Cookie `a_session_*` (httpOnly)
- Expiración: 30 días (configurable)
- Renovación automática
- Logout limpia sesión completamente

### 3.3 Verificación de Email

- **Obligatoria** para acceso completo
- Email enviado automáticamente al registrarse
- Usuario puede reenviar email de verificación
- Token expira en 7 días

---

## 4. Base de Datos - Principios

### 4.1 Nomenclatura

- **Collections**: snake_case (ej: `property_images`)
- **Attributes**: camelCase (ej: `createdAt`, `propertyType`)
- **IDs**: Auto-generados por Appwrite
- **Relationships**: explícitos con IDs

### 4.2 Campos Comunes (Estándar)

Todas las colecciones principales deben incluir:

- `createdAt` (datetime) - Fecha de creación
- `updatedAt` (datetime) - Última actualización
- `enabled` (boolean, default: true) - Soft delete

Colecciones multi-tenant (futuro):

- `organizationId` (string) - FK a organizations

### 4.3 Índices

Crear índices para:

- Campos usados en filtros (ej: `propertyType`, `operationType`, `status`)
- Campos usados en ordenamiento (ej: `price`, `createdAt`)
- Búsquedas de texto (fulltext)
- Foreign keys (ej: `userId`, `propertyId`)

**Nomenclatura de índices**:

- `idx_<collection>_<field>` (ej: `idx_properties_status`)
- `uq_<collection>_<field>` para unique (ej: `uq_users_email`)
- `fk_<collection>_<field>` para foreign keys (ej: `fk_leads_propertyId`)

---

## 5. Permisos

### 5.1 Estrategia de Permisos

Appwrite maneja permisos a nivel de documento con:

- `Role.any()` - Cualquier usuario (público)
- `Role.user(userId)` - Usuario específico
- `Role.users()` - Cualquier usuario autenticado
- `Role.team(teamId)` - Team específico (futuro multi-tenant)

### 5.2 Permisos por Colección (Fase 0)

**users** (perfiles):

- Read: `Role.user(userId)` (solo su perfil)
- Write: `Role.user(userId)` (solo su perfil)

**properties** (propiedades):

- Read: `Role.any()` si `status=published` y `enabled=true`
- Read: `Role.user(userId)` (propietario) siempre
- Create: `Role.users()` (cualquier autenticado)
- Update: `Role.user(userId)` (propietario)
- Delete: `Role.user(userId)` (propietario)

**leads** (contactos):

- Read: `Role.user(userId)` (admin de la propiedad)
- Create: `Role.any()` (formulario público)
- Update: `Role.user(userId)` (admin)
- Delete: `Role.user(userId)` (admin)

**property_images**:

- Read: `Role.any()` (en contexto de propiedad pública)
- Create/Update/Delete: `Role.user(userId)` (propietario de propiedad)

---

## 6. Storage (Detalle)

### 6.1 Bucket: property-images

**Configuración**:

```
bucketId: property-images
maxFileSize: 10485760 (10 MB)
allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp']
encryption: false
antivirus: true
enabled: true
```

**Permisos**:

- Read: `Role.any()` (público)
- Create: `Role.users()` (autenticados)
- Update: `Role.user(userId)` (propietario archivo)
- Delete: `Role.user(userId)` (propietario archivo)

**Procesamiento**:

- Compresión automática (calidad 85%)
- Conversión a WebP (futuro)
- Thumbnails: 200x200, 400x400, 800x800

### 6.2 Bucket: avatars

**Configuración**:

```
bucketId: avatars
maxFileSize: 5242880 (5 MB)
allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp']
encryption: false
antivirus: true
enabled: true
```

**Permisos**:

- Read: `Role.users()` (autenticados)
- Create/Update/Delete: `Role.user(userId)` (propietario)

---

## 7. Functions - Estructura Estándar

### 7.1 Estructura de Carpetas

Cada función debe seguir esta estructura:

```
functions/
└── send-lead-notification/
    ├── .env.example
    ├── README.md
    ├── package.json
    └── src/
        └── index.js
```

### 7.2 package.json (Template)

```json
{
  "name": "send-lead-notification",
  "version": "1.0.0",
  "description": "Envía notificación cuando se recibe un lead",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "node-appwrite": "^17.0.0"
  }
}
```

### 7.3 src/index.js (Template)

```javascript
import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    // Lógica de la función
    log("Function executed successfully");

    return res.json({ success: true });
  } catch (err) {
    error("Function error: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

### 7.4 Variables de Entorno por Función

Todas las funciones requieren:

```
APPWRITE_ENDPOINT
APPWRITE_PROJECT_ID
APPWRITE_API_KEY
```

Variables adicionales según función:

```
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
WHATSAPP_API_KEY
```

---

## 8. Eventos y Triggers

### 8.1 Database Events

Appwrite puede disparar funciones ante eventos de database:

**Evento**: `databases.*.collections.*.documents.*.create`
**Uso**: Cuando se crea un lead
**Function**: `send-lead-notification`

**Evento**: `databases.*.collections.*.documents.*.update`
**Uso**: Cuando se actualiza una propiedad
**Function**: `property-published-webhook` (si cambia a published)

### 8.2 Storage Events

**Evento**: `buckets.*.files.*.create`
**Uso**: Cuando se sube una imagen
**Function**: `image-processor`

### 8.3 Scheduled Tasks (Cron)

**Función**: `seo-sitemap-generator`
**Schedule**: `0 2 * * *` (diario a las 2 AM)
**Propósito**: Regenerar sitemap.xml

---

## 9. Messaging - Plantillas

### 9.1 Email Verification

**Template ID**: `email-verification`

**Variables**:

- `{{name}}` - Nombre del usuario
- `{{url}}` - URL de verificación

**Asunto**: Verifica tu email - {{appName}}

### 9.2 Password Recovery

**Template ID**: `password-recovery`

**Variables**:

- `{{name}}` - Nombre del usuario
- `{{url}}` - URL de recuperación

**Asunto**: Recupera tu contraseña - {{appName}}

### 9.3 New Lead Notification

**Template ID**: `new-lead`

**Variables**:

- `{{adminName}}` - Nombre del admin
- `{{leadName}}` - Nombre del lead
- `{{leadEmail}}` - Email del lead
- `{{leadPhone}}` - Teléfono del lead
- `{{propertyTitle}}` - Título de la propiedad
- `{{leadMessage}}` - Mensaje del lead
- `{{dashboardUrl}}` - URL al dashboard

**Asunto**: Nuevo contacto para {{propertyTitle}}

---

## 10. Seguridad

### 10.1 API Keys

- **Nunca** exponer API keys en frontend
- API keys solo en backend/functions
- Scope mínimo necesario por API key
- Rotación periódica de keys (cada 6 meses)

### 10.2 Environment Variables

- Todas las variables sensibles en `.env`
- `.env.example` sin valores reales
- Nunca commitear `.env` al repositorio
- Usar secrets manager en producción

### 10.3 Validación de Inputs

- Validar todos los inputs en el backend
- No confiar en validaciones de frontend
- Sanitizar datos antes de guardar
- Prevenir SQL injection (Appwrite lo maneja)

### 10.4 Rate Limiting

Configurar límites en Appwrite:

- Login: 10 intentos / 15 minutos
- API calls: 60 requests / minuto (configuración global)
- File uploads: 20 archivos / hora por usuario

---

## 11. Logging y Monitoreo

### 11.1 Logs de Appwrite

- Activar logs en producción
- Nivel: INFO mínimo, DEBUG en desarrollo
- Retención: 30 días
- Revisar logs regularmente

### 11.2 Logs de Functions

Usar `log()` y `error()` en funciones:

```javascript
log("Info message");
error("Error message");
```

### 11.3 Auditoría (Futuro)

Collection `audits` para rastrear:

- Creación/edición/eliminación de propiedades
- Login exitoso/fallido
- Cambios de permisos
- Acciones críticas

---

## 12. Backup y Recuperación

### 12.1 Backup de Database

- **Frecuencia**: Diario (automático)
- **Retención**: 30 días
- **Método**: Dump de PostgreSQL
- **Ubicación**: Storage externo seguro

### 12.2 Backup de Storage

- **Frecuencia**: Semanal
- **Método**: Sync a S3 compatible
- **Retención**: 60 días

### 12.3 Plan de Recuperación

Documentar procedimiento de restore:

1. Detener Appwrite
2. Restaurar database desde dump
3. Restaurar storage desde backup
4. Reiniciar Appwrite
5. Verificar integridad

---

## 13. Performance

### 13.1 Caching

- Appwrite maneja cache interno
- Considerar Redis para cache adicional (futuro)
- Cache de queries frecuentes

### 13.2 Índices de Database

- Crear índices para todos los campos filtrados
- Monitorear queries lentas
- Optimizar queries N+1

### 13.3 CDN para Storage

- Configurar CDN delante de Storage
- Cloudflare o similar
- Cache de imágenes por 1 año (immutable)

---

## 14. Deployment

### 14.1 Infraestructura

- Appwrite self-hosted en servidor dedicado
- Docker Compose
- Reverse proxy (Nginx/Caddy)
- SSL/TLS con Let's Encrypt

### 14.2 Proceso de Deploy

1. Backup de database
2. Pull de última imagen de Appwrite
3. Ejecutar migraciones (si aplica)
4. Restart de servicios
5. Verificación de salud

---

## 15. Relación con Documentos Posteriores

Este documento habilita:

- 03_appwrite_db_schema.md (schema detallado de collections)
- 05_permissions_and_roles.md (permisos granulares)
- 06_appwrite_functions_catalog.md (catálogo completo de funciones)
- 08_env_reference.md (variables de entorno completas)

---

## 16. Estado del Documento

Este documento es:

- ✅ Definitivo para Fase 0
- 📝 Sujeto a extensión en fases posteriores
- 🔒 No negociable en uso de Appwrite como backend

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
