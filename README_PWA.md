# README_PWA

Esta es la guia unica de PWA para este proyecto.

## Estado actual

- PWA activa con `vite-plugin-pwa`.
- Iconos master del branding en `resources/icons/`.
- Validacion automatica en `validate-pwa.cjs`.

## Archivos clave

- `vite.config.js`: manifest, workbox y configuracion PWA.
- `index.html`: metadatos SEO/PWA (theme-color, OG, Twitter, schema).
- `src/main.jsx`: registro del service worker.
- `public/web/`: favicon e iconos PWA web.
- `public/android/res/`: iconos Android.
- `public/ios/`: iconos iOS.

## Branding y logo en la app

Logos fuente:
- `resources/icons/icon_color.png`
- `resources/icons/icon_white.png`

Componente central de logo:
- `src/components/common/BrandLogo.jsx`

Lugares donde ya se renderiza:
- `src/components/common/organisms/Navbar/Navbar.jsx`
- `src/components/common/organisms/Footer/Footer.jsx`
- `src/layouts/AuthLayout.jsx`
- `src/components/navigation/Sidebar.jsx`
- `src/components/navigation/DashboardNavbar.jsx`

## Cambiar para otra app/cliente

1. Reemplaza `resources/icons/icon_color.png` y `resources/icons/icon_white.png`.
2. Regenera iconos finales en `public/web/`, `public/android/res/` y `public/ios/`.
3. Ajusta textos de marca en `src/i18n/es.json` y `src/i18n/en.json`:
- `navbar.brand`
- `navbar.tagline`
- `footer.brand`
- `footer.tagline`
- `authLayout.platform`
4. Actualiza dominio, title y metadatos en `index.html`.
5. Actualiza `name`, `short_name`, `theme_color` e iconos del manifest en `vite.config.js`.
6. Corre validacion y build:

```bash
node validate-pwa.cjs
npm run build
```

## Verificacion rapida

1. `npm run dev`
2. Revisar logo en navbar, footer, auth y dashboard.
3. `npm run build && npm run preview`
4. En Chrome DevTools > Application:
- Manifest correcto
- Service Worker registrado
- Iconos correctos
