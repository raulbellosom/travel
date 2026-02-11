# 00_PROJECT_BRIEF - REAL ESTATE SAAS PLATFORM (SINGLE-TENANT)

## Documento Base

Este documento define el alcance funcional y de negocio del producto.
Las reglas tecnicas detalladas viven en:

- `00_ai_project_context.md`
- `01_frontend_requirements.md`
- `02_backend_appwrite_requirements.md`

---

## 1. Vision del Producto

El producto es una **plantilla SaaS inmobiliaria** que se entrega como
**instancia dedicada por cliente**.

Modelo operativo:

- Este repositorio funciona como **demo/portafolio**.
- Cuando entra un cliente nuevo, se crea una **nueva instancia exclusiva**:
  - Frontend independiente
  - Proyecto Appwrite independiente
  - Base de datos independiente
  - Buckets y Functions independientes
- No existe mezcla de datos entre clientes.

---

## 2. Problema que Resuelve

### 2.1 Para agentes y brokers

- Necesitan pagina profesional para publicar propiedades.
- Necesitan recibir reservas y mensajes sin depender de portales externos.
- Necesitan control real sobre sus leads, reseñas y conversiones.

### 2.2 Para equipos pequenos

- Requieren usuarios de staff con permisos restringidos.
- Necesitan delegar operacion diaria (contenido, mensajes, leads).
- Necesitan trazabilidad para auditoria de cambios.

### 2.3 Para operacion del proveedor SaaS

- Se requiere control root interno para soporte y diagnostico.
- Se requiere panel oculto de ActivityLog para auditoria forense.
- Se requiere onboarding repetible por cliente (provisioning).

---

## 3. Solucion Propuesta

### 3.1 Core funcional por instancia cliente

- Landing y catalogo publico de propiedades.
- Detalle de propiedad con formulario de contacto.
- Reservas online por propiedad.
- Reseñas verificadas por reservacion.
- Dashboard con metricas operativas y comerciales.

### 3.2 Preparacion comercial y financiera

- Arquitectura lista para Stripe y/o Mercado Pago.
- Registro de pagos y reconciliacion por webhook.
- Emision de voucher de reservacion.
- Estados de reservacion y pago trazables.

### 3.3 Control operativo y seguridad

- Usuario `owner` por cliente con control completo de negocio.
- Usuarios `staff` creados por owner con permisos granulares.
- Usuario `root` interno, oculto y no listable, con acceso total.
- ActivityLog detallado (quien, cuando, entidad, antes, despues).

---

## 4. Usuarios Objetivo

### 4.1 En la instancia de cliente

1. **Owner (dueno del negocio)**
   - Administra propiedades, reservas, pagos y staff.
2. **Staff (operadores internos)**
   - Atienden mensajes, actualizan contenido, gestionan leads.
   - Acceso restringido por modulos.
3. **Visitante publico**
   - Navega propiedades, contacta, reserva y deja reseña.

### 4.2 En la operacion del proveedor

4. **Root interno (RacoonDevs)**
   - Soporte, auditoria y recuperacion de incidentes.
   - Acceso a panel oculto ActivityLog.

---

## 5. Alcance Funcional del MVP

### 5.1 Incluye

#### Sitio publico

- Home con listado de propiedades publicadas.
- Filtros y ordenamiento.
- Detalle de propiedad con galeria y datos principales.
- Formulario de contacto y CTA de reserva.

#### Reservas y pagos (MVP preparado)

- Crear reservacion desde sitio publico.
- Estados de reservacion (`pending`, `confirmed`, `cancelled`, `completed`).
- Integracion inicial con pasarela de pago:
  - Stripe
  - Mercado Pago
- Registro de transacciones y webhooks.
- Voucher de reservacion al confirmar pago.

#### Reseñas

- Reseña vinculada a reservacion completada.
- Moderacion basica por owner/staff autorizado.

#### Dashboard privado

- Vista de resumen con metricas.
- CRUD de propiedades.
- Gestion de leads y mensajes.
- Gestion de reservas y pagos.
- Gestion de reseñas.
- Gestion de usuarios staff (crear, editar permisos, desactivar).

#### Seguridad y auditoria

- Permisos por rol y por modulo.
- ActivityLog con before/after snapshot en cambios criticos.
- Panel oculto root para auditoria avanzada.

### 5.2 No incluye en MVP

- Multitenancy compartido en una sola base de datos.
- Marketplace comun entre clientes.
- Facturacion fiscal automatica avanzada.
- Integraciones CRM/ERP enterprise.

---

## 6. Modelo de Entrega SaaS

### 6.1 Producto de portafolio

- Esta instancia muestra capacidades base del producto.
- Sirve para ventas, demos y validacion rapida.

### 6.2 Instancia por cliente

- Cada cliente recibe un deploy aislado.
- Se permite personalizacion futura de branding:
  - Colores
  - Tipografias
  - Ajustes de layout

---

## 7. Metricas de Exito

### 7.1 Tecnicas

- Provisioning completo por cliente en < 2 horas.
- Errores criticos de permisos: 0 en produccion.
- Trazabilidad completa de acciones criticas: 100%.

### 7.2 Funcionales

- Creacion de reservacion de punta a punta sin friccion.
- Emision correcta de voucher al confirmar pago.
- Staff operando con permisos restringidos sin bloqueos.

### 7.3 Negocio

- Tiempo de entrega por cliente predecible.
- Capacidad de replicar modelo en multiples clientes.

---

## 8. Restricciones y Consideraciones

### 8.1 Tecnicas

- Backend Appwrite self-hosted.
- No mock data en flujos funcionales.
- Eventos criticos respaldados por Functions.

### 8.2 Seguridad

- Root no visible en listados ni UI publica.
- Auditoria obligatoria para acciones de alto impacto.
- Principio de minimo privilegio para staff.

### 8.3 Operacion

- Cada instancia debe tener su propio `.env` y secretos.
- No se comparten API keys ni credenciales entre clientes.

---

## 9. Roadmap de Alto Nivel

### Fase 0 (actual)

- Base funcional de propiedades, leads, reservas y roles.
- Auditoria root y panel oculto ActivityLog.

### Fase 1

- Mejoras de pagos (refunds, conciliacion avanzada).
- Plantillas de branding por cliente.
- Reporteria visual ampliada.

### Fase 2

- Automatizaciones comerciales.
- Integraciones externas (CRM, marketing, BI).

---

## 10. Criterios de Aceptacion del MVP

1. Se puede crear una nueva instancia de cliente aislada sin tocar datos de otras.
2. Owner puede crear usuarios staff y limitar accesos por modulo.
3. Visitante puede reservar desde pagina publica.
4. Pago exitoso confirma reservacion y genera voucher.
5. Root puede auditar cambios con detalle before/after.

---

## 11. Fuera de Alcance (Explicito)

- Mezclar multiples clientes en la misma base de datos.
- Exponer panel root al owner o staff.
- Permitir bypass de auditoria en acciones criticas.

---

Ultima actualizacion: 2026-02-10
Version: 2.0.0
