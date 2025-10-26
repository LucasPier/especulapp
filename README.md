# EspeculApp - Simulador Electoral

![Versión](https://img.shields.io/badge/versi%C3%B3n-1.2.0-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

Una librería JavaScript encapsulada para simular escenarios electorales con integración de datos en tiempo real y soporte para múltiples configuraciones de grupos electorales.

## 🚀 Características

- ✅ **Encapsulada y sin conflictos**: Expone solo un objeto global `EspeculApp`
- 🔄 **Múltiples configuraciones**: Selecciona entre diferentes agrupaciones electorales
- 📊 **Datos en tiempo real**: Polling automático cada 60 segundos por configuración
- 🖼️ **Imágenes de grupos**: Soporte opcional para mostrar imágenes representativas
- 📈 **Perfiles electorales**: Gráficos interactivos de resultados de elecciones anteriores con Plotly
- 💾 **Persistencia automática**: Guarda el estado independiente de cada configuración
- 🎨 **Interfaz responsiva**: Funciona en desktop, tablet y móvil
- 🎯 **Simulaciones interactivas**: Controles de slider para ajustar parámetros
- � **Visualización dinámica**: Gráficos de barras actualizados en tiempo real
- 📱 **Progressive Web App**: Funciona offline e instalable en cualquier dispositivo

## 📦 Instalación

1. Incluye los archivos en tu proyecto:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <link rel="stylesheet" href="styles.css">
    <!-- Plotly para gráficos de perfiles -->
    <script src="js/plotly-3.1.2.min.js"></script>
</head>
<body>
    <!-- Tu estructura HTML -->
    <div id="app-container">
        <!-- Incluir la estructura HTML de index.html -->
    </div>

    <!-- Cargar la librería -->
    <script src="app.js"></script>
</body>
</html>
```

2. La aplicación se inicializará automáticamente cuando el DOM esté listo.

## 🎯 Uso Básico

### Inicialización Automática

Por defecto, la aplicación se inicializa automáticamente:

```javascript
// No se requiere código adicional
// La aplicación se inicia automáticamente cuando document.readyState !== 'loading'
```

### Inicialización Manual

Si necesitas controlar cuándo se inicializa:

```javascript
// Elimina o comenta el código de auto-inicialización al final de app.js
// Luego inicializa manualmente:

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await EspeculApp.init();
        console.log('✅ Aplicación inicializada');
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
    }
});
```

### Verificar Estado

```javascript
// Verificar si la aplicación está lista
if (EspeculApp.isReady()) {
    console.log('La aplicación está lista para usar');
}

