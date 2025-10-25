# 📝 Registro de Cambios - EspeculApp

## Versión 1.1.2 - Corrección Cambio de Configuración

### Fecha: 25 de Octubre de 2025

#### 🐛 Correcciones de Bugs

**Cambio entre configuraciones de grupos**:
- ✅ Corregido: Warnings en consola al cambiar entre configuraciones con diferente cantidad de grupos
- ✅ Causa: `cambiarConfiguracionGrupos()` creaba tarjetas dos veces (manual + vía `renderizarUI()`)
- ✅ Problema: `renderizarUI()` detectaba tarjetas existentes e intentaba actualizar grupos inexistentes en nueva configuración
- ✅ Solución: Eliminar creación manual de tarjetas; solo `renderizarUI()` se encarga tras limpiar el grid
- ✅ Flujo optimizado: Limpiar grid → cargar datos servidor → renderizar UI → calcular resultados

#### 📝 Cambios Técnicos

**Función `cambiarConfiguracionGrupos()` (app.js:366-377)**:
```javascript
// ANTES: Creaba tarjetas dos veces
await cargarDatosServidor();
gruposGrid.innerHTML = '';
configGrupoActiva.grupos.forEach(grupo => {
    gruposGrid.appendChild(crearTarjetaGrupo(grupo));
});

// AHORA: Solo limpia y delega en renderizarUI()
gruposGrid.innerHTML = '';
await cargarDatosServidor(); // Esto llama a renderizarUI()
```

---

## Versión 1.1.1 - Animaciones y Mejoras de Renderizado

### Fecha: 25 de Octubre de 2025

#### 🎨 Mejoras Visuales

##### ✨ Animaciones de Reordenamiento
- ✅ **Gráfico de Resultados Global**: Las barras ahora se deslizan suavemente cuando cambian de posición
- ✅ **Gráficos Mini (Datos Reales)**: Animación fluida al reordenar frentes en tarjetas con datos del servidor
- ✅ **Técnica FLIP**: Implementación de animación First-Last-Invert-Play para transiciones suaves
- ✅ **Duración**: Animaciones de 0.6 segundos con ease-in-out para un efecto natural

##### 🔄 Sistema de Renderizado Optimizado

**Gráfico Global (`renderizarGraficoBarras`)**:
- 🔧 No recrea el DOM completo en cada actualización
- 🔧 Mantiene elementos existentes y solo actualiza valores
- 🔧 Usa `insertBefore()` y `insertAdjacentElement()` para reordenar sin duplicaciones
- 🔧 Aplica `transform: translateY()` para animar cambios de posición
- 🔧 Usa `requestAnimationFrame` doble para garantizar renderizado del estado inicial

**Gráficos Mini (`renderizarGraficoMini`)**:
- 🔧 Sistema idéntico al gráfico global para consistencia
- 🔧 Elimina generación de HTML estático
- 🔧 Crea elementos dinámicamente con `data-resultado-id`
- 🔧 Funciones auxiliares: `crearBarraMiniHTML()`, `actualizarBarraMiniExistente()`

##### 🐛 Correcciones de Bugs

**Duplicación de Elementos**:
- ✅ Corregido: Frentes duplicados en gráficos mini al actualizar datos
- ✅ Causa: `renderizarGrupoConDatosReales` generaba HTML estático sin `data-resultado-id`
- ✅ Solución: Ahora usa `renderizarGraficoMini` desde el inicio para consistencia

**Persistencia de Estado**:
- ✅ Corregido: Valores de sliders no se cargaban desde localStorage
- ✅ Corregido: Botonera de escenarios no mostraba el escenario activo guardado
- ✅ Nueva función: `sincronizarInputsConEstado()` para sincronizar inputs y botones
- ✅ Nueva función ampliada: `actualizarInputsGrupo()` incluye nulos y asistencia

#### 📝 Cambios Técnicos

##### CSS (`styles.css`)
```css
.barra-contenedor {
    transition: transform 0.6s ease-in-out;
}

.barra-contenedor-mini {
    transition: transform 0.6s ease-in-out;
}

.grupo-grafico-barras {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
```

##### JavaScript (`app.js`)

