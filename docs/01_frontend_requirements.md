# 01_FRONTEND_REQUIREMENTS – REAL ESTATE SAAS PLATFORM

## Referencia

Este documento se rige por:

- 00_ai_project_context.md
- 00_project_brief.md

---

## 1. Stack Frontend

- **ReactJS** (v18+)
- **Vite** (v5+)
- **JavaScript puro** (NO TypeScript)
- **PWA** (Progressive Web App)
- **TailwindCSS 4.1** con Dark Mode
- **Appwrite SDK** (JavaScript)
- **Framer Motion** (animaciones)
- **Lucide React** (iconos)
- **React Router DOM** (v6+)
- **React Hook Form** (formularios)
- **Zod** (validaciones)
- **Day.js** (fechas)
- **React i18next** (internacionalización)

---

## 2. Principios de Arquitectura

### 2.1 Mobile-First (Obligatorio)

- Diseño base: **360px** (mobile pequeño)
- Diseño secundario: **768px** (tablet)
- Diseño terciario: **1024px+** (desktop)

Todo componente, página y feature debe diseñarse primero para móvil.

### 2.2 Arquitectura Modular por Dominio

La aplicación se organiza por dominios de negocio, no por tipo de archivo.

Estructura actual (mantenida):

```
src/
├── api/                    # Clientes API y servicios
├── assets/                 # Imágenes, logos, archivos estáticos
├── components/
│   ├── common/            # Componentes reutilizables
│   │   ├── atoms/         # Componentes básicos
│   │   ├── molecules/     # Componentes compuestos
│   │   └── organisms/     # Componentes complejos
│   ├── loaders/           # Spinners, skeletons
│   └── navigation/        # Navbar, Sidebar, Footer
├── contexts/              # React Contexts
│   ├── AuthContext.jsx
│   └── UIContext.jsx
├── features/              # Features por dominio
│   ├── listings/          # Todo lo de propiedades
│   ├── user/              # Perfil y configuración
│   └── ui-docs/           # Documentación UI (temporal)
├── hooks/                 # Custom hooks
├── i18n/                  # Traducciones
│   ├── en.json
│   ├── es.json
│   └── index.js
├── layouts/               # Layouts de página
│   ├── AuthLayout.jsx
│   ├── DashboardLayout.jsx
│   └── MainLayout.jsx
├── pages/                 # Páginas/Rutas
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── NotFound.jsx
│   └── UIDocsPage.jsx
├── providers/             # Providers globales
├── routes/                # Configuración de rutas
│   ├── AppRoutes.jsx
│   └── ProtectedRoute.jsx
├── services/              # Servicios de negocio
├── store/                 # Estado global (futuro)
├── styles/                # Estilos globales
│   ├── tokens.css
│   └── index.css
├── utils/                 # Utilidades
├── App.jsx
├── main.jsx
└── index.css
```

### 2.3 Separación Clara de Responsabilidades

- **Components**: Solo UI y eventos
- **Hooks**: Lógica reutilizable
- **Services**: Comunicación con backend
- **Contexts**: Estado global
- **Utils**: Funciones puras

### 2.4 Prohibido Mock Data

- Todo dato debe venir de Appwrite
- No arrays hardcodeados simulando backend
- No placeholders falsos
- Variables de entorno para configuración

---

## 3. Estructura de Carpetas Detallada

### 3.1 `/components/common`

Componentes reutilizables organizados por complejidad (Atomic Design).

**Atoms** (básicos):

- Avatar
- Badge
- Button
- Checkbox
- CodeBlock
- CurrencyInput
- IconButton
- NumberInput
- Radio
- RatingStars
- Select
- Spinner
- TextInput
- Toggle

**Molecules** (compuestos):

- Card
- Carousel
- ComponentDemo
- DateRangePicker
- FormField
- PriceBadge
- SearchBar

**Organisms** (complejos):

- Footer
- ListingCard
- Modal
- Navbar

**Templates** (plantillas de página):

- Vacío por ahora

### 3.2 `/features`

Features organizadas por dominio de negocio.

