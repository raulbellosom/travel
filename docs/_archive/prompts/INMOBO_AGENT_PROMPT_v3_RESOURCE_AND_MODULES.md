# INMOBO --- PROMPT MAESTRO PARA CODEX (VS Code Agent Mode) (v3)

## Refactor a arquitectura **Resource** + sistema **Módulos/Features** controlado por **ROOT**

**Fecha:** 2026-02-18

> Este prompt está pensado para ejecutarse con **Codex / Agent Mode**
> dentro del repo del proyecto INMOBO. El objetivo es que el agente
> **actualice el proyecto completo** (docs + frontend + functions +
> schema Appwrite) para soportar una arquitectura universal tipo
> marketplace y un sistema de módulos vendibles por plan.

------------------------------------------------------------------------

# 0) REGLAS DE TRABAJO (OBLIGATORIAS)

1.  **Lee y entiende TODO** antes de modificar:
    -   `00_ai_project_context.md`
    -   `00_project_brief.md`
    -   `01_frontend_requirements.md`
    -   `02_backend_appwrite_requirements.md`
    -   `03_appwrite_db_schema.md`
    -   `04_design_system_mobile_first.md`
    -   `05_permissions_and_roles.md`
    -   `06_appwrite_functions_catalog.md`
    -   `07_frontend_routes_and_flows.md`
    -   `08_env_reference.md`
    -   `09_agent_usage_guide.md`
    -   `10_master_plan_checklist.md`
    -   `11_schema_mapping_matrix.md`
    -   `12_env_traceability_matrix.md`
    -   `13_chat_messaging_schema.md`
2.  **No TypeScript.** Todo se mantiene en **JavaScript**.
3.  **No rompas producción:** aplica estrategia de migración progresiva
    (compatibilidad temporal).
4.  **Frontend no es seguridad:** todas las restricciones críticas deben
    validarse en Functions y/o permisos Appwrite.
5.  **No inventes archivos** que no existen. Si necesitas crear algo,
    justifica y mantén el estilo del repo.
6.  Toda mutación importante debe generar **activity log** (como ya lo
    exige la documentación).
7.  Mantén SEO y rutas públicas existentes (ej. `/propiedades/:slug`)
    aunque por debajo se mapee a resources.

------------------------------------------------------------------------

# 1) CONTEXTO ACTUAL (RESUMEN PARA ORIENTARTE)

El sistema actual está centrado en **properties** y maneja: -
`operationType`: `sale`, `rent`, `vacation_rental` (ver
`07_frontend_routes_and_flows.md`) - `propertyType`: `house`,
`apartment`, `land`, `commercial`, `office`, `warehouse` (ver
`11_schema_mapping_matrix.md`) - Reservas + pagos + vouchers para
`vacation_rental` - Leads y chat (conversations/messages) ligados a
`propertyId` (ver `13_chat_messaging_schema.md`) - Roles: `root`,
`owner`, `staff_manager`, `staff_editor`, `staff_support`, `client` (ver
`11_schema_mapping_matrix.md`)

El negocio quiere evolucionar a: - 3 modalidades principales: **renta**,
**renta vacacional**, **venta** - y preparar el camino a futuro para
**servicios** y otras verticales - además: el usuario **ROOT** debe
poder habilitar/deshabilitar **módulos y features** (planes y add-ons).

------------------------------------------------------------------------

# 2) OBJETIVO FINAL (QUÉ DEBE QUEDAR LISTO)

## 2.1 Arquitectura universal "Resource"

El sistema ya no debe estar acoplado a "property" como entidad única.
Debe soportar recursos comercializables de distintas categorías:

-   Property (inmuebles)
-   Service (servicios, ej. limpieza, DJ, chef)
-   Vehicle (futuro)
-   Experience (futuro)
-   Venue (salón de eventos como recurso reservable)

## 2.2 Sistema de Módulos/Features (SaaS modular)

ROOT debe poder: - Activar/desactivar módulos por instancia (esta app es
**single-tenant por instancia**, ver `00_project_brief.md`). - Definir
límites por plan (ej: max anuncios publicados, max staff, etc.) - Forzar
gating: si el módulo está desactivado, debe bloquear UI y backend.

------------------------------------------------------------------------

# 3) DISEÑO PROPUESTO (CANÓNICO) --- NUEVO MODELO

## 3.1 Resource (reemplazo conceptual de Property)

Introduce el concepto `resource` como entidad principal.

### Campos core nuevos (mínimos):