**Funciones Nuevas**:
- `renderizarGraficoMini(contenedor, resultados)`: Renderizado dinámico con animaciones
- `crearBarraMiniHTML(resultado)`: Crea elemento de barra mini
- `actualizarBarraMiniExistente(barraDiv, resultado)`: Actualiza barra existente
- `sincronizarInputsConEstado(grupoId)`: Sincroniza inputs range y botonera con estado

**Funciones Modificadas**:
- `renderizarGraficoBarras()`: Sistema FLIP para animaciones
- `renderizarGrupoConDatosReales()`: Usa `renderizarGraficoMini` en lugar de HTML estático
- `renderizarGrupoSimulacion()`: Llama a `sincronizarInputsConEstado` en el orden correcto
- `actualizarInputsGrupo()`: Ampliada para incluir nulos y asistencia

**Eliminados**:
- `console.warn` innecesarios al inicializar estado de grupos

#### 🎯 Comportamiento

**Animaciones se activan cuando**:
- Cambias valores de sliders que modifican el orden de los frentes
- Llegan nuevos datos del servidor que cambian posiciones
- Cambias entre escenarios predefinidos
- Cambias la configuración "Incluir blancos como válidos"

**No se animan**:
- Elementos nuevos que aparecen por primera vez
- Elementos que permanecen en la misma posición
- Actualizaciones de valores sin cambio de orden

---

## Versión 1.1.0 - Múltiples Configuraciones de Grupos

### Fecha: 25 de Octubre de 2025

#### 🎉 Nuevas Funcionalidades

##### 🔄 Sistema de Múltiples Configuraciones
- ✅ **Selector de configuraciones**: Select para elegir entre diferentes agrupaciones electorales
- ✅ **Configuraciones independientes**: Cada configuración mantiene su propio estado
- ✅ **Persistencia separada**: Estados guardados independientemente en localStorage
- ✅ **Datos por configuración**: Cada configuración consulta su propia fuente de datos

##### 📊 Estructura de Datos Actualizada

**`configuracion_grupos.json`** - Nueva estructura:
```json
{
  "configuraciones": [
    {
      "id": "config_1",
      "nombre": "Clústeres provinciales",
      "grupos": [...]
    },
    {
      "id": "config_2",
      "nombre": "Proximidad territorial",
      "grupos": [...]
    }
  ]
}
```

**Antes**: Un solo array de grupos
**Ahora**: Array de configuraciones, cada una con su propio array de grupos

##### 🗂️ Organización de Datos del Servidor

**Nueva estructura de carpetas**:
```
simulacion/
├── config_1/
│   └── datos_servidor.json
└── config_2/
    └── datos_servidor.json
```

**Antes**: `datos_servidor.json` en la raíz
**Ahora**: `simulacion/{config_id}/datos_servidor.json`

#### 📝 Cambios en el Código

##### Variables Privadas
- ✅ `configGrupoActiva`: Nueva variable para la configuración actual
- ✅ `STORAGE_CONFIG_KEY`: Clave para persistir la configuración seleccionada

##### Funciones Nuevas
- ✅ `inicializarSelectorConfiguraciones()`: Renderiza el select con las opciones
- ✅ `cambiarConfiguracionGrupos(configId)`: Cambia la configuración activa

##### Funciones Modificadas
- 🔄 `cargarConfiguraciones()`: Carga configuración activa desde localStorage
- 🔄 `cargarDatosServidor()`: Construye ruta dinámica según configuración
- 🔄 `cargarEstadoDesdeLocalStorage()`: Usa clave específica por configuración
- 🔄 `guardarEstadoEnLocalStorage()`: Guarda con clave específica
- 🔄 Todas las referencias `configGrupos.grupos` → `configGrupoActiva.grupos`

#### 🎨 Cambios en la UI

##### HTML (`index.html`)
- ✅ Nuevo `<select id="selector-configuracion-grupos">` debajo del título
- ✅ Opciones cargadas dinámicamente desde el JSON

##### CSS (`styles.css`)
- ✅ Nueva clase `.selector-configuracion-container`
- ✅ Estilos para el select con hover y focus
- ✅ Diseño responsive

#### 💾 Service Worker Actualizado

##### Versiones Incrementadas
```javascript
CACHE_VERSIONS = {
    HTML: '1.1.0',  // Selector agregado
    CSS: '1.1.0',   // Nuevos estilos
    JS: '1.1.0',    // Nueva lógica
    JSON: '1.1.0',  // Nueva estructura
    IMG: '1.0.0'    // Sin cambios
}
```

