# 🔄 Flujo de Actualización de Caché - Diagrama Visual

## Escenario: Desarrollador modifica `styles.css`

```
┌─────────────────────────────────────────────────────────┐
│ PASO 1: Desarrollador modifica archivos                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📝 Archivos modificados:                              │
│     • styles.css                                        │
│                                                         │
│  ✏️ Acción en service-worker.js:                       │
│     const CACHE_VERSIONS = {                           │
│         HTML: '1.0.0',  // sin cambios                 │
│         CSS: '1.0.1',   // ← INCREMENTADO (era 1.0.0) │
│         JS: '1.0.0',    // sin cambios                 │
│         JSON: '1.0.0',  // sin cambios                 │
│         IMG: '1.0.0'    // sin cambios                 │
│     };                                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ PASO 2: Usuario visita la app                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🌐 Navegador detecta nuevo Service Worker             │
│  📥 Descarga service-worker.js                          │
│  🔍 Compara versiones actuales vs cachés existentes    │
│                                                         │
│  Estado de cachés ANTES:                                │
│  ├─ especulapp-html-v1.0.0  ✅ (sin cambios)           │
│  ├─ especulapp-css-v1.0.0   ❌ (obsoleto)              │
│  ├─ especulapp-js-v1.0.0    ✅ (sin cambios)           │
│  ├─ especulapp-json-v1.0.0  ✅ (sin cambios)           │
│  └─ especulapp-img-v1.0.0   ✅ (sin cambios)           │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ EVENTO: install                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔧 Service Worker se instala                           │
│  📦 Crea SOLO los cachés con versión nueva:            │
│                                                         │
│  [SW] Cacheando grupo CSS (especulapp-css-v1.0.1):     │
│       • /cf/2023/especulapp/styles.css                  │
│                                                         │
│  ⏭️ Cachés no modificados se mantienen:                │
│     • especulapp-html-v1.0.0  (reutilizado)            │
│     • especulapp-js-v1.0.0    (reutilizado)            │
│     • especulapp-json-v1.0.0  (reutilizado)            │
│     • especulapp-img-v1.0.0   (reutilizado)            │
│                                                         │
│  ✅ Instalación completada                             │
│  ⚡ skipWaiting() → Activación inmediata               │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ EVENTO: activate                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🧹 Limpieza de cachés obsoletos                       │
│                                                         │
│  Cachés actuales (mantener):                            │
│  ├─ especulapp-html-v1.0.0                             │
│  ├─ especulapp-css-v1.0.1   ← nueva versión            │
│  ├─ especulapp-js-v1.0.0                               │
│  ├─ especulapp-json-v1.0.0                             │
│  └─ especulapp-img-v1.0.0                              │
│                                                         │
│  Cachés obsoletos (eliminar):                           │
│  └─ especulapp-css-v1.0.0   🗑️ ELIMINADO              │
│                                                         │
│  [SW] 🗑️ Eliminando caché obsoleto: especulapp-css-v1.0.0│
│  [SW] ✅ 1 caché(s) obsoleto(s) eliminado(s)           │
│                                                         │
│  🎯 clients.claim() → Toma control inmediato           │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ EVENTO: fetch (peticiones del usuario)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Usuario navega → Peticiones de recursos               │
│                                                         │
│  Petición: /cf/2023/especulapp/styles.css               │
│  ├─ 1. Buscar en caché                                 │
│  ├─ 2. ✅ Encontrado en especulapp-css-v1.0.1          │
│  ├─ 3. 📦 Servir desde caché (instantáneo)             │
│  └─ 4. 🔄 Actualizar en segundo plano (opcional)       │
│                                                         │
│  Petición: /cf/2023/especulapp/app.js                   │
│  ├─ 1. Buscar en caché                                 │
│  ├─ 2. ✅ Encontrado en especulapp-js-v1.0.0           │
│  └─ 3. 📦 Servir desde caché (instantáneo)             │
│                                                         │
│  Petición: /cf/2023/especulapp/datos_servidor.json     │
│  ├─ 1. 🌐 Network First (siempre intentar red)         │
│  ├─ 2. ✅ Obtenido de la red                           │
│  ├─ 3. 💾 Actualizar caché                             │
│  └─ 4. 📤 Devolver al usuario                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ RESULTADO FINAL                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ App actualizada con nuevo CSS                       │
│  ⚡ Solo se descargó 1 archivo (styles.css)            │
│  💾 Ahorro de datos: ~95% vs descarga completa         │
│  🚀 Carga instantánea desde caché                      │
│  📱 Funciona completamente offline                     │
│                                                         │
│  Estado final de cachés:                                │
│  ├─ especulapp-html-v1.0.0  (~15 KB)                   │
│  ├─ especulapp-css-v1.0.1   (~8 KB)  ← actualizado     │
│  ├─ especulapp-js-v1.0.0    (~50 KB)                   │
│  ├─ especulapp-json-v1.0.0  (~5 KB)                    │
│  └─ especulapp-img-v1.0.0   (~10 KB)                   │
│                                                         │
│  Total en caché: ~88 KB                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Comparación con Descarga Tradicional

### Sin Service Worker (descarga completa cada vez)
```
Usuario visita la app
  ↓
