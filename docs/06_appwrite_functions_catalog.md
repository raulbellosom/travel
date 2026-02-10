# 06_APPWRITE_FUNCTIONS_CATALOG.md – REAL ESTATE SAAS PLATFORM

## Referencia

Este documento se rige estrictamente por:

- 00_ai_project_context.md
- 02_backend_appwrite_requirements.md
- 05_permissions_and_roles.md

Define el **catálogo completo y detallado** de Appwrite Functions que forman parte del sistema, así como las reglas obligatorias para su implementación.

Este documento está diseñado para ser consumido por agentes AI en VS Code.

---

## 1. Objetivo del Documento

1. Definir qué Functions existen y cuáles NO
2. Evitar lógica crítica en frontend
3. Centralizar automatizaciones, integraciones externas y tareas programadas
4. Estandarizar estructura, variables de entorno y documentación
5. Evitar Functions improvisadas o inconsistentes

---

## 2. Reglas Técnicas Globales (No Negociables)

### 2.1 Runtime

- **Node.js**: mínimo 18 LTS
- **node-appwrite**: mínimo 17.0.0
- No se permite usar SDKs deprecated
- No se permite usar APIs no documentadas de Appwrite

### 2.2 Estructura Obligatoria de Cada Function

Cada Function debe vivir en su propia carpeta y respetar exactamente esta estructura:

```
functions/
└── function-name/
    ├── .env.example
    ├── README.md
    ├── package.json
    └── src/
        └── index.js
```

**No se permite**:

- Código fuera de `/src`
- Variables hardcodeadas
- Secrets en el repositorio

---

## 3. Convenciones Generales

### 3.1 Naming

- Nombre de carpeta y Function en **kebab-case**
- Nombre descriptivo, sin abreviaturas ambiguas

**Ejemplos correctos**:

- `send-lead-notification`
- `user-create-profile`
- `property-published-webhook`
- `image-processor`

**Ejemplos incorrectos**:

- `sendLeadNotif` (camelCase)
- `SLN` (abreviatura ambigua)
- `func1` (nombre genérico)

### 3.2 Versionado

- Cada Function debe tener versión explícita en `package.json`
- Cambios breaking requieren bump de versión mayor

---

## 4. README Obligatorio por Function

Cada Function debe incluir un `README.md` con al menos las siguientes secciones:

1. **Descripción funcional**: Qué hace la función
2. **Tipo de ejecución**:
   - HTTP endpoint
   - Event Trigger
   - Cron Job
3. **Runtime y dependencias**
4. **Variables de entorno requeridas**
5. **Permisos necesarios** (collections, storage, APIs externas)
6. **Eventos o cron asociados**
7. **Manejo de errores esperado**
8. **Ejemplo de payload** (si aplica)

---

## 5. Variables de Entorno

### 5.1 Reglas

- Todas las variables deben existir en `.env.example`
- Nombres normalizados y consistentes con frontend
- Nunca usar `process.env` sin validar existencia

### 5.2 Variables Core (Todas las Functions)

```
APPWRITE_ENDPOINT=https://appwrite.racoondevs.com/v1
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=
```

---

## 6. Catálogo de Functions (Fase 0 - MVP)

### 6.1 Function: user-create-profile

**Descripción**: Crea automáticamente el perfil de usuario extendido cuando un usuario se registra en Auth.

**Tipo**: Event Trigger

**Evento**: `users.*.create` (Appwrite Auth)

**Flujo**:

1. Usuario completa registro en frontend
2. Appwrite Auth crea cuenta
3. Dispara evento `users.*.create`
4. Esta función captura evento
5. Crea documento en collection `users` con datos básicos
6. Crea documento en collection `user_preferences` con defaults
7. Envía email de bienvenida (opcional)

**Variables de entorno**:

```
APPWRITE_ENDPOINT
APPWRITE_PROJECT_ID
APPWRITE_API_KEY
APPWRITE_DATABASE_ID
APPWRITE_COLLECTION_USERS_ID
APPWRITE_COLLECTION_USER_PREFERENCES_ID
```

**Lógica clave**:

```javascript
export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // Datos del evento
  const payload = JSON.parse(req.body);
  const userId = payload.$id;
  const email = payload.email;
  const name = payload.name || "";

  try {
    // 1. Crear perfil
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_USERS_ID,
      userId,
      {
        authId: userId,
        email: email,
        firstName: name.split(" ")[0] || "",
        lastName: name.split(" ").slice(1).join(" ") || "",
        role: "agent",
        enabled: true,
        onboardingCompleted: false,
      },
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    );

    // 2. Crear preferencias
    await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_USER_PREFERENCES_ID,
      ID.unique(),
      {
        userId: userId,
        theme: "system",
        locale: "es",
        currency: "MXN",
        measurementSystem: "metric",
        notificationsEmail: true,
        enabled: true,
      },
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
      ],
    );

    log(`Profile and preferences created for user ${userId}`);
    return res.json({ success: true, userId });
  } catch (err) {
    error(`Error creating profile: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

