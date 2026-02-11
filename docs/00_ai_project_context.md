# 00_AI_PROJECT_CONTEXT - REAL ESTATE SAAS PLATFORM

## Proposito

Este documento define el contexto raiz del proyecto para personas y agentes AI.
Ningun documento en `docs/` debe contradecir estas reglas.

---

## 1. Vision General

Se construye una plataforma inmobiliaria SaaS bajo modelo **single-tenant por despliegue**:

- Este repositorio es la instancia demo/portafolio.
- Cada cliente recibe una instancia nueva y aislada.
- No se mezclan datos de diferentes clientes en una misma base de datos.

La plataforma incluye:

1. Sitio publico con catalogo.
2. Dashboard administrativo.
3. Reservas, pagos y vouchers.
4. Reseñas y gestion de leads.
5. Panel root oculto para auditoria avanzada.

---

## 2. Modelo de Negocio

Modelo: **productized SaaS delivery**.

- Se parte de una base comun reutilizable.
- Se provisiona una instancia exclusiva por cliente.
- Se permite personalizacion de branding por cliente en fases siguientes.

---

## 3. Principio de Diseno

### 3.1 Mobile-first

Todo flujo debe funcionar primero en mobile:

- catalogo
- detalle
- contacto
- reserva
- dashboard

Desktop es extension del flujo movil, no al reves.

### 3.2 Backend-first Security

- Frontend no decide seguridad.
- Permisos y validaciones viven en Appwrite + Functions.

---

## 4. Alcance Funcional Base

- CRUD de propiedades
- Lead capture (mensajes)
- Reservas
- Pagos online (Stripe/Mercado Pago)
- Voucher de reservacion
- Reviews moderables
- Dashboard con estadisticas
- Staff con accesos restringidos
- Root con auditoria completa

---

## 5. Stack Tecnologico (No Negociable)

### Frontend

- React + Vite
- JavaScript (sin TypeScript)
- TailwindCSS
- Arquitectura modular
- Sin mock/fake data en flujos reales

### Backend

- Appwrite self-hosted
- Auth, Databases, Storage, Functions, Messaging
- PostgreSQL como motor de DB

---

## 6. Reglas Arquitectonicas Absolutas

1. Single-tenant por instancia.
2. Datos reales siempre.
3. Sin secrets en repositorio.
4. Minimo privilegio por rol/scope.
5. Auditoria obligatoria en acciones criticas.

---

## 7. Seguridad y Roles

Roles de negocio:

- `root` (interno, oculto, acceso total)
- `owner` (dueno de la instancia cliente)
- `staff_manager`
- `staff_editor`
- `staff_support`
- `visitor`

Regla especial:

- Usuario `root` no debe listarse en UI operativa del cliente.

---

## 8. Auditoria (Obligatoria)

Debe existir `activity_logs` con minimo:

- actor
- fecha
- entidad
- accion
- before/after
- requestId

Debe existir panel oculto root (`/__root/activity`) para consulta.

---

## 9. Integraciones

Incluidas o preparadas:

- Stripe
- Mercado Pago
- SMTP
- WhatsApp (futuro)
- Maps (futuro)

---

## 10. Fases

### Fase 0

- Base operativa completa por instancia dedicada.
- Roles, reservas, pagos, vouchers y activity log.

### Fase 1

- Branding por cliente ampliado.
- Reporteria avanzada.
- Automatizaciones comerciales.

### Fase 2

- Integraciones CRM/ERP/BI segun cliente.

---

## 11. Restricciones

No permitido:

- TypeScript
- mock data en flujos productivos
- exponer root panel a owner/staff
- confirmar pagos solo con callback frontend

Permitido:

- Functions Appwrite en Node.js
- Validacion con zod/yup
- utilidades de fecha

---

## 12. Criterio de Calidad

- Documentacion sincronizada entre `02`, `03`, `05`, `06`, `07`, `08`.
- Smoke test por instancia nueva (propiedad, lead, reserva, pago, voucher, auditoria).
- Errores de permisos criticos: cero.

---

Ultima actualizacion: 2026-02-10
Version: 2.0.0
Autor: RacoonDevs