// Obtener versión
console.log('Versión:', EspeculApp.version);
```

### Destruir Instancia

```javascript
// Limpiar recursos antes de salir de la página
window.addEventListener('beforeunload', () => {
    EspeculApp.destroy();
});
```

## 📚 API Pública

### `EspeculApp.init()`

Inicializa la aplicación.

- **Retorna**: `Promise<void>`
- **Throws**: Error si falla la carga de configuraciones

### `EspeculApp.destroy()`

Destruye la instancia y limpia recursos (intervalos, event listeners).

- **Retorna**: `void`

### `EspeculApp.isReady()`

Verifica si la aplicación está inicializada.

- **Retorna**: `boolean`

### `EspeculApp.version`

Versión actual de la librería.

- **Tipo**: `string`
- **Valor**: `"1.2.0"`

## 📁 Estructura de Archivos

```
especulapp/
├── index.html                      # Estructura HTML de la aplicación
├── app.js                          # Librería principal (encapsulada)
├── styles.css                      # Estilos de la aplicación
├── configuracion_eleccion.json     # Configuración de frentes y escenarios
├── configuracion_grupos.json       # Configuraciones de grupos electorales (múltiples)
├── simulacion/                     # Datos del servidor por configuración
│   ├── config_1/
│   │   └── datos_servidor.json    # Datos para configuración 1
│   └── config_2/
│       └── datos_servidor.json    # Datos para configuración 2
├── perfiles/                       # Perfiles electorales (elección anterior) por configuración
│   └── config_1/
│       └── perfiles.json           # Perfiles para configuración 1
├── js/
│   └── plotly-3.1.2.min.js        # Librería Plotly para gráficos de perfiles
├── img/
│   ├── icono.svg                   # Icono de la aplicación
│   ├── icono128.png
│   ├── icono512.png
│   └── clusteres/                  # Imágenes de grupos/clusters
│       ├── cluster_grupo_1.webp
│       ├── cluster_grupo_2.webp
│       └── ...
├── service-worker.js               # Service Worker para PWA
├── manifest.json                   # Manifiesto de la PWA
├── API.md                          # Documentación completa de la API
└── README.md                       # Este archivo
```

## ⚙️ Configuración

### configuracion_eleccion.json

Define los frentes políticos y escenarios de votación:

```json
{
  "eleccion": {
    "nombre": "Elección 2023",
    "fecha": "2023-10-22",
    "frentes": [
      {
        "id": "frente_1",
        "nombre": "Frente A",
        "color": "#3498db"
      }
    ],
    "escenarios": [
      {
        "id": "escenario_1",
        "nombre": "Optimista",
        "porcentajes": {
          "frente_1": 45,
          "blancos": 5
        }
      }
    ]
  }
}
```

### configuracion_grupos.json

Define múltiples configuraciones de grupos electorales:

```json
{
  "configuraciones": [
    {
      "id": "config_1",
      "nombre": "Clústeres provinciales",
      "grupos": [
        {
          "id": "grupo_1",
          "nombre": "Clúster 1",
          "electores": 135668,
          "imagen": "img/clusteres/cluster_grupo_1.webp",
          "perfil": true
        },
        {
          "id": "grupo_2",
          "nombre": "Clúster 2",
          "electores": 329783,
          "imagen": "img/clusteres/cluster_grupo_2.webp",
          "perfil": true
        }
      ]
    },
    {
      "id": "config_2",
      "nombre": "Proximidad territorial",
      "grupos": [
        {
          "id": "grupo_1",
          "nombre": "Ciudad de Rosario",
          "electores": 820000,
          "imagen": null,
          "perfil": false
        },
        {
          "id": "grupo_2",
          "nombre": "Cordón Industrial",
          "electores": 280000,
          "imagen": null,
          "perfil": false
        }
      ]
    }
  ]
}
```

### Datos del Servidor (por configuración)

Los datos en tiempo real se organizan por configuración:

**Ruta**: `simulacion/{config_id}/datos_servidor.json`

Ejemplo para `simulacion/config_1/datos_servidor.json`:

```json
{
  "timestamp": "2025-10-25T14:30:00Z",
  "actualizacion": "Última actualización: 14:30hs",
  "grupos_con_datos": [
    {
      "id": "grupo_2",
      "electores": 329783,
      "asistentes": 245000,
      "nulos": 4900,
      "blancos": 7350,
      "votosValidos": 232750,
      "frentes": {
        "frente_1": 102410,
        "frente_2": 65215,
        "frente_3": 48913,
        "otros": 16212
      },
      "porcentaje_escrutado": 78.5
    }
  ]
}
```

**Nota**: Cada configuración tiene su propio archivo de datos del servidor en su respectiva carpeta.

### Perfiles Electorales (Elección Anterior)

Los perfiles muestran resultados de elecciones anteriores con gráficos interactivos de Plotly:

**Ruta**: `perfiles/{config_id}/perfiles.json`

Ejemplo para `perfiles/config_1/perfiles.json`:

```json
[
  {
    "id": "grupo_1",
    "valores": {
      "JXC": 0.28,
      "FDT": 0.42,
      "FAP": 0.18,
      "BLANCOS": 0.05,
      "NULOS": 0.03,
      "OTROS": 0.04
    }
  },
  {
    "id": "grupo_2",
    "valores": {
      "JXC": 0.35,
      "FDT": 0.38,
      "FAP": 0.15,
      "BLANCOS": 0.06,
      "NULOS": 0.02,
      "OTROS": 0.04
    }
  }
]
```

**Características**:
- Los valores son proporciones (suman 1.0)
- Se muestran como gráficos polares con Plotly
- Los gráficos se renderizarán solo si el grupo tiene `"perfil": true`
- Independiente del sistema de imágenes

### Imágenes de Grupos

Las imágenes representativas de grupos se configuran opcionalmente:

**Propiedad**: `imagen` en cada grupo de `configuracion_grupos.json`

```json
{
  "id": "grupo_1",
  "nombre": "Clúster 1",
  "electores": 135668,
  "imagen": "img/clusteres/cluster_grupo_1.webp",  // Ruta a la imagen o null
  "perfil": true  // Si tiene gráfico de perfil electoral
}
```

**Características**:
- Formato recomendado: WebP para mejor rendimiento
- Si `imagen` es `null`, no se muestra imagen
- Si `perfil` es `true`, se renderiza gráfico de elección anterior
- Layout responsivo de 2 columnas (40% imagen, 60% perfil) o 1 columna si falta alguno

## 🔧 Desarrollo

### Requisitos

- Python 3 (para servidor de desarrollo)
- Navegador moderno con soporte ES6+

### Iniciar Servidor de Desarrollo

```bash
cd especulapp
python -m http.server 8000
```

Luego abre http://localhost:8000 en tu navegador.

### Estructura del Código

El código está encapsulado en un IIFE (Immediately Invoked Function Expression):

```javascript
const EspeculApp = (function() {
    'use strict';
    
    // ⚠️ Variables privadas - NO son accesibles desde fuera
    let configEleccion = null;
    let configGrupos = null;
    let configGrupoActiva = null;
    let estadoGrupos = {};
    
    // ⚠️ Funciones privadas - NO son accesibles desde fuera
    function cargarConfiguraciones() { ... }
    function renderizarUI() { ... }
    function calcularResultados() { ... }
    function cambiarConfiguracionGrupos(configId) { ... }
    
    // ✅ API Pública - Accesible desde EspeculApp.*
    return {
        init,
        destroy,
        isReady,
        version: '1.1.0'
    };
})();
```

### Agregar Nuevas Funcionalidades

1. **Funcionalidad privada** (solo interna):

```javascript
// Dentro del IIFE, después de las otras funciones privadas
function miFuncionPrivada() {
    // Tu código aquí
}
```

2. **Funcionalidad pública** (expuesta en la API):

```javascript
// Dentro del IIFE
function miFuncionPublica() {
    // Tu código aquí
}