---

### 6.2 Function: send-lead-notification

**Descripción**: Envía notificación por email al propietario de una propiedad cuando recibe un lead (contacto).

**Tipo**: Event Trigger

**Evento**: `databases.*.collections.leads.documents.*.create`

**Flujo**:

1. Usuario público envía formulario de contacto
2. Se crea documento en collection `leads`
3. Dispara evento de creación
4. Esta función captura evento
5. Obtiene datos de la propiedad y del dueño
6. Envía email de notificación al dueño
7. Opcionalmente envía WhatsApp (futuro)

**Variables de entorno**:

```
APPWRITE_ENDPOINT
APPWRITE_PROJECT_ID
APPWRITE_API_KEY
APPWRITE_DATABASE_ID
APPWRITE_COLLECTION_PROPERTIES_ID
APPWRITE_COLLECTION_USERS_ID
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM_EMAIL
SMTP_FROM_NAME
APP_URL
```

**Lógica clave**:

```javascript
import nodemailer from "nodemailer";

export default async ({ req, res, log, error }) => {
  // Setup Appwrite client...

  const lead = JSON.parse(req.body);
  const propertyId = lead.propertyId;
  const propertyOwnerId = lead.propertyOwnerId;

  try {
    // 1. Obtener propiedad
    const property = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_PROPERTIES_ID,
      propertyId,
    );

    // 2. Obtener datos del dueño
    const owner = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_USERS_ID,
      propertyOwnerId,
    );

    // 3. Enviar email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: owner.email,
      subject: `Nuevo contacto para ${property.title}`,
      html: `
        <h2>Has recibido un nuevo contacto</h2>
        <p><strong>Propiedad:</strong> ${property.title}</p>
        <p><strong>Nombre:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Teléfono:</strong> ${lead.phone || "No proporcionado"}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${lead.message}</p>
        <br>
        <a href="${process.env.APP_URL}/dashboard/leads">Ver en Dashboard</a>
      `,
    });

    log(`Lead notification sent to ${owner.email}`);
    return res.json({ success: true });
  } catch (err) {
    error(`Error sending lead notification: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

---

### 6.3 Function: create-lead-public

**Descripción**: Crea un lead desde el formulario público (sin autenticación del usuario visitante).

**Tipo**: HTTP Endpoint

**Método**: POST

**Por qué Function**: El formulario público no puede crear documentos directamente por permisos. La función usa API Key para crear con permisos correctos.

**Flujo**:

1. Usuario público completa formulario de contacto
2. Frontend llama a esta función vía HTTP POST
3. Función valida datos
4. Función crea lead con permisos `Role.user(propertyOwnerId)`
5. Devuelve éxito
6. El evento de creación dispara `send-lead-notification`

**Payload ejemplo**:

```json
{
  "propertyId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+52 123 456 7890",
  "message": "Me interesa esta propiedad"
}
```

**Variables de entorno**:

```
APPWRITE_ENDPOINT
APPWRITE_PROJECT_ID
APPWRITE_API_KEY
APPWRITE_DATABASE_ID
APPWRITE_COLLECTION_PROPERTIES_ID
APPWRITE_COLLECTION_LEADS_ID
```

**Lógica clave**:

```javascript
export default async ({ req, res, log, error }) => {
  // Setup Appwrite client...

  const { propertyId, name, email, phone, message } = JSON.parse(req.body);

  // Validaciones
  if (!propertyId || !name || !email || !message) {
    return res.json({ success: false, error: "Missing required fields" }, 400);
  }

  try {
    // 1. Obtener propiedad para saber el dueño
    const property = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_PROPERTIES_ID,
      propertyId,
    );

    // Verificar que la propiedad está publicada
    if (property.status !== "published" || !property.enabled) {
      return res.json({ success: false, error: "Property not available" }, 404);
    }

    // 2. Crear lead
    const lead = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_LEADS_ID,
      ID.unique(),
      {
        propertyId: propertyId,
        propertyOwnerId: property.userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        message: message.trim(),
        source: "web_form",
        status: "new",
        enabled: true,
      },
      [
        Permission.read(Role.user(property.userId)),
        Permission.update(Role.user(property.userId)),
        Permission.delete(Role.user(property.userId)),
      ],
    );

    // Incrementar contador de contactos en propiedad
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_COLLECTION_PROPERTIES_ID,
      propertyId,
      {
        contactCount: (property.contactCount || 0) + 1,
      },
    );

    log(`Lead created: ${lead.$id} for property ${propertyId}`);
    return res.json({ success: true, leadId: lead.$id });
  } catch (err) {
    error(`Error creating lead: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

