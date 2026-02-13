# create-lead-public

Recibe leads desde formulario publico y crea documento en `leads`.

## Contrato de ejecucion

- Tipo: HTTP Function publica.
- Trigger Appwrite: invocacion directa de la function `create-lead-public`.
- Metodo: `POST`.
- Permiso `execute`: `any`.
- Scope/rol de actor: no requiere usuario autenticado.

## Scopes minimos de API key

- `databases.read`
- `databases.write`

## Payload

```json
{
  "propertyId": "PROPERTY_ID",
  "name": "Juan Perez",
  "email": "juan@example.com",
  "phone": "+5215512345678",
  "message": "Estoy interesado en esta propiedad"
}
```

## Reglas clave

- `propertyId`, `name`, `email`, `message` son obligatorios.
- La propiedad debe estar `status=published` y `enabled=true`.
