# 📱 Guía de Progressive Web App (PWA)

## 🎯 ¿Qué es una PWA?

EspeculApp ahora funciona como una **Progressive Web App**, lo que significa que puede:
- ✅ **Funcionar sin conexión** a internet
- ✅ **Instalarse** en dispositivos móviles y de escritorio
- ✅ **Actualizarse automáticamente** cuando hay nuevas versiones
- ✅ **Cargarse instantáneamente** desde la caché

---

## 🚀 Instalación

### En Android (Chrome, Edge, Samsung Internet)
1. Abre la aplicación en el navegador
2. Toca el menú (⋮) → **"Agregar a pantalla de inicio"** o **"Instalar app"**
3. Confirma la instalación
4. ¡Listo! El ícono aparecerá en tu pantalla de inicio

### En iOS (Safari)
1. Abre la aplicación en Safari
2. Toca el botón de compartir (□↑)
3. Selecciona **"Agregar a pantalla de inicio"**
4. Personaliza el nombre si lo deseas
5. Toca **"Añadir"**

### En Desktop (Chrome, Edge, Firefox)
1. Abre la aplicación en el navegador
2. Busca el ícono de instalación (⊕) en la barra de direcciones
3. Click en **"Instalar"**
4. La app se abrirá en su propia ventana

---

## 💾 Sistema de Caché Versionado

### ¿Cómo funciona?

La aplicación usa un **sistema de caché inteligente por grupos de recursos**. Cada tipo de archivo (HTML, CSS, JS, JSON, imágenes) tiene su propia versión independiente.

### Grupos de Caché

```javascript
CACHE_VERSIONS = {
    HTML: '1.0.0',    // Archivos HTML
    CSS: '1.0.0',     // Hojas de estilo
    JS: '1.0.0',      // Scripts JavaScript
    JSON: '1.0.0',    // Configuraciones y datos
    IMG: '1.0.0'      // Imágenes e íconos
}
```

### ¿Por qué grupos separados?

**Ventajas:**
- ✅ **Actualizaciones selectivas**: Si solo cambias CSS, solo se actualiza ese grupo
- ✅ **Menor consumo de datos**: No se re-descargan archivos innecesarios
- ✅ **Más rápido**: Solo se actualizan los recursos que realmente cambiaron
- ✅ **Control granular**: Puedes versionar cada tipo de recurso independientemente

---

## 🔧 Guía para Desarrolladores

### Cómo actualizar la caché cuando modificas archivos

#### Ejemplo 1: Modificaste `styles.css`

```javascript
// En service-worker.js, solo incrementa la versión de CSS
const CACHE_VERSIONS = {
    HTML: '1.0.0',    // No cambió
    CSS: '1.0.1',     // ← INCREMENTADO (antes era 1.0.0)
    JS: '1.0.0',      // No cambió
    JSON: '1.0.0',    // No cambió
    IMG: '1.0.0'      // No cambió
};
```

**¿Qué pasa?**
1. El Service Worker detecta que la versión de CSS cambió
2. Solo actualiza el caché `especulapp-css-v1.0.1`
3. Los demás cachés permanecen sin tocar
4. El caché obsoleto `especulapp-css-v1.0.0` se elimina automáticamente

#### Ejemplo 2: Modificaste `app.js` y `configuracion_eleccion.json`

```javascript
const CACHE_VERSIONS = {
    HTML: '1.0.0',    
    CSS: '1.0.1',     
    JS: '1.0.1',      // ← INCREMENTADO
    JSON: '1.0.1',    // ← INCREMENTADO
    IMG: '1.0.0'      
};
```

**¿Qué pasa?**
- Solo se actualizan los grupos JS y JSON
- CSS, HTML e imágenes permanecen cacheados

#### Ejemplo 3: Release mayor con cambios en todo

```javascript
const CACHE_VERSIONS = {
    HTML: '2.0.0',    // ← Versión mayor
    CSS: '2.0.0',     // ← Versión mayor
    JS: '2.0.0',      // ← Versión mayor
    JSON: '2.0.0',    // ← Versión mayor
    IMG: '2.0.0'      // ← Versión mayor (si agregaste/cambiaste imágenes)
};
```

---

## 📋 Versionado Semántico

