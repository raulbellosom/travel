# 08_ENV_REFERENCE.md – REAL ESTATE SAAS PLATFORM

## Referencia

Este documento se rige estrictamente por:

- 00_ai_project_context.md
- 01_frontend_requirements.md
- 02_backend_appwrite_requirements.md
- 06_appwrite_functions_catalog.md

Define **todas las variables de entorno** usadas por el sistema, su propósito, alcance y reglas de sincronización entre frontend, backend y Appwrite Functions.

Este documento es obligatorio para:

- Mantener `.env.example` siempre actualizado
- Evitar variables duplicadas o inconsistentes
- Permitir a un Agent AI configurar entornos sin ambigüedad

---

## 1. Principios Generales

1. **Single Source of Truth**: Toda variable debe estar documentada aquí
2. **Normalización**: Mismo nombre lógico en todas las capas
3. **Prefijos por plataforma**:
   - Frontend (Vite): `VITE_`
   - Backend / Functions (Node): sin prefijo `VITE_`
4. **No Hardcoding**: Ninguna variable sensible se escribe en código
5. **`.env.example` obligatorio**: Cada proyecto (frontend, functions) debe tener su `.env.example`

---

## 2. Clasificación de Variables

Las variables se clasifican en:

- **Core Appwrite**: Conexión a Appwrite
- **Frontend (Vite)**: Variables expuestas al navegador
- **Backend / Functions**: Variables sensibles (API Keys, SMTP)
- **Integrations**: APIs externas (Maps, WhatsApp, etc.)

---

## 3. Variables Core Appwrite

Estas variables existen en **todas las capas**.

| Variable             | Descripción               | Frontend | Backend | Functions |
| -------------------- | ------------------------- | -------- | ------- | --------- |
| APPWRITE_ENDPOINT    | URL del servidor Appwrite | ✅       | ✅      | ✅        |
| APPWRITE_PROJECT_ID  | ID del proyecto           | ✅       | ✅      | ✅        |
| APPWRITE_API_KEY     | API Key (admin)           | ❌       | ✅      | ✅        |
| APPWRITE_DATABASE_ID | ID de database main       | ✅       | ✅      | ✅        |

**Reglas**:

- En frontend deben exponerse como `VITE_APPWRITE_*`
- En backend/functions sin prefijo `VITE_`
- `APPWRITE_API_KEY` **NUNCA** se expone al frontend

---

## 4. Variables Frontend (Vite)

### 4.1 Reglas Específicas

- Todas deben iniciar con `VITE_`
- Se acceden solo mediante `src/env.js`
- Nunca usar `import.meta.env` directamente fuera de `env.js`

### 4.2 Variables Definidas

#### 4.2.1 Appwrite Configuration

```bash
# Appwrite Connection
VITE_APPWRITE_ENDPOINT=https://appwrite.racoondevs.com/v1
VITE_APPWRITE_PROJECT_ID=

# Database
VITE_APPWRITE_DATABASE_ID=main

# Collections
VITE_APPWRITE_COLLECTION_USERS_ID=
VITE_APPWRITE_COLLECTION_USER_PREFERENCES_ID=
VITE_APPWRITE_COLLECTION_PROPERTIES_ID=
VITE_APPWRITE_COLLECTION_PROPERTY_IMAGES_ID=
VITE_APPWRITE_COLLECTION_AMENITIES_ID=
VITE_APPWRITE_COLLECTION_PROPERTY_AMENITIES_ID=
VITE_APPWRITE_COLLECTION_LEADS_ID=

# Storage Buckets
VITE_APPWRITE_BUCKET_PROPERTY_IMAGES_ID=
VITE_APPWRITE_BUCKET_AVATARS_ID=

# Functions (Endpoints HTTP)
VITE_APPWRITE_FUNCTION_CREATE_LEAD_ID=
```

#### 4.2.2 App Configuration

