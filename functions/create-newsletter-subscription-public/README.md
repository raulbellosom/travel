# create-newsletter-subscription-public

Registra suscripciones del newsletter desde el footer del CRM Landing.

## Contrato de ejecucion

- Tipo: HTTP Function publica.
- Metodo: `POST`.
- Permiso `execute`: `any`.

## Payload

```json
{
  "email": "juan@example.com",
  "locale": "es",
  "source": "crm_landing_footer"
}
```

## Reglas

- Campo obligatorio: `email`.
- Si el email ya existe, reactiva suscripcion (`status=subscribed`).
- Guarda en `newsletter_subscribers`.