Recomendamos usar [Semantic Versioning](https://semver.org/):

- **X.0.0** (Major): Cambios importantes, breaking changes
- **0.X.0** (Minor): Nuevas funcionalidades compatibles
- **0.0.X** (Patch): Correcciones de bugs, cambios menores

**Ejemplos:**
```
1.0.0 → 1.0.1  (Fix de bug en CSS)
1.0.1 → 1.1.0  (Nueva funcionalidad en JS)
1.1.0 → 2.0.0  (Rediseño completo)
```

---

## 🔄 Estrategias de Caché

### Cache First (predeterminada para la mayoría de recursos)
```
1. Buscar en caché
2. Si existe → Devolver desde caché
3. Si no existe → Obtener de la red y cachear
```

**Ventajas:**
- ⚡ Carga instantánea
- 📱 Funciona offline

### Network First (para `datos_servidor.json`)
```
1. Intentar obtener de la red
2. Si funciona → Actualizar caché y devolver
3. Si falla → Devolver desde caché
```

**Ventajas:**
- 🔄 Datos siempre actualizados
- 📡 Fallback a caché si no hay internet

### Stale-While-Revalidate (para otros recursos)
```
1. Devolver desde caché inmediatamente
2. En segundo plano, actualizar desde la red
3. La próxima vez tendrá la versión actualizada
```

**Ventajas:**
- ⚡ Velocidad máxima
- 🔄 Actualización en segundo plano

---

## 🛠️ Debugging

### Ver cachés en Chrome DevTools

1. Abre **DevTools** (F12)
2. Ve a la pestaña **Application**
3. En el menú izquierdo, expande **Cache Storage**
4. Verás todos los cachés versionados:
   ```
   ├─ especulapp-html-v1.0.0
   ├─ especulapp-css-v1.0.1
   ├─ especulapp-js-v1.0.0
   ├─ especulapp-json-v1.0.0
   └─ especulapp-img-v1.0.0
   ```

### Ver Service Worker activo

1. En **DevTools** → **Application**
2. Click en **Service Workers**
3. Verás el estado del SW:
   - ✅ Activated and running
   - 🔄 Waiting to activate
   - ⏸️ Stopped

### Forzar actualización del Service Worker

**Opción 1: DevTools**
1. **Application** → **Service Workers**
2. Check **"Update on reload"**
3. Recarga la página (Ctrl+R)

**Opción 2: Manualmente**
1. **Application** → **Service Workers**
2. Click en **"Unregister"**
3. Recarga la página

**Opción 3: Limpiar todo**
```javascript
// En la consola del navegador
navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
        registration.unregister();
    }
});
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
```

---

## 📊 Monitoreo en Producción

### Ver versiones de caché en consola

El Service Worker logea todas las operaciones:
```
[SW] Instalando Service Worker... {HTML: '1.0.0', CSS: '1.0.1', ...}
[SW] Cacheando grupo CSS (especulapp-css-v1.0.1): [...]
[SW] ✅ Instalación completada
[SW] Activando Service Worker...
[SW] 🗑️ Eliminando caché obsoleto: especulapp-css-v1.0.0
[SW] ✅ 1 caché(s) obsoleto(s) eliminado(s)
```

### Comunicación con el Service Worker

Puedes obtener info del SW desde la página:

```javascript
// Enviar mensaje al Service Worker
navigator.serviceWorker.controller.postMessage({
    action: 'getCacheInfo'
});

// Recibir respuesta
navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Info del caché:', event.data);
    // { versions: {...}, cacheNames: {...} }
});
```

---

## ⚡ Optimización

### Reducir tamaño de caché

Si la caché se vuelve muy grande, considera:
1. No cachear archivos muy grandes
2. Usar compresión (gzip/brotli) en el servidor
3. Minificar CSS y JS antes de cachear

### Actualización automática

El Service Worker se actualiza automáticamente cuando:
- El usuario visita la app después de 24 horas
- Detecta cambios en `service-worker.js`
- Cambias las versiones en `CACHE_VERSIONS`

---

## 🔒 Seguridad

### HTTPS Requerido

Los Service Workers **solo funcionan con HTTPS** (excepto en `localhost` para desarrollo).

### Scope del Service Worker

El SW está limitado a:
```javascript
scope: '/cf/2023/especulapp/'
```

Solo puede interceptar peticiones dentro de ese directorio.

---

## 📝 Checklist de Actualización

Cuando modificas archivos:

- [ ] Identifica qué archivos cambiaron
- [ ] Abre `service-worker.js`
- [ ] Incrementa la versión del/los grupo(s) correspondiente(s)
- [ ] Guarda el archivo
- [ ] Despliega a producción
- [ ] Verifica en DevTools que el SW se actualizó
- [ ] Verifica que los cachés obsoletos se eliminaron
- [ ] Prueba que la app funcione offline

---

## 🆘 Problemas Comunes

### La app no se actualiza

**Solución:**
1. Verifica que incrementaste las versiones en `service-worker.js`
2. Haz hard reload (Ctrl+Shift+R)
3. Desregistra el SW manualmente si es necesario

### Caché no funciona offline

**Solución:**
1. Verifica que el SW esté registrado: DevTools → Application → Service Workers
2. Verifica que los archivos estén en caché: DevTools → Application → Cache Storage
3. Revisa la consola por errores

### El SW no se instala

**Posibles causas:**
- No estás en HTTPS (o localhost)
- Hay errores de sintaxis en `service-worker.js`
- El navegador no soporta Service Workers

---

## 📚 Recursos Adicionales

- [MDN: Service Worker API](https://developer.mozilla.org/es/docs/Web/API/Service_Worker_API)
- [Google: Workbox (librería de SW)](https://developers.google.com/web/tools/workbox)
- [PWA Builder](https://www.pwabuilder.com/)

---

**Última actualización**: Octubre 2025  
**Versión de la guía**: 1.0.0
