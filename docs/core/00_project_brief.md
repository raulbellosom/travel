# 00_PROJECT_BRIEF - RESOURCE + CRM MODES

## Documento base

Este documento define alcance de negocio y funcional a nivel alto.
Reglas tecnicas detalladas viven en `docs/core/*`.

## 1. Vision

Se ofrece una plataforma tipo productized service con instancias dedicadas.
Este repo es una base/demo; cada cliente se despliega de forma aislada.

## 2. Modelo de superficie del producto

1. CRM marketing landing para venta del servicio.
2. Admin panel del cliente despues de compra.
3. Landing de recursos/ads del cliente (marketplace publico para explorar).

Cuando una instancia opera en modo plataforma, la landing CRM deja de ser la superficie principal.

## 3. Publico vs interaccion

- Publico sin login: puede explorar recursos.
- Interacciones de recursos requieren login:
  - contacto
  - chat
  - favoritos
  - intencion de reserva
  - creacion de leads/mensajes

Regla clave:

- Formularios de marketing (contacto/newsletter CRM) solo aplican a marketing.
- No se mezclan con operaciones de recursos.

## 4. Usuarios

- `owner`: responsable del negocio en su instancia.
- `staff_*`: operacion interna con permisos por modulo.
- `client`: usuario final autenticado.
- `visitor`: usuario publico de navegacion.
- `root`: operador interno del proveedor.

## 5. Objetivo MVP

- Catalogo publico de recursos.
- Contacto/chat/reserva autenticados.
- Reservas, pagos y vouchers.
- Dashboard privado con gestion y auditoria.

## 6. Restricciones de negocio

- No multicliente en la misma DB.
- No bypass de permisos o auditoria.
- No exposicion de panel root a roles del cliente.

---

Last update: 2026-03-02
Version: 3.0.0