---

### 6.4 Function: image-processor (Futuro)

**Descripción**: Procesa imágenes subidas a `property-images` bucket: comprime, genera thumbnails, convierte a WebP.

**Tipo**: Event Trigger

**Evento**: `buckets.property-images.files.*.create`

**Variables**:

```
APPWRITE_ENDPOINT
APPWRITE_PROJECT_ID
APPWRITE_API_KEY
APPWRITE_BUCKET_PROPERTY_IMAGES_ID
```

**Nota**: En Fase 0 se puede omitir, pero considerar para Fase 1.

---

### 6.5 Function: seo-sitemap-generator (Futuro)

**Descripción**: Genera `sitemap.xml` con todas las propiedades publicadas para SEO.

**Tipo**: Cron Job

**Schedule**: `0 2 * * *` (diario a las 2 AM)

**Variables**:

```
APPWRITE_ENDPOINT
APPWRITE_PROJECT_ID
APPWRITE_API_KEY
APPWRITE_DATABASE_ID
APPWRITE_COLLECTION_PROPERTIES_ID
APPWRITE_BUCKET_DOCUMENTS_ID
APP_URL
```

**Nota**: Implementar en Fase 1 cuando SEO sea prioridad.

---

### 6.6 Function: property-view-counter (Futuro)

**Descripción**: Incrementa contador de vistas de una propiedad de forma async (para no bloquear la carga de la página).

**Tipo**: HTTP Endpoint

**Método**: POST

**Payload**:

```json
{
  "propertyId": "64f1a2b3c4d5e6f7g8h9i0j1"
}
```

---

## 7. Functions NO Incluidas (Fuera de Alcance Fase 0)

- ❌ `whatsapp-integration` (Fase 1)
- ❌ `facebook-publish-property` (Fase 2)
- ❌ `instagram-story-automation` (Fase 2)
- ❌ `crm-sync` (Fase 2)
- ❌ `payment-webhook` (Fase 1 cuando haya suscripciones)
- ❌ `analytics-aggregator` (Fase 2)
- ❌ `backup-database` (Fase 1)

---

## 8. Testing de Functions

### 8.1 Test Local

Usar Appwrite CLI para probar localmente:

```bash
appwrite functions create --runtime node-18 --name "send-lead-notification"
appwrite functions deploy --functionId xxx
```

### 8.2 Test con Eventos

Crear documento de prueba en collection para disparar evento:

```bash
appwrite databases createDocument \
  --databaseId main \
  --collectionId leads \
  --documentId unique() \
  --data '{"propertyId":"test123","name":"Test"}'
```

---

## 9. Deployment de Functions

### 9.1 Proceso

1. Desarrollar localmente
2. Probar con datos reales de desarrollo
3. Revisar logs
4. Deploy a producción con Appwrite CLI o consola
5. Configurar variables de entorno en consola
6. Activar eventos/cron
7. Monitorear primeras ejecuciones

### 9.2 Variables de Entorno en Producción

**Nunca** commitear `.env` al repositorio.
Configurar variables directamente en Appwrite Console para cada función.

---

## 10. Monitoreo y Logs

### 10.1 Logs de Ejecución

- Revisar logs en Appwrite Console
- Usar `log()` para info
- Usar `error()` para errores
- Incluir IDs de documentos en logs para debugging

### 10.2 Alertas

Configurar alertas para:

- Functions que fallan repetidamente
- Tiempos de ejecución > 5 segundos
- Errores de SMTP (email no entregado)

---

## 11. Seguridad

### 11.1 API Keys

- Cada función debe tener su propia API Key con scopes mínimos necesarios
- Ejemplo:
  - `send-lead-notification`: scope `databases.read`, `users.read`
  - `create-lead-public`: scope `databases.read`, `databases.write` (solo collection leads)

### 11.2 Validación de Inputs

Toda función HTTP debe validar inputs:

- Tipos de datos
- Rangos permitidos
- Sanitización de strings
- Rate limiting (considerar)

---

## 12. Relación con Documentos Posteriores

Este documento complementa:

- 02_backend_appwrite_requirements.md (define dónde van las functions)
- 05_permissions_and_roles.md (functions operan con API Key, bypass de permisos de usuario)
- 08_env_reference.md (variables de entorno compartidas)

---

## 13. Estado del Documento

Este documento es:

- ✅ Definitivo para Fase 0 (funciones básicas)
- 📝 Se ampliará en Fase 1+ con nuevas funciones
- 🔒 Estructuras y convenciones no negociables

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
