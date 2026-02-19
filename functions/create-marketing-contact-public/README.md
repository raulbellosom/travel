# create-marketing-contact-public

Recibe formularios de contacto del CRM Landing y guarda el registro en `marketing_contacts`.

## Contrato de ejecucion

- Tipo: HTTP Function publica.
- Metodo: `POST`.
- Permiso `execute`: `any`.

## Payload

```json
{
  "name": "Juan",
  "lastName": "Perez",
  "email": "juan@example.com",
  "phone": "+5215512345678",
  "message": "Quiero una demo",
  "locale": "es",
  "source": "crm_landing_contact"
}
```

## Reglas

- Campos obligatorios: `name`, `email`, `message`.
- Crea documento en `marketing_contacts` con `status=new`.
- Intenta enviar notificacion por SMTP a `PLATFORM_OWNER_EMAIL`.
