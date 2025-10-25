/**
 * Service Worker para EspeculApp
 * PWA con sistema de caché versionado por grupos de recursos
 * 
 * SISTEMA DE VERSIONADO:
 * ----------------------
 * Cada grupo de recursos tiene su propia versión independiente.
 * Cuando modificas archivos de un grupo, solo incrementa la versión de ese grupo.
 * 
 * GRUPOS DISPONIBLES:
 * - HTML: Archivos HTML principales
 * - CSS: Hojas de estilo
 * - JS: Scripts JavaScript
 * - JSON: Archivos de configuración y datos
 * - IMG: Imágenes e íconos
 * 
 * EJEMPLO DE USO:
 * ---------------
 * Si modificas styles.css:
 * 1. Incrementa CACHE_VERSIONS.CSS de '1.0.0' a '1.0.1'
 * 2. El SW detectará el cambio y solo actualizará archivos CSS
 * 3. Los demás cachés (JS, HTML, etc.) permanecen intactos
 * 
 * Si modificas app.js Y configuracion_eleccion.json:
 * 1. Incrementa CACHE_VERSIONS.JS a '1.0.1'
 * 2. Incrementa CACHE_VERSIONS.JSON a '1.0.1'
 * 3. Solo esos dos grupos se actualizarán
 */

// ====================================
// CONFIGURACIÓN DE VERSIONES
// ====================================
// ⚠️ IMPORTANTE: Incrementa solo la versión del grupo que modificaste
const CACHE_VERSIONS = {
    HTML: '1.1.1',    // Actualizado: sin cambios estructurales
    CSS: '1.1.1',     // Actualizado: animaciones con transform para reordenamiento
    JS: '1.1.1',      // Actualizado: sistema de renderizado con animaciones FLIP
    JSON: '1.1.0',    // Sin cambios
    IMG: '1.0.0'
};

// Prefijo base para todos los cachés
const CACHE_PREFIX = 'especulapp';

// Nombres completos de cachés (se generan automáticamente)
const CACHE_NAMES = {
    HTML: `${CACHE_PREFIX}-html-v${CACHE_VERSIONS.HTML}`,
    CSS: `${CACHE_PREFIX}-css-v${CACHE_VERSIONS.CSS}`,
    JS: `${CACHE_PREFIX}-js-v${CACHE_VERSIONS.JS}`,
    JSON: `${CACHE_PREFIX}-json-v${CACHE_VERSIONS.JSON}`,
    IMG: `${CACHE_PREFIX}-img-v${CACHE_VERSIONS.IMG}`
};

// ====================================
// GRUPOS DE RECURSOS
// ====================================
// Define qué archivos pertenecen a cada grupo
const CACHE_RESOURCES = {
    HTML: [
        './',
        './index.html',
        './ejemplo-integracion.html'
    ],
    CSS: [
        './styles.css'
    ],
    JS: [
        './app.js'
    ],
    JSON: [
        './configuracion_eleccion.json',
        './configuracion_grupos.json',
        // Datos del servidor por configuración
        './simulacion/config_1/datos_servidor.json',  // Clústeres provinciales
        './simulacion/config_2/datos_servidor.json',  // Proximidad territorial
        './manifest.json'
    ],
    IMG: [
        './img/icono.svg',
        './img/icono128.png',
        './img/icono512.png'
    ]
};

// ====================================
// EVENTO: INSTALL
// ====================================
// Se ejecuta cuando el SW se instala por primera vez
// o cuando hay una nueva versión del SW
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando Service Worker...', CACHE_VERSIONS);
    
    event.waitUntil(
        (async () => {
            try {
                // Cachear recursos por grupo
                for (const [groupName, resources] of Object.entries(CACHE_RESOURCES)) {
                    const cacheName = CACHE_NAMES[groupName];
                    const cache = await caches.open(cacheName);
                    
                    console.log(`[SW] Cacheando grupo ${groupName} (${cacheName}):`, resources);
                    
                    // Intentar cachear cada recurso individualmente para mejor manejo de errores
                    for (const resource of resources) {
                        try {
                            await cache.add(resource);
                        } catch (error) {
                            console.warn(`[SW] No se pudo cachear ${resource}:`, error.message);
                        }
                    }
                }
                
                console.log('[SW] ✅ Instalación completada');
                
                // Activar el nuevo SW inmediatamente sin esperar
                await self.skipWaiting();
                
            } catch (error) {
                console.error('[SW] ❌ Error durante la instalación:', error);
            }
        })()
    );
});

