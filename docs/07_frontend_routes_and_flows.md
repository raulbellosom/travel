# 07_FRONTEND_ROUTES_AND_FLOWS.md – REAL ESTATE SAAS PLATFORM

## Referencia

Este documento se rige estrictamente por:

- 00_ai_project_context.md
- 01_frontend_requirements.md
- 04_design_system_mobile_first.md
- 05_permissions_and_roles.md

Define **todas las rutas, guards y flujos UX** del frontend.
Está diseñado para Agent Mode (VS Code / Copilot).

---

## 1. Principios de Navegación

1. **Mobile-first**: Cada flujo debe funcionar con una sola mano
2. **Carga progresiva**: Nunca bloquear la UI esperando múltiples requests
3. **Seguridad por Appwrite**: El frontend **asume denegación por defecto**
4. **Estados explícitos**: loading, empty, error y success siempre visibles
5. **Deep links** permitidos solo si hay sesión válida o es contenido público

---

## 2. Guards Globales

### 2.1 AuthGuard (ProtectedRoute)

**Propósito**: Verifica sesión activa con Appwrite

**Lógica**:

```jsx
// routes/ProtectedRoute.jsx
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Spinner } from "@/components/loaders";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: window.location.pathname }}
        replace
      />
    );
  }

  // Email verificado (opcional, habilitar en Fase 1)
  // if (!user.emailVerified) {
  //   return <Navigate to="/verificar-email" replace />;
  // }

  return children;
}

export default ProtectedRoute;
```

**Si falla**:

- Redirige a `/login`
- Guarda ruta original en `state.from`
- Después de login exitoso, redirige a ruta original

---

### 2.2 PublicOnlyRoute

**Propósito**: Redirige a dashboard si ya está autenticado (para login/register)

```jsx
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
```

---

## 3. Rutas Públicas (Sin Autenticación)

### 3.1 `/` - Home (Landing Page)

**Componente**: `pages/Home.jsx`

**Layout**: `MainLayout`

**Datos cargados**:

- Propiedades publicadas (`status=published`, `enabled=true`)
- Query params para filtros:
  - `?city=` - Ciudad
  - `?type=` - Tipo de propiedad
  - `?operation=` - Venta/Renta
  - `?minPrice=` - Precio mínimo
  - `?maxPrice=` - Precio máximo
  - `?bedrooms=` - Recámaras mínimo
  - `?sort=` - Ordenamiento (recent, price-asc, price-desc)
  - `?page=` - Paginación

**Secciones**:

1. Hero con barra de búsqueda
2. Propiedades destacadas (`featured=true`)
3. Grid de propiedades (paginado)
4. Filtros laterales (desktop) o drawer (mobile)
5. Footer

**Estados**:

- **Loading**: Skeleton cards
- **Empty**: "No se encontraron propiedades"
- **Error**: Mensaje genérico + botón reintentar

**Flujo típico**:

1. Usuario entra a `/`
2. Ve propiedades más recientes
3. Aplica filtros
4. URL se actualiza (`?city=Guadalajara&type=house`)
5. Resultados se recargan
6. Click en propiedad → `/propiedades/{slug}`

---

### 3.2 `/propiedades/:slug` - Detalle de Propiedad

**Componente**: `pages/PropertyDetail.jsx`

**Layout**: `MainLayout`

**Datos cargados**:

- Propiedad por slug
- Si no existe o `status !== published`: 404
- Imágenes de la propiedad
- Amenidades relacionadas
- Perfil del agente/propietario

**Secciones**:

1. Galería de imágenes (lightbox)
2. Información principal:
   - Título
   - Precio
   - Ubicación
   - Badge de operación
   - Badge de tipo
3. Características (recámaras, baños, m², etc.)
4. Descripción completa
5. Amenidades (chips)
6. Mapa de ubicación (Mapbox/Google Maps)
7. Información del agente:
   - Avatar
   - Nombre
   - Teléfono
   - WhatsApp
   - Email
8. Formulario de contacto

**Formulario de contacto**:

- Campos: Nombre, Email, Teléfono (opcional), Mensaje
- Botón: "Enviar Mensaje"
- Botón secundario: "Contactar por WhatsApp"
- Al enviar:
  - Llama a función `create-lead-public`
  - Muestra toast de éxito
  - Opcionalmente redirige a WhatsApp

