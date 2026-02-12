# 09_AGENT_USAGE_GUIDE.md – REAL ESTATE SAAS PLATFORM

## Referencia

Este documento se rige estrictamente por:

- 00_ai_project_context.md
- 00_project_brief.md
- 01_frontend_requirements.md
- 02_backend_appwrite_requirements.md
- 03_appwrite_db_schema.md
- 04_design_system_mobile_first.md
- 05_permissions_and_roles.md
- 06_appwrite_functions_catalog.md
- 07_frontend_routes_and_flows.md
- 08_env_reference.md

Define **cómo debe usarse este bundle por un Agent AI** (en VS Code, Copilot, u otro entorno similar) sin romper reglas, sin inventar arquitectura y sin asumir contexto externo.

---

## 1. Objetivo del Documento

1. Convertir este bundle en una **fuente de verdad consumible por IA**
2. Evitar prompts ambiguos o incompletos
3. Guiar al agente para:
   - Generar código
   - Modificar código existente
   - Crear archivos nuevos
   - Configurar Appwrite
   - Debuggear problemas
     respetando la arquitectura definida

---

## 2. Qué es este Bundle para un Agent AI

Este conjunto de archivos debe interpretarse como:

- Un **contrato de arquitectura** no negociable
- Una **especificación funcional completa** del sistema
- Una **restricción explícita de decisiones** técnicas

### Regla Crítica

> El agente **NO puede** tomar decisiones técnicas fuera de lo que está documentado aquí.

Si algo no está definido:

- El agente debe **preguntar al usuario**
- O documentar la decisión **antes** de implementar
- Nunca asumir o improvisar

---

## 3. Orden de Lectura Obligatorio

Un agente debe leer los documentos en este orden estricto:

1. **00_ai_project_context.md** - Contexto raíz, stack tecnológico, principios
2. **00_project_brief.md** - Visión del producto, problema, alcance
3. **01_frontend_requirements.md** - Stack y arquitectura frontend
4. **02_backend_appwrite_requirements.md** - Backend y servicios
5. **03_appwrite_db_schema.md** - Schema completo de base de datos
6. **04_design_system_mobile_first.md** - UI/UX y componentes
7. **05_permissions_and_roles.md** - Modelo de permisos
8. **06_appwrite_functions_catalog.md** - Funciones de backend
9. **07_frontend_routes_and_flows.md** - Rutas y navegación
10. **08_env_reference.md** - Variables de entorno
11. **Este documento** - Guía de uso

**Nunca saltar el contexto raíz (00_ai_project_context.md)**.

---

## 4. Reglas de Comportamiento del Agent

### 4.1 El Agent DEBE

✅ Respetar el stack tecnológico:

- ReactJS + Vite + JavaScript (NO TypeScript)
- TailwindCSS 4.1
- Appwrite como backend
- PostgreSQL (vía Appwrite)
- Mobile-First siempre

✅ Seguir la arquitectura definida:

- Componentes en `src/components/common/`
- Features en `src/features/`
- Servicios en `src/services/`
- Hooks en `src/hooks/`

✅ Usar el design system:

- Colores de `tokens.css`
- Componentes base documentados en 04
- Espaciados y tipografía definidos

✅ Respetar permisos de Appwrite:

- Nunca simular permisos en frontend
- Usar `Role.user()`, `Role.any()` correctamente
- Validar ownership en backend

✅ Mantener `.env.example` actualizado:

- Toda nueva variable debe estar documentada
- Sincronizar entre frontend y functions

✅ Usar Lucide React para iconos:

- NO usar emojis como iconos de UI
- Solo SVG

✅ Implementar estados de UI:

- Loading (skeleton o spinner)
- Empty
- Error
- Success

- Redactar copy para usuario final:

- Lenguaje simple y orientado a la accion
- Sin exponer detalles internos de arquitectura, permisos o infraestructura en vistas no-root

---

### 4.2 El Agent NO DEBE

❌ Inventar colecciones no documentadas en 03
❌ Inventar roles no definidos en 05
❌ Inventar variables de entorno no documentadas en 08
❌ Usar TypeScript (prohibido expresamente)
❌ Hardcodear datos (mock data prohibido)
❌ Implementar lógica de permisos en frontend
❌ Usar librerías no aprobadas sin consultar
❌ Cambiar stack tecnológico (es fijo)
❌ Usar emojis como iconos de UI
❌ Exponer API Keys en frontend
- No mostrar en UI no-root terminos internos como `root`, `owner`, `client`, `scope`, IDs o restricciones de backend

---

## 5. Cómo Pedirle Tareas al Agent

### 5.1 Ejemplos de Prompts Correctos