// En el objeto de retorno
return {
    init,
    destroy,
    isReady,
    miFuncionPublica,  // ← Agregar aquí
    version: '1.0.0'
};
```

3. **Actualizar documentación** en `API.md`

## 🔄 Múltiples Configuraciones de Grupos

### Funcionamiento

La aplicación permite definir y seleccionar entre múltiples configuraciones de grupos electorales. Cada configuración:

- ✅ Tiene su propio conjunto de grupos con IDs, nombres y cantidades de electores
- ✅ Mantiene un estado independiente en localStorage
- ✅ Consulta sus propios datos del servidor desde `simulacion/{config_id}/`
- ✅ No comparte valores con otras configuraciones

### Selector de Configuraciones

Un `<select>` permite cambiar entre configuraciones:

```html
<select id="selector-configuracion-grupos">
  <option value="config_1">Clústeres provinciales</option>
  <option value="config_2">Proximidad territorial</option>
</select>
```

### Persistencia Independiente

Cada configuración guarda su estado en una clave diferente de localStorage:

```javascript
// Configuración 1
localStorage.getItem('especulapp_estado_config_1')

// Configuración 2
localStorage.getItem('especulapp_estado_config_2')
```

### Datos del Servidor por Configuración

La aplicación consulta la ruta específica según la configuración activa:

```javascript
// Configuración activa: config_1
fetch('simulacion/config_1/datos_servidor.json')

