# 00_PROJECT_BRIEF – REAL ESTATE SAAS PLATFORM

## Documento Base

Este documento define el **Project Brief oficial** del sistema SaaS inmobiliario.

Todas las decisiones técnicas, restricciones y reglas arquitectónicas que aquí se aplican
están definidas previamente en:

- `00_ai_project_context.md`

Este documento **no redefine reglas técnicas**, únicamente establece el alcance funcional,
la visión del producto y los criterios de éxito.

---

## 1. Visión del Producto

El proyecto consiste en el desarrollo de un **SaaS inmobiliario multi-tenant**
que permite a agentes inmobiliarios, agencias y grupos corporativos:

- Publicar y gestionar propiedades de todo tipo
- Tener presencia digital profesional con su propia marca
- Generar leads y gestionar contactos
- Operar completamente desde dispositivos móviles
- Escalar desde un solo usuario hasta cientos de agentes

El sistema está diseñado como un **producto comercial real** que se vende
como suscripción mensual/anual a diferentes tipos de clientes del sector inmobiliario.

---

## 2. Problema que Resuelve

### 2.1 Problemas de los Agentes Independientes

- No tienen presencia digital profesional
- Dependen de portales inmobiliarios (Inmuebles24, Vivanuncios) que cobran altas comisiones
- No controlan sus leads ni datos de clientes
- Usan herramientas genéricas no especializadas en inmobiliaria
- No pueden personalizar su marca

### 2.2 Problemas de Agencias Pequeñas y Medianas

- Sistemas inmobiliarios tradicionales son caros ($500-$2000 USD/mes)
- Requieren instalación local o infraestructura compleja
- No están optimizados para móvil
- No permiten customización de marca
- Difíciles de usar y aprender

### 2.3 Problemas de Grupos Corporativos

- Necesitan gestionar múltiples sucursales y agentes
- Requieren reportes y analytics centralizados
- Necesitan control de permisos granular
- Quieren integración con sus sistemas existentes (CRM, ERP)

---

## 3. Solución Propuesta

El SaaS inmobiliario ofrece:

### 3.1 Para Todos los Usuarios

- **SaaS puro**: Sin instalación, acceso web inmediato
- **Mobile-first**: Funciona perfectamente en smartphone y tablet
- **Presencia digital**: Landing page profesional con su marca
- **Gestión completa**: CRUD de propiedades con galería rica
- **Multi-idioma**: Español e inglés desde el inicio
- **SEO optimizado**: Cada propiedad indexable por Google
- **Leads centralizados**: Todos los contactos en un solo lugar

### 3.2 Para Agentes Individuales (Plan Solo)

- Una sola cuenta de administrador
- Catálogo ilimitado de propiedades
- Personalización básica de marca
- Formularios de contacto
- Galería de fotos profesional

### 3.3 Para Agencias (Plan Team)

- Múltiples usuarios/agentes
- Cada agente gestiona su cartera
- Admin puede ver y gestionar todo
- Asignación de propiedades a agentes
- Reportes por agente

### 3.4 Para Grupos Corporativos (Plan Enterprise)

- Multi-sucursal
- Roles y permisos avanzados
- Reportes y analytics centralizados
- API para integraciones
- Soporte prioritario
- Custom domain

---

## 4. Usuarios Objetivo

### 4.1 Primarios

1. **Agente Inmobiliario Independiente**
   - Persona física
   - 5-50 propiedades en cartera
   - Trabaja desde smartphone
   - Necesita presencia digital profesional
   - Presupuesto: $20-50 USD/mes

2. **Agencia Pequeña**
   - 2-10 agentes
   - 50-200 propiedades
   - Necesitan colaboración
   - Presupuesto: $100-300 USD/mes

3. **Grupo Inmobiliario**
   - 10-100 agentes
   - Múltiples sucursales
   - 200-1000+ propiedades
   - Presupuesto: $500-2000 USD/mes

### 4.2 Secundarios

4. **Desarrolladores Inmobiliarios**
   - Venden proyectos nuevos
   - Necesitan catálogo de unidades
   - Calculadoras de financiamiento

5. **Administradores de Propiedades**
   - Rentas de largo plazo
   - Gestión de inquilinos
   - Control de pagos

