# create-marketing-contact-public

Recibe formularios de contacto del CRM landing y guarda el registro en
`marketing_contact_requests`.

## Contrato de ejecucion

- Tipo: HTTP Function publica.
- Metodo: `POST`.
- Permiso `execute`: `any`.

## Payload

```json
{
  "firstName": "Juan",
  "lastName": "Perez",
  "email": "juan@example.com",
  "phone": "+52 123 123 1234",
  "message": "Quiero una demo",
  "source": "landing_contact",
  "utmJson": {
    "utm_source": "google",
    "utm_campaign": "brand"
  }
}
```

## Reglas

- Campos obligatorios: `firstName`, `lastName`, `email`, `message`.
- `firstName` y `lastName`: maximo 60 caracteres cada uno.
- `phone` es opcional, pero cuando se envia debe cumplir regex:
  `^\+52 \d{3} \d{3} \d{4}$`.
- Si `phone` llega sin formato, la function intenta normalizarlo a
  `+52 123 123 1234` antes de validar.
- Crea documento en `marketing_contact_requests`.
- Guarda `utmJson` serializado para analitica de marketing.
- Intenta enviar notificacion por SMTP a `PLATFORM_OWNER_EMAIL`.
