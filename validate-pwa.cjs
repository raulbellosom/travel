#!/usr/bin/env node

/**
 * Script de validaciÃ³n PWA
 * 
 * Verifica que todos los archivos necesarios estÃ©n en su lugar
 * antes de hacer deploy o personalizar para un cliente.
 * 
 * Uso: node validate-pwa.cjs
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? 'âœ…' : 'âŒ';
  const color = exists ? 'green' : 'red';
  
  log(`${status} ${description}: ${filePath}`, color);
  return exists;
}

function checkDir(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  const status = exists ? 'âœ…' : 'âŒ';
  const color = exists ? 'green' : 'red';
  
  log(`${status} ${description}: ${dirPath}`, color);
  return exists;
}

function validatePWA() {
  log('\nðŸ” Validando configuraciÃ³n PWA...\n', 'cyan');
  
  let errors = 0;
  let warnings = 0;

  // 1. Archivos de configuraciÃ³n
  log('ðŸ“¦ Archivos de ConfiguraciÃ³n:', 'blue');
  if (!checkFile('vite.config.js', 'Config Vite')) errors++;
  if (!checkFile('index.html', 'HTML principal')) errors++;
  if (!checkFile('package.json', 'Package.json')) errors++;
  
  // 2. Archivos PWA pÃºblicos
  log('\nðŸŒ Archivos PWA:', 'blue');
  if (!checkFile('public/robots.txt', 'Robots.txt')) errors++;
  if (!checkFile('public/sitemap.xml', 'Sitemap.xml')) errors++;
  if (!checkFile('public/browserconfig.xml', 'Browserconfig.xml')) errors++;
  
  // 3. Iconos Web
  log('\nðŸ“± Iconos Web/PWA:', 'blue');
  if (!checkFile('public/web/favicon.ico', 'Favicon')) errors++;
  if (!checkFile('public/web/apple-touch-icon.png', 'Apple Touch Icon')) errors++;
  if (!checkFile('public/web/icon-192.png', 'Icon 192x192')) errors++;
  if (!checkFile('public/web/icon-512.png', 'Icon 512x512')) errors++;
  if (!checkFile('public/web/icon-192-maskable.png', 'Maskable 192x192')) warnings++;
  if (!checkFile('public/web/icon-512-maskable.png', 'Maskable 512x512')) warnings++;
  
  // 4. Iconos Android
  log('\nðŸ¤– Iconos Android:', 'blue');
  if (!checkDir('public/android/res', 'Directorio Android res')) errors++;
  if (!checkDir('public/android/res/mipmap-mdpi', 'mipmap-mdpi')) warnings++;
  if (!checkDir('public/android/res/mipmap-hdpi', 'mipmap-hdpi')) warnings++;
  if (!checkDir('public/android/res/mipmap-xhdpi', 'mipmap-xhdpi')) warnings++;
  if (!checkDir('public/android/res/mipmap-xxhdpi', 'mipmap-xxhdpi')) warnings++;
  if (!checkDir('public/android/res/mipmap-xxxhdpi', 'mipmap-xxxhdpi')) warnings++;
  
  // 5. Iconos Master
  log('\nðŸŽ¨ Iconos Master:', 'blue');
  if (!checkFile('resources/icons/icon_color.png', 'Icon Color')) warnings++;
  if (!checkFile('resources/icons/icon_white.png', 'Icon White')) warnings++;
  
  // 6. Componentes React
  log('\nâš›ï¸  Componentes React PWA:', 'blue');
  if (!checkFile('src/main.jsx', 'Main.jsx')) errors++;
  if (!checkFile('src/hooks/usePWA.js', 'Hook usePWA')) warnings++;
  if (!checkFile('src/components/common/PWAUpdateNotification.jsx', 'PWA Update Notification')) warnings++;
  if (!checkFile('src/components/common/PWAInstallButton.jsx', 'PWA Install Button')) warnings++;
  if (!checkFile('src/components/common/OfflineIndicator.jsx', 'Offline Indicator')) warnings++;
  
  // 7. Documentacion
  log('\n📚 Documentacion:', 'blue');
  if (!checkFile('README_PWA.md', 'Guia PWA unica')) warnings++;
  
  // 8. Verificar package.json
  log('\nðŸ“¦ Dependencias:', 'blue');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasPWAPlugin = packageJson.devDependencies && packageJson.devDependencies['vite-plugin-pwa'];
    
    if (hasPWAPlugin) {
      log(`âœ… vite-plugin-pwa instalado (${packageJson.devDependencies['vite-plugin-pwa']})`, 'green');
    } else {
      log('âŒ vite-plugin-pwa NO encontrado en devDependencies', 'red');
      errors++;
    }
  } catch (e) {
    log('âŒ Error al leer package.json', 'red');
    errors++;
  }
  
  // 9. Verificar vite.config.js
  log('\nâš™ï¸  ConfiguraciÃ³n Vite:', 'blue');
  try {
    const viteConfig = fs.readFileSync('vite.config.js', 'utf8');
    
    if (viteConfig.includes('VitePWA')) {
      log('âœ… VitePWA importado en vite.config.js', 'green');
    } else {
      log('âŒ VitePWA NO importado en vite.config.js', 'red');
      errors++;
    }
    
    if (viteConfig.includes('manifest')) {
      log('âœ… Manifest configurado', 'green');
    } else {
      log('âŒ Manifest NO configurado', 'red');
      errors++;
    }
    
    if (viteConfig.includes('workbox')) {
      log('âœ… Workbox configurado', 'green');
    } else {
      log('âŒ Workbox NO configurado', 'red');
      errors++;
    }
  } catch (e) {
    log('âŒ Error al leer vite.config.js', 'red');
    errors++;
  }
  
  // 10. Verificar index.html
  log('\nðŸ“„ Index.html:', 'blue');
  try {
    const html = fs.readFileSync('index.html', 'utf8');
    
    if (html.includes('<meta name="theme-color"')) {
      log('âœ… Theme color configurado', 'green');
    } else {
      log('âš ï¸  Theme color NO encontrado', 'yellow');
      warnings++;
    }
    
    if (html.includes('og:')) {
      log('âœ… Open Graph tags encontrados', 'green');
    } else {
      log('âš ï¸  Open Graph tags NO encontrados', 'yellow');
      warnings++;
    }
    
    if (html.includes('twitter:')) {
      log('âœ… Twitter Card tags encontrados', 'green');
    } else {
      log('âš ï¸  Twitter Card tags NO encontrados', 'yellow');
      warnings++;
    }
    
    if (html.includes('application/ld+json')) {
      log('âœ… Structured Data encontrado', 'green');
    } else {
      log('âš ï¸  Structured Data NO encontrado', 'yellow');
      warnings++;
    }
  } catch (e) {
    log('âŒ Error al leer index.html', 'red');
    errors++;
  }
  
  // 11. Verificar build
  log('\nðŸ—ï¸  Build:', 'blue');
  const distExists = fs.existsSync('dist');
  if (distExists) {
    log('âœ… Carpeta dist existe (build previo encontrado)', 'green');
    
    if (fs.existsSync('dist/manifest.webmanifest')) {
      log('âœ… manifest.webmanifest generado', 'green');
    } else {
      log('âš ï¸  manifest.webmanifest NO encontrado en dist', 'yellow');
      warnings++;
    }
    
    if (fs.existsSync('dist/sw.js')) {
      log('âœ… Service Worker generado', 'green');
    } else {
      log('âš ï¸  Service Worker NO encontrado en dist', 'yellow');
      warnings++;
    }
  } else {
    log('âš ï¸  Carpeta dist NO existe (ejecuta npm run build)', 'yellow');
    warnings++;
  }
  
  // Resumen
  log('\n' + '='.repeat(50), 'cyan');
  log('ðŸ“Š RESUMEN:', 'cyan');
  log('='.repeat(50) + '\n', 'cyan');
  
  if (errors === 0 && warnings === 0) {
    log('âœ… Â¡PERFECTO! ConfiguraciÃ³n PWA completa', 'green');
    log('ðŸš€ Lista para personalizar o hacer deploy\n', 'green');
    return 0;
  } else if (errors === 0) {
    log(`âš ï¸  ${warnings} advertencia(s) encontrada(s)`, 'yellow');
    log('âœ… ConfiguraciÃ³n mÃ­nima cumplida', 'green');
    log('ðŸ’¡ Considera completar los archivos faltantes\n', 'yellow');
    return 0;
  } else {
    log(`âŒ ${errors} error(es) crÃ­tico(s) encontrado(s)`, 'red');
    if (warnings > 0) {
      log(`âš ï¸  ${warnings} advertencia(s) encontrada(s)`, 'yellow');
    }
    log('ðŸ”§ Revisa y corrige los errores antes de continuar\n', 'red');
    return 1;
  }
}

// Ejecutar validaciÃ³n
const exitCode = validatePWA();
process.exit(exitCode);





