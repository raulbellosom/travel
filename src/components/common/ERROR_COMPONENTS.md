# Error Components Documentation

Sistema de manejo de errores con componentes bonitos y animados para diferentes situaciones.

## Componentes Disponibles

### ErrorPage (Base)

Componente base que muestra páginas de error con animaciones y mensajes personalizados.

**Props:**

```jsx
<ErrorPage
  errorCode="404" // Código de error: "400", "403", "404", "500", "503", "general"
  customTitle="Título" // (Opcional) Título personalizado
  customMessage="Mensaje" // (Opcional) Mensaje personalizado
  showTips={true} // (Opcional) Mostrar tips útiles
  showActions={true} // (Opcional) Mostrar botones de acción
/>
```

**Ejemplo:**

```jsx
import ErrorPage from "../components/common/ErrorPage";

// Error 404 con configuración por defecto
<ErrorPage errorCode="404" />

// Error personalizado
<ErrorPage
  errorCode="500"
  customTitle="Estamos trabajando en ello"
  customMessage="Nuestro equipo está resolviendo el problema"
  showTips={false}
/>
```

### Componentes Específicos

Ya existen componentes específicos para cada tipo de error:

- **NotFound** (404): Página no encontrada
- **BadRequest** (400): Solicitud incorrecta
- **Forbidden** (403): Acceso denegado
- **ServerError** (500): Error del servidor
- **ServiceUnavailable** (503): Servicio no disponible

**Uso en rutas:**

```jsx
import NotFound from "../pages/NotFound";
import ServerError from "../pages/ServerError";

<Routes>
  {/* Otras rutas */}
  <Route path="/500" element={<ServerError />} />
  <Route path="*" element={<NotFound />} />
</Routes>;
```

### ErrorBoundary

Captura errores inesperados en toda la aplicación y muestra una página de error 500.

**Uso:**

```jsx
import ErrorBoundary from "./components/common/ErrorBoundary";

<ErrorBoundary>
  <App />
</ErrorBoundary>;
```

Ya está integrado en App.jsx.

## Características

### ✨ Animaciones

Cada tipo de error tiene su propia animación única:

- **404**: Icono animado con rebote
- **400**: Señal de advertencia con sacudida
- **403**: Candado con movimiento de wiggle
- **500**: Cara triste con efecto glitch
- **503**: Estrella girando con pulse

### 🌐 Internacionalización

Todos los mensajes soportan español e inglés automáticamente mediante i18n.

### 🎨 Temas

Soporte completo para modo claro y oscuro.

### 📱 Responsive

Diseño mobile-first que se adapta a todos los tamaños de pantalla.

### 🔘 Acciones

Botones disponibles:

- **Ir al Inicio**: Navega a la página principal
- **Regresar**: Vuelve a la página anterior
- **Intentar de Nuevo**: Recarga la página actual

### 💡 Tips Útiles

Cada error muestra tips contextuales al usuario para ayudarle a resolver el problema.

## Códigos de Error Soportados

| Código  | Descripción            | Uso                |
| ------- | ---------------------- | ------------------ |
| 404     | Página no encontrada   | Rutas inexistentes |
| 400     | Solicitud incorrecta   | Datos inválidos    |
| 403     | Acceso denegado        | Sin permisos       |
| 500     | Error del servidor     | Errores internos   |
| 503     | Servicio no disponible | Mantenimiento      |
| general | Error genérico         | Otros errores      |

## Agregar Traducciones

Las traducciones están en:

- `src/i18n/en.json`
- `src/i18n/es.json`

Sección `errors` en cada archivo.

## Animaciones CSS

Las animaciones están definidas en `src/index.css`:

- `animate-bounce-slow`: Rebote lento
- `animate-ping-slow`: Ping lento
- `animate-shake`: Sacudida
- `animate-wiggle`: Movimiento de lado a lado
- `animate-glitch`: Efecto glitch
- `animate-spin-slow`: Rotación lenta
- `animate-fade-in`: Aparición gradual
- `animate-slide-up`: Deslizar hacia arriba

## Personalización

Para crear un error personalizado:

```jsx
import ErrorPage from "../components/common/ErrorPage";

function CustomError() {
  return (
    <ErrorPage
      errorCode="general"
      customTitle="¡Houston, tenemos un problema!"
      customMessage="Algo inesperado sucedió, pero estamos en ello."
      showTips={true}
      showActions={true}
    />
  );
}
```

## Mejores Prácticas

1. **Usar componentes específicos** cuando sea posible (NotFound, ServerError, etc.)
2. **Configurar ErrorBoundary** en el nivel más alto de la aplicación
3. **Proporcionar mensajes claros** al usuario sobre qué salió mal
4. **Ofrecer acciones** para que el usuario pueda recuperarse del error
5. **Registrar errores** en servicios de monitoreo cuando sea apropiado

## Ejemplo de Integración con Manejo de Errores

```jsx
// En un servicio o componente
try {
  const data = await fetchData();
  return data;
} catch (error) {
  if (error.status === 404) {
    navigate("/404");
  } else if (error.status === 403) {
    navigate("/403");
  } else if (error.status >= 500) {
    navigate("/500");
  } else {
    // ErrorBoundary capturará esto
    throw error;
  }
}
```