**features/listings/**

```
listings/
├── components/
│   ├── ListingForm.jsx
│   ├── ListingFilters.jsx
│   ├── ListingGallery.jsx
│   ├── ListingMap.jsx
│   └── ContactForm.jsx
├── hooks/
│   ├── useListings.js
│   ├── useListingDetail.js
│   └── useListingForm.js
├── services/
│   └── listingsService.js
└── index.js
```

**features/user/**

```
user/
├── components/
│   ├── ProfileForm.jsx
│   ├── BrandingSettings.jsx
│   └── LeadsList.jsx
├── hooks/
│   └── useProfile.js
├── services/
│   └── userService.js
└── index.js
```

### 3.3 `/pages`

Páginas principales de la aplicación:

- **Home.jsx**: Landing pública con catálogo
- **ListingDetail.jsx**: Detalle de propiedad (público)
- **Login.jsx**: Autenticación
- **Register.jsx**: Registro
- **Dashboard.jsx**: Panel admin
- **MyListings.jsx**: Mis propiedades
- **CreateListing.jsx**: Crear propiedad
- **EditListing.jsx**: Editar propiedad
- **Leads.jsx**: Contactos/leads
- **Profile.jsx**: Perfil de usuario
- **Settings.jsx**: Configuración
- **NotFound.jsx**: 404

---

## 4. Variables de Entorno

### 4.1 Archivo `env.js`

Único punto de acceso a variables de entorno:

```javascript
// src/env.js
const env = {
  // Appwrite
  appwrite: {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    collections: {
      properties: import.meta.env.VITE_APPWRITE_COLLECTION_PROPERTIES_ID,
      users: import.meta.env.VITE_APPWRITE_COLLECTION_USERS_ID,
      leads: import.meta.env.VITE_APPWRITE_COLLECTION_LEADS_ID,
    },
    buckets: {
      propertyImages: import.meta.env.VITE_APPWRITE_BUCKET_PROPERTY_IMAGES_ID,
      avatars: import.meta.env.VITE_APPWRITE_BUCKET_AVATARS_ID,
    },
  },

  // App
  app: {
    name: import.meta.env.VITE_APP_NAME || "Real Estate SaaS",
    env: import.meta.env.VITE_APP_ENV || "production",
    url: import.meta.env.VITE_APP_URL,
  },
};

export default env;
```

### 4.2 Variables Requeridas

Archivo `.env.example`:

```
# Appwrite Configuration
VITE_APPWRITE_ENDPOINT=https://appwrite.racoondevs.com/v1
VITE_APPWRITE_PROJECT_ID=

# Database
VITE_APPWRITE_DATABASE_ID=

# Collections
VITE_APPWRITE_COLLECTION_PROPERTIES_ID=
VITE_APPWRITE_COLLECTION_USERS_ID=
VITE_APPWRITE_COLLECTION_LEADS_ID=

# Storage Buckets
VITE_APPWRITE_BUCKET_PROPERTY_IMAGES_ID=
VITE_APPWRITE_BUCKET_AVATARS_ID=

# App Configuration
VITE_APP_NAME="Real Estate SaaS"
VITE_APP_ENV=development
VITE_APP_URL=http://localhost:5173
```

---

## 5. PWA (Progressive Web App)

### 5.1 Configuración

- Plugin: `vite-plugin-pwa`
- Manifest generado automáticamente
- Service Worker para offline básico
- Instalable en móvil y desktop

### 5.2 Manifest

```json
{
  "name": "Real Estate SaaS",
  "short_name": "RealEstate",
  "description": "Plataforma SaaS para gestión inmobiliaria",
  "theme_color": "#0F172A",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 6. UI / UX

### 6.1 Principios de Diseño

- **Mobile-First**: Diseño optimizado para touch
- **Accesible**: WCAG AA mínimo
- **Performante**: < 3s tiempo de carga
- **Consistente**: Design System unificado
- **Responsive**: 360px - 2560px

### 6.2 Diseño Táctil

- Touch targets mínimo: **44x44px**
- Espaciados generosos en móvil
- Botones grandes y claros
- Formularios optimizados para móvil
- Inputs con tipos correctos (tel, email, number)

### 6.3 Iconografía

- **Librería**: Lucide React
- **Formato**: SVG únicamente
- **Prohibido**: Emojis como iconos
- **Tamaños**: 16px, 20px, 24px, 32px, 48px

### 6.4 Animaciones

- **Librería**: Framer Motion
- **Uso**: Transiciones sutiles
- **Performance**: 60fps siempre
- **Respeto**: `prefers-reduced-motion`

---

## 7. Routing

### 7.1 Estructura de Rutas

**Públicas**:

- `/` - Home (catálogo público)
- `/propiedades/:slug` - Detalle de propiedad
- `/login` - Login
- `/register` - Registro
- `/recuperar-password` - Recuperación

**Privadas** (requieren autenticación):

- `/dashboard` - Panel admin
- `/mis-propiedades` - Mis propiedades
- `/crear-propiedad` - Crear propiedad
- `/editar-propiedad/:id` - Editar propiedad
- `/leads` - Leads/Contactos
- `/perfil` - Perfil de usuario
- `/configuracion` - Configuración

**Otras**:

- `*` - 404 Not Found

### 7.2 Guards

**ProtectedRoute**:

- Verifica sesión activa
- Redirige a `/login` si no autenticado
- Mantiene URL para redirigir después de login

**PublicOnlyRoute**:

- Para login/register
- Redirige a `/dashboard` si ya autenticado

---

## 8. Autenticación

### 8.1 AuthContext

Maneja sesión y usuario actual:

```javascript
// contexts/AuthContext.jsx
{
  user: {...},           // Usuario actual o null
  loading: true/false,   // Cargando sesión
  login,                 // Función login
  register,              // Función registro
  logout,                // Función logout
  updateProfile,         // Actualizar perfil
}
```

### 8.2 Flujos

**Login**:

1. Usuario ingresa email/password
2. Llamada a Appwrite Auth
3. Si éxito: cargar perfil de usuario
4. Guardar sesión
5. Redirigir a dashboard

**Register**:

1. Usuario completa formulario
2. Crear cuenta en Appwrite Auth
3. Crear documento en collection `users`
4. Enviar email de verificación
5. Login automático
6. Redirigir a onboarding (futuro)

**Logout**:

1. Llamada a Appwrite logout
2. Limpiar estado local
3. Redirigir a home

---

## 9. Gestión de Estado

### 9.1 Estado Local (Actual)

- React Context para auth y UI
- useState/useReducer en componentes
- Custom hooks para lógica reutilizable

### 9.2 Estado Futuro (Fase 1+)

- Considerar Redux Toolkit o Zustand
- Solo si complejidad lo justifica
- Por ahora: Context es suficiente

---

## 10. Servicios / API

### 10.1 Estructura de Servicios

Cada dominio tiene su servicio:

```javascript
// services/listingsService.js
import { databases, storage } from '@/api/appwrite';
import env from '@/env';

export const listingsService = {
  // Obtener todas las propiedades
  async getAll(filters = {}) { ... },

  // Obtener una propiedad por ID
  async getById(id) { ... },

  // Crear propiedad
  async create(data) { ... },

  // Actualizar propiedad
  async update(id, data) { ... },

  // Eliminar propiedad
  async delete(id) { ... },

  // Subir imágenes
  async uploadImages(propertyId, files) { ... },
};
```

### 10.2 Cliente Appwrite

```javascript
// api/appwrite.js
import { Client, Account, Databases, Storage } from "appwrite";
import env from "@/env";

const client = new Client()
  .setEndpoint(env.appwrite.endpoint)
  .setProject(env.appwrite.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export default client;
```

---

## 11. Formularios

### 11.1 Librería

- **React Hook Form** para manejo de formularios
- **Zod** para validaciones
- Integración con componentes de UI

### 11.2 Ejemplo

```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(10, 'Mínimo 10 caracteres'),
  price: z.number().positive('Debe ser positivo'),
  email: z.string().email('Email inválido'),
});

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => { ... };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
}
```

---

## 12. Internacionalización (i18n)

### 12.1 Configuración

- **Librería**: react-i18next
- **Idiomas**: español (es), inglés (en)
- **Detección**: navegador, localStorage
- **Fallback**: español

### 12.2 Archivos de Traducción

```json
// i18n/es.json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar"
  },
  "listings": {
    "title": "Propiedades",
    "create": "Crear Propiedad",
    "edit": "Editar Propiedad"
  }
}
```

### 12.3 Uso en Componentes

```javascript
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t("listings.title")}</h1>;
}
```

---

## 13. Optimización y Performance

### 13.1 Code Splitting

- Lazy loading de rutas
- Lazy loading de componentes pesados
- Suspense para loading states

### 13.2 Imágenes

- Lazy loading nativo (`loading="lazy"`)
- Formatos modernos (WebP)
- Responsive images (srcset)
- Optimización en backend (Appwrite)

### 13.3 Bundling

- Vite maneja optimización
- Tree shaking automático
- Minificación en producción
- CSS purging con TailwindCSS

---

## 14. Testing (Futuro)

### 14.1 Fase 0 (MVP)

- Testing manual exhaustivo
- Validación en múltiples dispositivos
- Testing de flujos críticos

### 14.2 Fase 1+

- Vitest para unit tests
- React Testing Library
- Playwright para E2E

---

## 15. Build y Deploy

### 15.1 Scripts de Package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx",
    "lint:fix": "eslint . --ext js,jsx --fix"
  }
}
```

### 15.2 Build para Producción

```bash
npm run build
```

Genera carpeta `dist/` lista para deploy.

---

## 16. Seguridad Frontend

### 16.1 Principios

- **Nunca** confiar en validaciones de frontend
- Guards preventivos, validación real en backend
- No exponer API keys sensibles
- Sanitización de inputs
- CSP (Content Security Policy)

### 16.2 Appwrite SDK

- SDK maneja tokens de sesión
- Cookies seguras (httpOnly cuando posible)
- HTTPS obligatorio en producción

---

## 17. Accesibilidad

### 17.1 Estándares

- **WCAG AA** como mínimo
- Contraste de colores > 4.5:1
- Navegación por teclado completa
- Screen readers compatibles

### 17.2 Implementación

- Atributos ARIA correctos
- Labels en inputs
- Focus visible
- Alternativas textuales para imágenes
- Landmark roles

---

## 18. Relación con Documentos Posteriores

Este documento habilita:

- 03_appwrite_db_schema.md (define collections necesarias)
- 04_design_system_mobile_first.md (especifica componentes UI)
- 07_frontend_routes_and_flows.md (detalla flujos de navegación)

---

## 19. Estado del Documento

Este documento es:

- ✅ Definitivo para Fase 0
- 📝 Sujeto a ampliación en fases posteriores
- 🔒 No negociable en stack tecnológico base

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