##### Recursos de Caché
- ❌ Eliminado: `./datos_servidor.json`
- ✅ Agregado: `./simulacion/config_1/datos_servidor.json`
- ✅ Agregado: `./simulacion/config_2/datos_servidor.json`

##### Estrategia de Fetch
- 🔄 Detecta rutas dinámicas: `url.pathname.includes('/simulacion/')`
- ✅ Network First para todos los archivos en `/simulacion/`

#### 📚 Documentación Actualizada

##### Archivos Modificados
- 📖 `README.md`: Sección de múltiples configuraciones agregada
- 📖 `API.md`: Documentación de nuevas funciones (pendiente)
- 📖 `CHANGELOG.md`: Este archivo
- 📖 `PWA.md`: Información de caché actualizada (pendiente)
- 📖 `CACHE-FLOW.md`: Flujo de caché actualizado (pendiente)

#### 🔧 localStorage Keys

**Nuevas claves**:
- `especulapp_config_grupos_activa`: ID de la configuración seleccionada
- `especulapp_estado_config_1`: Estado de la configuración 1
- `especulapp_estado_config_2`: Estado de la configuración 2

**Obsoletas**:
- `especulapp_estado`: Reemplazado por claves específicas por configuración

#### ⚙️ Configuraciones Incluidas

1. **Clústeres provinciales** (`config_1`)
   - 12 grupos (Clúster 1-11 + Ciudades Chicas)
   - Basado en agrupaciones tradicionales

2. **Proximidad territorial** (`config_2`)
   - 10 grupos (Rosario, Santa Fe, zonas rurales, etc.)
   - Basado en ubicación geográfica

#### 🎯 Comportamiento

**Al cambiar de configuración**:
1. Se limpia el estado actual
2. Se carga el estado guardado de la nueva configuración
3. Se consultan los datos del servidor de la nueva configuración
4. Se re-renderizan todas las tarjetas de grupos
5. Se recalculan los resultados globales

**Persistencia**:
- Cada configuración mantiene sus propios valores de asistencia, votos nulos, y distribución de frentes
- Al volver a una configuración anterior, se restauran sus valores guardados
- No hay interferencia entre configuraciones

---

## Fecha: 19 de Octubre de 2025

### 🎉 Versión 2.0.0 - PWA con Caché Inteligente

#### Nuevas Funcionalidades

##### 📱 Progressive Web App (PWA)
- ✅ Aplicación instalable en dispositivos móviles y desktop
- ✅ Funciona completamente offline
- ✅ Ícono en pantalla de inicio
- ✅ Experiencia standalone (sin barra de navegador)

##### 💾 Sistema de Caché Versionado
- ✅ **Caché por grupos de recursos**: HTML, CSS, JS, JSON, IMG
- ✅ **Versionado independiente**: Cada grupo tiene su propia versión
- ✅ **Actualizaciones selectivas**: Solo se actualizan los recursos modificados
- ✅ **Limpieza automática**: Cachés obsoletos se eliminan al activar el SW

**Ejemplo de uso:**
```javascript
// Si modificas solo CSS, incrementa solo esa versión
CACHE_VERSIONS = {
    HTML: '1.0.0',  // No cambia
    CSS: '1.0.1',   // ← INCREMENTADO
    JS: '1.0.0',    // No cambia
    JSON: '1.0.0',  // No cambia
    IMG: '1.0.0'    // No cambia
};
```

##### 🔄 Estrategias de Caché
1. **Cache First**: Para recursos estáticos (HTML, CSS, JS, imágenes)
2. **Network First**: Para `datos_servidor.json` (siempre actualizado)
3. **Stale-While-Revalidate**: Actualización en segundo plano

#### Archivos Nuevos

```
✨ manifest.json          → Configuración PWA (nombre, íconos, colores)
✨ service-worker.js      → Service Worker con caché versionado
✨ PWA.md                 → Guía completa de PWA y versionado
```

#### Archivos Modificados

```
✏️ index.html             → Meta tags PWA + registro de SW
✏️ ejemplo-integracion.html → Meta tags PWA
✏️ README.md              → Sección de PWA agregada
✏️ CHANGELOG.md           → Este archivo
```

---

## Versión 1.0.0 - Encapsulación y Modularización

### ✨ Cambios Principales