-   `resourceType` (enum):
    -   `property`
    -   `service`
    -   `music`
    -   `vehicle` (futuro)
    -   `experience` (futuro)
    -   `venue` (opcional: si prefieres, puede ser `property` con
        `category=event_hall`)
-   `category` (enum o string controlado)\
    Ejemplos: `house`, `apartment`, `land`, `event_hall`,
    `commercial_local`, `office`, `warehouse`, `cleaning`, `chef`, `dj`, `banda`, `mariachi`, `corridos_tumbados`.
-   `commercialMode` (enum):
    -   `sale`
    -   `rent_long_term`
    -   `rent_short_term` (equivale a vacacional)
    -   `rent_hourly` (salón por horas / servicios por horas)
-   `pricingModel` (enum):
    -   `total`
    -   `per_month`
    -   `per_night`
    -   `per_day`
    -   `per_hour`
    -   `per_person`
    -   `per_event`
    -   `per_m2`
-   `bookingType` (enum):
    -   `manual_contact` (venta y rentas sin pagos)
    -   `date_range` (vacacional y/o renta por días)
    -   `time_slot` (por horas)
    -   `fixed_event` (por evento/turno)
-   `attributes` (string JSON) → **extensible** por tipo, evita columnas
    infinitas.

> Importante: Mantén los campos actuales de `properties` durante la
> transición, pero el target final es `resources`.

## 3.2 Rate Plans (pricing)

Unifica precios en una capa tipo `rate_plans` para recursos.

-   `basePrice`
-   `currency`
-   `pricingModel`
-   reglas: `minStay`, `maxStay`, depósitos, fees, taxes... (lo que ya
    manejas, reusa lo existente).

## 3.3 Booking config / Policies

Define reglas de reserva / cancelación / depósitos en entidades
separadas o dentro de un JSON, manteniendo el estándar de docs.

------------------------------------------------------------------------

# 4) SISTEMA DE MÓDULOS (FEATURE GATING) --- DISEÑO CANÓNICO

> Dado que este proyecto es **single-tenant por instancia** (una
> instancia Appwrite por cliente), el gating se maneja **a nivel
> instancia**, no por orgId.

## 4.1 Colección nueva: `instance_settings` (RECOMENDADA)

Crea una colección con **1 documento** principal por instancia (id fijo
o `key="main"`).

Campos sugeridos: - `key` (string, unique) → `"main"` - `planKey`
(string) → `"starter" | "pro" | "elite" | "custom"` - `enabledModules`
(string\[\]) → lista de keys - `limits` (string JSON) → ejemplo:
`json   {     "maxPublishedResources": 50,     "maxStaffUsers": 5,     "maxActiveReservationsPerMonth": 200   }` -
`createdAt`, `updatedAt`, `enabled` (si tu patrón lo exige)

### Módulos (keys) sugeridos (mínimo viable)

**Core** - `module.resources` (anuncios / recursos) - `module.leads` -
`module.staff` - `module.analytics.basic`

**Booking/Pagos** - `module.booking.long_term` -
`module.booking.short_term` (vacacional) - `module.booking.hourly` -
`module.payments.online` (Stripe/MercadoPago)

**Extras** - `module.messaging.realtime` (chat) - `module.reviews` -
`module.calendar.advanced`

## 4.2 Hook frontend: `useInstanceModules()`

Debe: - Leer `instance_settings` - Exponer helpers: -
`isEnabled(moduleKey)` - `getLimit(limitKey)` -
`assertEnabled(moduleKey)` para UI

## 4.3 Enforcement backend (OBLIGATORIO)

Todas las functions críticas deben validar: - Si el módulo requerido
está habilitado - Si no se exceden límites (si aplica)

Implementa helper compartido para functions: -
`assertModuleEnabled(moduleKey)` -
`assertLimitNotExceeded(limitKey, currentValue)`

Respuesta estándar si bloquea: - HTTP 403 - JSON:
`json   {     "error": "MODULE_DISABLED",     "moduleKey": "module.booking.short_term",     "message": "Este módulo no está habilitado para esta instancia."   }`

## 4.4 UI Root: Módulo de administración de features

ROOT debe tener rutas y screens internas (no visibles a owner/staff):

-   `/app/root/instance` (settings generales)
-   `/app/root/modules` (toggle de módulos + límites + planKey)

Este módulo debe: - Listar enabledModules - Permitir toggle (solo
ROOT) - Editar limits (solo ROOT) - Registrar activity logs

