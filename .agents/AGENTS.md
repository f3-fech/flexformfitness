# Reglas y Arquitectura del Proyecto (flexformfitness)

Este archivo contiene directrices para la IA en futuras sesiones de desarrollo sobre las decisiones de arquitectura del proyecto y herramientas integradas.

---

## 1. Grafo de Conocimiento (Codebase Memory)
*   Este proyecto utiliza **codebase-memory-mcp** para indexar la estructura del código.
*   **Actualizar el índice:** Si agregas nuevos archivos, funciones o realizas refactorizaciones grandes, re-indexa el repositorio usando:
    ```powershell
    codebase-memory-mcp cli index_repository --repo-path .
    ```
*   **Prioridad de herramientas:** Prefiere usar las herramientas de consulta de grafo (`search_graph`, `trace_path`, `get_code_snippet`) de `codebase-memory-mcp` sobre búsquedas genéricas de archivos (`grep_search`/lectura de archivos en masa) para explorar la estructura del código.

---

## 2. Caché en Memoria para Ajustes (Firestore)
*   **Regla:** Nunca consultes Firestore directamente (`db.collection('settings').doc(...)`) para obtener configuraciones generales o de correo.
*   **Uso:** Utiliza siempre las funciones centralizadas de acceso, las cuales implementan un caché en memoria con un TTL de 5 minutos:
    *   `getGeneralSettings()` en `src/lib/settings.ts` para precios de envío, mercados, roles de admin, urls del logo/video.
    *   `getEmailSettings()` en `src/lib/emailSettings.ts` para plantillas y asuntos de correos.

---

## 3. Sistema de Módulos en Scripts (`scripts/`)
El proyecto combina scripts ES Modules (ESM) y CommonJS (CJS). Respeta y utiliza las utilidades compartidas correspondientes para evitar duplicar la lectura del archivo `.env`:

*   **Scripts CommonJS (`.cjs`):** Utilizan `require` e importan la utilidad compartida desde `scripts/utils.cjs`.
    ```javascript
    const { parseEnvFile } = require('./utils.cjs');
    ```
*   **Scripts ES Modules (`.js`):** Utilizan `import` e importan la inicialización desde `scripts/utils.js`.
    ```javascript
    import { initFirebase } from './utils.js';
    ```

---

## 4. Caché de Vistas en el Admin Panel (`dashboard.astro`)
*   **Regla:** Las listas principales en el panel de administración se cargan de forma diferida (lazy load) y se cachea su estado una vez cargadas para evitar llamadas redundantes a la base de datos al cambiar entre pestañas.
*   **Implementación:** Se controlan mediante banderas booleanas de estado en el cliente:
    *   `usersLoaded` para la lista de usuarios (`loadUsersList()`).
    *   `ordersLoaded` para la lista de pedidos (`loadOrdersList()`).
    *   `cartsLoaded` para los carritos abandonados (`loadAbandonedCarts()`).
*   **Uso:** Al cambiar de pestaña, solo se invoca la función de carga si la bandera correspondiente es falsa. Las acciones de filtrado, búsqueda o paginación eluden este caché realizando llamadas explícitas y refrescando los datos.

---

## 5. Restricción de Compilación (`npm run build`) para Verificación
*   **Regla:** NO ejecutes `npm run build` para validar cambios o verificar que el proyecto compila, a menos que el usuario lo pida explícitamente.
*   **Razón:** Durante el build, Astro genera estáticamente (SSG) todas las páginas de productos y colecciones. Esto realiza un gran volumen de lecturas a Firestore, agotando rápidamente las cuotas de uso de la base de datos.
*   **Alternativa para verificación:** Utiliza análisis estáticos que no realicen consultas de red a base de datos, por ejemplo:
    ```powershell
    npx astro check
    ```
    o
    ```powershell
    npx tsc --noEmit
    ```


