# Migration: Fix misnamed indexes in `reviews` and `activity_logs`

**Fecha:** 2026-03-03  
**Colecciones:** `reviews`, `activity_logs`  
**Prioridad:** Media — los indexes existen pero apuntan a la columna equivocada, causando indexes duplicados en `status`/`entityType` y ausencia de indexación en `rating`/`entityId`.

---

## Contexto

Al auditar los schemas de Appwrite contra la documentación se detectaron 2 indexes con nombres que no coinciden con la columna que indexan:

| Collection      | Index Name              | Debería indexar | Realmente indexa | Impacto                                            |
| --------------- | ----------------------- | --------------- | ---------------- | -------------------------------------------------- |
| `reviews`       | `idx_reviews_rating`    | `rating`        | `status`         | No hay index en `rating`; `status` duplicado       |
| `activity_logs` | `idx_activity_entityid` | `entityId`      | `entityType`     | No hay index en `entityId`; `entityType` duplicado |

---

## Paso 1 — Fix `idx_reviews_rating` en Appwrite Console

### 1a. Eliminar index actual

1. Ir a **Appwrite Console → Databases → main → reviews → Indexes**
2. Localizar `idx_reviews_rating` (actualmente indexa `status`)
3. **Eliminar** el index

### 1b. Recrear index correcto

1. En la misma sección de Indexes, crear nuevo:
   - **Key:** `idx_reviews_rating`
   - **Type:** Key
   - **Attributes:** `rating`
   - **Order:** ASC

### Verificación

```
Indexes en reviews después del fix:
  idx_reviews_resourceid   → resourceId   ✓
  idx_reviews_authoruserid → authorUserId  ✓
  idx_reviews_status       → status        ✓
  idx_reviews_rating       → rating        ✓ (corregido)
  idx_reviews_createdat    → $createdAt    ✓
```

---

## Paso 2 — Fix `idx_activity_entityid` en Appwrite Console

### 2a. Eliminar index actual

1. Ir a **Appwrite Console → Databases → main → activity_logs → Indexes**
2. Localizar `idx_activity_entityid` (actualmente indexa `entityType`)
3. **Eliminar** el index

### 2b. Recrear index correcto

1. En la misma sección de Indexes, crear nuevo:
   - **Key:** `idx_activity_entityid`
   - **Type:** Key
   - **Attributes:** `entityId`
   - **Order:** ASC

### Verificación

```
Indexes en activity_logs después del fix:
  idx_activity_actoruserid → actorUserId              ✓
  idx_activity_entitytype  → entityType               ✓
  idx_activity_entityid    → entityId                  ✓ (corregido)
  idx_activity_action      → action                    ✓
  idx_activity_severity    → severity                  ✓
  idx_activity_createdat   → $createdAt                ✓
  idx_activity_entitydate  → entityType, $createdAt    ✓
```

---

## Paso 3 — Actualizar documentación

Una vez aplicados los fixes en Appwrite Console, actualizar `docs/core/03_appwrite_db_schema.md`:

1. **reviews** — cambiar `idx_reviews_rating` para que diga `rating` ↑ y quitar la nota ⚠️
2. **activity_logs** — cambiar `idx_activity_entityid` para que diga `entityId` ↑ y quitar la nota ⚠️

---

## Rollback

Si algo sale mal:

- Eliminar el index recién creado
- Recrear con la configuración anterior (apuntando a `status` / `entityType` respectivamente)
- No hay impacto en datos — los indexes solo afectan rendimiento de queries

---

## Impacto esperado

- **reviews**: queries por `rating` (score ranking) serán indexadas. Antes recorrían full scan.
- **activity_logs**: queries por `entityId` (entity lookup) serán indexadas. El index compuesto `idx_activity_entitydate` ya cubre `entityType` así que el duplicado no causa daño al eliminarse.