// Configuración activa: config_2
fetch('simulacion/config_2/datos_servidor.json')
```

### Agregar Nueva Configuración

1. **Agregar en `configuracion_grupos.json`**:

```json
{
  "configuraciones": [
    {
      "id": "config_3",
      "nombre": "Nueva Configuración",
      "grupos": [
        { "id": "grupo_1", "nombre": "Grupo A", "electores": 50000 }
      ]
    }
  ]
}
```

2. **Crear carpeta y archivo de datos**:

```bash
mkdir -p simulacion/config_3
# Crear simulacion/config_3/datos_servidor.json
```

3. **Actualizar Service Worker** (`service-worker.js`):

```javascript
JSON: [
    './configuracion_eleccion.json',
    './configuracion_grupos.json',
    './simulacion/config_1/datos_servidor.json',
    './simulacion/config_2/datos_servidor.json',
    './simulacion/config_3/datos_servidor.json',  // ← Agregar
    './manifest.json'
]
```

4. **Incrementar versión del caché JSON**:

```javascript
CACHE_VERSIONS = {
    JSON: '1.1.1'  // ← Incrementar
}
```

## 🎨 Personalización

### Estilos

Modifica `styles.css`. La aplicación usa CSS Custom Properties para facilitar la personalización:

```css
:root {
    --primary-color: #669dea;
    --background-main: #0f1419;
    --card-background: #1a1f26;
    /* ... más variables */
}
```

### Colores de Frentes

Define los colores en `configuracion_eleccion.json`:

```json
{
  "frentes": [
    {
      "id": "frente_1",
      "nombre": "Frente A",
      "color": "#3498db"  // ← Personaliza aquí
    }
  ]
}
```

## � Características Técnicas

- **Sin dependencias externas**: Vanilla JavaScript puro
- **Patrón Módulo**: IIFE con closure para encapsulación
- **Promesas y Async/Await**: Para operaciones asíncronas
- **localStorage**: Persistencia automática del estado
- **Polling inteligente**: Se pausa cuando la pestaña no está visible
- **Responsive Design**: Grid CSS y media queries
- **Sistema de Modales**: Dialogs personalizados basados en promesas

### 📱 Progressive Web App (PWA)

EspeculApp funciona como una PWA completa:

**Instalación:**
- En móviles: "Agregar a pantalla de inicio"
- En desktop: Click en el ícono de instalación en la barra de direcciones

**Caché Inteligente:**
- Sistema de caché versionado por grupos (HTML, CSS, JS, JSON, imágenes)
- Cada grupo se actualiza independientemente
- Solo se re-descargan los recursos que realmente cambiaron

**Offline First:**
```javascript
// La app funciona completamente sin internet
// Los datos se sirven desde caché local
// datos_servidor.json se actualiza cuando hay conexión
```

**Actualizaciones selectivas:**
```javascript
// ¿Modificaste solo CSS? Incrementa solo esa versión
CACHE_VERSIONS = {
    HTML: '1.0.0',
    CSS: '1.0.1',  // ← Solo esto cambió
    JS: '1.0.0',
    JSON: '1.0.0',
    IMG: '1.0.0'
};
```

📖 **Guía completa**: Ver [PWA.md](PWA.md) para documentación detallada sobre el sistema de caché y versionado.

### Sistema de Modales

La aplicación incluye un sistema de modales reutilizable que reemplaza los `alert()` y `confirm()` nativos:

```javascript
// Confirmación simple
try {
    await confirmar('¿Deseas continuar?', 'Confirmación');
    // Usuario aceptó
} catch (error) {
    // Usuario canceló
}

// Alerta informativa (no se puede cancelar)
await alerta('Operación exitosa', '✅ Éxito');

// Acción peligrosa (botón rojo)
try {
    await confirmarAccionPeligrosa('Esto eliminará todos los datos');
    eliminarTodosDatos();
} catch (error) {
    console.log('Eliminación cancelada');
}
```

**Características:**
- ✅ Basado en promesas (async/await)
- ✅ Cierre con ESC o clic fuera
- ✅ Botones personalizables (primary, danger, success)
- ✅ Reject cuando el usuario cancela
- ✅ Emojis soportados en títulos y mensajes

## �📊 Características Técnicas

- **Sin dependencias externas**: Vanilla JavaScript puro
- **Patrón Módulo**: IIFE con closure para encapsulación
- **Promesas y Async/Await**: Para operaciones asíncronas
- **localStorage**: Persistencia automática del estado
- **Polling inteligente**: Se pausa cuando la pestaña no está visible
- **Responsive Design**: Grid CSS y media queries

## 🔒 Seguridad y Privacidad

- **No tracking**: No envía datos a servidores externos
- **localStorage local**: Todos los datos se guardan en el navegador del usuario
- **Sin eval()**: No ejecuta código dinámico
- **CSP compatible**: Puede usarse con Content Security Policy estricto

## 🐛 Debugging

### Verificar Estado en Consola

```javascript
// Verificar si está inicializada
EspeculApp.isReady();

// Versión
EspeculApp.version;

// Ver errores de carga
// Revisar Network tab para ver si los JSON se cargan correctamente
```

### Problemas Comunes

**La aplicación no se inicializa:**
- Verificar que los archivos JSON existen y son válidos
- Revisar la consola del navegador por errores
- Verificar que el DOM esté completamente cargado

**El estado no se guarda:**
- Verificar que localStorage esté habilitado
- Revisar la configuración de privacidad del navegador

**Los datos del servidor no se actualizan:**
- Verificar que `datos_servidor.json` exista
- El polling ocurre cada 60 segundos
- Revisar la consola por errores de fetch

## 📝 Licencia

MIT License - Ver archivo LICENSE para más detalles.

## 👥 Contribuir

Para reportar bugs o solicitar features:
1. Abre un issue en el repositorio
2. Describe el problema o feature detalladamente
3. Incluye ejemplos de código si es posible

## 📞 Soporte

Para soporte, contactar al equipo de Ciudad Futura.

---

**Desarrollado por Ciudad Futura** | Santa Fe, Argentina  
**Última actualización**: Octubre 2025
