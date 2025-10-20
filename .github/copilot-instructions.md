# EspeculApp - AI Coding Instructions

## Project Overview
EspeculApp is a **vanilla JavaScript electoral simulation library** for Ciudad Futura (Santa Fe, Argentina). It simulates election scenarios with real-time data integration, allowing users to model different voting patterns across regional groups.

**Architecture**: The application is encapsulated in an IIFE (Immediately Invoked Function Expression) that exposes a single global object `EspeculApp` with public API methods.

## Module Structure

### Global Object: `EspeculApp`
The entire application is wrapped in a closure pattern:
```javascript
const EspeculApp = (function() {
    'use strict';
    
    // Private variables and functions
    let configEleccion = null;
    let configGrupos = null;
    // ... more private state
    
    // Private functions
    function cargarConfiguraciones() { ... }
    function renderizarUI() { ... }
    // ... more private functions
    
    // Public API
    return {
        init,      // Initialize the app
        destroy,   // Cleanup resources
        isReady,   // Check if initialized
        version: '1.0.0'
    };
})();
```

### No Global Pollution
- **All variables are private** within the closure
- **Only `EspeculApp` object is global**
- Safe for integration with other applications
- No prototype modifications or global namespace pollution

## Three-Tier Data Model
1. **Configuration Files (Static)**: `configuracion_eleccion.json` defines election metadata (frentes/parties, scenarios with vote percentages), `configuracion_grupos.json` defines electoral groups/regions with elector counts
2. **Real-Time Data**: `datos_servidor.json` provides live results for groups with actual vote counts (polling every 60s)
3. **Simulation State**: `estadoGrupos` object holds user-configured scenarios for groups without real data, persisted to `localStorage`

### Hybrid Display Logic
- Groups in `gruposConDatosReales` Set: Render read-only cards showing live results from `datos_servidor.json`
- Other groups: Render interactive sliders/controls for user simulation
- The app **dynamically switches** card types when `datos_servidor.json` updates

### State Management Pattern
```javascript
estadoGrupos[grupoId] = {
  asistencia: 75,           // Attendance %
  votosNulos: 2,            // Null votes %
  votosBlancos: 6,          // Blank votes %
  frentes: {                // Party vote proportions (slider values, not percentages)
    frente_1: 40,
    frente_2: 30,
    ...
  },
  escenarioActivo: 'escenario_1'  // Active predefined scenario
}
```

**Critical**: `frentes` values are proportional weights, NOT final percentages. They're normalized in `calcularPorcentajesNormalizados()` based on `incluirBlancosComoValidos` flag.

## Development Workflow

### Starting Development Server
```bash
cd /d/xampp_old/htdocs/cf/2023/especulapp
python -m http.server 8000
# Navigate to http://localhost:8000
```

### Making Code Changes
**CRITICAL**: All code modifications must be made inside the IIFE closure:
- Variables: Declare at the top of the closure (private)
- Functions: Define within the closure (private)
- Public API: Only modify the returned object if exposing new functionality

### Adding New Features
1. Implement private function inside the closure
2. Test functionality
3. If feature needs external access, add to public API return object
4. Update API.md documentation

## Common Patterns

### Modal System (Promise-Based)
**ALWAYS** use these three functions instead of `alert()`/`confirm()`:
```javascript
await alerta(mensaje, titulo)                    // Info dialog
await confirmar(mensaje, titulo)                 // Yes/No confirmation
await confirmarAccionPeligrosa(mensaje, titulo)  // Destructive actions (red button)
```
All return Promises, reject on cancel. Example:
```javascript
try {
  await confirmarAccionPeligrosa('¿Resetear todo?');
  // User confirmed, proceed
} catch (error) {
  if (error.cancelado) return; // User canceled
}
```

### UI Update Strategy
- **Never recreate DOM unnecessarily**: Check if card type changed before replacing (`actualizarTarjetaGrupo`)
- For real-data cards: Update inner values only via `actualizarTarjetaDatosReales()`
- For simulation cards: Event listeners persist, update via `actualizarLabelsGrupo()`

### Calculation Logic (`calcularYActualizarResultados`)
1. Compute valid votes considering `incluirBlancosComoValidos` toggle
2. Normalize slider proportions to final percentages
3. Aggregate results across all groups
4. Render global bar chart in `#grafico-resultados`

### File Naming & Organization
- No build process, no modules - single `app.js` (1766 lines)
- JSON files must be in root for `fetch()` calls
- Styles use CSS custom properties in `:root` (see `styles.css:6-16`)

## Common Patterns

### Formatting Helpers
```javascript
formatearNumero(123456)  // Returns "123.456" (European notation)
```

### Color Indicators
Use `<span class="color-indicator" style="background-color: ${color}"></span>` for party colors, NOT emoji for frentes (only `❌` for nulos)

### Event Listener Attachment
When creating cards, call `agregarEventListeners(card, grupoId)` which attaches:
- Range input handlers → update state → normalize → update labels → save localStorage → recalculate
- Scenario button handlers → apply preset percentages

## Integration Points

### Polling System
- `inicializarPolleo()`: 60-second interval calling `cargarDatosServidor()`
- `inicializarDeteccionVisibilidad()`: Re-fetch on tab focus after >1 minute

### localStorage Keys
- `especulapp_estado`: Serialized `estadoGrupos` object
- `especulapp_switch_blancos`: Boolean for `incluirBlancosComoValidos`

## Critical Files
- `app.js:28-178`: Modal system (mostrarDialogo, confirmar, alerta, confirmarAccionPeligrosa)
- `app.js:183-192`: Initialization sequence in DOMContentLoaded
- `app.js:456-475`: `aplicarEscenario()` - maps scenario percentages to group state
- `app.js:968-1027`: `calcularPorcentajesNormalizados()` - handles blanks-as-valid logic
- `index.html:118-131`: Reusable modal structure

## Debugging Tips
- Check console for "Grupos con datos reales" array on load
- If cards don't update, verify `gruposConDatosReales` Set population
- Percentage mismatches? Check `incluirBlancosComoValidos` state
