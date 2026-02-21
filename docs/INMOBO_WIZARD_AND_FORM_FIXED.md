# Codex Agent Prompt — Fix Wizard de creación de Resource (antes Properties)

You are a senior full-stack engineer specialized in real-estate marketplaces (Airbnb-like) and multi-vertical booking products (properties, vehicles, services, experiences, venues). You will work directly inside this repository and implement the fixes described below **end-to-end** (UI + logic + validation + docs).  
IMPORTANT: The product is multi-language, but primarily Spanish. Use UTF-8 and keep accents and “ñ”. Update i18n keys/texts accordingly.

## Context

We currently have a dynamic wizard used for creating and editing resources via:

- `/app/properties/new` (CreateProperty → PropertyWizard)
- `/app/properties/:id/edit` (EditProperty using same dynamic engine)
  Even though the route says “properties”, it actually supports multiple `resourceType` profiles.

There is an auto-generated file with the **real wizard combinations and current rules**:

- `17_wizard_flows_combinations.md` (82 combinations, steps, allowed pricing models, fields per profile)
  Use that file as the source of truth for current behavior, then implement corrections and update this doc after changes.

## High-level problem

The wizard currently allows or asks for options that do not match the semantics of each vertical:

- Vehicles: hourly rent usually not valid (minimum is per day).
- Properties: hourly rent is rarely valid except for specific venue-like categories (event hall, meeting room, coworking, studio, etc.).
- Pricing model labels and meaning are confusing (e.g., “total”).
- Some fields are missing in flows where they make sense (e.g., selling a furnished house).
- Categories overlap/confuse the mental model (e.g., “property: commercial” vs “venue: commercial_local”).
- Filters are not strict enough: `category` must filter by `resourceType`, and `commercialMode` must filter by (`resourceType` + `category`). Also `pricingModel` must filter by the full context.

## Goals (What you must deliver)

1. **Refactor the wizard selection logic** so that the flow is coherent and strictly filtered:
   - Step order must be: **Resource Type → Category → Commercial Mode** (if applicable).
   - `category` options depend on `resourceType`.
   - `commercialMode` options depend on `resourceType + category`.
   - `pricingModel` options depend on `resourceType + category + commercialMode`.
   - If the context changes, sanitize invalid previous values and reset to valid defaults.

2. **Fix semantic rules for verticals**

   ### Vehicles
   - Remove or disable `rent_hourly` for all vehicle categories (car/suv/pickup/van/motorcycle/boat).
   - Ensure default booking types are consistent:
     - sale → manual_contact
     - rent_short_term → date_range
     - rent_long_term → manual_contact (or explicit monthly)
   - Ensure allowed pricing models:
     - rent_short_term → per_day (and only those that make sense)
     - rent_long_term → per_month (optionally allow per_day only if explicitly intended; otherwise remove)
   - Update any UI labels and validation accordingly.

   ### Properties
   - For properties like house/apartment/land/office/warehouse/commercial:
     - Disable `rent_hourly` by default.
     - Hourly rental should exist ONLY for venue-like resourceTypes (venue) or for explicitly defined “space by hour” categories.
   - Add **furnished** field to **sale** flows for houses/apartments/commercial/office/warehouse where it makes sense.
     - If you don’t want it on land, keep it excluded.
   - Fix “land + rent_long_term” showing furnished/petsAllowed (currently semantically weak). Decide:
     - Either remove furnished/petsAllowed from land rent flows, or replace with land-appropriate conditions.
   - Re-check minStay and check-in/out fields only for short-term lodging (night/day). Not for land or office if not needed.

   ### Venues (Salones / Espacios)
   - Ensure categories like:
     - event_hall, commercial_local, studio, coworking, meeting_room
       belong to `resourceType=venue` and are the only ones allowed to have `rent_hourly` and time-slot availability fields.
   - Clarify the difference between:
     - property.category = commercial (long-term/real-estate commercial property)
     - venue.category = commercial_local (space rentable by hour/day for events/meetings/etc.)
   - If the product wants to merge or rename categories for clarity, implement it in the catalog and update UI texts.

3. **Fix pricing model UX and meaning**
   - The label “total” is confusing. Define clear semantics:
     - If “total” means “precio fijo por operación/venta” → rename to something like:
       - `fixed_total` (UI: “Precio fijo” / “Precio total (fijo)”)
     - If it means “precio final calculado” → it should NOT be a user-selected pricing model; it’s an output of a quote.
   - Ensure that for rentals the pricing model communicates periodicity:
     - per_hour, per_day, per_night, per_month, per_event, per_person, per_m2
   - Update UI labels, helper texts, and validations for every pricing model shown.
   - Remove any pricing model that does not apply to the current vertical/context.

4. **Wizard copy and field labels must be precise**
   - Review all “Modo comercial”, “Categoría”, “Precio”, “Periodo”, etc.
   - Remove ambiguous/duplicated wording and add short helper text where confusion exists.
   - Ensure Spanish UI is primary; keep i18n keys consistent and UTF-8.

5. **Validation and sanitization**
   - When changing resourceType/category/commercialMode:
     - sanitize and reset dependent fields: pricingModel, bookingType, commercialConditions fields (min/max units, availability times, etc.)
   - Validation per-step must validate only active fields, but final submit must validate the full active profile.
   - Ensure no invalid combinations can be submitted.

6. **Documentation updates (mandatory)**
   - Update `17_wizard_flows_combinations.md` to reflect the new matrix (new total combinations, allowed modes, steps, and fields).
   - If there are other docs mirroring wizard logic, update them too.
   - Add a short “Changelog” section at the top explaining what changed and why.

7. **Testing**
   - Add/update unit tests (or lightweight integration tests) for:
     - Filtering logic (category → commercialMode → pricingModel)
     - Vehicle disallows rent_hourly
     - Property disallows rent_hourly except venues
     - Pricing model renames and label correctness
   - Add a simple dev-only debug panel or console logs guard (optional) to print current profile context and resolved allowed options.

## Implementation guidance (do this systematically)

1. Locate the wizard profile engine / config:
   - find where `resourceType`, `category`, `commercialMode`, `pricingModel`, `bookingType` are defined and resolved.
2. Centralize the rules:
   - Create a single “catalog” / “profile resolver” module that outputs:
     - allowed categories
     - allowed commercial modes
     - allowed pricing models
     - steps visible
     - fields visible
     - defaults per context
3. Replace any scattered conditional logic with the centralized resolver.
4. Update UI components to use the resolver output (options + helper texts).
5. Update i18n dictionary keys and ensure Spanish copy is clear.

## Acceptance criteria

- A vehicle can never be configured with hourly renting.
- A typical property (house/apartment/land/etc.) does not show hourly renting; hourly exists for venues/spaces only.
- “Total” pricing is no longer confusing; the UI shows a clear name and meaning.
- Selling a house/apartment can capture “amueblado” (furnished) when appropriate.
- Category/commercialMode/pricingModel always appear filtered correctly and cannot produce invalid combos.
- Documentation matrix file is regenerated/updated and matches the code.

## Deliverables

- Code changes committed across wizard logic + UI + i18n
- Updated docs (`17_wizard_flows_combinations.md`) reflecting new behavior
- Tests added/updated
- Brief summary in final message listing what was changed and where