#### 1. **Encapsulación Completa del Código**
- ✅ Todo el código de `app.js` ahora está envuelto en un IIFE (Immediately Invoked Function Expression)
- ✅ Se expone un único objeto global: `EspeculApp`
- ✅ Todas las variables y funciones son privadas dentro del closure
- ✅ No hay contaminación del namespace global

**Antes:**
```javascript
// Variables globales
let configEleccion = null;
let configGrupos = null;
// ... más variables globales

function cargarConfiguraciones() { ... }
// ... más funciones globales

document.addEventListener('DOMContentLoaded', async () => {
    // Inicialización directa
});
```

**Después:**
```javascript
const EspeculApp = (function() {
    'use strict';
    
    // Variables PRIVADAS
    let configEleccion = null;
    let configGrupos = null;
    // ...
    
    // Funciones PRIVADAS
    function cargarConfiguraciones() { ... }
    // ...
    
    // API PÚBLICA
    return {
        init,
        destroy,
        isReady,
        version: '1.0.0'
    };
})();

// Auto-inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        EspeculApp.init();
    });
} else {
    EspeculApp.init();
}
```

#### 2. **Nueva API Pública**

Se agregaron los siguientes métodos públicos:

##### `EspeculApp.init()`
- **Propósito**: Inicializa la aplicación
- **Retorna**: `Promise<void>`
- **Uso**: Se llama automáticamente al cargar, pero puede llamarse manualmente
- **Seguridad**: Previene múltiples inicializaciones

##### `EspeculApp.destroy()`
- **Propósito**: Destruye la instancia y libera recursos
- **Uso**: Limpia intervalos y event listeners
- **Ideal para**: Navegación SPA o limpieza antes de `beforeunload`

##### `EspeculApp.isReady()`
- **Propósito**: Verifica si la aplicación está inicializada
- **Retorna**: `boolean`
- **Uso**: Para verificación de estado desde código externo

##### `EspeculApp.version`
- **Propósito**: Versión de la librería
- **Valor**: `"1.0.0"`
- **Tipo**: `string` (read-only)

#### 3. **Estado de Inicialización**

Se agregó una variable privada `isInitialized` para controlar el ciclo de vida:

```javascript
let isInitialized = false;

async function init() {
    if (isInitialized) {
        console.warn('EspeculApp: La aplicación ya está inicializada');
        return;
    }
    // ... código de inicialización
    isInitialized = true;
}

function destroy() {
    if (!isInitialized) {
        console.warn('EspeculApp: La aplicación no está inicializada');
        return;
    }
    // ... código de limpieza
    isInitialized = false;
}
```

### 📚 Documentación Creada/Actualizada

#### Nuevos Archivos:

1. **API.md**
   - Documentación completa de la API pública
   - Ejemplos de uso
   - Guía de integración
   - Troubleshooting

2. **README.md**
   - Guía de inicio rápido
   - Características principales
   - Ejemplos de código
   - Estructura del proyecto
   - Guía de desarrollo

3. **ejemplo-integracion.html**
   - Ejemplo práctico de integración
   - Controles interactivos para la API
   - Demostración de todas las funcionalidades públicas

#### Archivos Actualizados:

1. **.github/copilot-instructions.md**
   - Actualizado para reflejar la nueva arquitectura de módulo
   - Instrucciones sobre cómo agregar nuevas funciones
   - Énfasis en la encapsulación

### 🔒 Beneficios de la Encapsulación

#### 1. **Sin Conflictos de Nombres**
- Ya no hay riesgo de colisión con variables/funciones de otras librerías
- Solo `EspeculApp` existe en el scope global

#### 2. **Mejor Mantenibilidad**
- API clara y bien definida
- Separación explícita entre código público y privado
- Más fácil de entender qué es "touchable" desde fuera

#### 3. **Integración Segura**
- Puede integrarse en cualquier aplicación sin romper código existente
- No modifica prototipos nativos
- Compatible con otras librerías (jQuery, React, etc.)

#### 4. **Control del Ciclo de Vida**
- `init()` y `destroy()` permiten control explícito
- Previene fugas de memoria con limpieza adecuada
- Útil en aplicaciones SPA

### 🛠️ Cambios Técnicos Internos

#### Auto-Inicialización Mejorada:
```javascript
// Antes
document.addEventListener('DOMContentLoaded', async () => {
    await cargarConfiguraciones();
    // ...
});

// Después
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        EspeculApp.init();
    });
} else {
    // DOM ya está listo, inicializar inmediatamente
    EspeculApp.init();
}
```

