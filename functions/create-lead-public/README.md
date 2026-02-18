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
  "resourceId": "RESOURCE_ID",
  "name": "Juan Perez",
  "email": "juan@example.com",
  "phone": "+5215512345678",
  "message": "Estoy interesado en este recurso"
}
```

## Reglas clave

- `resourceId`, `name`, `email`, `message` son obligatorios.
- El recurso debe estar `status=published` y `enabled=true`.