---

## 5. Alcance Funcional del Sistema

### 5.1 Incluye (Fase 0 - MVP)

#### Landing Page Pública

- Página principal moderna y atractiva (ref: v3.png)
- Catálogo de propiedades con paginación
- Filtros básicos:
  - Tipo de operación (venta/renta)
  - Tipo de propiedad
  - Rango de precio
  - Ubicación (ciudad/estado)
  - Recámaras/baños
- Ordenamiento (recientes, precio, tamaño)
- Vista en grid y lista
- Detalle de propiedad profesional (ref: details.png):
  - Galería de imágenes completa
  - Información detallada
  - Características y amenidades
  - Mapa de ubicación
  - Formulario de contacto
  - Botón WhatsApp directo
- Diseño responsive (mobile-first)
- Modo claro/oscuro
- Multi-idioma (es/en)

#### Panel Administrativo

- Dashboard con estadísticas básicas
- Gestión de propiedades (CRUD):
  - Crear propiedad
  - Editar propiedad
  - Eliminar propiedad
  - Cambiar estado (activo/inactivo)
- Gestión de imágenes:
  - Subida múltiple
  - Reordenamiento drag & drop
  - Establecer imagen principal
  - Eliminar imágenes
- Formulario de propiedad completo:
  - Información básica
  - Ubicación
  - Características
  - Precio y términos
  - Descripción
  - Amenidades
- Gestión de leads/contactos:
  - Lista de contactos
  - Detalle de contacto
  - Origen del lead
  - Estado (nuevo/contactado/cerrado)
- Perfil de usuario:
  - Datos personales
  - Foto de perfil
  - Información de contacto
  - Configuración de marca (logo, colores)

#### Autenticación

- Registro de usuario
- Login con email/password
- Verificación de email
- Recuperación de contraseña
- Logout
- Sesión persistente

#### Sistema de Propiedades

Tipos de inmuebles:

- Casas
- Departamentos
- Terrenos
- Locales comerciales
- Oficinas
- Bodegas
- Salones de eventos

Tipos de operación:

- Venta
- Renta
- Renta vacacional

Campos por propiedad:

- Título
- Descripción
- Tipo de inmueble
- Tipo de operación
- Precio
- Moneda
- Superficie total
- Superficie construida
- Recámaras
- Baños
- Estacionamientos
- Ubicación (calle, colonia, ciudad, estado, país, código postal)
- Coordenadas GPS
- Amenidades (array)
- Estado (activo/inactivo/vendido/rentado)
- Fecha de creación
- Última actualización

---

### 5.2 NO Incluye (Fase 0)

- Sistema de pagos/suscripciones
- Multi-tenant con organizaciones
- Roles avanzados (solo admin/agente básico)
- Reportes complejos
- Integraciones externas (CRM, pagos)
- API pública
- Calculadora de hipotecas
- Sistema de favoritos
- Comparador de propiedades
- Búsqueda geoespacial avanzada
- Tours virtuales 360°
- Chat en tiempo real

Estas características se implementarán en fases posteriores.

---

## 6. Diseño de Referencia

### 6.1 Landing Page

- Inspiración: `refs/v3.png`
- Diseño moderno, limpio, visual
- Grid de propiedades con imágenes grandes
- Filtros laterales o top
- Tarjetas de propiedad atractivas
- Call-to-action claros

### 6.2 Detalle de Propiedad

- Inspiración: `refs/details.png`
- Galería principal prominente
- Información organizada en secciones
- Mapa integrado
- Formulario de contacto visible
- Datos del agente/empresa

---

## 7. Modelo de Monetización (Futuro)

### Plan Solo

- $29 USD/mes
- 1 usuario administrador
- Propiedades ilimitadas
- Landing page personalizada
- Soporte por email

### Plan Team

- $99 USD/mes
- Hasta 10 usuarios
- Propiedades ilimitadas
- Multi-agente
- Reportes básicos
- Soporte prioritario

### Plan Enterprise

- $299 USD/mes
- Usuarios ilimitados
- Multi-sucursal
- API acceso
- Custom domain
- Soporte dedicado

---

