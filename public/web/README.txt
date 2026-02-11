==============================================
  GUÍA DE ICONOS PWA - TRAVEL PLATFORM
==============================================

📁 ESTRUCTURA DE ICONOS
-----------------------
La aplicación utiliza iconos en múltiples ubicaciones:

1. /public/web/ (iconos web y PWA)
   - favicon.ico (16x16, 32x32)
   - apple-touch-icon.png (180x180)
   - icon-192.png (192x192)
   - icon-512.png (512x512)
   - icon-192-maskable.png (192x192 con safe zone)
   - icon-512-maskable.png (512x512 con safe zone)

2. /public/android/res/mipmap-*/ (iconos Android)
   - mipmap-mdpi (48x48)
   - mipmap-hdpi (72x72)
   - mipmap-xhdpi (96x96)
   - mipmap-xxhdpi (144x144)
   - mipmap-xxxhdpi (192x192)

3. /resources/icons/ (iconos master)
   - icon_color.png (logo a color - azul #3B82F6)
   - icon_white.png (logo en blanco)

🎨 CONFIGURACIÓN ACTUAL
-----------------------
Color principal (theme_color): #3B82F6 (Azul)
Background: #ffffff (Blanco)

Estos colores están configurados en:
- vite.config.js (manifest PWA)
- index.html (meta tags)
- browserconfig.xml (tiles Microsoft)

🔄 CÓMO CAMBIAR LOS ICONOS PARA TU CLIENTE
------------------------------------------
Cuando vendas este proyecto y necesites personalizar los iconos:

PASO 1: Prepara el nuevo logo
  - Logo en alta resolución (mínimo 512x512px)
  - Formato PNG con fondo transparente
  - Versión a color y versión monocromática/blanca

PASO 2: Genera los iconos en todos los tamaños
  Herramientas recomendadas:
  - https://realfavicongenerator.net/
  - https://www.pwabuilder.com/imageGenerator
  - https://maskable.app/ (para iconos maskable)

PASO 3: Reemplaza los archivos
  - Reemplaza todos los archivos en /public/web/
  - Reemplaza los archivos en /public/android/res/mipmap-*/
  - Actualiza /resources/icons/ con los logos master

PASO 4: Actualiza la configuración de colores
  En vite.config.js (línea ~27-28):
    theme_color: "#TU_COLOR_PRINCIPAL"
    background_color: "#TU_COLOR_FONDO"
  
  En index.html (línea ~50):
    <meta name="theme-color" content="#TU_COLOR_PRINCIPAL" />
  
  En browserconfig.xml (línea ~9):
    <TileColor>#TU_COLOR_PRINCIPAL</TileColor>

PASO 5: Actualiza textos del proyecto
  En vite.config.js (manifest):
    - name: "Nombre completo de la app del cliente"
    - short_name: "Nombre corto"
    - description: "Descripción del servicio del cliente"
  
  En index.html:
    - <title> y meta tags
    - Open Graph tags (og:*)
    - Twitter Card tags
    - Structured Data (JSON-LD)

PASO 6: Actualiza SEO
  En index.html:
    - Reemplaza URLs (www.travel.com -> www.cliente.com)
    - Actualiza keywords específicas del cliente
    - Modifica description tags
  
  En robots.txt:
    - Actualiza Sitemap URLs
    - Ajusta reglas según necesidades del cliente
  
  En sitemap.xml:
    - Actualiza el dominio
    - Agrega/elimina páginas según la estructura

PASO 7: Rebuild y test
  ```bash
  npm run build
  npm run preview
  ```

📱 ICONOS MASKABLE (ADAPTIVE ICONS)
-----------------------------------
Los iconos maskable son importantes para Android:
- Mantén el contenido importante en el círculo central (safe zone 80%)
- El área externa (20%) puede ser cortada por diferentes formas
- Usa https://maskable.app/ para validar

🧪 TESTING PWA
--------------
Para probar la PWA localmente:
1. En vite.config.js, cambia devOptions.enabled a true
2. Ejecuta: npm run dev
3. Abre Chrome DevTools > Application > Manifest
4. Verifica que todos los iconos carguen correctamente

Para testing en producción:
1. Build: npm run build
2. Preview: npm run preview
3. Usa Lighthouse en Chrome DevTools para auditoría PWA

📋 CHECKLIST DE CAMBIO DE MARCA
-------------------------------
[ ] Nuevos iconos generados en todos los tamaños
[ ] Archivos reemplazados en /public/web/
[ ] Archivos reemplazados en /public/android/
[ ] Archivos reemplazados en /resources/icons/
[ ] Colores actualizados en vite.config.js
[ ] Colores actualizados en index.html
[ ] Colores actualizados en browserconfig.xml
[ ] Nombre de app actualizado en manifest (vite.config.js)
[ ] Meta tags SEO actualizados en index.html
[ ] URLs actualizadas (travel.com -> dominio cliente)
[ ] robots.txt configurado para dominio del cliente
[ ] sitemap.xml configurado para dominio del cliente
[ ] Build realizado y testeado
[ ] PWA validada con Lighthouse (score > 90)

💡 TIPS
-------
- Mantén siempre backups de los iconos originales
- Documenta los colores principales del cliente
- Usa nombres de archivos consistentes
- Verifica en múltiples dispositivos (iOS, Android, Desktop)
- Considera crear un script automatizado para el cambio de marca

📞 SOPORTE
----------
Si tienes dudas sobre la configuración PWA, revisa:
- Documentación oficial: https://vite-pwa-org.netlify.app/
- Web.dev PWA Guide: https://web.dev/progressive-web-apps/