**Estados**:

- **Loading**: Skeleton de detalle
- **404**: Propiedad no encontrada
- **Error**: Mensaje de error

**Incremento de vistas**:

- Al cargar página, llamar a función `property-view-counter` (async, sin esperar)

**SEO**:

- Title: `{property.title} - {property.city}, {property.state}`
- Description: `{property.description}` (primeros 160 caracteres)
- Open Graph tags
- Schema.org markup (RealEstateListing)

---

### 3.3 `/login` - Inicio de Sesión

**Componente**: `pages/Login.jsx`

**Layout**: `AuthLayout`

**Guard**: `PublicOnlyRoute`

**Formulario**:

- Email
- Password
- Checkbox "Recordarme" (opcional)
- Link "¿Olvidaste tu contraseña?"
- Botón "Iniciar Sesión"

**Flujo**:

1. Usuario ingresa credenciales
2. Click en "Iniciar Sesión"
3. Llamada a Appwrite Auth `account.createEmailSession()`
4. Si éxito:
   - Actualizar contexto `AuthContext`
   - Redirigir a `state.from` || `/dashboard`
5. Si falla:
   - Mostrar mensaje de error
   - "Credenciales inválidas" o "Email no verificado"

**Errores comunes**:

- User not found
- Invalid credentials
- User disabled
- Email not verified (mostrar botón "Reenviar email")

---

### 3.4 `/register` - Registro

**Componente**: `pages/Register.jsx`

**Layout**: `AuthLayout`

**Guard**: `PublicOnlyRoute`

**Formulario**:

- Nombre completo
- Email
- Teléfono (opcional)
- Password
- Confirmar Password
- Checkbox "Acepto términos y condiciones"
- Botón "Crear Cuenta"

**Flujo**:

1. Usuario completa formulario
2. Validaciones:
   - Email único (Appwrite lo maneja)
   - Passwords coinciden
   - Password fuerte (min 8 caracteres)
3. Click en "Crear Cuenta"
4. Llamada a `account.create()`
5. Si éxito:
   - Automatically login (`account.createEmailSession()`)
   - La función `user-create-profile` crea perfil automáticamente
   - Redirigir a `/dashboard` o `/onboarding` (futuro)
6. Si falla:
   - Mostrar error (email ya existe, etc)

**Validaciones**:

```javascript
const schema = z
  .object({
    fullName: z.string().min(3, "Mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, "Debes aceptar los términos"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
```

---

### 3.5 `/recuperar-password` - Recuperación de Contraseña

**Componente**: `pages/ForgotPassword.jsx`

**Layout**: `AuthLayout`

**Guard**: `PublicOnlyRoute`

**Flujo**:

1. Usuario ingresa email
2. Click en "Enviar enlace de recuperación"
3. Llamada a `account.createRecovery()`
4. Mostrar mensaje: "Revisa tu email"
5. Usuario recibe email con enlace
6. Enlace redirige a `/reset-password?userId={userId}&secret={secret}`

---

### 3.6 `/reset-password` - Resetear Contraseña

**Componente**: `pages/ResetPassword.jsx`

**Layout**: `AuthLayout`

**Query params**: `userId`, `secret`

**Formulario**:

- Nueva contraseña
- Confirmar nueva contraseña

**Flujo**:

1. Usuario ingresa nueva contraseña
2. Click en "Cambiar Contraseña"
3. Llamada a `account.updateRecovery(userId, secret, newPassword)`
4. Si éxito: Redirigir a `/login` con mensaje "Contraseña actualizada"
5. Si falla: "Enlace expirado o inválido"

---

## 4. Rutas Privadas (Requieren Autenticación)

### 4.1 `/dashboard` - Panel Principal

**Componente**: `pages/Dashboard.jsx`

**Layout**: `DashboardLayout`

**Guard**: `ProtectedRoute`

**Datos cargados**:

- Estadísticas del usuario:
  - Total de propiedades
  - Propiedades publicadas
  - Propiedades en borrador
  - Leads recibidos (últimos 30 días)
  - Vistas totales
- Gráficas:
  - Vistas por día (últimos 7 días)
  - Leads por propiedad (top 5)