Descarga TODOS los archivos:
  • index.html (5 KB)
  • styles.css (8 KB)
  • app.js (50 KB)
  • configuracion_eleccion.json (2 KB)
  • configuracion_grupos.json (2 KB)
  • datos_servidor.json (1 KB)
  • icono.svg (2 KB)
  • icono128.png (4 KB)
  • icono512.png (6 KB)
  ─────────────────
  TOTAL: ~80 KB cada visita ❌
  Tiempo: ~500ms (4G) 
```

### Con Service Worker + Caché Versionado
```
Primera visita:
  • Descarga todo (~80 KB)
  • Guarda en caché
  ─────────────────
  TOTAL: ~80 KB

Visitas posteriores (sin cambios):
  • Todo desde caché (0 KB de red)
  • Solo verifica si hay actualizaciones del SW
  ─────────────────
  TOTAL: ~0 KB ✅
  Tiempo: ~50ms (instantáneo)

Visita después de cambio en CSS:
  • styles.css desde red (~8 KB)
  • Todo lo demás desde caché
  ─────────────────
  TOTAL: ~8 KB ✅ (90% de ahorro)
  Tiempo: ~150ms
```

---

## 🔍 Casos de Uso Reales

### Caso 1: Hotfix de CSS (cambio visual pequeño)

```javascript
// Antes
CACHE_VERSIONS = { CSS: '1.0.0' }

// Después del hotfix
CACHE_VERSIONS = { CSS: '1.0.1' }

Resultado:
✅ Solo 8 KB descargados (styles.css)
❌ Sin esto: 80 KB descargados (todo de nuevo)
📊 Ahorro: 90%
```

### Caso 2: Nueva funcionalidad (JS + JSON)

```javascript
// Antes
CACHE_VERSIONS = { JS: '1.0.0', JSON: '1.0.0' }

// Después de la feature
CACHE_VERSIONS = { JS: '1.1.0', JSON: '1.1.0' }

Resultado:
✅ ~55 KB descargados (app.js + JSONs)
❌ Sin esto: 80 KB descargados (todo de nuevo)
📊 Ahorro: 31%
```

### Caso 3: Release mayor (todo cambió)

```javascript
// Antes
CACHE_VERSIONS = { HTML: '1.0.0', CSS: '1.0.1', JS: '1.1.0', JSON: '1.1.0', IMG: '1.0.0' }

// Después del release 2.0
CACHE_VERSIONS = { HTML: '2.0.0', CSS: '2.0.0', JS: '2.0.0', JSON: '2.0.0', IMG: '2.0.0' }

Resultado:
✅ ~80 KB descargados (todo actualizado)
❌ Sin esto: 80 KB descargados (mismo resultado)
📊 Ahorro: 0% (pero offline funciona)
```

---

## ⚡ Ventajas del Sistema

### 1. Granularidad
- No necesitas actualizar todo si solo cambia CSS
- Control fino sobre qué actualizar

### 2. Eficiencia
- Menos datos descargados = más rápido
- Importante en conexiones móviles lentas

### 3. Offline First
- La app funciona sin internet
- Datos se sirven desde caché local

### 4. Simplicidad
- Solo incrementa la versión del grupo que modificaste
- El SW hace el resto automáticamente

### 5. Debugging
- Cada caché tiene nombre descriptivo con versión
- Fácil de inspeccionar en DevTools

---

**Creado**: Octubre 2025  
**Versión del diagrama**: 1.0.0