```bash
# App Metadata
VITE_APP_NAME="Real Estate SaaS"
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_APP_VERSION=1.0.0

# Features Flags (boolean)
VITE_FEATURE_GEOLOCATION=true
VITE_FEATURE_DARK_MODE=true
VITE_FEATURE_I18N=true
```

#### 4.2.3 External APIs (Opcional)

```bash
# Google Maps (futuro)
VITE_GOOGLE_MAPS_API_KEY=

# Mapbox (futuro)
VITE_MAPBOX_ACCESS_TOKEN=

# Analytics (futuro)
VITE_GA_MEASUREMENT_ID=
```

---

### 4.3 Archivo: src/env.js

```javascript
// src/env.js
const env = {
  // Appwrite
  appwrite: {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,

    collections: {
      users: import.meta.env.VITE_APPWRITE_COLLECTION_USERS_ID,
      userPreferences: import.meta.env
        .VITE_APPWRITE_COLLECTION_USER_PREFERENCES_ID,
      properties: import.meta.env.VITE_APPWRITE_COLLECTION_PROPERTIES_ID,
      propertyImages: import.meta.env
        .VITE_APPWRITE_COLLECTION_PROPERTY_IMAGES_ID,
      amenities: import.meta.env.VITE_APPWRITE_COLLECTION_AMENITIES_ID,
      propertyAmenities: import.meta.env
        .VITE_APPWRITE_COLLECTION_PROPERTY_AMENITIES_ID,
      leads: import.meta.env.VITE_APPWRITE_COLLECTION_LEADS_ID,
    },

    buckets: {
      propertyImages: import.meta.env.VITE_APPWRITE_BUCKET_PROPERTY_IMAGES_ID,
      avatars: import.meta.env.VITE_APPWRITE_BUCKET_AVATARS_ID,
    },

    functions: {
      createLead: import.meta.env.VITE_APPWRITE_FUNCTION_CREATE_LEAD_ID,
    },
  },

  // App
  app: {
    name: import.meta.env.VITE_APP_NAME || "Real Estate SaaS",
    env: import.meta.env.VITE_APP_ENV || "production",
    url: import.meta.env.VITE_APP_URL,
    version: import.meta.env.VITE_APP_VERSION || "1.0.0",
  },

  // Features
  features: {
    geolocation: import.meta.env.VITE_FEATURE_GEOLOCATION === "true",
    darkMode: import.meta.env.VITE_FEATURE_DARK_MODE === "true",
    i18n: import.meta.env.VITE_FEATURE_I18N === "true",
  },

  // External APIs
  external: {
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    mapboxToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
    gaId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  },
};

// Validación: asegurar variables críticas
if (!env.appwrite.endpoint || !env.appwrite.projectId) {
  throw new Error("Missing critical Appwrite environment variables");
}

export default env;
```

---

### 4.4 Archivo: .env.example (Frontend)

```bash
# ============================================
# APPWRITE CONFIGURATION
# ============================================
VITE_APPWRITE_ENDPOINT=https://appwrite.racoondevs.com/v1
VITE_APPWRITE_PROJECT_ID=

# Database
VITE_APPWRITE_DATABASE_ID=main

# Collections (obtener IDs desde Appwrite Console)
VITE_APPWRITE_COLLECTION_USERS_ID=
VITE_APPWRITE_COLLECTION_USER_PREFERENCES_ID=
VITE_APPWRITE_COLLECTION_PROPERTIES_ID=
VITE_APPWRITE_COLLECTION_PROPERTY_IMAGES_ID=
VITE_APPWRITE_COLLECTION_AMENITIES_ID=
VITE_APPWRITE_COLLECTION_PROPERTY_AMENITIES_ID=
VITE_APPWRITE_COLLECTION_LEADS_ID=

# Storage Buckets
VITE_APPWRITE_BUCKET_PROPERTY_IMAGES_ID=
VITE_APPWRITE_BUCKET_AVATARS_ID=

# Functions
VITE_APPWRITE_FUNCTION_CREATE_LEAD_ID=

# ============================================
# APP CONFIGURATION
# ============================================
VITE_APP_NAME="Real Estate SaaS"
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_APP_VERSION=1.0.0

# ============================================
# FEATURE FLAGS
# ============================================
VITE_FEATURE_GEOLOCATION=true
VITE_FEATURE_DARK_MODE=true
VITE_FEATURE_I18N=true

# ============================================
# EXTERNAL APIS (Opcional)
# ============================================
# Google Maps
# VITE_GOOGLE_MAPS_API_KEY=

# Mapbox
# VITE_MAPBOX_ACCESS_TOKEN=

# Google Analytics
# VITE_GA_MEASUREMENT_ID=
```

