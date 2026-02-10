# 🌴 Travel — Frontend

**Travel** es una aplicación web progresiva (**PWA**) construida con **React + Vite**, diseñada para conectar **anunciantes (partners)** con **viajeros**, en un modelo similar a Airbnb/Tripadvisor.  
La plataforma permite explorar anuncios, crear listados, gestionar reservas y mantener comunicación en tiempo real.

---

## 🚀 Stack principal

- **React + Vite (JavaScript)** — SPA rápida y modular.
- **TailwindCSS** — Estilos utilitarios y tema personalizable.
- **Motion** — Animaciones fluidas.
- **Lucide Icons** — Íconos consistentes.
- **Appwrite** — Autenticación, base de datos, storage y funciones.

---

## 📂 Estructura de Carpetas

```
/src
  /api
  /assets
  /components
    /common
    /loaders
    /navigation
  /contexts
  /features
    /listings
    /user
  /hooks
  /i18n
  /layouts
  /pages
  /providers
  /routes
  /services
  /store
  /styles
  /utils
```

### **`/api`**

Cliente de comunicación con **Appwrite** y otros servicios externos.  
Ejemplo: `authAPI.js`, `listingsAPI.js`, `paymentsAPI.js`.

### **`/assets`**

Recursos estáticos: imágenes, íconos SVG, fuentes y animaciones.

### **`/components`**

Componentes reutilizables y compartidos.

- **`common/`**: botones, modales, formularios, breadcrumbs.
- **`loaders/`**: spinners, skeleton loaders.
- **`navigation/`**: Navbar, Sidebar, Drawer, Footer.

### **`/contexts`**

React Context API para manejar **estado global** (auth, theme, cart, etc.).

### **`/features`**

Módulos organizados por dominio de negocio.

- **`listings/`**: catálogo, creación, detalle de anuncios.
- **`user/`**: perfil de usuario, autenticación, favoritos.

### **`/hooks`**

Hooks personalizados (`useAuth`, `useFetch`, `useDebounce`, `useTheme`).

### **`/i18n`**

Internacionalización (traducciones). Archivos JSON para `es`, `en`, etc.

### **`/layouts`**

Plantillas de diseño de página:

- `MainLayout.jsx` (público),
- `AuthLayout.jsx` (login/register),
- `DashboardLayout.jsx` (partners).

### **`/pages`**

Vistas principales de la app:

- `Home.jsx`, `Login.jsx`, `Register.jsx`, `Dashboard.jsx`, `ListingDetail.jsx`, etc.

### **`/providers`**

Providers globales: configuración de tema, autenticación, React Query/Appwrite client.

### **`/routes`**

Configuración de rutas públicas y protegidas.  
Ejemplo: `AppRoutes.jsx`, `ProtectedRoute.jsx`.

### **`/services`**

Utilidades externas (validadores, formateadores, almacenamiento local).  
Ejemplo: `formatPrice.js`, `validators.js`.

### **`/store`**

Gestión de estado global con Redux (o Zustand/Context, según decisión).  
Ejemplo: `store.js`, `rootReducer.js`.

### **`/styles`**

Archivos de estilos globales:

- `global.css`, `variables.css`, `tailwind.css`.

### **`/utils`**

Funciones auxiliares: constantes, formateo de datos, helpers.  
Ejemplo: `constants.js`, `pagination.js`.

---

## ⚙️ Scripts principales

- `npm run dev` → Inicia el servidor de desarrollo.
- `npm run build` → Compila el proyecto para producción.
- `npm run preview` → Sirve el build generado.
- `npm run lint` → Corre las reglas de ESLint/Prettier.

---

## ✅ Próximos pasos

- Completar vistas de **Auth, Home y Dashboard Partner**.
- Conectar a **Appwrite (auth + database)**.
- Definir design system base en `components/common/`.
- Implementar catálogo de anuncios y flujo de creación.