**✅ Crear componente siguiendo design system**:

```
Crea el componente PropertyCard siguiendo las especificaciones de 04_design_system_mobile_first.md, sección 10.1. Debe incluir imagen, precio, título, ubicación, características y botón de favorito. Usa componentes base de atoms/ y molecules/.
```

✅ Implementar ruta con guard\*\*:

```
Implementa la ruta /app/properties/new según 07_frontend_routes_and_flows.md, sección 4.3. Debe usar ProtectedRoute guard y DashboardLayout. El formulario debe ser wizard (multi-paso) como está especificado.
```

**✅ Crear función de Appwrite**:

```
Crea la función send-lead-notification siguiendo la estructura de 06_appwrite_functions_catalog.md, sección 6.2. Debe incluir .env.example, README.md, package.json y src/index.js con la lógica especificada.
```

**✅ Añadir colección a schema**:

```
Necesito añadir una colección 'property_features' para características adicionales de propiedades. Actualiza 03_appwrite_db_schema.md con la definición completa (attributes, indexes, permissions) siguiendo el formato establecido. Luego genera el código para crearla en Appwrite.
```

---

### 5.2 Ejemplos de Prompts Incorrectos

**❌ Demasiado genérico**:

```
Crea un sistema de propiedades
```

→ Falta especificar qué parte, qué alcance, referencias a docs

**❌ Solicita algo fuera de scope**:

```
Convierte el proyecto a TypeScript
```

→ Viola reglas explícitas de 00_ai_project_context.md

**❌ Asume decisiones no documentadas**:

```
Agrega autenticación con Firebase
```

→ El backend es Appwrite, está definido

**❌ Sin contexto de documentación**:

```
Haz un componente de tarjeta bonito
```

→ No especifica design system, no referencia 04

---

## 6. Casos de Uso Comunes

### 6.1 Crear un Nuevo Componente

**Proceso**:

1. Consultar `04_design_system_mobile_first.md` para:
   - Colores, tipografía, espaciados
   - Componentes base existentes
   - Patrones de UI
2. Decidir si es atom, molecule u organism
3. Crear archivo en `src/components/common/{tipo}/`
4. Implementar con:
   - TailwindCSS para estilos
   - Lucide React para iconos
   - Framer Motion para animaciones (si aplica)
   - Props tipadas con JSDoc (sin TypeScript)
5. Exportar en `index.js` correspondiente
6. Actualizar README si es componente importante

**Ejemplo de prompt**:

```
Crea NumberInput atom component en src/components/common/atoms/NumberInput/. Debe seguir el design system (04), soportar:
- Valor numérico
- Min/max
- Prefijos/sufijos (ej: "$", "m²")
- Estados: default, error, disabled
- Botones incrementar/decrementar
Usa tokens.css para estilos.
```

---

### 6.2 Implementar una Página/Ruta

**Proceso**:

1. Consultar `07_frontend_routes_and_flows.md` para:
   - Sección específica de la ruta
   - Layout a usar
   - Guard necesario
   - Datos a cargar
   - Estados de UI
2. Crear archivo en `src/pages/`
3. Crear componentes específicos en `src/features/` si aplica
4. Implementar guards según `05_permissions_and_roles.md`
5. Añadir ruta en `src/routes/AppRoutes.jsx`

**Ejemplo de prompt**:

```
Implementa la página /app/my-properties según 07, sección 4.2. Debe:
- Usar DashboardLayout
- Tener guard ProtectedRoute
- Cargar propiedades del usuario logueado
- Mostrar tabla/grid con filtros
- Incluir estados: loading, empty, error
- Tener botón "Crear Propiedad"
```

---

### 6.3 Crear una Appwrite Function

**Proceso**:

1. Consultar `06_appwrite_functions_catalog.md` para:
   - Ver si ya existe
   - Si no, definir propósito claro
2. Crear carpeta `functions/{function-name}/`
3. Estructura obligatoria:
   - `.env.example`
   - `README.md`
   - `package.json`
   - `src/index.js`
4. Seguir template de 06
5. Documentar variables en `08_env_reference.md`
6. Actualizar `06_appwrite_functions_catalog.md` con la nueva función

**Ejemplo de prompt**:

```
Crea la función property-view-counter (marcada como futuro en 06, sección 6.6). Debe:
- Ser HTTP endpoint
- Recibir propertyId
- Incrementar campo views en properties collection
- No bloquear respuesta (async)
Incluye toda la estructura según 06, sección 4.
```

---

### 6.4 Añadir una Variable de Entorno

**Proceso**:

1. Determinar si es para:
   - Frontend (`VITE_*`)
   - Functions (sin prefijo)
   - Ambos (duplicar con prefijo correcto)
