# create-newsletter-subscription-public

Registra suscripciones de newsletter desde el landing y guarda en
`marketing_newsletter_subscribers`.

## Name vs ID en Appwrite

- Nombre de function (display): `create-newsletter-subscription-public`.
- ID real de Appwrite Function (usado en ENV/SDK): `create-newsletter-subscription-publi`.
- Motivo: Appwrite limita `functionId` a maximo 36 caracteres.

## Contrato de ejecucion

- Tipo: HTTP Function publica.
- Metodo: `POST`.
- Permiso `execute`: `any`.

## Payload

```json
{
  "email": "juan@example.com",
  "name": "Juan Perez",
  "source": "landing_newsletter",
  "utmJson": {
    "utm_source": "footer"
  }
}
```

## Reglas

- Campo obligatorio: `email`.
- Si el email ya existe, reactiva el registro (`enabled=true`).
- Guarda `utmJson` serializado para analitica de marketing.