// ====================================
// EVENTO: ACTIVATE
// ====================================
// Se ejecuta cuando el SW se activa
// Aquí limpiamos cachés obsoletos
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando Service Worker...');
    
    event.waitUntil(
        (async () => {
            try {
                // Obtener todos los nombres de cachés existentes
                const cacheNames = await caches.keys();
                
                // Obtener lista de cachés actuales (los que queremos mantener)
                const currentCaches = Object.values(CACHE_NAMES);
                
                // Eliminar cachés obsoletos
                const deletePromises = cacheNames
                    .filter(cacheName => {
                        // Solo procesar cachés de esta app
                        if (!cacheName.startsWith(CACHE_PREFIX)) {
                            return false;
                        }
                        
                        // Eliminar si no está en la lista de cachés actuales
                        return !currentCaches.includes(cacheName);
                    })
                    .map(cacheName => {
                        console.log(`[SW] 🗑️ Eliminando caché obsoleto: ${cacheName}`);
                        return caches.delete(cacheName);
                    });
                
                await Promise.all(deletePromises);
                
                if (deletePromises.length > 0) {
                    console.log(`[SW] ✅ ${deletePromises.length} caché(s) obsoleto(s) eliminado(s)`);
                } else {
                    console.log('[SW] ✅ No hay cachés obsoletos para eliminar');
                }
                
                // Tomar control de todas las páginas inmediatamente
                await self.clients.claim();
                
                console.log('[SW] ✅ Activación completada');
                
            } catch (error) {
                console.error('[SW] ❌ Error durante la activación:', error);
            }
        })()
    );
});

// ====================================
// EVENTO: FETCH
// ====================================
// Intercepta todas las peticiones de red
// Estrategia: Cache First con Network Fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Solo interceptar peticiones del mismo origen
    if (url.origin !== location.origin) {
        return;
    }
    
    event.respondWith(
        (async () => {
            try {
                // ESTRATEGIA ESPECIAL PARA datos_servidor.json
                // Este archivo necesita estar siempre actualizado
                // Ahora incluye rutas dinámicas: simulacion/config_X/datos_servidor.json
                if (url.pathname.endsWith('datos_servidor.json') || 
                    url.pathname.includes('/simulacion/')) {
                    return await fetchWithCacheFallback(request);
                }
                
                // ESTRATEGIA ESTÁNDAR: Cache First
                // Intentar obtener del caché primero
                const cachedResponse = await caches.match(request);
                
                if (cachedResponse) {
                    // console.log(`[SW] 📦 Servido desde caché: ${url.pathname}`);
                    
                    // Actualizar el caché en segundo plano (stale-while-revalidate)
                    event.waitUntil(updateCache(request));
                    
                    return cachedResponse;
                }
                
                // Si no está en caché, obtener de la red
                console.log(`[SW] 🌐 Obteniendo de la red: ${url.pathname}`);
                return await fetchWithCacheFallback(request);
                
            } catch (error) {
                console.error(`[SW] ❌ Error al procesar fetch para ${url.pathname}:`, error);
                
                // Si todo falla, devolver una respuesta de error amigable
                return new Response(
                    JSON.stringify({
                        error: 'No disponible offline',
                        message: 'Este recurso no está disponible sin conexión'
                    }),
                    {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
        })()
    );
});

// ====================================
// FUNCIONES AUXILIARES
// ====================================

/**
 * Intenta obtener de la red y cachea el resultado
 * Si falla, intenta obtener del caché
 */
async function fetchWithCacheFallback(request) {
    try {
        const response = await fetch(request);
        
        // Solo cachear respuestas exitosas
        if (response && response.status === 200) {
            // Determinar en qué caché guardar según el tipo de recurso
            const cacheName = getCacheNameForRequest(request);
            
            if (cacheName) {
                const cache = await caches.open(cacheName);
                cache.put(request, response.clone());
            }
        }
        
        return response;
        
    } catch (error) {
        // Si la red falla, intentar obtener del caché
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            console.log(`[SW] 📦 Fallback a caché para: ${request.url}`);
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Actualiza el caché con la versión más reciente de la red
 */
async function updateCache(request) {
    try {
        const response = await fetch(request);
        
        if (response && response.status === 200) {
            const cacheName = getCacheNameForRequest(request);
            
            if (cacheName) {
                const cache = await caches.open(cacheName);
                await cache.put(request, response);
                // console.log(`[SW] 🔄 Caché actualizado: ${request.url}`);
            }
        }
    } catch (error) {
        // No hacer nada si falla la actualización en segundo plano
        // console.warn(`[SW] No se pudo actualizar el caché para ${request.url}`);
    }
}

/**
 * Determina el nombre del caché apropiado según el tipo de recurso
 */
function getCacheNameForRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // HTML
    if (pathname.endsWith('.html') || pathname.endsWith('/')) {
        return CACHE_NAMES.HTML;
    }
    
    // CSS
    if (pathname.endsWith('.css')) {
        return CACHE_NAMES.CSS;
    }
    
    // JS
    if (pathname.endsWith('.js')) {
        return CACHE_NAMES.JS;
    }
    
    // JSON
    if (pathname.endsWith('.json')) {
        return CACHE_NAMES.JSON;
    }
    
    // Imágenes
    if (pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/i)) {
        return CACHE_NAMES.IMG;
    }
    
    return null;
}

// ====================================
// EVENTO: MESSAGE
// ====================================
// Permite comunicación desde la página web al SW
self.addEventListener('message', (event) => {
    console.log('[SW] Mensaje recibido:', event.data);
    
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.action === 'getCacheInfo') {
        event.ports[0].postMessage({
            versions: CACHE_VERSIONS,
            cacheNames: CACHE_NAMES
        });
    }
});

console.log('[SW] Service Worker cargado con versiones:', CACHE_VERSIONS);