#### Logging Mejorado:
```javascript
console.log('EspeculApp: Aplicación inicializada correctamente');
console.warn('EspeculApp: La aplicación ya está inicializada');
console.error('EspeculApp: Error durante la inicialización', error);
```

### ✅ Retrocompatibilidad

#### Comportamiento Idéntico:
- La aplicación funciona exactamente igual que antes
- Todos los event listeners internos funcionan
- El estado en localStorage se mantiene
- Los modales funcionan igual
- El polling sigue operando cada 60 segundos

#### Cambios NO Breaking:
- No se eliminaron funcionalidades existentes
- La auto-inicialización mantiene el comportamiento original
- Los archivos JSON siguen siendo los mismos

### 🧪 Testing

Para probar la refactorización:

```bash
cd /d/xampp_old/htdocs/cf/2023/especulapp
python -m http.server 8000
# Navegar a http://localhost:8000
```

#### Casos de Prueba:

1. **Inicialización Normal**
   - ✅ Abrir `index.html`
   - ✅ Verificar que todo funciona como antes

2. **Control Manual**
   - ✅ Abrir `ejemplo-integracion.html`
   - ✅ Usar botones de control
   - ✅ Destruir y reinicializar

3. **Verificación de Estado**
   - ✅ Consola: `EspeculApp.isReady()`
   - ✅ Consola: `EspeculApp.version`

4. **Prevención de Re-Inicialización**
   - ✅ Consola: `EspeculApp.init()` (debería advertir si ya está inicializada)

### 📦 Archivos Modificados

```
✏️  app.js                          (Encapsulación completa + comentarios mejorados)
✨  API.md                           (Nuevo - Documentación API)
✨  README.md                        (Nuevo - Guía de uso + info de modales)
✨  ejemplo-integracion.html         (Nuevo - Demo de integración)
✏️  .github/copilot-instructions.md (Actualizado - Instrucciones AI)
🗑️  MODALES_README.md               (Eliminado - Documentación integrada al código)
```

### 🔄 Archivos de Respaldo

Se creó un respaldo antes de la refactorización:
```
app.js.backup  (Versión original sin encapsular)
```

### 📊 Estadísticas del Código

- **Funciones privadas**: ~40
- **Variables privadas**: ~10
- **Funciones públicas**: 3 (init, destroy, isReady)
- **Propiedades públicas**: 1 (version)
- **Líneas de código**: ~1861

### 🚀 Próximos Pasos Sugeridos

1. **Testing exhaustivo**
   - Probar todos los escenarios
   - Verificar con diferentes navegadores
   - Probar integración con otras apps

2. **Agregar más métodos públicos** (si es necesario)
   - `EspeculApp.getState()` - Obtener estado actual
   - `EspeculApp.setState(state)` - Establecer estado programáticamente
   - `EspeculApp.exportData()` - Exportar resultados a JSON

3. **TypeScript Definitions** (opcional)
   - Crear archivo `.d.ts` para mejor autocompletado
   - Documentar tipos de retorno

4. **Build Process** (opcional)
   - Minificación para producción
   - Source maps
   - Versionado automático

### ✍️ Notas del Desarrollador

- **Patrón utilizado**: Module Pattern con IIFE
- **Compatibilidad**: ES6+ requerido
- **Sin breaking changes**: Comportamiento 100% idéntico
- **Preparado para**: Integración en aplicaciones más grandes
- **Filosofía**: Encapsulación sin sacrificar funcionalidad
- **Documentación**: Todo el código está bien comentado, incluyendo el sistema de modales integrado en el código fuente

### 📝 Mejoras de Documentación

#### Comentarios en el Código
Se mejoraron significativamente los comentarios en el código, especialmente en el sistema de modales:
- ✅ Ejemplos de uso directamente en JSDoc
- ✅ Explicación clara de cómo manejar promesas y rechazos
- ✅ Documentación de todos los parámetros y retornos
- ✅ Casos de uso comunes documentados

Esto elimina la necesidad de archivos de documentación separados para funcionalidades internas.

---

**Desarrollado por**: GitHub Copilot  
**Revisado por**: Equipo de Ciudad Futura  
**Fecha**: 19 de Octubre de 2025