- Propiedades recientes (5 más recientes)
- Leads recientes (5 más recientes)

**Widgets**:

1. **Resumen de estadísticas** (cards con números)
2. **Gráfica de vistas** (line chart)
3. **Lista de leads recientes** (tabla)
4. **Propiedades activas** (grid)
5. **Acciones rápidas**:
   - Botón "Crear Propiedad"
   - Botón "Ver Todas Mis Propiedades"
   - Botón "Ver Todos los Leads"

---

### 4.2 `/mis-propiedades` - Mis Propiedades

**Componente**: `pages/MyProperties.jsx`

**Layout**: `DashboardLayout`

**Guard**: `ProtectedRoute`

**Datos cargados**:

- Propiedades del usuario (`userId={currentUser.$id}`)
- Filtros locales:
  - Todo / Publicadas / Borradores / Vendidas-Rentadas
  - Ordenar por: Más recientes, Más antiguas, Precio

**Vista**:

- Tabla (desktop) o Cards (mobile)
- Columnas:
  - Imagen thumbnail
  - Título
  - Tipo
  - Operación
  - Precio
  - Estado
  - Vistas
  - Leads
  - Acciones (Editar, Ver, Eliminar)

**Acciones**:

- **Ver**: Abre detalle público en nueva pestaña
- **Editar**: Navega a `/editar-propiedad/:id`
- **Eliminar**: Modal de confirmación → soft delete (enabled=false)
- **Cambiar estado**: Draft ↔ Published
- **Duplicar** (futuro)

**Botón principal**: "Crear Nueva Propiedad" → `/crear-propiedad`

---

### 4.3 `/crear-propiedad` - Crear Propiedad

**Componente**: `pages/CreateProperty.jsx`

**Layout**: `DashboardLayout`

**Guard**: `ProtectedRoute`

**Formulario multi-paso** (wizard):

**Paso 1: Información Básica**

- Título
- Descripción
- Tipo de propiedad (select)
- Tipo de operación (select)

**Paso 2: Ubicación**

- Calle y número
- Colonia
- Ciudad
- Estado
- País
- Código postal
- Coordenadas GPS (autocompletar con API o mapa)

**Paso 3: Características**

- Precio
- Moneda
- Precio por (total/m²)
- Superficie total
- Superficie construida
- Recámaras
- Baños
- Estacionamientos
- Año de construcción

**Paso 4: Amenidades**

- Checkboxes con amenidades (de catálogo `amenities`)
- Agrupadas por categoría

**Paso 5: Imágenes**

- Upload múltiple (drag & drop)
- Previsualización
- Reordenar (drag & drop)
- Marcar imagen principal
- Máximo: 20 imágenes

**Paso 6: Revisión**

- Resumen de toda la información
- Botón "Guardar como Borrador"
- Botón "Publicar Propiedad"

**Flujo**:

1. Usuario completa formulario step by step
2. Navegación: Siguiente, Anterior
3. Validación por paso
4. Al finalizar:
   - Si "Guardar Borrador": `status=draft`
   - Si "Publicar": `status=published` con permisos `Role.any()`
5. Subir imágenes a Storage
6. Crear registros en `property_images`
7. Crear registros en `property_amenities`
8. Redirigir a `/mis-propiedades` con toast "Propiedad creada"

**Guardado automático**:

- Guardar en `localStorage` cada cambio
- Si usuario sale y vuelve, recuperar datos
- Limpiar localStorage al publicar

---

### 4.4 `/editar-propiedad/:id` - Editar Propiedad

**Componente**: `pages/EditProperty.jsx`

**Layout**: `DashboardLayout`

**Guard**: `ProtectedRoute` + `OwnerGuard`

**Verificación**:

```javascript
const { id } = useParams();
const { data: property } = useProperty(id);
const { user } = useAuth();

useEffect(() => {
  if (property && property.userId !== user.$id) {
    navigate("/dashboard", { replace: true });
  }
}, [property, user]);
```

**Formulario**: Igual que crear, pero prefilled con datos existentes

**Diferencias**:

- No es wizard, es formulario único con tabs
- Botón "Eliminar Propiedad" (modal de confirmación)
- Botón "Cambiar Estado" (Published ↔ Draft)

---

### 4.5 `/leads` - Gestión de Leads