## 8. Métricas de Éxito

### 8.1 Técnicas

- Tiempo de carga < 3 segundos
- 100% responsive (mobile/tablet/desktop)
- 95%+ disponibilidad
- 0 errores críticos en producción

### 8.2 Funcionales

- Usuario puede crear propiedad en < 5 minutos
- Landing page genera leads verificables
- Panel funciona en smartphone sin problemas
- SEO: propiedades indexadas por Google

### 8.3 Negocio (Post-Lanzamiento)

- 100 usuarios registrados primer mes
- 10 clientes de pago primer trimestre
- NPS > 50
- Churn < 10% mensual

---

## 9. Restricciones y Consideraciones

### 9.1 Técnicas

- Definidas en `00_ai_project_context.md`
- Stack: React + Vite + Appwrite
- Mobile-first obligatorio
- No TypeScript

### 9.2 Legales

- GDPR compliance (futuro)
- Protección de datos personales
- Términos y condiciones
- Política de privacidad

### 9.3 Operacionales

- Self-hosted en infraestructura propia inicialmente
- Escalabilidad considerada desde arquitectura
- Backup diario de datos

---

## 10. Roadmap de Alto Nivel

### Q1 2026 - Fase 0 (MVP)

- Autenticación
- CRUD propiedades
- Landing page pública
- Panel administrativo básico
- Deploy en producción

### Q2 2026 - Fase 1

- Multi-tenant real
- Sistema de suscripciones
- Roles y permisos avanzados
- Reportes básicos

### Q3 2026 - Fase 2

- Integración pagos (Stripe)
- WhatsApp Business API
- Email marketing
- Búsqueda geoespacial

### Q4 2026 - Fase 3

- CRM completo
- API pública
- Integraciones (Zapier)
- Mobile apps (iOS/Android)

---

## 11. Stakeholders

- **Product Owner**: Equipo RacoonDevs
- **Desarrolladores**: Equipo técnico interno + IA Agents
- **Usuarios Beta**: 5-10 agentes inmobiliarios
- **Usuarios Finales**: Agentes, agencias, grupos inmobiliarios

---

## 12. Criterios de Aceptación (MVP)

### Landing Page

✅ Usuario puede ver catálogo de propiedades
✅ Usuario puede filtrar por tipo, precio, ubicación
✅ Usuario puede ver detalle de propiedad con galería
✅ Usuario puede contactar vía formulario o WhatsApp
✅ Página responsive en mobile/tablet/desktop
✅ Soporta modo claro/oscuro
✅ Multi-idioma es/en

### Panel Admin

✅ Administrador puede crear propiedad completa
✅ Administrador puede subir múltiples imágenes
✅ Administrador puede editar propiedades existentes
✅ Administrador puede activar/desactivar propiedades
✅ Administrador puede ver leads recibidos
✅ Panel funciona en smartphone
✅ Sesión persiste entre visitas

### Sistema

✅ Autenticación segura con Appwrite
✅ Datos almacenados en Appwrite Database
✅ Imágenes en Appwrite Storage
✅ Permisos correctos (solo admin ve panel)
✅ Sin errores de consola
✅ Build exitoso sin warnings

---

## 13. Fuera de Alcance (Explícitamente)

- ❌ Sistema de pagos (Fase 1)
- ❌ Multi-tenant con organizaciones (Fase 1)
- ❌ CRM completo (Fase 2)
- ❌ Tours virtuales (Fase 3)
- ❌ Mobile apps nativas (Fase 3)
- ❌ Integración con portales externos (Fase 2)
- ❌ Sistema de mensajería interna (Fase 2)
- ❌ Firma digital de contratos (Fase 3)

---

## 14. Próximos Pasos

1. Revisar y aprobar este Project Brief
2. Crear documentos técnicos detallados:
   - 01_frontend_requirements.md
   - 02_backend_appwrite_requirements.md
   - 03_appwrite_db_schema.md
   - etc.
3. Iniciar desarrollo de Fase 0
4. Testing con usuarios beta
5. Deploy en producción

---

**Fecha de creación**: Febrero 2026
**Versión**: 1.0.0
**Estado**: ✅ Aprobado para desarrollo
