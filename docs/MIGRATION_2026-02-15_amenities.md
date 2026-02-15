# Migration: Simplificar Amenities a Array Simple

**Fecha:** 2026-02-15  
**Versión Schema:** 2.5  
**Prioridad:** Alta - Requerido para filtros de amenidades en Home

---

## Contexto

El frontend necesita filtrar propiedades por amenidades (ejemplo: "Propiedades con Alberca", "Vista al Mar").

Anteriormente teníamos una tabla junction `property_amenities` (many-to-many). Como **Appwrite NO soporta JOINs**, no podíamos filtrar eficientemente con esta estructura.

**Decisión:** Simplificar eliminando `property_amenities` y usar solo un array `amenities: string[]` en la colección `properties`.

**Ventajas:**

- ✅ Sin redundancia (una sola fuente de verdad)
- ✅ Sin necesidad de sincronización
- ✅ Filtros directos con `Query.contains()`
- ✅ Código más simple

---

## Cambios en el Schema

### Campo agregado a `properties`

| Atributo    | Tipo       | Size | Requerido | Default | Notas                                 |
| ----------- | ---------- | ---- | --------- | ------- | ------------------------------------- |
| `amenities` | `string[]` | 64   | No        | -       | Array de slugs: ["pool", "wifi", ...] |

### Índice agregado

| Nombre                     | Tipo  | Atributos   | Notas                 |
| -------------------------- | ----- | ----------- | --------------------- |
| `idx_properties_amenities` | index | `amenities` | Filtro por amenidades |

### Colección eliminada

- `property_amenities` (eliminada completamente)

---

## Pasos Manuales en Appwrite Console

### 1. Migrar datos existentes (si tienes propiedades con amenidades)

**IMPORTANTE:** Haz esto ANTES de eliminar `property_amenities`

Ejecuta un script que:

1. Consulte todas las propiedades
2. Para cada propiedad, consulte sus amenidades en `property_amenities`
3. Extraiga los slugs desde la tabla `amenities`
4. Actualice `properties.amenities` con el array de slugs

**Ejemplo de código de migración:**

```javascript
// Migración temporal - ejecutar una vez
const properties = await databases.listDocuments("main_db", "properties");

for (const property of properties.documents) {
  // Buscar amenidades de esta propiedad
  const propAmenities = await databases.listDocuments(
    "main_db",
    "property_amenities",
    [Query.equal("propertyId", property.$id)],
  );

  // Extraer slugs de amenidades
  const amenitySlugs = [];
  for (const pa of propAmenities.documents) {
    const amenity = await databases.getDocument(
      "main_db",
      "amenities",
      pa.amenityId,
    );
    amenitySlugs.push(amenity.slug);
  }

  // Actualizar property con array de slugs
  await databases.updateDocument("main_db", "properties", property.$id, {
    amenities: amenitySlugs,
  });
}
```

### 2. Agregar el atributo `amenities`

1. Ir a **Appwrite Console** → Tu Proyecto → **Databases** → `main_db` → Colección `properties`
2. Click en **"Attributes"** → **"Add Attribute"**
3. Seleccionar tipo **"String"**
4. Configurar:
   - **Attribute Key:** `amenities`
   - **Size:** `64`
   - **Required:** `No` (dejar sin marcar)
   - **Array:** `Yes` ✅ (IMPORTANTE: marcar esta opción)
   - **Default:** dejar vacío
5. Click **"Create"**
6. Esperar a que el atributo se cree (puede tomar unos segundos)

### 2. Crear el índice

1. En la misma colección `properties`, ir a tab **"Indexes"**
2. Click **"Add Index"**
3. Configurar:
   - **Index Key:** `idx_properties_amenities`
   - **Type:** `index` (no fulltext)
   - **Attributes:** Seleccionar `amenities`
   - **Order:** Puede dejarse por defecto
4. Click **"Create"**

### 3. Eliminar la colección `property_amenities`

**IMPORTANTE:** Solo después de migrar los datos existentes (paso 1)

1. En Appwrite Console → Databases → `main_db` → Colección `property_amenities`
2. Click en **"Settings"** tab
3. Scroll hasta abajo → **"Delete Collection"**
4. Confirmar eliminación

---

## Cambios en el código del wizard/forms

Necesitarás actualizar el código que crea/edita propiedades para guardar directamente en el array:

**Antes (con property_amenities):**

```javascript
// Crear registros en property_amenities
for (const amenityId of selectedAmenities) {
  await databases.createDocument("main_db", "property_amenities", {
    propertyId: newProperty.$id,
    amenityId: amenityId,
  });
}
```

**Después (con array):**

```javascript
// Guardar directamente slugs en el array
const amenitySlugs = selectedAmenities.map((a) => a.slug); // o ya tienes los slugs
await databases.createDocument("main_db", "properties", ID.unique(), {
  // ... otros campos
  amenities: amenitySlugs, // ["pool", "wifi", "parking"]
});
```

**Para edición:**

```javascript
// Actualizar simplemente el array completo
await databases.updateDocument("main_db", "properties", propertyId, {
  amenities: newAmenitySlugs,
});
```

---

## Uso en el código (ya implementado)

El código de filtros ya está listo en `propertiesService.js`:

```javascript
// src/services/propertiesService.js (líneas 218-226)
if (filters.amenities && Array.isArray(filters.amenities)) {
  filters.amenities.forEach((amenity) => {
    queries.push(Query.contains("amenities", String(amenity).trim()));
  });
}
```

```javascript
// src/pages/Home.jsx - Secciones ya implementadas
<PropertyGridSection
  title="Propiedades con Alberca"
  filters={{ amenities: ["pool"] }}
  limit={3}
/>
```

---

## Verificación

Para verificar que funciona:

1. ✅ Agregar campo `amenities` en Appwrite Console
2. ✅ Crear índice `idx_properties_amenities`
3. ✅ Migrar datos existentes (si los hay)
4. ✅ Eliminar colección `property_amenities`
5. ✅ Actualizar wizard/forms para usar array
6. ✅ Crear una propiedad de prueba con amenidades: `["pool", "wifi"]`
7. ✅ Recargar Home - debe mostrar secciones sin errores 400
8. ✅ Revisar Network tab - el request debe incluir los filtros correctamente

---

## Archivos a revisar para actualizar

Busca referencias a `property_amenities` en el código:

- `src/pages/dashboard/properties/**` - Forms de creación/edición
- `src/components/**` - Componentes relacionados con amenidades
- `src/services/**` - Servicios que consulten property_amenities

---

## Rollback

Si necesitas revertir:

1. Recrear colección `property_amenities` en Appwrite
2. Eliminar campo `amenities` y su índice de `properties`
3. Revertir cambios al wizard/forms
4. Comentar líneas 218-226 en `src/services/propertiesService.js`
5. Revertir secciones de amenidades en `src/pages/Home.jsx`

---

**Siguiente paso:** Buscar y actualizar wizard/forms para usar el array directamente.

Verifica en [03_appwrite_db_schema.md](./03_appwrite_db_schema.md) la migración completa.
