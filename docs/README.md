
# Sayulita Travel · Fase 0 (Appwrite)

Este paquete te guía para levantar el **núcleo** del backend estilo Airbnb sobre Appwrite.

## 0) Requisitos
- Appwrite en tu servidor (ya listo ✅)
- Appwrite CLI en tu máquina de trabajo
- Llave API con permisos de **Projects, Databases, Functions, Messaging, Storage**

## 1) Qué vamos a crear
- **Database `travel`** con colecciones base
- **Storage buckets**: `media`, `docs`
- **Messaging**: plantillas mínimas
- **Functions** (stubs): `availability-check`, `pricing-quote`, `booking-create-hold`

## 2) Estructuras de colecciones (fase 0)
Consulta `collections_phase0.json` para ver atributos sugeridos, tipos y campos obligatorios. Úsalo como guía al crear las colecciones desde el panel o con Appwrite CLI.

## 3) Orden recomendado
1. **Teams (Partners)**: un Team por organización (partner).  
2. **Database**: crear DB `travel`.  
3. **Colecciones** (en este orden):  
   `users_profile` → `orgs` → `org_members` → `listings` → `listing_units` → `rate_plans` → `inventory_calendar` → `booking_policies` → `bookings` → `conversations` → `messages`.  
4. **Storage**: buckets `media` (público lectura) y `docs` (privado).  
5. **Messaging**: cargar plantillas mínimas (`emails/`).  
6. **Functions**: deploy de los stubs y setear variables de entorno.  

## 4) Permisos (patrón)
- `listings`: lectura pública solo si `status=active`; escritura `team:{orgTeamId}` y admin.  
- `bookings`: lectura `guestId`, `team:{orgTeamId}`, admin; escritura por funciones y dueños según estado.  
- `messages`: `participants[]` únicamente.  

## 5) Functions (stubs)
- `functions/availability-check/` → valida disponibilidad a partir de `inventory_calendar`.  
- `functions/pricing-quote/` → devuelve desglose: precio base + fees + impuestos + descuentos.  
- `functions/booking-create-hold/` → crea booking en `hold` con TTL corto.  

Cada carpeta incluye `index.js` y `package.json` de ejemplo.

## 6) Próximos pasos
- Implementar webhooks de pagos (`payments:webhook`)
- Indexación de búsqueda (Typesense/OpenSearch)
- Notificaciones (Messaging) y Realtime channels

---

> Sugerencia: empieza creando **solo** `users_profile`, `orgs`, `org_members`, `listings`, `listing_units` y `rate_plans`. Con eso ya puedes publicar anuncios y cotizar precios.