2. Añadir a `.env.example` correspondiente
3. Documentar en `08_env_reference.md`
4. Actualizar `src/env.js` si es frontend
5. Validar en código que existe

**Ejemplo de prompt**:

```
Necesito añadir Google Maps API para mostrar mapas en detalle de propiedad. Añade variables:
- VITE_GOOGLE_MAPS_API_KEY (frontend)
Actualiza 08_env_reference.md, .env.example y src/env.js.
```

---

### 6.5 Modificar el Schema de Base de Datos

**Proceso**:

1. **PRIMERO** actualizar `03_appwrite_db_schema.md`
2. Documentar:
   - Attributes
   - Indexes
   - Permissions
   - Relationships
3. Luego generar código o instrucciones para Appwrite Console
4. Actualizar services en frontend si aplica

**Ejemplo de prompt**:

```
Necesito añadir campo 'virtualTourUrl' (URL) a collection properties para tours virtuales 360°.
1. Actualiza 03_appwrite_db_schema.md con el nuevo campo
2. Genera el comando Appwrite CLI para añadirlo
3. Actualiza el servicio listingsService.js
```

---

## 7. Debugging con el Agent

### 7.1 Error: "Collection not found"

**Prompt**:

```
Estoy obteniendo error "Collection not found" al intentar listar properties.
Verifica:
1. Que el ID de collection en .env coincida con 03_appwrite_db_schema.md
2. Que la collection exista en Appwrite
3. Que los permisos permitan lectura
Muéstrame qué revisar paso a paso.
```

---

### 7.2 Error: "Unauthorized"

**Prompt**:

```
Error "Unauthorized" al intentar crear una propiedad.
Revisa según 05_permissions_and_roles.md:
1. Qué permisos debe tener la collection properties para Create
2. Si estoy usando el guard correcto
3. Si el usuario está autenticado
Sugiere fix.
```

---

### 7.3 Error de Permisos en Función

**Prompt**:

```
La función send-lead-notification falla con "Permission denied".
Revisa según 06_appwrite_functions_catalog.md, sección 6.2:
1. Qué API Key scope necesita
2. Qué collections debe poder leer
3. Si las variables de entorno están configuradas
```

---

## 8. Mantenimiento de Documentación

### 8.1 Cuando Añadir Algo Nuevo

**Si añades**:

- Nueva collection → Actualizar `03`
- Nueva función → Actualizar `06`
- Nueva ruta → Actualizar `07`
- Nueva variable → Actualizar `08`
- Nuevo componente → Considerar actualizar `04` si es reutilizable

**Prompt para actualizar docs**:

```
He añadido la colección 'favorites' para propiedades favoritas. Actualiza 03_appwrite_db_schema.md con:
- Definición completa de attributes
- Indexes necesarios
- Permissions apropiados
- Relationship con properties y users
Sigue el formato existente.
```

---

### 8.2 Mantener Sincronización

**Documentos que deben estar sincronizados**:

- `03` (schema) ↔ `08` (collection IDs)
- `06` (functions) ↔ `08` (variables de functions)
- `07` (rutas) ↔ `01` (estructura de carpetas)

**Prompt de validación**:

```
Valida que 03_appwrite_db_schema.md y 08_env_reference.md estén sincronizados:
- Todas las collections en 03 deben tener su ID en 08
- Todas las variables en 08 deben corresponder a recursos existentes
Muéstrame inconsistencias.
```

---

## 9. Generación de Código

### 9.1 Componentes React

**Template esperado**:

```jsx
import React from "react";
import PropTypes from "prop-types";

/**
 * ComponentName - Breve descripción
 *
 * @param {Object} props
 * @param {string} props.propName - Descripción
 */
function ComponentName({ propName }) {
  // Lógica

  return <div className="...">{/* UI */}</div>;
}

ComponentName.propTypes = {
  propName: PropTypes.string.isRequired,
};

ComponentName.defaultProps = {
  // defaults si aplica
};

export default ComponentName;
```

---

### 9.2 Servicios

**Template esperado**:

```javascript
import { databases, storage, ID, Query } from "@/api/appwrite";
import env from "@/env";

/**
 * Service para gestionar propiedades
 */
export const propertiesService = {
  /**
   * Obtener todas las propiedades publicadas
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getPublished(filters = {}) {
    const queries = [
      Query.equal("status", "published"),
      Query.equal("enabled", true),
      Query.orderDesc("createdAt"),
      Query.limit(filters.limit || 20),
    ];

    if (filters.city) {
      queries.push(Query.equal("city", filters.city));
    }

    const response = await databases.listDocuments(
      env.appwrite.databaseId,
      env.appwrite.collections.properties,
      queries,
    );

    return response;
  },

  // ... más métodos
};
```

