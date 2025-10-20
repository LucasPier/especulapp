# EspeculApp - API Documentation

## Descripción
EspeculApp es una librería JavaScript encapsulada para simular escenarios electorales de Ciudad Futura (Santa Fe, Argentina). La aplicación combina datos en tiempo real con simulaciones interactivas.

## Instalación

Incluye los archivos necesarios en tu HTML:

```html
<link rel="stylesheet" href="styles.css">
<script src="app.js"></script>
```

## API Pública

La librería expone un objeto global `EspeculApp` con los siguientes métodos:

### `EspeculApp.init()`

Inicializa la aplicación. Este método debe ser llamado después de que el DOM esté listo.

**Retorna:** `Promise<void>`

**Ejemplo:**
```javascript
// Inicialización automática (por defecto)
// La aplicación se inicializa automáticamente cuando el DOM está listo

// Inicialización manual
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await EspeculApp.init();
        console.log('Aplicación lista');
    } catch (error) {
        console.error('Error al inicializar:', error);
    }
});
```

### `EspeculApp.destroy()`

Destruye la instancia de la aplicación y limpia todos los recursos (intervalos, event listeners).

**Retorna:** `void`

**Ejemplo:**
```javascript
// Destruir la aplicación antes de navegar a otra página
window.addEventListener('beforeunload', () => {
    EspeculApp.destroy();
});
```

### `EspeculApp.isReady()`

Verifica si la aplicación está inicializada y lista para usar.

**Retorna:** `boolean`

**Ejemplo:**
```javascript
if (EspeculApp.isReady()) {
    console.log('La aplicación está lista');
} else {
    console.log('La aplicación no está inicializada');
}
```

### `EspeculApp.version`

Versión actual de la librería.

**Tipo:** `string`

**Ejemplo:**
```javascript
console.log('Versión de EspeculApp:', EspeculApp.version);
```

## Uso Básico

### Integración en una aplicación existente

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mi Aplicación</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Tu contenido HTML aquí -->
    <div id="app-container">
        <!-- Estructura HTML de EspeculApp -->
    </div>

    <script src="app.js"></script>
    <script>
        // La aplicación se inicializa automáticamente
        // pero puedes verificar su estado:
        window.addEventListener('load', () => {
            if (EspeculApp.isReady()) {
                console.log('EspeculApp v' + EspeculApp.version + ' está listo');
            }
        });
    </script>
</body>
</html>
```

### Prevención de conflictos

La librería está completamente encapsulada:
- **Sin variables globales contaminantes**: Todo el código está dentro del closure del IIFE
- **Solo un objeto global**: `EspeculApp`
- **No interfiere con otras librerías**: No modifica prototipos ni objetos nativos

### Inicialización Condicional

Si necesitas controlar cuándo se inicializa la aplicación:

```javascript
// Deshabilitar auto-inicialización eliminando el código al final de app.js
// Luego inicializar manualmente:

async function iniciarCuandoSeaNecesario() {
    // Tu lógica aquí
    if (algunaCondicion) {
        await EspeculApp.init();
    }
}
```

## Requisitos

### Archivos de Configuración

La aplicación requiere los siguientes archivos JSON en el mismo directorio:

1. **configuracion_eleccion.json**: Define frentes, escenarios y porcentajes
2. **configuracion_grupos.json**: Define grupos electorales y número de electores
3. **datos_servidor.json**: Proporciona datos en tiempo real (opcional)

### Estructura HTML Requerida

El HTML debe incluir los siguientes elementos con IDs específicos:

- `#modal-dialogo`: Modal para confirmaciones y alertas
- `#grupos-grid`: Contenedor para las tarjetas de grupos
- `#grafico-resultados`: Contenedor para el gráfico de resultados globales
- `#incluir-blancos`: Switch para incluir/excluir blancos como válidos
- Y otros elementos según se definen en `index.html`

## Ciclo de Vida

```
1. DOM Ready
   ↓
2. EspeculApp.init() llamado automáticamente
   ↓
3. Cargar configuraciones (JSON)
   ↓
4. Cargar datos del servidor (si existen)
   ↓
5. Cargar estado desde localStorage
   ↓
6. Inicializar estado de grupos
   ↓
7. Renderizar UI
   ↓
8. Iniciar polling (cada 60s)
   ↓
9. Aplicación lista (isInitialized = true)
```

## Persistencia de Datos

La aplicación guarda automáticamente el estado en `localStorage`:

- **Key**: `especulapp_estado` - Estado de simulaciones
- **Key**: `especulapp_switch_blancos` - Preferencia de blancos como válidos

## Polling Automático

La aplicación consulta `datos_servidor.json` cada 60 segundos para actualizar datos en tiempo real. El polling se pausa cuando la pestaña no está visible.

## Eventos Personalizados

La aplicación no emite eventos personalizados actualmente, pero todas las interacciones se manejan internamente.

## Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- **JavaScript**: ES6+ (async/await, Promises, arrow functions)
- **No requiere**: jQuery, React, Vue u otros frameworks

## Troubleshooting

### La aplicación no se inicializa

```javascript
// Verificar en la consola
EspeculApp.isReady(); // ¿Retorna false?

// Revisar errores de carga de JSON
// Verificar que los archivos existan en el servidor
```

### Conflictos con otras librerías

La aplicación está encapsulada, pero asegúrate de:
- No tener otros elementos con los mismos IDs
- No modificar el objeto global `EspeculApp`

### Estado no se guarda

Verifica que `localStorage` esté habilitado en el navegador.

## Soporte

Para reportar bugs o solicitar features, contactar al equipo de Ciudad Futura.

---

**Versión**: 1.0.0  
**Última actualización**: Octubre 2025
