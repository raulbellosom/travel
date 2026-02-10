# 00_AI_PROJECT_CONTEXT – REAL ESTATE SAAS PLATFORM

## Propósito de este Documento

Este archivo define el **contexto raíz del proyecto** y actúa como la **fuente única de verdad inicial** para cualquier agente de IA, desarrollador o proceso automatizado involucrado en el diseño y construcción del sistema.

Ningún documento posterior (00–0N) debe contradecir las decisiones, restricciones o principios establecidos aquí.

---

## 1. Visión General del Proyecto

El proyecto consiste en el diseño y desarrollo de un **SaaS inmobiliario multi-tenant** que permite a diferentes grupos inmobiliarios, agentes independientes y empresas del sector inmobiliario gestionar y publicar sus propiedades en una plataforma profesional.

El sistema cubre:

1. **Landing page pública** con catálogo de propiedades
2. **Panel administrativo** para gestión de anuncios y operaciones
3. **Sistema multi-tenant** configurable como mono-usuario o multi-usuario
4. **Gestión de propiedades diversas**: casas, terrenos, departamentos, locales comerciales, salones de eventos, etc.

El sistema está diseñado para **uso real en producción** como SaaS, no como demo o prototipo.

---

## 2. Modelo de Negocio SaaS

### Enfoque Multi-Tenant

El sistema opera como **SaaS multi-tenant** donde:

- Cada **instancia** representa un cliente (grupo inmobiliario, agencia, agente independiente)
- Cada instancia puede ser configurada como:
  - **Mono-usuario**: Un solo administrador gestiona todas las propiedades
  - **Multi-usuario**: Múltiples agentes/usuarios bajo una misma organización
- Cada instancia tiene su propia **identidad de marca** (logo, colores, dominio)
- Cada instancia gestiona su propio **catálogo de propiedades**

### Tipos de Instancias

1. **Agente Individual**: Una persona con su cartera de propiedades
2. **Agencia Pequeña**: 2-10 agentes compartiendo plataforma
3. **Grupo Inmobiliario**: 10+ agentes, múltiples sucursales
4. **Empresa Corporativa**: Centenares de propiedades, múltiples administradores

---

## 3. Principio Fundamental de Diseño

### Enfoque Mobile-First

Todo el sistema debe concebirse bajo el principio **Mobile-First**, priorizando:

- Teléfonos móviles
- Tabletas

El diseño de escritorio es una adaptación posterior.

Este principio aplica a:

- Landing page pública
- Panel administrativo
- Catálogo de propiedades
- Formularios de contacto
- Gestión de anuncios
- Perfiles de agentes

Las interfaces deben estar optimizadas para interacción táctil.

---

## 4. Alcance Funcional de Alto Nivel

### 4.1 Landing Page Pública

- Página principal estilo moderno inmobiliario (ref: v3.png)
- Catálogo de propiedades con filtros avanzados
- Detalle de propiedad profesional (ref: details.png)
- Formularios de contacto
- Galería de imágenes interactiva
- Optimización SEO
- Diseño responsive con soporte para modo oscuro
- Multi-idioma (español/inglés mínimo)

---

### 4.2 Panel Administrativo / Dashboard

Incluye:

- Gestión de propiedades (CRUD completo)
- Gestión de agentes/usuarios (multi-tenant)
- Gestión de medios (imágenes, videos, documentos)
- Configuración de marca (logo, colores, dominio)
- Estadísticas y reportes
- Gestión de leads/contactos
- Sistema de roles y permisos

---

### 4.3 Tipos de Propiedades Soportadas

El sistema debe manejar diversos tipos de inmuebles:

1. **Residencial**:
   - Casas
   - Departamentos
   - Condominios
   - Villas

2. **Terrenos**:
   - Lotes urbanos
   - Terrenos rústicos
   - Lotes en desarrollo

3. **Comercial**:
   - Locales comerciales
   - Oficinas
   - Bodegas/Almacenes
   - Salones de eventos

4. **Mixto**:
   - Edificios completos
   - Plazas comerciales

---

### 4.4 Operaciones Soportadas

- **Venta**
- **Renta** (corto y largo plazo)
- **Renta vacacional**
- **Traspaso**

---

## 5. Stack Tecnológico (No Negociable)

### Frontend

- ReactJS
- Vite
- JavaScript puro (NO TypeScript)
- PWA
- TailwindCSS 4.1 con Dark Mode
- Arquitectura modular y mantenible
- Framer Motion para animaciones
- Lucide React para iconos

Prohibido:

- TypeScript
- Mock data
- Fake data
- Datos hardcodeados

Todo dato debe provenir del backend real.

---

### Backend