---

### 9.3 Hooks

**Template esperado**:

```javascript
import { useState, useEffect } from "react";
import { propertiesService } from "@/services/propertiesService";

/**
 * Hook para obtener propiedades publicadas
 * @param {Object} filters - Filtros opcionales
 * @returns {Object} { data, loading, error, refetch }
 */
export function useProperties(filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await propertiesService.getPublished(filters);
      setData(response.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [JSON.stringify(filters)]);

  return {
    data,
    loading,
    error,
    refetch: fetchProperties,
  };
}
```

---

## 10. Checklist para el Agent

Antes de generar/modificar código, el agent debe verificar:

- [ ] He leído el documento de contexto raíz (00)
- [ ] He consultado los documentos relevantes para esta tarea
- [ ] Conozco el stack tecnológico y restricciones
- [ ] Sé qué componentes/servicios ya existen
- [ ] Conozco la estructura de carpetas
- [ ] Entiendo los permisos de Appwrite necesarios
- [ ] Tengo clara la arquitectura mobile-first
- [ ] No estoy inventando decisiones no documentadas
- [ ] Estoy usando el design system definido
- [ ] El copy visible para usuario final no expone terminos internos ni restricciones tecnicas
- [ ] Voy a actualizar documentación si añado algo nuevo

---

## 11. Límites y Escalación

### 11.1 Cuándo el Agent NO Puede Decidir Solo

❌ Cambiar stack tecnológico
❌ Añadir librerías externas no mencionadas
❌ Modificar arquitectura core
❌ Tomar decisiones de negocio
❌ Definir nuevos roles/permisos sin consultar
❌ Cambiar modelo de datos sin validar

**En estos casos**: El agent debe preguntar al usuario y documentar la decisión.

---

### 11.2 Cuándo el Agent SÍ Puede Decidir

✅ Nombres de variables locales
✅ Funciones auxiliares internas
✅ Mensajes de error específicos
✅ Validaciones de formulario
✅ Animaciones sutiles (siguiendo 04)
✅ Refactoring que no cambia arquitectura
✅ Optimizaciones de performance
✅ Corrección de bugs evidentes

---

## 12. Recursos y Referencias

### 12.1 Documentación Externa

- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **TailwindCSS**: https://tailwindcss.com
- **Appwrite**: https://appwrite.io/docs
- **Lucide React**: https://lucide.dev
- **Framer Motion**: https://www.framer.com/motion

### 12.2 Documentación Interna

- `docs/00_ai_project_context.md` - **Inicio siempre aquí**
- `docs/03_appwrite_db_schema.md` - Fuente de verdad del schema
- `docs/04_design_system_mobile_first.md` - UI/UX reference
- `docs/05_permissions_and_roles.md` - Seguridad y acceso

---

## 13. Flujo de Trabajo Recomendado

```
1. Usuario: "Necesito [tarea]"
   ↓
2. Agent: Lee documentos relevantes (00-08)
   ↓
3. Agent: Identifica qué archivos modificar/crear
   ↓
4. Agent: Valida contra reglas establecidas
   ↓
5. Agent: Si hay ambigüedad → Pregunta al usuario
   ↓
6. Agent: Genera código siguiendo plantillas
   ↓
7. Agent: Documenta cambios si añade algo nuevo
   ↓
8. Agent: Entrega resultado con explicación
```

---

## 14. Ejemplo Completo: Añadir Feature "Favoritos"

**Usuario**:

```
Quiero añadir sistema de favoritos para que usuarios puedan guardar propiedades favoritas
```

**Agent (proceso interno)**:

1. **Leer contexto**: 00, 03, 05, 07
2. **Identificar alcance**:
   - Nueva collection `favorites`
   - Nueva ruta `/favoritos`
   - Botón favorito en PropertyCard
   - Hook `useFavorites`
3. **Validar permisos**: Solo usuarios autenticados, cada quien ve sus favoritos
4. **Actualizar docs**:
   - `03`: Añadir collection favorites
   - `07`: Añadir ruta /favoritos
   - `08`: Añadir collection ID
5. **Generar código**:
   - Componente FavoriteButton
   - Service favoritesService
   - Hook useFavorites
   - Página Favorites
   - Actualizar PropertyCard con botón
6. **Entregar** con resumen de cambios

---

## 15. Estado del Documento

Este documento es:

- ✅ Guía de uso para cualquier Agent AI
- 📝 Se actualizará si cambian patrones de uso
- 🔒 Principios de no inventar arquitectura no negociables

---

**Ultima actualizacion**: Febrero 2026
**Version**: 1.0.1
