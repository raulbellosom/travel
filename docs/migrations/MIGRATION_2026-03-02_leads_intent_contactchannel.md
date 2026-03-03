# Migration: Add `intent` and `contactChannel` to `leads`

**Fecha:** 2026-03-02  
**Colección:** `leads`  
**Prioridad:** Alta — el código ya escribe estos campos pero Appwrite los descarta silenciosamente.

---

## Contexto

El flow `create-lead` (function) y `Leads.jsx` (frontend) ya escriben y leen `intent` y `contactChannel` en la colección `leads`. Actualmente:

- `intent` se persiste solo dentro de `metaJson` (el atributo no existe).
- `contactChannel` se duplica a `source` como fallback (el atributo no existe).
- `leadsService.listMine()` hace try/catch para detectar que `contactChannel` no existe y fallback a `source`.

Esta migración crea ambos atributos + 3 índices pendientes, y luego backfills los leads existentes.

---

## Paso 1 — Crear atributos en Appwrite Console

### 1a. `contactChannel` (enum)

- **Collection:** `leads`
- **Key:** `contactChannel`
- **Type:** Enum
- **Elements:** `resource_chat`, `resource_cta_form`, `IN_PLATFORM`, `WHATSAPP`, `EMAIL`
- **Required:** No
- **Default:** `IN_PLATFORM`

### 1b. `intent` (enum)

- **Collection:** `leads`
- **Key:** `intent`
- **Type:** Enum
- **Elements:** `booking_request`, `booking_request_manual`, `visit_request`, `info_request`, `GENERAL_INQUIRY`, `SCHEDULE_MEETING`, `AVAILABILITY_INQUIRY`
- **Required:** No
- **Default:** `info_request`

---

## Paso 2 — Crear índices en Appwrite Console

| Index name                 | Type | Key(s)           |
| -------------------------- | ---- | ---------------- |
| `idx_leads_contactchannel` | key  | `contactChannel` |
| `idx_leads_intent`         | key  | `intent`         |
| `idx_leads_source`         | key  | `source`         |

---

## Paso 3 — Backfill leads existentes

Ejecutar desde Node.js con API key (funciones o script local):

```javascript
import { Client, Databases, Query } from "node-appwrite";

const client = new Client()
  .setEndpoint("https://appwrite.racoondevs.com/v1")
  .setProject("<PROJECT_ID>")
  .setKey("<API_KEY>");

const db = new Databases(client);
const DATABASE_ID = "main";
const LEADS_COLLECTION = "leads";

const CONTACT_CHANNEL_MAP = {
  authenticated_chat: "resource_chat",
  authenticated_form: "resource_cta_form",
  booking_flow: "IN_PLATFORM",
  manual_admin: "IN_PLATFORM",
  IN_PLATFORM: "IN_PLATFORM",
  WHATSAPP: "WHATSAPP",
  EMAIL: "EMAIL",
};

const VALID_INTENTS = new Set([
  "booking_request",
  "booking_request_manual",
  "visit_request",
  "info_request",
  "GENERAL_INQUIRY",
  "SCHEDULE_MEETING",
  "AVAILABILITY_INQUIRY",
]);

function extractIntentFromMeta(metaJson) {
  if (!metaJson) return "info_request";
  try {
    const meta = typeof metaJson === "string" ? JSON.parse(metaJson) : metaJson;
    // intent stored directly
    if (meta.intent && VALID_INTENTS.has(meta.intent)) return meta.intent;
    // infer from structure
    const visit = meta.visit || {};
    const booking = meta.booking || {};
    const slots = Array.isArray(visit.preferredSlots)
      ? visit.preferredSlots
      : [];
    if (slots.length > 0) return "visit_request";
    if (booking.startDate || booking.endDate || booking.guests)
      return "booking_request";
    return "info_request";
  } catch {
    return "info_request";
  }
}

async function backfill() {
  let cursor = undefined;
  let updated = 0;
  let total = 0;

  while (true) {
    const queries = [Query.limit(100), Query.equal("enabled", true)];
    if (cursor) queries.push(Query.cursorAfter(cursor));

    const response = await db.listDocuments(
      DATABASE_ID,
      LEADS_COLLECTION,
      queries,
    );
    if (response.documents.length === 0) break;

    for (const lead of response.documents) {
      total++;
      const patch = {};

      // Backfill contactChannel from source
      if (!lead.contactChannel) {
        patch.contactChannel =
          CONTACT_CHANNEL_MAP[lead.source] || "IN_PLATFORM";
      }

      // Backfill intent from metaJson
      if (!lead.intent) {
        patch.intent = extractIntentFromMeta(lead.metaJson);
      }

      if (Object.keys(patch).length > 0) {
        await db.updateDocument(DATABASE_ID, LEADS_COLLECTION, lead.$id, patch);
        updated++;
      }
    }

    cursor = response.documents[response.documents.length - 1].$id;
    console.log(`Processed ${total} leads, updated ${updated}...`);
  }

  console.log(`Done. Total: ${total}, Updated: ${updated}`);
}

backfill().catch(console.error);
```

---

## Paso 4 — Código ya actualizado

Los siguientes archivos se actualizaron como parte de esta migración:

- `src/services/leadsService.js` — limpiado fallback try/catch de `contactChannel`
- `src/services/globalSearchService.js` — campos legacy corregidos
- `src/features/global-search/searchSuggestions.js` — campos legacy corregidos
- `docs/core/03_appwrite_db_schema.md` — atributos e índices movidos a "deployed"

---

## Rollback

1. Eliminar índices `idx_leads_contactchannel`, `idx_leads_intent`, `idx_leads_source`.
2. Eliminar atributos `contactChannel`, `intent`.
3. Revertir commits de código (el fallback en leadsService seguirá funcionando sin el atributo).

---

## Verificación post-migración

1. Abrir Appwrite Console → `leads` → verificar que `contactChannel` e `intent` aparecen como atributos.
2. Crear un lead desde el frontend → verificar que tanto `contactChannel` como `intent` se persisten.
3. Filtrar leads por intent y por channel en `Leads.jsx` → debe funcionar sin fallback.
4. Buscar un lead en la búsqueda global → debe matchear por `lastMessage`.