---

## 5. Variables Backend / Functions

### 5.1 Reglas

- Sin prefijo `VITE_`
- API Keys y secrets **nunca** se exponen al frontend
- Configurar directamente en Appwrite Console para cada función

### 5.2 Variables Core (Todas las Functions)

```bash
# Appwrite Configuration
APPWRITE_ENDPOINT=https://appwrite.racoondevs.com/v1
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=main

# Collections
APPWRITE_COLLECTION_USERS_ID=
APPWRITE_COLLECTION_PROPERTIES_ID=
APPWRITE_COLLECTION_LEADS_ID=
APPWRITE_COLLECTION_PROPERTY_IMAGES_ID=

# Buckets
APPWRITE_BUCKET_PROPERTY_IMAGES_ID=
APPWRITE_BUCKET_AVATARS_ID=
```

---

### 5.3 Function: user-create-profile

```bash
# Appwrite
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=
APPWRITE_COLLECTION_USERS_ID=
APPWRITE_COLLECTION_USER_PREFERENCES_ID=
```

**Archivo**: `functions/user-create-profile/.env.example`

---

### 5.4 Function: send-lead-notification

```bash
# Appwrite
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=
APPWRITE_COLLECTION_PROPERTIES_ID=
APPWRITE_COLLECTION_USERS_ID=

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@realestate-saas.com
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@realestate-saas.com
SMTP_FROM_NAME="Real Estate SaaS"

# App
APP_URL=https://realestate-saas.com
```

**Archivo**: `functions/send-lead-notification/.env.example`

---

### 5.5 Function: create-lead-public

```bash
# Appwrite
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=
APPWRITE_COLLECTION_PROPERTIES_ID=
APPWRITE_COLLECTION_LEADS_ID=
```

**Archivo**: `functions/create-lead-public/.env.example`

---

## 6. Variables de Integración (Futuro)

### 6.1 WhatsApp Business API (Fase 1)

```bash
# WhatsApp Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
```

### 6.2 Payment Gateways (Fase 1)

```bash
# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
```

### 6.3 Email Marketing (Fase 2)

```bash
# SendGrid
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# Mailchimp
MAILCHIMP_API_KEY=
MAILCHIMP_LIST_ID=
```

---

## 7. Configuración por Ambiente

### 7.1 Development (.env.development)

```bash
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
VITE_APPWRITE_ENDPOINT=http://localhost/v1
```

### 7.2 Staging (.env.staging)

```bash
VITE_APP_ENV=staging
VITE_APP_URL=https://staging.realestate-saas.com
VITE_APPWRITE_ENDPOINT=https://appwrite.staging.racoondevs.com/v1
```

### 7.3 Production (.env.production)

```bash
VITE_APP_ENV=production
VITE_APP_URL=https://realestate-saas.com
VITE_APPWRITE_ENDPOINT=https://appwrite.racoondevs.com/v1
```

---

## 8. Validación de Variables

### 8.1 Frontend (src/env.js)

```javascript
// Validar variables críticas al iniciar
function validateEnv() {
  const required = [
    "VITE_APPWRITE_ENDPOINT",
    "VITE_APPWRITE_PROJECT_ID",
    "VITE_APPWRITE_DATABASE_ID",
  ];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

validateEnv();
```

### 8.2 Functions