------------------------------------------------------------------------

# 5) CAMBIOS CONCRETOS QUE DEBES HACER (PLAN DE EJECUCIÓN)

## 5.1 Paso A --- Inventario de referencias en código

Haz un "global search" y genera una lista de archivos donde aparezca: -
`properties` - `operationType` - `propertyType` - `propertyId` - rutas
`/propiedades/` - services/hook names relacionados

Entrega (en commit) un documento `docs/14_migration_inventory.md` con: -
archivo → patrón → acción (replace / adapt / deprecate)

## 5.2 Paso B --- Actualizar schema canónico (docs + Appwrite)

1)  Actualiza `03_appwrite_db_schema.md`:
    -   Introduce colecciones nuevas:
        -   `resources` (nueva canónica)
        -   `resource_images` o reusa `property_images` renombrando
            (según tu estado actual)
        -   `rate_plans` para resources (o mapea las existentes)
        -   `instance_settings` (nuevo)
    -   Mantén colecciones legacy `properties` **marcadas como
        DEPRECATE** hasta completar migración.
2)  Actualiza `11_schema_mapping_matrix.md` agregando:
    -   `properties → resources` mapping
    -   `operationType → commercialMode`
    -   `propertyType → category`
    -   `conversations.propertyId → conversations.resourceId`
    -   `messages` si referencia property
3)  Actualiza `13_chat_messaging_schema.md`:
    -   `propertyId` pasa a `resourceId`
    -   campos denormalizados `propertyTitle` → `resourceTitle`
    -   asegúrate de que el flujo lead+chat siga funcionando

## 5.3 Paso C --- Backend: Functions (refactor sin romper)

Revisa `06_appwrite_functions_catalog.md` y actualiza las functions
que: - crean/actualizan propiedades - crean leads - crean
reservas/pagos - manejan moderación/auditoría - chat si existe function

### Acciones:

-   Introduce `services/modulesService.js` (backend helper) o `lib/`
    dentro de functions para:
    -   leer `instance_settings`
    -   validar módulo habilitado
    -   validar límites
-   Modifica functions clave para operar con `resources`:
    -   create/update/publish resource
    -   create-lead-public: guardar lead con `resourceId`
    -   create-reservation-public: depende del modo:
        -   `sale` + `rent_long_term` → **manual_contact** (sin pagos)
        -   `rent_short_term` + `rent_hourly` → requieren módulo de
            booking correspondiente
    -   availability/pricing quote deben usar `rate_plans`

### Compatibilidad temporal:

-   Si existe `properties`, agrega un adaptador:
    -   al leer, si llega `propertyId`, resuelve a `resourceId`
    -   o crea mirror update (solo durante migración)

## 5.4 Paso D --- Frontend: Migración de UI (rutas y forms)

Objetivo: UI deje de pensar en operationType/propertyType y piense en
behavior.

### D.1 Mantener rutas públicas

No rompas `/propiedades/:slug`. Internamente: - cargar `resource` por
slug - renderizar en base a `commercialMode` y `bookingType`

### D.2 Refactor de formulario de creación/edición

-   reemplazar lógica actual de tabs estáticos por:
    1)  Selección de `resourceType`, `category`, `commercialMode`
    2)  Render dinámico de campos según `resourceSchema`
    3)  Sección de pricing según `pricingModel`
    4)  Sección booking si `bookingType` != manual_contact
    5)  Amenidades/Media
-   agrega gating por módulos:
    -   si `module.booking.short_term` disabled, no mostrar "Renta
        vacacional" como opción
    -   si `module.booking.hourly` disabled, no mostrar "Por horas"

### D.3 Calcular "behavior config" en un solo lugar

Crea helper: - `getResourceBehavior(resourceDraftOrDoc)`

Devuelve: - `requiresCalendar` - `requiresPayments` -
`allowedPricingModels` - `ctaType` (contact / book) - `priceLabel` (por
noche / mensual / total / por hora)

y úsalo en: - detalle público - wizard/form - cards del catálogo -
dashboard list

## 5.5 Paso E --- Root Module UI

Crear screens y navegación solo para ROOT:

-   `RootModulesPage.jsx` (o equivalente)
-   service frontend `instanceSettingsService.js`
-   guards ya existen (`RootRoute` según docs), úsalo

Requisitos: - UI para toggles - UI para límites (inputs number) -
guardar cambios en Appwrite (collection `instance_settings`) - activity
log por cambio

------------------------------------------------------------------------

