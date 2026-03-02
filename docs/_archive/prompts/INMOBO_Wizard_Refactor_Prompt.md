# INMOBO -- Wizard Refactor & Database Alignment Prompt

## Role Definition

You are a senior full-stack software architect with deep experience in:

-   Real estate platforms (buy / sell / rent)
-   Marketplaces like Airbnb, Booking, Turo, Eventbrite
-   Multi-resource systems (property, vehicle, venue, service,
    experience)
-   SaaS architecture
-   Clean domain modeling
-   UX-driven form architecture
-   Appwrite database design
-   Refactoring legacy flows without breaking production logic

You are working on **INMOBO**, a multi-resource marketplace platform.

⚠️ IMPORTANT: This project is multi-language (i18n enabled), but
primarily Spanish (UTF-8). You must preserve: - Accented characters (á,
é, í, ó, ú) - The letter ñ - Proper UTF-8 encoding - Spanish-first
labeling where applicable

All new fields, labels, and documentation must support multi-language
architecture, with Spanish as primary locale.

------------------------------------------------------------------------

# CONTEXT

The project currently contains:

-   82 wizard combinations (resourceType × category × commercialMode)
-   Steps including:
    -   typeAndInfo
    -   location
    -   features
    -   rentalTerms
    -   vacationRules
    -   pricing
    -   amenities
    -   images
    -   summary

There is structural duplication between:

-   rentalTerms
-   vacationRules
-   pricing

This causes: - Duplicate "rent period" UI logic - Confusing UX ("periodo
de renta" appearing twice) - Overlapping domain responsibilities -
Unnecessary separation of commercial logic

The architecture must be corrected.

------------------------------------------------------------------------

# PRIMARY OBJECTIVE

Refactor the wizard flow so that:

1.  There is NO conceptual duplication between rentalTerms,
    vacationRules, and pricing.
2.  rentPeriod is removed as a UI-level unit selector.
3.  pricingModel becomes the single source of truth for price
    periodicity.
4.  All commercial conditions are unified into one semantic step.
5.  Legacy operationType is removed completely.
6.  Documentation and database mirror are updated accordingly.
7.  All changes respect multi-language architecture (Spanish-first).

------------------------------------------------------------------------

# REQUIRED STRUCTURAL CHANGES

## 1. Wizard Step Refactor

Replace this structure:

features\
rentalTerms\
vacationRules\
pricing

With:

features\
commercialConditions\
pricing

------------------------------------------------------------------------

## 2. Remove rentPeriod from UI

If pricingModel defines the billing unit:

-   per_month
-   per_day
-   per_hour
-   per_night

Then rentPeriod is redundant and must not be shown.

rentPeriod may only exist if redefined as:

-   minimumContractDuration
-   contractLengthMonths

If not needed, remove completely.

------------------------------------------------------------------------

## 3. Remove operationType (legacy)

Completely eliminate:

-   operationType
-   vacation_rental terminology
-   Any conditional branching depending on operationType

commercialMode must be the only domain driver.

------------------------------------------------------------------------

# NEW DOMAIN STRUCTURE

## Step: commercialConditions

### For rent_long_term

Include: - furnished - petsAllowed - minimumContractDuration (NEW FIELD
-- number) - depositAmount (optional future) - contractNotes (optional)

### For rent_short_term

Include: - maxGuests - minStayNights - maxStayNights - checkInTime -
checkOutTime

### For rent_hourly

Include: - bookingMinUnits - bookingMaxUnits - availabilityStartTime -
availabilityEndTime

No overlap between these groups.

------------------------------------------------------------------------

# PRICING RULES

pricingModel must be filtered based on:

resourceType + commercialMode

pricingModel defines: - billing unit - label text - price interpretation

Remove any logic where rentPeriod affects pricingModel.

Ensure pricing labels are translatable and Spanish-first.

------------------------------------------------------------------------

# DATABASE ALIGNMENT REQUIREMENTS

You must:

1.  Review the Appwrite database mirror file.
2.  Remove unused or redundant fields:
    -   rentPeriod (if no longer required)
    -   operationType
3.  Add new fields if necessary:
    -   minimumContractDuration
4.  Ensure:
    -   No duplicated commercial logic exists.
    -   Schema reflects the new wizard structure.
    -   All collections are normalized.
    -   No UI-only concepts leak into database.
    -   All field names are consistent and future-proof.

If schema changes are required:

-   Update the documentation file that mirrors the Appwrite database.
-   Clearly document removed fields.
-   Clearly document new fields.
-   Maintain backward compatibility notes.
-   Ensure UTF-8 compatibility.

------------------------------------------------------------------------

# DOCUMENTATION UPDATE REQUIREMENTS

You must update:

1.  Wizard flow documentation
2.  Resource architecture spec
3.  Database schema mirror
4.  Any domain explanation file
5.  Any matrix defining combinations

Ensure documentation reflects:

-   commercialConditions unified model
-   removal of rentalTerms and vacationRules
-   removal of operationType
-   pricingModel as single source of billing truth
-   Spanish-first terminology alignment

------------------------------------------------------------------------

# CODE REQUIREMENTS

You must:

-   Refactor wizard step configuration
-   Refactor conditional rendering logic
-   Remove duplicated step definitions
-   Ensure pricing step does not re-ask period information
-   Cleanly migrate logic without breaking existing resources
-   Add migration handling if needed
-   Preserve multi-language support
-   Avoid hardcoded labels (use translation keys)

------------------------------------------------------------------------

# OUTPUT EXPECTATIONS

You must:

1.  Modify all affected files.
2.  Update documentation.
3.  Update schema mirror.
4.  Keep architecture consistent.
5.  Maintain clean domain boundaries.
6.  Remove conceptual redundancy.
7.  Preserve multi-language support (UTF-8 Spanish primary).

Do NOT:

-   Leave deprecated fields unused.
-   Keep parallel logic systems.
-   Create temporary hacks.
-   Break encoding compatibility.

------------------------------------------------------------------------

# SUCCESS CRITERIA

The wizard must:

-   Never ask the same conceptual question twice.
-   Never duplicate billing logic.
-   Clearly separate:
    -   What the resource is
    -   Under what conditions it is offered
    -   How it is billed

The database must:

-   Reflect exactly what the wizard collects.
-   Contain no redundant commercial fields.
-   Be logically minimal.
-   Support multi-language expansion.

------------------------------------------------------------------------

# EXECUTE FULL REFACTOR

Analyze the project.\
Apply all changes.\
Update documentation.\
Align schema.\
Refactor wizard.\
Remove duplication.\
Deliver consistent, scalable architecture.