- Appwrite self-hosted (última versión estable)
- Uso de:
  - Auth (autenticación y autorización)
  - Database (PostgreSQL)
  - Storage (imágenes y documentos)
  - Functions (lógica de negocio)
  - Realtime (notificaciones)
  - Messaging (correos)

---

### Infraestructura

- Appwrite self-hosted
- PostgreSQL como motor de base de datos
- Storage distribuido para medios
- CDN para imágenes (opcional)

---

## 6. Reglas Arquitectónicas Absolutas

### 6.1 Separación de Responsabilidades

- **Frontend**: Presentación y UX únicamente
- **Backend (Appwrite)**: Lógica de negocio, validaciones, permisos
- **Functions**: Automatizaciones, integraciones, procesos complejos

### 6.2 Datos Reales Siempre

Prohibido terminantemente:

- Mock data
- Fake data
- Placeholders hardcodeados
- Arrays estáticos simulando backend

Toda información debe provenir de Appwrite Database.

### 6.3 Mobile-First No Negociable

- Diseño base: 360px (mobile)
- Diseño secundario: 768px (tablet)
- Diseño terciario: 1024px+ (desktop)

### 6.4 Multi-Tenant Desde el Core

- La arquitectura de datos debe soportar multi-tenant desde el inicio
- Uso de `organizationId` / `tenantId` en todas las colecciones relevantes
- Permisos basados en teams de Appwrite
- Aislamiento total de datos entre tenants

---

## 7. Seguridad y Privacidad

### 7.1 Principios

- **Zero Trust**: Validación en backend siempre
- **Least Privilege**: Permisos mínimos necesarios
- **Data Isolation**: Datos de cada tenant completamente aislados

### 7.2 Autenticación

- Appwrite Auth como única fuente
- Sesiones seguras
- Verificación de email obligatoria
- Recuperación de contraseña

### 7.3 Autorización

- Permisos basados en roles
- Teams de Appwrite para multi-tenant
- Guards en frontend (preventivos)
- Validación real en backend

---

## 8. Integraciones Futuras (Consideradas)

- Pasarelas de pago (Stripe/MercadoPago)
- CRM externo (HubSpot/Pipedrive)
- Email marketing (Mailchimp/SendGrid)
- WhatsApp Business API
- Google Maps / Mapbox
- Redes sociales (Facebook/Instagram)

---

## 9. Fases del Proyecto

### Fase 0 (MVP)

- Autenticación básica
- CRUD de propiedades
- Landing page pública
- Catálogo con filtros básicos
- Detalle de propiedad
- Formulario de contacto
- Panel administrativo básico

### Fase 1

- Multi-tenant completo
- Gestión de agentes
- Roles y permisos avanzados
- Reportes y estadísticas
- Integración WhatsApp

### Fase 2

- Integración pagos
- Sistema de favoritos
- Búsqueda avanzada (geoespacial)
- Comparador de propiedades
- Calculadora de hipotecas

### Fase 3

- CRM integrado
- Email marketing
- Automatizaciones
- Analytics avanzado
- API pública para integraciones

---

## 10. Restricciones Técnicas

### NO permitido:

- TypeScript
- GraphQL
- Microservicios complejos
- Contenedores custom (fuera de Appwrite)
- ORMs externos

### SÍ permitido:

- Appwrite Functions (Node.js)
- Appwrite SDK oficial
- Libraries de UI compatibles con React
- Utilidades de fecha (day.js)
- Librerías de validación (zod/yup)

---

## 11. Calidad y Testing

### Frontend

- ESLint configurado
- Prettier para formato
- Testing manual exhaustivo
- Validación de accesibilidad (WCAG AA)

### Backend

- Validación de permisos
- Testing de Functions
- Validación de schemas

---

## 12. Documentación Obligatoria

Cada capa del sistema debe tener:

- README.md descriptivo
- Comentarios en código complejo
- Variables de entorno documentadas (.env.example)
- Guías de setup y deployment

---

## 13. Relación con Documentos Posteriores

Este documento habilita y define restricciones para:

- 00_project_brief.md
- 01_frontend_requirements.md
- 02_backend_appwrite_requirements.md
- 03_appwrite_db_schema.md
- 04_design_system_mobile_first.md
- 05_permissions_and_roles.md
- 06_appwrite_functions_catalog.md
- 07_frontend_routes_and_flows.md
- 08_env_reference.md
- 09_agent_usage_guide.md

---

## 14. Estado del Documento

Este documento es:

- ✅ Definitivo para Fase 0
- 📝 Sujeto a refinamiento en fases posteriores (sin romper arquitectura base)
- 🔒 No negociable en decisiones tecnológicas core

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
**Autor**: RacoonDevs Team