**Componente**: `pages/Leads.jsx`

**Layout**: `DashboardLayout`

**Guard**: `ProtectedRoute`

**Datos cargados**:

- Leads del usuario (`propertyOwnerId={currentUser.$id}`)
- Filtros:
  - Por estado: Todos / Nuevos / Contactados / En proceso / Ganados / Perdidos
  - Por propiedad: Seleccionar propiedad específica
  - Fecha: Últimos 7 días, 30 días, 90 días, Todo

**Vista**: Tabla con columnas

- Fecha
- Propiedad (título + link)
- Nombre del contacto
- Email
- Teléfono
- Estado
- Acciones (Ver, Cambiar Estado, Eliminar)

**Detalle de Lead** (modal o sidebar):

- Información del lead
- Propiedad de interés
- Estado actual
- Notas del agente (textarea editable)
- Fecha de seguimiento (date picker)
- Calificación (1-5 estrellas)
- Historial de cambios (futuro)
- Botones:
  - Enviar Email
  - Llamar (abre tel:)
  - WhatsApp (abre whatsapp://)
  - Marcar como Ganado/Perdido

---

### 4.6 `/perfil` - Perfil de Usuario

**Componente**: `pages/Profile.jsx`

**Layout**: `DashboardLayout`

**Guard**: `ProtectedRoute`

**Secciones**:

**1. Información Personal**

- Avatar (editable)
- Nombre
- Apellido
- Email (read-only)
- Teléfono
- WhatsApp
- Botón "Guardar Cambios"

**2. Información Profesional**

- Nombre de empresa
- Biografía
- Website
- Facebook
- Instagram
- Botón "Guardar"

**3. Marca y Personalización**

- Logo de empresa (upload)
- Color primario (color picker)
- Botón "Guardar Configuración"

**4. Configuración de Cuenta**

- Idioma (es/en)
- Moneda preferida
- Sistema de medida (métrico/imperial)
- Tema (claro/oscuro/sistema)
- Botón "Guardar Preferencias"

**5. Notificaciones**

- Email al recibir lead (toggle)
- SMS al recibir lead (toggle, futuro)
- Resumen semanal (toggle)

**6. Seguridad**

- Cambiar contraseña
- Cerrar sesión en todos los dispositivos (futuro)
- Eliminar cuenta (con confirmación, soft delete)

---

### 4.7 `/configuracion` - Configuración Avanzada (Futuro)

**Fase 1+**: Integración con pasarelas de pago, SMTP personalizado, WhatsApp Business, etc.

---

## 5. Rutas Especiales

### 5.1 `/404` o `*` - Not Found

**Componente**: `pages/NotFound.jsx`

**Layout**: `MainLayout`

**Contenido**:

- Ilustración o icono 404
- "Página no encontrada"
- Botón "Ir al Inicio"

---

### 5.2 `/verificar-email` - Verificación de Email (Futuro)

**Componente**: `pages/VerifyEmail.jsx`

**Layout**: `AuthLayout`

**Flujo**:

- Usuario recién registrado ve esta página
- Mensaje: "Revisa tu email para verificar tu cuenta"
- Botón "Reenviar email de verificación"
- Link "Ya verifiqué, continuar"

---

## 6. Navegación y Layouts

### 6.1 MainLayout (Público)

**Estructura**:

```
<MainLayout>
  <Navbar>
    - Logo
    - Búsqueda (desktop)
    - Selector idioma
    - Selector tema
    - Botón "Iniciar Sesión"
  </Navbar>

  <main>{children}</main>

  <Footer>
    - Links de sitio
    - Redes sociales
    - Copyright
  </Footer>
</MainLayout>
```

---

### 6.2 DashboardLayout (Privado)

**Estructura Desktop**:

```
<DashboardLayout>
  <Sidebar> (fixed left)
    - Logo
    - Navegación:
      * Dashboard
      * Mis Propiedades
      * Crear Propiedad
      * Leads
      * Perfil
      * Configuración
    - Usuario actual (bottom)
  </Sidebar>

  <main className="ml-64">
    <DashboardNavbar>
      - Breadcrumbs
      - Búsqueda rápida
      - Notificaciones (futuro)
      - Avatar → Dropdown (Perfil, Cerrar Sesión)
    </DashboardNavbar>

    <div className="p-6">
      {children}
    </div>
  </main>
</DashboardLayout>
```

**Estructura Mobile**:

```
<DashboardLayout>
  <MobileHeader>
    - Menú hamburguesa → Drawer
    - Logo/Título
    - Avatar → Dropdown
  </MobileHeader>

  <main className="pb-16">
    {children}
  </main>

  <BottomNavigation> (fixed bottom)
    - Dashboard
    - Propiedades
    - Crear (+)
    - Leads
    - Perfil
  </BottomNavigation>
</DashboardLayout>
```

---

### 6.3 AuthLayout (Login/Register)

**Estructura**:

```
<AuthLayout>
  <div className="flex min-h-screen">
    <div className="w-full lg:w-1/2 flex items-center justify-center">
      {children} <!-- Formulario -->
    </div>

    <div className="hidden lg:block lg:w-1/2 bg-primary">
      <!-- Ilustración o imagen de hero -->
    </div>
  </div>
</AuthLayout>
```

---

## 7. Flujos Críticos

### 7.1 Flujo: Publicar Primera Propiedad

1. Usuario registrado → Dashboard
2. Click "Crear Propiedad"
3. Completa wizard (5-6 pasos)
4. Sube imágenes
5. Click "Publicar"
6. Éxito → Redirige a "Mis Propiedades"
7. Ve su propiedad publicada
8. Click "Ver" → Abre en nueva pestaña versión pública

---

### 7.2 Flujo: Recibir y Gestionar Lead

1. Visitante entra a `/propiedades/casa-en-sayulita`
2. Completa formulario de contacto
3. Envía mensaje
4. Function crea lead
5. Function envía email a propietario
6. Propietario recibe email con notificación
7. Propietario entra a Dashboard
8. Ve nuevo lead en widget "Leads Recientes"
9. Click en lead → Abre detalle
10. Marca como "Contactado"
11. Agrega notas y fecha de seguimiento
12. Contacta al cliente por WhatsApp

---

### 7.3 Flujo: Cambiar Propiedad de Draft a Published

1. Usuario en "Mis Propiedades"
2. Ve propiedad con estado "Borrador"
3. Click en menú → "Publicar"
4. Modal de confirmación
5. Click "Sí, Publicar"
6. Backend actualiza `status=published`
7. Backend cambia permisos a `Role.any()` para lectura
8. Propiedad ahora visible en catálogo público
9. Toast: "Propiedad publicada exitosamente"

---

## 8. Estados de Carga y Errores

### 8.1 Loading States

- **Skeleton screens**: Para listas, cards, detalles
- **Spinners**: Para acciones (botones, formularios)
- **Progress bars**: Para uploads

### 8.2 Empty States

- Cuando no hay propiedades: "Crea tu primera propiedad"
- Cuando no hay leads: "Aún no has recibido contactos"
- Cuando filtros no devuelven resultados: "No encontramos propiedades con esos filtros"

### 8.3 Error States

- Error de red: "Error de conexión. Verifica tu internet"
- Error de servidor: "Algo salió mal. Intenta de nuevo"
- 404: "Propiedad no encontrada"
- 403: "No tienes permiso para ver esto"

---

## 9. SEO y Meta Tags

### 9.1 Home (`/`)

```html
<title>
  Plataforma Inmobiliaria SaaS - Compra, Venta y Renta de Propiedades
</title>
<meta name="description" content="Encuentra la propiedad de tus sueños..." />
```

### 9.2 Property Detail

```html
<title>{property.title} - {property.city}, {property.state}</title>
<meta name="description" content="{property.description.slice(0, 160)}" />
<meta property="og:title" content="{property.title}" />
<meta property="og:image" content="{property.mainImage}" />
<meta property="og:type" content="website" />
```

---

## 10. Relación con Documentos Posteriores

Este documento complementa:

- 01_frontend_requirements.md (implementa routing definido)
- 04_design_system_mobile_first.md (usa componentes definidos)
- 05_permissions_and_roles.md (guards implementan permisos)

---

## 11. Estado del Documento

Este documento es:

- ✅ Definitivo para Fase 0
- 📝 Se expandirá en Fase 1 con rutas de organizaciones
- 🔒 Flujos principales no cambian

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
