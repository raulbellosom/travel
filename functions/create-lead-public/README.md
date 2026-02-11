# create-lead-public

Recibe leads desde formulario público y crea documento en la colección `leads`.

## Runtime

- Node.js >= 18
- node-appwrite >= 17

## Tipo

- HTTP endpoint (POST)

## Validaciones

- `propertyId`, `name`, `email`, `message` obligatorios
- Propiedad debe existir, estar `published` y `enabled=true`

## Variables de entorno

Ver `.env.example`.