# 6) ESPECIFICACIONES DE COMPORTAMIENTO (CASOS IMPORTANTES)

## 6.1 Venta

-   `commercialMode = sale`
-   `bookingType = manual_contact`
-   No pagos online
-   CTA: "Agendar visita" o "Solicitar información"
-   Puede generar lead y conversación (si messaging enabled)

## 6.2 Renta largo plazo

-   `commercialMode = rent_long_term`
-   `bookingType = manual_contact` (por ahora)
-   No calendario público de disponibilidad (opcional futuro)
-   Puede tener "periodo" (weekly/monthly/yearly) → esto se vuelve parte
    de `pricingModel=per_month` o `attributes`

## 6.3 Renta vacacional

-   `commercialMode = rent_short_term`
-   `bookingType = date_range`
-   Requiere:
    -   `module.booking.short_term`
    -   si pagos: `module.payments.online`
-   calendario + pricing quote + reserva + pago + voucher

## 6.4 Renta por horas (salón / servicios)

-   `commercialMode = rent_hourly`
-   `bookingType = time_slot` o `fixed_event`
-   Requiere:
    -   `module.booking.hourly`
    -   si pagos: `module.payments.online`
-   UI de slots y buffer time

------------------------------------------------------------------------

# 7) QA / PRUEBAS MÍNIMAS (NO NEGOCIABLE)

Al finalizar, debe existir un checklist en `10_master_plan_checklist.md`
actualizado con pruebas manuales:

1)  Crear resource tipo "Casa" en modo venta → se publica → detalle
    muestra CTA de contacto
2)  Crear resource tipo "Casa" en renta largo plazo → CTA contacto, sin
    calendario
3)  Crear resource tipo "Casa" en renta vacacional → requiere módulos;
    calendario + checkout + pago
4)  Si `module.booking.short_term` OFF → UI oculta opción vacacional y
    backend bloquea create/update
5)  ROOT puede activar módulos y guardar límites
6)  Activity logs registran cambios críticos (root y owner)
7)  Chat: lead + conversación ahora usa `resourceId` (si módulo
    messaging ON)

------------------------------------------------------------------------

# 8) ENTREGABLES (LO QUE DEBES CAMBIAR / CREAR)

## Docs

-   Actualizar:
    -   `02_backend_appwrite_requirements.md`
    -   `03_appwrite_db_schema.md`
    -   `05_permissions_and_roles.md`
    -   `06_appwrite_functions_catalog.md`
    -   `07_frontend_routes_and_flows.md`
    -   `10_master_plan_checklist.md`
    -   `11_schema_mapping_matrix.md`
    -   `13_chat_messaging_schema.md`
-   Crear:
    -   `14_resource_architecture_spec.md` (explica resources +
        pricing + booking)
    -   `15_module_system_spec.md` (explica instance_settings + gating +
        root UI)
    -   `16_migration_plan_resources.md` (pasos, riesgos, rollback)

## Código

-   Frontend:
    -   Servicios y hooks para instance_settings/modules
    -   Refactor de pages/components que dependían de `properties`
-   Functions:
    -   Helpers de modules/limits
    -   Refactor de create/update/publish
    -   Refactor lead/reservation/pricing/availability
-   Schema:
    -   Instrucciones de consola Appwrite para agregar
        colecciones/atributos necesarios

------------------------------------------------------------------------

# 9) NOTAS IMPORTANTES (NO TE EQUIVOQUES AQUÍ)

-   Este repo es single-tenant por instancia: no inventes "orgs" si no
    existen en el schema actual.
-   **Módulos deben existir aunque el tenant sea único**, porque el
    objetivo es vender planes (starter/pro/elite).
-   Nunca confíes solo en UI para bloquear; **Functions deben validar**.
-   Mantén naming canónico consistente con tu estilo (ver convenciones
    en `03_appwrite_db_schema.md`).

------------------------------------------------------------------------

# 10) INSTRUCCIÓN FINAL PARA EL AGENTE

Ejecuta este trabajo como una serie de commits pequeños:

1)  Docs + schema changes (sin tocar UI)
2)  instance_settings + root module UI (mínimo)
3)  resources + mapping layer (sin eliminar properties)
4)  Refactor frontend a resources
5)  Refactor functions a resources + gating
6)  Actualizar chat a resourceId
7)  Cleanup + checklist QA

En cada commit: - actualiza matrices (11, 12) - evita romper build -
mantiene lint

------------------------------------------------------------------------

**FIN DEL PROMPT v3**