```javascript
// functions/utils/validateEnv.js
export function validateEnv(required) {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

// En cada función
validateEnv(["APPWRITE_ENDPOINT", "APPWRITE_PROJECT_ID", "APPWRITE_API_KEY"]);
```

---

## 9. Seguridad y Best Practices

### 9.1 Nunca Commitear

- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.development`
- ❌ `.env.production`

**Siempre en .gitignore**:

```
.env
.env.*
!.env.example
```

### 9.2 Siempre Commitear

- ✅ `.env.example` (sin valores reales)

### 9.3 Rotación de Secrets

- API Keys rotar cada 6 meses
- Passwords cambiar si hay sospecha de compromiso
- Tokens de integración rotar según política del proveedor

### 9.4 Scope Mínimo

- API Keys con permisos mínimos necesarios
- No usar API Key "super admin" en funciones
- Un API Key por función (preferible)

---

## 10. Debugging y Logs

### 10.1 Mostrar Configuración (Solo Development)

```javascript
// src/main.jsx
if (import.meta.env.DEV) {
  console.log("🔧 Environment:", env.app.env);
  console.log("🌐 Appwrite Endpoint:", env.appwrite.endpoint);
  console.log("📦 Project ID:", env.appwrite.projectId);
  // NO mostrar API Keys nunca
}
```

### 10.2 Logs en Functions

```javascript
// Al inicio de cada función
log(`Environment: ${process.env.APPWRITE_ENDPOINT}`);
log(`Database ID: ${process.env.APPWRITE_DATABASE_ID}`);
// Nunca loguear API Keys completas
log(`API Key: ${process.env.APPWRITE_API_KEY?.slice(0, 10)}...`);
```

---

## 11. Sincronización entre Capas

### 11.1 IDs de Collections

Los IDs de collections deben ser **idénticos** en:

- Frontend `.env`
- Todas las Functions `.env`

**Recomendación**: Crear script de sincronización (futuro):

```bash
# scripts/sync-env.sh
#!/bin/bash

# Leer IDs de Appwrite CLI
COLLECTION_USERS_ID=$(appwrite databases list | grep users | awk '{print $1}')

# Actualizar .env files
echo "VITE_APPWRITE_COLLECTION_USERS_ID=$COLLECTION_USERS_ID" >> frontend/.env
echo "APPWRITE_COLLECTION_USERS_ID=$COLLECTION_USERS_ID" >> functions/user-create-profile/.env
```

---

## 12. Matriz de Variables (Resumen)

| Variable                   | Frontend | Functions | Sensitive |
| -------------------------- | -------- | --------- | --------- |
| APPWRITE_ENDPOINT          | ✅       | ✅        | No        |
| APPWRITE_PROJECT_ID        | ✅       | ✅        | No        |
| APPWRITE_API_KEY           | ❌       | ✅        | **Yes**   |
| APPWRITE_DATABASE_ID       | ✅       | ✅        | No        |
| APPWRITE*COLLECTION*\*\_ID | ✅       | ✅        | No        |
| APPWRITE*BUCKET*\*\_ID     | ✅       | ✅        | No        |
| SMTP\_\*                   | ❌       | ✅        | **Yes**   |
| WHATSAPP\_\*               | ❌       | ✅        | **Yes**   |
| STRIPE_SECRET_KEY          | ❌       | ✅        | **Yes**   |
| GOOGLE_MAPS_API_KEY        | ✅       | ❌        | Partial   |

**Leyenda**:

- ✅ Requerido
- ❌ No debe existir
- **Yes** = Sensible, nunca exponer

---

## 13. Relación con Documentos Posteriores

Este documento complementa:

- 01_frontend_requirements.md (define uso de env.js)
- 02_backend_appwrite_requirements.md (define variables de backend)
- 06_appwrite_functions_catalog.md (define variables por función)

---

## 14. Estado del Documento

Este documento es:

- ✅ Definitivo para Fase 0
- 📝 Se actualizará con nuevas integraciones en fases posteriores
- 🔒 Principios de seguridad no negociables

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
