/**
 * EspeculApp - Librería para simulación electoral de Ciudad Futura
 * @module EspeculApp
 */
const EspeculApp = (function() {
    'use strict';
    
    // Variables privadas
    let configEleccion = null;
    let configGrupos = null;
    let estadoGrupos = {};
    let incluirBlancosComoValidos = true;
    let datosServidor = null;
    let gruposConDatosReales = new Set();
    let intervaloPolleoId = null;
    let ultimaConsulta = null;
    let isInitialized = false;

    const STORAGE_KEY = 'especulapp_estado';
    const STORAGE_SWITCH_KEY = 'especulapp_switch_blancos';

    // ========================================
    // SISTEMA DE MODALES REUTILIZABLES
    // ========================================
    // 
    // Sistema de modales personalizables basado en promesas para reemplazar
    // los alert() y confirm() nativos con una interfaz moderna.
    // 
    // FUNCIONES DISPONIBLES:
    // - mostrarDialogo(opciones)              → Modal personalizable completo
    // - confirmar(mensaje, titulo?)           → Confirmación con Sí/No
    // - alerta(mensaje, titulo?)              → Alerta con solo botón Aceptar
    // - confirmarAccionPeligrosa(mensaje, titulo?) → Confirmación con botón rojo
    // 
    // MANEJO DE RESPUESTAS:
    // - resolve(true) cuando el usuario acepta/confirma
    // - reject({cancelado: true, mensaje: string}) cuando cancela/rechaza
    // - La tecla ESC y clic fuera del modal también cancelan
    // 
    // EJEMPLOS DE USO:
    // 
    // 1. Confirmación simple:
    //    try {
    //        await confirmar('¿Deseas continuar?', 'Confirmación');
    //        // Usuario aceptó
    //    } catch (error) {
    //        // Usuario canceló
    //    }
    // 
    // 2. Alerta informativa:
    //    await alerta('Operación exitosa', 'Éxito');
    // 
    // 3. Acción peligrosa:
    //    try {
    //        await confirmarAccionPeligrosa('Esto eliminará todos los datos');
    //        // Usuario confirmó acción peligrosa
    //    } catch (error) {
    //        // Usuario canceló
    //    }
    //
    // ========================================

    /**
     * Muestra un modal de diálogo reutilizable (función base)
     * 
     * @param {Object} opciones - Opciones de configuración del modal
     * @param {string} opciones.titulo - Título del modal
     * @param {string} opciones.mensaje - Mensaje a mostrar
     * @param {string} [opciones.textoAceptar='Aceptar'] - Texto del botón de aceptar
     * @param {string} [opciones.textoCancelar='Cancelar'] - Texto del botón de cancelar (null para ocultar)
     * @param {string} [opciones.tipoAceptar='primary'] - Tipo de botón: 'primary' (azul), 'danger' (rojo), 'success' (verde)
     * @returns {Promise<boolean>} - Promesa que resuelve true si acepta, rechaza con {cancelado: true} si cancela
     * 
     * @example
     * try {
     *     await mostrarDialogo({
     *         titulo: 'Eliminar',
     *         mensaje: '¿Eliminar permanentemente?',
     *         textoAceptar: 'Eliminar',
     *         textoCancelar: 'Conservar',
     *         tipoAceptar: 'danger'
     *     });
     *     // Usuario aceptó
     * } catch (error) {
     *     // Usuario canceló
     * }
     */
    function mostrarDialogo(opciones) {
        return new Promise((resolve, reject) => {
        const {
            titulo = 'Confirmación',
            mensaje = '¿Estás seguro?',
            textoAceptar = 'Aceptar',
            textoCancelar = 'Cancelar',
            tipoAceptar = 'primary'
        } = opciones;

        const modal = document.getElementById('modal-dialogo');
        const modalTitulo = document.getElementById('modal-dialogo-titulo');
        const modalMensaje = document.getElementById('modal-dialogo-mensaje');
        const btnAceptar = document.getElementById('modal-dialogo-btn-aceptar');
        const btnCancelar = document.getElementById('modal-dialogo-btn-cancelar');

        // Validar que los elementos existan
        if (!modal || !modalTitulo || !modalMensaje || !btnAceptar || !btnCancelar) {
            reject(new Error('No se pudo inicializar el modal: elementos no encontrados'));
            return;
        }

        // Configurar contenido
        modalTitulo.textContent = titulo;
        modalMensaje.textContent = mensaje;
        btnAceptar.textContent = textoAceptar;
        btnCancelar.textContent = textoCancelar;

        // Configurar visibilidad del botón cancelar
        if (textoCancelar === null) {
            btnCancelar.style.display = 'none';
        } else {
            btnCancelar.style.display = 'inline-block';
        }

        // Aplicar estilo al botón según el tipo
        btnAceptar.className = 'btn-modal-apply';
        if (tipoAceptar === 'danger') {
            btnAceptar.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        } else if (tipoAceptar === 'success') {
            btnAceptar.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
        } else {
            btnAceptar.style.background = 'linear-gradient(135deg, #669dea 0%, #4b8ba2 100%)';
        }

        // Manejadores de eventos
        const handleAceptar = () => {
            cerrarDialogo();
            resolve(true);
        };

        const handleCancelar = () => {
            cerrarDialogo();
            reject({ cancelado: true, mensaje: 'Usuario canceló la acción' });
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancelar();
            }
        };

        const cerrarDialogo = () => {
            modal.style.display = 'none';
            btnAceptar.removeEventListener('click', handleAceptar);
            btnCancelar.removeEventListener('click', handleCancelar);
            document.removeEventListener('keydown', handleEscape);
            modal.removeEventListener('click', handleClickFuera);
        };

        const handleClickFuera = (e) => {
            if (e.target === modal) {
                handleCancelar();
            }
        };

        // Agregar event listeners
        btnAceptar.addEventListener('click', handleAceptar);
        btnCancelar.addEventListener('click', handleCancelar);
        document.addEventListener('keydown', handleEscape);
        modal.addEventListener('click', handleClickFuera);

        // Mostrar modal
        modal.style.display = 'block';
        });
    }

    /**
     * Muestra un modal de confirmación (wrapper de conveniencia)
     * 
     * @param {string} mensaje - Mensaje de confirmación
     * @param {string} [titulo='Confirmación'] - Título del modal
     * @returns {Promise<boolean>} - Promesa que resuelve true si confirma, rechaza con {cancelado: true} si cancela
     * 
     * @example
     * try {
     *     await confirmar('¿Guardar cambios?', 'Guardar');
     *     guardarCambios();
     * } catch (error) {
     *     console.log('Guardado cancelado');
     * }
     */
    async function confirmar(mensaje, titulo = 'Confirmación') {
        try {
            return await mostrarDialogo({
                titulo,
                mensaje,
                textoAceptar: 'Sí',
                textoCancelar: 'No',
                tipoAceptar: 'primary'
            });
        } catch (error) {
            // Usuario canceló, re-lanzar el error para que se pueda manejar en la función llamadora
            throw error;
        }
    }

    /**
     * Muestra un modal de alerta (solo botón Aceptar, no se puede cancelar)
     * 
     * @param {string} mensaje - Mensaje de la alerta
     * @param {string} [titulo='Aviso'] - Título del modal
     * @returns {Promise<boolean>} - Promesa que siempre resuelve true (no rechaza)
     * 
     * @example
     * await alerta('Operación completada exitosamente', '✅ Éxito');
     * console.log('Usuario cerró la alerta');
     */
    async function alerta(mensaje, titulo = 'Aviso') {
        try {
            return await mostrarDialogo({
                titulo,
                mensaje,
                textoAceptar: 'Aceptar',
                textoCancelar: null,
                tipoAceptar: 'primary'
            });
        } catch (error) {
            // En alertas no hay cancelar, pero por si acaso
            return true;
        }
    }

    /**
     * Muestra un modal de confirmación para acciones peligrosas (botón rojo de advertencia)
     * 
     * @param {string} mensaje - Mensaje de confirmación/advertencia
     * @param {string} [titulo='¿Confirmás que querés continuar?'] - Título del modal
     * @returns {Promise<boolean>} - Promesa que resuelve true si confirma, rechaza con {cancelado: true} si cancela
     * 
     * @example
     * try {
     *     await confirmarAccionPeligrosa(
     *         'Esta acción eliminará todos los datos y no se puede deshacer.',
     *         '⚠️ Acción Peligrosa'
     *     );
     *     eliminarTodosDatos();
     * } catch (error) {
     *     console.log('Eliminación cancelada');
     * }
     */
    async function confirmarAccionPeligrosa(mensaje, titulo = '¿Confirmás que querés continuar?') {
        try {
            return await mostrarDialogo({
                titulo,
                mensaje,
                textoAceptar: 'Sí, continuar',
                textoCancelar: 'Cancelar',
                tipoAceptar: 'danger'
            });
        } catch (error) {
            // Usuario canceló, re-lanzar el error para que se pueda manejar en la función llamadora
            throw error;
        }
    }

    // ========================================
    // FIN SISTEMA DE MODALES
    // ========================================

    // Cargar archivos de configuración
    async function cargarConfiguraciones() {
        try {
        const [respuestaEleccion, respuestaGrupos] = await Promise.all([
            fetch('configuracion_eleccion.json'),
            fetch('configuracion_grupos.json')
        ]);

        configEleccion = await respuestaEleccion.json();
        configGrupos = await respuestaGrupos.json();

        // Mostrar información de la elección en ambos headers
        const infoEleccion = `${configEleccion.eleccion.nombre} - ${configEleccion.eleccion.fecha}`;
        const eleccionInfoMobile = document.getElementById('eleccion-info-mobile');
        const eleccionInfoDesktop = document.getElementById('eleccion-info-desktop');
        
        if (eleccionInfoMobile) {
            eleccionInfoMobile.textContent = infoEleccion;
        }
        if (eleccionInfoDesktop) {
            eleccionInfoDesktop.textContent = infoEleccion;
        }
    } catch (error) {
        await alerta('Error al cargar las configuraciones. Verifica que los archivos JSON existan.', '❌ Error de Carga');
    }
}

// Cargar datos reales desde el servidor (simula consulta a API)
    async function cargarDatosServidor() {
    try {
        const respuesta = await fetch('datos_servidor.json');
        datosServidor = await respuesta.json();
        ultimaConsulta = new Date();
        
        // Actualizar conjunto de grupos con datos reales
        gruposConDatosReales.clear();
        if (datosServidor && datosServidor.grupos_con_datos) {
            datosServidor.grupos_con_datos.forEach(grupo => {
                gruposConDatosReales.add(grupo.id);
            });
        }
        
        // Actualizar UI solo si ya está inicializada (no en la primera carga)
        if (configGrupos && Object.keys(estadoGrupos).length > 0) {
            renderizarUI();
            calcularYActualizarResultados();
            configurarBotonesPromedio(); // Actualizar estado de botones de promedio
        }
    } catch (error) {
        // No mostrar alerta, puede ser que aún no haya datos disponibles
    }
}

// Inicializar polling automático (cada 60 segundos)
    function inicializarPolleo() {
    // Limpiar intervalo anterior si existe
    if (intervaloPolleoId) {
        clearInterval(intervaloPolleoId);
    }
    
    // Consultar cada 60 segundos (solo si la página está visible)
    intervaloPolleoId = setInterval(async () => {
        if (!document.hidden) {
            await cargarDatosServidor();
        }
    }, 60000); // 60 segundos
}

// Detectar cuando el usuario vuelve a la aplicación
    function inicializarDeteccionVisibilidad() {
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            // Usuario volvió a la aplicación
            const ahora = new Date();
            const tiempoTranscurrido = ultimaConsulta ? (ahora - ultimaConsulta) / 1000 : Infinity;
            
            // Si pasó más de 1 minuto, actualizar
            if (tiempoTranscurrido > 60) {
                await cargarDatosServidor();
            }
        }
    });
}

// Inicializar estado de cada grupo con valores por defecto
    function inicializarEstadoGrupos() {
    // Solo inicializar grupos que no están en datos reales y no tienen estado guardado
    const primerEscenario = configEleccion.eleccion.escenarios[0];
    
    configGrupos.grupos.forEach(grupo => {
        // No inicializar si el grupo tiene datos reales
        if (gruposConDatosReales.has(grupo.id)) {
            return;
        }
        
        // Solo inicializar si no existe estado previo (no se cargó desde localStorage)
        if (!estadoGrupos[grupo.id]) {
            estadoGrupos[grupo.id] = {
                asistencia: 75, // 75% por defecto
                votosNulos: 2, // 2% por defecto
                frentes: {},
                escenarioActivo: primerEscenario.id // Primer escenario activo por defecto
            };

            // Aplicar porcentajes del primer escenario
            aplicarEscenario(grupo.id, primerEscenario.id);
        }
    });
}

// Cargar estado desde LocalStorage
    function cargarEstadoDesdeLocalStorage() {
    try {
        const estadoGuardado = localStorage.getItem(STORAGE_KEY);
        const switchGuardado = localStorage.getItem(STORAGE_SWITCH_KEY);
        
        if (estadoGuardado) {
            const estadoParsed = JSON.parse(estadoGuardado);
            // Solo cargar estados de grupos que no tienen datos reales
            Object.keys(estadoParsed).forEach(grupoId => {
                if (!gruposConDatosReales.has(grupoId)) {
                    estadoGrupos[grupoId] = estadoParsed[grupoId];
                }
            });
        }
        
        if (switchGuardado !== null) {
            incluirBlancosComoValidos = switchGuardado === 'true';
        }
    } catch (error) {
        // Error silencioso al cargar desde localStorage
    }
}

// Sincronizar el switch visual con el estado cargado
    function sincronizarSwitchBlancos() {
    const switchBlancos = document.getElementById('incluir-blancos');
    if (switchBlancos) {
        switchBlancos.checked = incluirBlancosComoValidos;
    }
}

// Guardar estado en LocalStorage
    function guardarEstadoEnLocalStorage() {
    try {
        // Solo guardar estados de grupos de simulación (no datos reales)
        const estadoParaGuardar = {};
        Object.keys(estadoGrupos).forEach(grupoId => {
            if (!gruposConDatosReales.has(grupoId)) {
                estadoParaGuardar[grupoId] = estadoGrupos[grupoId];
            }
        });
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoParaGuardar));
        localStorage.setItem(STORAGE_SWITCH_KEY, incluirBlancosComoValidos.toString());
    } catch (error) {
        // Error silencioso al guardar en localStorage
    }
}

// Resetear configuración a valores por defecto
    async function resetearConfiguracion() {
    try {
        const confirmado = await confirmarAccionPeligrosa(
            '¿Confirmás que querés resetear toda la configuración? Se reestablecerán los datos al primer escenario electoral en todos los grupos electorales que no contengan datos reales.',
            '⚠️ Resetear Configuración'
        );
        
        // Si llegamos aquí, el usuario confirmó
        // Limpiar localStorage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_SWITCH_KEY);
        
        // Resetear estado a valores por defecto
        const primerEscenario = configEleccion.eleccion.escenarios[0];
        
        configGrupos.grupos.forEach(grupo => {
            // Solo resetear grupos de simulación
            if (!gruposConDatosReales.has(grupo.id)) {
                estadoGrupos[grupo.id] = {
                    asistencia: 75,
                    votosNulos: 2,
                    frentes: {},
                    escenarioActivo: primerEscenario.id
                };
                aplicarEscenario(grupo.id, primerEscenario.id);
            }
        });
        
        // Resetear switch de blancos
        incluirBlancosComoValidos = true;
        document.getElementById('incluir-blancos').checked = true;
        
        // Re-renderizar UI completa
        renderizarUI();
        
        // Actualizar todos los controles visuales de cada grupo de simulación
        configGrupos.grupos.forEach(grupo => {
            if (!gruposConDatosReales.has(grupo.id)) {
                const card = document.getElementById(`grupo-${grupo.id}`);
                if (card) {
                    // Actualizar inputs de asistencia y nulos
                    const inputAsistencia = card.querySelector('.range-asistencia');
                    if (inputAsistencia) {
                        inputAsistencia.value = 75;
                    }
                    document.getElementById(`valor-${grupo.id}-asistencia`).textContent = '75,0%';
                
                const inputNulos = card.querySelector('.range-nulos');
                if (inputNulos) {
                    inputNulos.value = 2;
                }
                document.getElementById(`valor-${grupo.id}-nulos`).textContent = '2,0%';
                
                // Actualizar botón del primer escenario como activo
                card.querySelectorAll('.escenario-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                const btnPrimerEscenario = card.querySelector(`[data-escenario="${primerEscenario.id}"]`);
                if (btnPrimerEscenario) {
                    btnPrimerEscenario.classList.add('active');
                }
                
                // Actualizar inputs y labels de frentes
                actualizarInputsGrupo(grupo.id);
                actualizarColoresRangeGrupo(grupo.id);
                actualizarLabelsGrupo(grupo.id);
            }
        }
    });
    
    calcularYActualizarResultados();
    
    // await alerta('✅ Configuración reseteada correctamente', 'Operación Exitosa');
    
    } catch (error) {
        // Usuario canceló la operación
        if (error && error.cancelado) {
            // Cancelación silenciosa
        } else {
            // Error inesperado durante el reseteo
        }
    }
}

// Aplicar un escenario a un grupo
    function aplicarEscenario(grupoId, escenarioId) {
    const escenario = configEleccion.eleccion.escenarios.find(e => e.id === escenarioId);
    if (!escenario) return;
    
    const estado = estadoGrupos[grupoId];
    
    // Los porcentajes del escenario son los porcentajes finales deseados
    // Necesitamos convertirlos a valores proporcionales para los sliders
    configEleccion.eleccion.frentes.forEach(frente => {
        const porcentajeDeseado = escenario.porcentajes[frente.id] || 0;
        estado.frentes[frente.id] = porcentajeDeseado;
    });
    
    // Aplicar porcentaje de blancos
    estado.votosBlancos = escenario.porcentajes.blancos || 0;
    estado.escenarioActivo = escenarioId;
}

// Función auxiliar para obtener el indicador visual (emoji o círculo) según el tipo
    function obtenerIndicadorVisual(resultado) {
    if (resultado.id === 'nulos') {
        return '❌'; // Cruz roja para nulos
    }
    // Para todos los demás (frentes y blancos), usar círculo de color
    return `<span class="color-indicator" style="background-color: ${resultado.color}"></span>`;
}

// Renderizar interfaz de usuario
    function renderizarUI() {
    const gruposGrid = document.getElementById('grupos-grid');
    
    // Si ya hay tarjetas renderizadas, solo actualizarlas
    const tarjetasExistentes = gruposGrid.querySelectorAll('.grupo-card');
    if (tarjetasExistentes.length > 0) {
        // Actualizar tarjetas existentes sin recrearlas
        configGrupos.grupos.forEach(grupo => {
            actualizarTarjetaGrupo(grupo);
        });
    } else {
        // Primera vez: crear todas las tarjetas
        gruposGrid.innerHTML = '';
        configGrupos.grupos.forEach(grupo => {
            const grupoCard = crearTarjetaGrupo(grupo);
            gruposGrid.appendChild(grupoCard);
        });
    }
}

// Nueva función para actualizar una tarjeta sin recrearla
    function actualizarTarjetaGrupo(grupo) {
    const card = document.getElementById(`grupo-${grupo.id}`);
    if (!card) return;
    
    const tienesDatosReales = gruposConDatosReales.has(grupo.id);
    const esActualmenteDatosReales = card.querySelector('.badge-datos-reales') !== null;
    
    // Si el tipo de tarjeta cambió (de simulación a datos reales o viceversa), recrear
    if (tienesDatosReales !== esActualmenteDatosReales) {
        const nuevaTarjeta = crearTarjetaGrupo(grupo);
        card.replaceWith(nuevaTarjeta);
        return;
    }
    
    // Si tiene datos reales, actualizar solo los valores
    if (tienesDatosReales) {
        actualizarTarjetaDatosReales(card, grupo);
    }
    // Si es simulación, no hacer nada (ya se actualiza con los event listeners)
}

// Nueva función para actualizar tarjeta con datos reales sin recrearla
    function actualizarTarjetaDatosReales(card, grupo) {
    const datosGrupo = datosServidor.grupos_con_datos.find(g => g.id === grupo.id);
    if (!datosGrupo) return;
    
    // Actualizar porcentaje de escrutinio y participación
    const infoEscrutinio = card.querySelector('.grupo-info-escrutinio');
    if (infoEscrutinio) {
        const participacion = datosGrupo.electores > 0 
            ? formatearPorcentaje(datosGrupo.asistentes / datosGrupo.electores * 100)
            : '0,00';
        const escrutado = formatearPorcentaje(datosGrupo.porcentaje_escrutado, 1);
        infoEscrutinio.innerHTML = `
            <div>✅ Escrutado: ${escrutado}%</div>
            <div>📈 Participación: ${participacion}%</div>
        `;
    }
    
    // Actualizar gráfico de barras
    const graficoBarras = card.querySelector('.grupo-grafico-barras');
    if (graficoBarras) {
        // Calcular resultados
        const resultados = [];
        configEleccion.eleccion.frentes.forEach(frente => {
            const votos = datosGrupo.frentes[frente.id] || 0;
            const porcentaje = datosGrupo.votosValidos > 0 
                ? (votos / datosGrupo.votosValidos * 100)
                : 0;
            
            resultados.push({
                id: frente.id,
                nombre: frente.nombre,
                color: frente.color,
                votos: votos,
                porcentaje: porcentaje,
                esBarra: true
            });
        });
        
        // Agregar blancos
        const porcentajeBlancos = incluirBlancosComoValidos
            ? (datosGrupo.votosValidos > 0 ? (datosGrupo.blancos / datosGrupo.votosValidos * 100) : 0)
            : (datosGrupo.asistentes > 0 ? (datosGrupo.blancos / datosGrupo.asistentes * 100) : 0);
        
        resultados.push({
            id: 'blancos',
            nombre: 'Votos Blancos',
            color: '#95a5a6',
            votos: datosGrupo.blancos,
            porcentaje: porcentajeBlancos,
            esBarra: incluirBlancosComoValidos,
            orden: incluirBlancosComoValidos ? 0 : 2
        });
        
        // Agregar nulos
        const porcentajeNulos = datosGrupo.asistentes > 0 
            ? (datosGrupo.nulos / datosGrupo.asistentes * 100)
            : 0;
        
        resultados.push({
            id: 'nulos',
            nombre: 'Votos Nulos',
            color: '#7f8c8d',
            votos: datosGrupo.nulos,
            porcentaje: porcentajeNulos,
            esBarra: false,
            orden: 3
        });
        
        // Ordenar resultados
        resultados.sort((a, b) => {
            const ordenA = a.orden !== undefined ? a.orden : 0;
            const ordenB = b.orden !== undefined ? b.orden : 0;
            if (ordenA !== ordenB) return ordenA - ordenB;
            return b.porcentaje - a.porcentaje;
        });
        
        // Verificar si la estructura cambió (número de barras o tipo de barra)
        const barrasExistentes = graficoBarras.children;
        let necesitaReconstruir = barrasExistentes.length !== resultados.length;
        
        if (!necesitaReconstruir) {
            // Verificar si algún elemento cambió de tipo (con barra vs sin barra)
            for (let i = 0; i < resultados.length; i++) {
                const barraExistente = barrasExistentes[i];
                const tieneBarraFill = barraExistente.querySelector('.barra-progreso-mini') !== null;
                if ((resultados[i].esBarra && !tieneBarraFill) || (!resultados[i].esBarra && tieneBarraFill)) {
                    necesitaReconstruir = true;
                    break;
                }
            }
        }
        
        if (necesitaReconstruir) {
            // Recrear todo el gráfico
            let graficoHTML = '';
            resultados.forEach(resultado => {
                if (resultado.esBarra === false) {
                    graficoHTML += `
                        <div class="barra-contenedor-mini">
                            <div class="barra-info-mini">
                                <span class="frente-nombre-mini">
                                    ${obtenerIndicadorVisual(resultado)}
                                    ${resultado.nombre}
                                </span>
                                <span>
                                    <span class="frente-porcentaje-mini">${formatearPorcentaje(resultado.porcentaje)}%</span>
                                    <span class="frente-votos-mini">(${formatearNumero(resultado.votos)})</span>
                                </span>
                            </div>
                        </div>
                    `;
                } else {
                    graficoHTML += `
                        <div class="barra-contenedor-mini">
                            <div class="barra-info-mini">
                                <span class="frente-nombre-mini">
                                    ${obtenerIndicadorVisual(resultado)}
                                    ${resultado.nombre}
                                </span>
                                <span>
                                    <span class="frente-porcentaje-mini">${formatearPorcentaje(resultado.porcentaje)}%</span>
                                    <span class="frente-votos-mini">(${formatearNumero(resultado.votos)})</span>
                                </span>
                            </div>
                            <div class="barra-progreso-mini">
                                <div class="barra-fill" 
                                     style="width: ${resultado.porcentaje}%; background-color: ${resultado.color}">
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            graficoBarras.innerHTML = graficoHTML;
        } else {
            // Solo actualizar valores existentes
            resultados.forEach((resultado, index) => {
                const barraExistente = barrasExistentes[index];
                
                if (barraExistente) {
                    // Actualizar valores de la barra existente
                    const porcentajeSpan = barraExistente.querySelector('.frente-porcentaje-mini');
                    const votosSpan = barraExistente.querySelector('.frente-votos-mini');
                    const barraFill = barraExistente.querySelector('.barra-fill');
                    
                    if (porcentajeSpan) porcentajeSpan.textContent = `${formatearPorcentaje(resultado.porcentaje)}%`;
                    if (votosSpan) votosSpan.textContent = `(${formatearNumero(resultado.votos)})`;
                    if (barraFill) barraFill.style.width = `${resultado.porcentaje}%`;
                }
            });
        }
    }
    
    // Actualizar datos adicionales
    const datosAdicionales = card.querySelector('.datos-adicionales');
    if (datosAdicionales) {
        const datoItems = datosAdicionales.querySelectorAll('.dato-value');
        if (datoItems[0]) datoItems[0].textContent = formatearNumero(datosGrupo.asistentes);
        if (datoItems[1]) datoItems[1].textContent = formatearNumero(datosGrupo.votosValidos);
    }
}

// Crear tarjeta de grupo
    function crearTarjetaGrupo(grupo) {
    const card = document.createElement('div');
    card.className = 'grupo-card';
    card.id = `grupo-${grupo.id}`;

    // Verificar si el grupo tiene datos reales
    const tienesDatosReales = gruposConDatosReales.has(grupo.id);
    
    if (tienesDatosReales) {
        // Renderizar grupo con datos reales
        renderizarGrupoConDatosReales(card, grupo);
    } else {
        // Renderizar grupo con controles de simulación
        renderizarGrupoSimulacion(card, grupo);
    }

    return card;
}

// Renderizar grupo con datos reales del servidor
    function renderizarGrupoConDatosReales(card, grupo) {
    const datosGrupo = datosServidor.grupos_con_datos.find(g => g.id === grupo.id);
    
    if (!datosGrupo) return;
    
    // Calcular porcentajes
    const resultados = [];
    configEleccion.eleccion.frentes.forEach(frente => {
        const votos = datosGrupo.frentes[frente.id] || 0;
        const porcentaje = datosGrupo.votosValidos > 0 
            ? (votos / datosGrupo.votosValidos * 100)
            : 0;
        
        resultados.push({
            id: frente.id,
            nombre: frente.nombre,
            color: frente.color,
            votos: votos,
            porcentaje: porcentaje,
            esBarra: true
        });
    });
    
    // Agregar blancos si se cuentan como válidos
    const porcentajeBlancos = incluirBlancosComoValidos
        ? (datosGrupo.votosValidos > 0 ? (datosGrupo.blancos / datosGrupo.votosValidos * 100) : 0)
        : (datosGrupo.asistentes > 0 ? (datosGrupo.blancos / datosGrupo.asistentes * 100) : 0);
    
    resultados.push({
        id: 'blancos',
        nombre: 'Votos Blancos',
        color: '#95a5a6',
        votos: datosGrupo.blancos,
        porcentaje: porcentajeBlancos,
        esBarra: incluirBlancosComoValidos,
        orden: incluirBlancosComoValidos ? 0 : 2
    });
    
    // Agregar nulos
    const porcentajeNulos = datosGrupo.asistentes > 0 
        ? (datosGrupo.nulos / datosGrupo.asistentes * 100)
        : 0;
    
    resultados.push({
        id: 'nulos',
        nombre: 'Votos Nulos',
        color: '#7f8c8d',
        votos: datosGrupo.nulos,
        porcentaje: porcentajeNulos,
        esBarra: false,
        orden: 3
    });
    
    // Ordenar resultados
    resultados.sort((a, b) => {
        const ordenA = a.orden !== undefined ? a.orden : 0;
        const ordenB = b.orden !== undefined ? b.orden : 0;
        if (ordenA !== ordenB) return ordenA - ordenB;
        return b.porcentaje - a.porcentaje;
    });
    
    // Generar HTML del gráfico
    let graficoHTML = '<div class="grupo-grafico-barras">';
    resultados.forEach(resultado => {
        if (resultado.esBarra === false) {
            graficoHTML += `
                <div class="barra-contenedor-mini">
                    <div class="barra-info-mini">
                        <span class="frente-nombre-mini">
                            ${obtenerIndicadorVisual(resultado)}
                            ${resultado.nombre}
                        </span>
                        <span>
                            <span class="frente-porcentaje-mini">${formatearPorcentaje(resultado.porcentaje)}%</span>
                            <span class="frente-votos-mini">(${formatearNumero(resultado.votos)})</span>
                        </span>
                    </div>
                </div>
            `;
        } else {
            graficoHTML += `
                <div class="barra-contenedor-mini">
                    <div class="barra-info-mini">
                        <span class="frente-nombre-mini">
                            ${obtenerIndicadorVisual(resultado)}
                            ${resultado.nombre}
                        </span>
                        <span>
                            <span class="frente-porcentaje-mini">${formatearPorcentaje(resultado.porcentaje)}%</span>
                            <span class="frente-votos-mini">(${formatearNumero(resultado.votos)})</span>
                        </span>
                    </div>
                    <div class="barra-progreso-mini">
                        <div class="barra-fill" 
                             style="width: ${resultado.porcentaje}%; background-color: ${resultado.color}">
                        </div>
                    </div>
                </div>
            `;
        }
    });
    graficoHTML += '</div>';
    
    const participacion = datosGrupo.electores > 0 
        ? formatearPorcentaje(datosGrupo.asistentes / datosGrupo.electores * 100)
        : '0,00';
    const escrutado = formatearPorcentaje(datosGrupo.porcentaje_escrutado, 1);
    
    card.innerHTML = `
        <div class="grupo-header">
            <div class="grupo-nombre">
                ${grupo.nombre}
                <span class="badge-datos-reales">📊 DATOS REALES</span>
            </div>
            <div class="grupo-electores">👥 ${formatearNumero(datosGrupo.electores)} electores</div>
            <div class="grupo-info-escrutinio">
                <div>✅ Escrutado: ${escrutado}%</div>
                <div>📈 Participación: ${participacion}%</div>
            </div>
        </div>
        <div class="grupo-datos-reales">
            ${graficoHTML}
            <div class="datos-adicionales">
                <div class="dato-item">
                    <span class="dato-label">Asistentes:</span>
                    <span class="dato-value">${formatearNumero(datosGrupo.asistentes)}</span>
                </div>
                <div class="dato-item">
                    <span class="dato-label">Votos Válidos:</span>
                    <span class="dato-value">${formatearNumero(datosGrupo.votosValidos)}</span>
                </div>
            </div>
        </div>
    `;
}

// Renderizar grupo con controles de simulación
    function renderizarGrupoSimulacion(card, grupo) {
    const estado = estadoGrupos[grupo.id];

    let controlesHTML = '';

    // Controles para cada frente
    configEleccion.eleccion.frentes.forEach(frente => {
        const valorInicial = estado.frentes[frente.id] || 0;
        controlesHTML += `
            <div class="control-item">
                <div class="control-label">
                    <span class="control-label-name">
                        <span class="color-indicator" style="background-color: ${frente.color}"></span>
                        ${frente.nombre}
                    </span>
                    <span class="control-value" id="valor-${grupo.id}-${frente.id}">100</span>
                </div>
                <input type="range" 
                       min="0" 
                       max="100" 
                       value="${valorInicial}"
                       data-grupo="${grupo.id}"
                       data-frente="${frente.id}"
                       data-color="${frente.color}"
                       class="range-frente">
            </div>
        `;
    });

    // Control para votos blancos
    controlesHTML += `
        <div class="control-item">
            <div class="control-label">
                <span class="control-label-name">
                    <span class="color-indicator" style="background-color: #95a5a6"></span>
                    Votos Blancos
                </span>
                <span class="control-value" id="valor-${grupo.id}-blancos">100</span>
            </div>
            <input type="range" 
                   min="0" 
                   max="100" 
                   value="${estado.votosBlancos}"
                   data-grupo="${grupo.id}"
                   data-tipo="blancos"
                   data-color="#95a5a6"
                   class="range-blancos">
        </div>
    `;

    // Controles de nulos y asistencia (también con range)
    controlesHTML += `
        <div class="control-item">
            <div class="control-label">
                <span>❌ Votos Nulos (%)</span>
                <span class="control-value" id="valor-${grupo.id}-nulos">${estado.votosNulos}%</span>
            </div>
            <input type="range" 
                   min="0" 
                   max="100" 
                   step="0.1"
                   value="${estado.votosNulos}"
                   data-grupo="${grupo.id}"
                   data-tipo="nulos"
                   class="range-nulos">
        </div>
        <div class="control-item">
            <div class="control-label">
                <span>📊 Asistencia (%)</span>
                <span class="control-value" id="valor-${grupo.id}-asistencia">${estado.asistencia}%</span>
            </div>
            <input type="range" 
                   min="0" 
                   max="100" 
                   step="0.1"
                   value="${estado.asistencia}"
                   data-grupo="${grupo.id}"
                   data-tipo="asistencia"
                   class="range-asistencia">
        </div>
    `;

    // Crear botonera de escenarios
    let botoneraHTML = '<div class="escenarios-botonera">';
    configEleccion.eleccion.escenarios.forEach(escenario => {
        const isActive = estado.escenarioActivo === escenario.id ? 'active' : '';
        botoneraHTML += `
            <button class="escenario-btn ${isActive}" 
                    data-grupo="${grupo.id}" 
                    data-escenario="${escenario.id}">
                ${escenario.nombre}
            </button>
        `;
    });
    botoneraHTML += '</div>';

    card.innerHTML = `
        <div class="grupo-header">
            <div class="grupo-nombre">
                ${grupo.nombre}
                <span class="badge-simulacion">🎯 SIMULACIÓN</span>
            </div>
            <div class="grupo-electores">👥 ${formatearNumero(grupo.electores)} electores</div>
            ${botoneraHTML}
        </div>
        <div class="grupo-controles">
            ${controlesHTML}
        </div>
        <div class="grupo-resultados" id="resultados-${grupo.id}"></div>
    `;

    // Agregar event listeners
    agregarEventListeners(card, grupo.id);
    
    // Actualizar labels con porcentajes normalizados
    setTimeout(() => {
        actualizarLabelsGrupo(grupo.id);
        actualizarColoresRangeGrupo(grupo.id);
    }, 0);
}

// Calcular porcentajes normalizados para un grupo
    function calcularPorcentajesNormalizados(grupoId) {
    const estado = estadoGrupos[grupoId];
    const grupo = configGrupos.grupos.find(g => g.id === grupoId);
    
    const porcentajes = {
        frentes: {},
        blancos: 0
    };
    
    // Inicializar todos los frentes en 0
    configEleccion.eleccion.frentes.forEach(frente => {
        porcentajes.frentes[frente.id] = 0;
    });
    
    if (!incluirBlancosComoValidos) {
        // Si los blancos NO son válidos, se calculan sobre asistentes
        const asistentes = grupo.electores * estado.asistencia / 100;
        const nulos = asistentes * estado.votosNulos / 100;
        const blancos = asistentes * estado.votosBlancos / 100;
        const votosValidosParaFrentes = asistentes - nulos - blancos;
        
        // Calcular suma de proporciones solo de frentes
        let sumaProporcion = 0;
        Object.values(estado.frentes).forEach(valor => {
            sumaProporcion += valor;
        });
        
        if (sumaProporcion > 0 && votosValidosParaFrentes > 0) {
            configEleccion.eleccion.frentes.forEach(frente => {
                const proporcion = estado.frentes[frente.id];
                const votosFrente = votosValidosParaFrentes * proporcion / sumaProporcion;
                porcentajes.frentes[frente.id] = (votosFrente / asistentes * 100);
            });
        }
        
        porcentajes.blancos = estado.votosBlancos;
    } else {
        // Si los blancos SÍ son válidos, se incluyen en la proporción
        let sumaProporcion = 0;
        Object.values(estado.frentes).forEach(valor => {
            sumaProporcion += valor;
        });
        sumaProporcion += estado.votosBlancos;
        
        if (sumaProporcion > 0) {
            configEleccion.eleccion.frentes.forEach(frente => {
                const proporcion = estado.frentes[frente.id];
                porcentajes.frentes[frente.id] = (proporcion / sumaProporcion * 100);
            });
            
            porcentajes.blancos = (estado.votosBlancos / sumaProporcion * 100);
        }
    }
    
    return porcentajes;
}

// Actualizar labels de porcentajes en un grupo
    function actualizarLabelsGrupo(grupoId) {
    const porcentajes = calcularPorcentajesNormalizados(grupoId);
    const resultados = calcularResultadosGrupo(configGrupos.grupos.find(g => g.id === grupoId));
    const estado = estadoGrupos[grupoId];
    
    // Actualizar label de asistencia
    const elementoAsistencia = document.getElementById(`valor-${grupoId}-asistencia`);
    if (elementoAsistencia) {
        elementoAsistencia.textContent = `${formatearPorcentaje(estado.asistencia, 1)}%`;
    }
    
    // Actualizar labels de frentes con el mismo formato que datos reales
    configEleccion.eleccion.frentes.forEach(frente => {
        const porcentaje = formatearPorcentaje(porcentajes.frentes[frente.id]);
        const votos = resultados.frentes[frente.id];
        const elemento = document.getElementById(`valor-${grupoId}-${frente.id}`);
        if (elemento) {
            elemento.innerHTML = `<span style="font-weight: 700; color: var(--primary-color);">${porcentaje}%</span> <span style="color: var(--text-secondary); font-size: 0.85em;">(${formatearNumero(votos)})</span>`;
        }
    });
    
    // Actualizar label de blancos con el mismo formato
    const porcentajeBlancos = formatearPorcentaje(porcentajes.blancos);
    const votosBlancos = resultados.blancos;
    const elementoBlancos = document.getElementById(`valor-${grupoId}-blancos`);
    if (elementoBlancos) {
        elementoBlancos.innerHTML = `<span style="font-weight: 700; color: var(--primary-color);">${porcentajeBlancos}%</span> <span style="color: var(--text-secondary); font-size: 0.85em;">(${formatearNumero(votosBlancos)})</span>`;
    }
    
    // Actualizar label de nulos con el mismo formato (solo para grupos de simulación)
    const elementoNulos = document.getElementById(`valor-${grupoId}-nulos`);
    if (elementoNulos && resultados.asistentes !== undefined) {
        const porcentajeNulos = formatearPorcentaje(estado.votosNulos, 1);
        const votosNulos = resultados.nulos;
        elementoNulos.innerHTML = `<span style="font-weight: 700; color: var(--primary-color);">${porcentajeNulos}%</span> <span style="color: var(--text-secondary); font-size: 0.85em;">(${formatearNumero(votosNulos)})</span>`;
    }
}

// Actualizar color de fondo de un input range basado en su valor
    function actualizarColorRangeInput(input) {
    const valor = parseFloat(input.value);
    const max = parseFloat(input.max);
    const color = input.dataset.color;
    
    // Calcular el porcentaje
    const porcentaje = (valor / max) * 100;
    
    // Caso especial: blancos solo muestran color si se incluyen como válidos
    const esBlancos = input.classList.contains('range-blancos');
    const colorFinal = (esBlancos && !incluirBlancosComoValidos) ? '#ddd' : color;
    
    // Aplicar gradiente: color hasta el valor, gris después
    input.style.background = `linear-gradient(to right, ${colorFinal} 0%, ${colorFinal} ${porcentaje}%, #ddd ${porcentaje}%, #ddd 100%)`;
}

// Actualizar todos los colores de range inputs en un grupo
    function actualizarColoresRangeGrupo(grupoId) {
    const card = document.getElementById(`grupo-${grupoId}`);
    if (!card) return;
    
    // Actualizar ranges de frentes
    card.querySelectorAll('.range-frente').forEach(input => {
        actualizarColorRangeInput(input);
    });
    
    // Actualizar range de blancos
    card.querySelectorAll('.range-blancos').forEach(input => {
        actualizarColorRangeInput(input);
    });
}

// Actualizar inputs visuales de un grupo con los valores del estado
    function actualizarInputsGrupo(grupoId) {
    const estado = estadoGrupos[grupoId];
    const card = document.getElementById(`grupo-${grupoId}`);
    
    // Actualizar ranges de frentes
    configEleccion.eleccion.frentes.forEach(frente => {
        const input = card.querySelector(`input[data-frente="${frente.id}"]`);
        if (input) {
            input.value = estado.frentes[frente.id];
        }
    });
    
    // Actualizar range de blancos
    const inputBlancos = card.querySelector(`input[data-tipo="blancos"]`);
    if (inputBlancos) {
        inputBlancos.value = estado.votosBlancos;
    }
}

// Deseleccionar escenario activo
    function deseleccionarEscenario(grupoId) {
    estadoGrupos[grupoId].escenarioActivo = null;
    
    // Actualizar botones visualmente
    const card = document.getElementById(`grupo-${grupoId}`);
    card.querySelectorAll('.escenario-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Agregar event listeners a los controles
    function agregarEventListeners(card, grupoId) {
    // Botones de escenarios
    card.querySelectorAll('.escenario-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const escenarioId = e.target.dataset.escenario;
            
            // Deseleccionar otros botones
            card.querySelectorAll('.escenario-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Activar este botón
            e.target.classList.add('active');
            
            // Aplicar el escenario
            aplicarEscenario(grupoId, escenarioId);
            
            // Actualizar los inputs visuales
            actualizarInputsGrupo(grupoId);
            
            // Actualizar colores de los ranges
            actualizarColoresRangeGrupo(grupoId);
            
            // Actualizar labels y resultados
            actualizarLabelsGrupo(grupoId);
            calcularYActualizarResultados();
            
            // Guardar en localStorage
            guardarEstadoEnLocalStorage();
        });
    });
    
    // Ranges de frentes
    card.querySelectorAll('.range-frente').forEach(input => {
        input.addEventListener('input', (e) => {
            const frenteId = e.target.dataset.frente;
            const valor = parseInt(e.target.value);
            estadoGrupos[grupoId].frentes[frenteId] = valor;
            deseleccionarEscenario(grupoId);
            actualizarColorRangeInput(e.target);
            actualizarLabelsGrupo(grupoId);
            calcularYActualizarResultados();
            guardarEstadoEnLocalStorage();
        });
    });

    // Range de blancos
    card.querySelectorAll('.range-blancos').forEach(input => {
        input.addEventListener('input', (e) => {
            const valor = parseInt(e.target.value);
            estadoGrupos[grupoId].votosBlancos = valor;
            deseleccionarEscenario(grupoId);
            actualizarColorRangeInput(e.target);
            actualizarLabelsGrupo(grupoId);
            calcularYActualizarResultados();
            guardarEstadoEnLocalStorage();
        });
    });

    // Range asistencia
    card.querySelectorAll('.range-asistencia').forEach(input => {
        input.addEventListener('input', (e) => {
            let valor = parseFloat(e.target.value);
            estadoGrupos[grupoId].asistencia = valor;
            actualizarLabelsGrupo(grupoId);
            calcularYActualizarResultados();
            guardarEstadoEnLocalStorage();
        });
    });

    // Range nulos
    card.querySelectorAll('.range-nulos').forEach(input => {
        input.addEventListener('input', (e) => {
            let valor = parseFloat(e.target.value);
            estadoGrupos[grupoId].votosNulos = valor;
            actualizarLabelsGrupo(grupoId);
            calcularYActualizarResultados();
            guardarEstadoEnLocalStorage();
        });
    });
}

// Calcular resultados de un grupo
    function calcularResultadosGrupo(grupo) {
    const estado = estadoGrupos[grupo.id];
    const totalElectores = grupo.electores;
    
    // Calcular asistentes
    const asistentes = Math.round(totalElectores * estado.asistencia / 100);
    
    // Calcular votos nulos
    const nulos = Math.round(asistentes * estado.votosNulos / 100);
    
    // Calcular base para votos válidos
    let baseCalculo = asistentes - nulos;
    
    // Calcular suma de proporciones
    let sumaProporcion = 0;
    Object.values(estado.frentes).forEach(valor => {
        sumaProporcion += valor;
    });
    
    // Si los blancos NO se cuentan como válidos, se calculan sobre asistentes
    let blancos = 0;
    let votosValidosParaFrentes = baseCalculo;
    
    if (!incluirBlancosComoValidos) {
        // Los blancos se calculan sobre asistentes (como los nulos)
        blancos = Math.round(asistentes * estado.votosBlancos / 100);
        votosValidosParaFrentes = asistentes - nulos - blancos;
    } else {
        // Los blancos se incluyen en la proporción con los frentes
        sumaProporcion += estado.votosBlancos;
    }
    
    // Calcular votos por frente
    const resultados = {
        frentes: {},
        blancos: 0,
        nulos: nulos,
        asistentes: asistentes,
        votosValidos: incluirBlancosComoValidos ? baseCalculo : votosValidosParaFrentes
    };
    
    // Inicializar frentes en 0
    configEleccion.eleccion.frentes.forEach(frente => {
        resultados.frentes[frente.id] = 0;
    });
    
    if (sumaProporcion > 0) {
        // Calcular votos para cada frente
        configEleccion.eleccion.frentes.forEach(frente => {
            const proporcion = estado.frentes[frente.id];
            const base = incluirBlancosComoValidos ? baseCalculo : votosValidosParaFrentes;
            const votos = Math.round(base * proporcion / sumaProporcion);
            resultados.frentes[frente.id] = votos;
        });
        
        // Calcular votos blancos
        if (incluirBlancosComoValidos) {
            resultados.blancos = Math.round(baseCalculo * estado.votosBlancos / sumaProporcion);
        } else {
            resultados.blancos = blancos;
        }
    }
    
    return resultados;
}

/**
 * Calcula la distribución de cargos según el sistema D'Hondt
 * @param {number[]} votos - Array con la cantidad de votos de cada lista
 * @param {number} cantidadCargos - Total de cargos a repartir
 * @returns {number[][]} Array de arrays con los números de cargos asignados a cada lista
 */
    function calcularDHondt(votos, cantidadCargos) {
    const cargos = [];
    const nuevoCargo = () => {
        let imax = -1, max = -1;
        for (let indexLista = 0; indexLista < votos.length; indexLista++) {
            const cociente = votos[indexLista] / (cargos[indexLista].length + 1);
            if (cociente > max) {
                max = cociente;
                imax = indexLista;
            }
        }
        return imax;
    };
    
    // Un array de cargos por cada lista
    for (let indexLista = 0; indexLista < votos.length; indexLista++) {
        cargos[indexLista] = [];
    }
    
    // Asignamos los cargos
    for (let indexCargo = 0; indexCargo < cantidadCargos; indexCargo++) {
        const index = nuevoCargo();
        if (index === -1) break;
        cargos[index].push(indexCargo + 1);
    }
    
    return cargos;
}

// Calcular resultados globales
    function calcularResultadosGlobales() {
    const resultadosGlobales = {
        frentes: {},
        blancos: 0,
        nulos: 0,
        asistentes: 0,
        votosValidos: 0,
        totalElectores: 0
    };
    
    // Inicializar contadores de frentes
    configEleccion.eleccion.frentes.forEach(frente => {
        resultadosGlobales.frentes[frente.id] = 0;
    });
    
    // Sumar resultados de todos los grupos
    configGrupos.grupos.forEach(grupo => {
        // Verificar si el grupo tiene datos reales
        if (gruposConDatosReales.has(grupo.id)) {
            // Usar datos reales del servidor
            const datosGrupo = datosServidor.grupos_con_datos.find(g => g.id === grupo.id);
            if (datosGrupo) {
                resultadosGlobales.totalElectores += datosGrupo.electores;
                resultadosGlobales.asistentes += datosGrupo.asistentes;
                resultadosGlobales.nulos += datosGrupo.nulos;
                resultadosGlobales.votosValidos += datosGrupo.votosValidos;
                resultadosGlobales.blancos += datosGrupo.blancos;
                
                configEleccion.eleccion.frentes.forEach(frente => {
                    resultadosGlobales.frentes[frente.id] += (datosGrupo.frentes[frente.id] || 0);
                });
            }
        } else {
            // Usar simulación del usuario
            const resultadoGrupo = calcularResultadosGrupo(grupo);
            
            resultadosGlobales.totalElectores += grupo.electores;
            resultadosGlobales.asistentes += resultadoGrupo.asistentes;
            resultadosGlobales.nulos += resultadoGrupo.nulos;
            resultadosGlobales.votosValidos += resultadoGrupo.votosValidos;
            resultadosGlobales.blancos += resultadoGrupo.blancos;
            
            configEleccion.eleccion.frentes.forEach(frente => {
                resultadosGlobales.frentes[frente.id] += (resultadoGrupo.frentes[frente.id] || 0);
            });
        }
    });
    
    return resultadosGlobales;
}

// Actualizar visualización de resultados
    function calcularYActualizarResultados() {
    const resultadosGlobales = calcularResultadosGlobales();
    
    // Actualizar estadísticas globales
    document.getElementById('total-electores').textContent = formatearNumero(resultadosGlobales.totalElectores);
    document.getElementById('total-votos-validos').textContent = formatearNumero(resultadosGlobales.votosValidos);
    
    const participacion = resultadosGlobales.totalElectores > 0 
        ? formatearPorcentaje(resultadosGlobales.asistentes / resultadosGlobales.totalElectores * 100)
        : '0,00';
    document.getElementById('participacion-global').textContent = `${participacion}%`;
    
    // Crear array de resultados para ordenar (solo frentes)
    const resultadosArray = [];
    
    configEleccion.eleccion.frentes.forEach(frente => {
        const votos = resultadosGlobales.frentes[frente.id];
        const porcentaje = resultadosGlobales.votosValidos > 0 
            ? (votos / resultadosGlobales.votosValidos * 100)
            : 0;
        
        resultadosArray.push({
            id: frente.id,
            nombre: frente.nombre,
            color: frente.color,
            votos: votos,
            porcentaje: porcentaje,
            esBarra: true
        });
    });
    
    // Calcular porcentaje de blancos
    let porcentajeBlancos;
    if (incluirBlancosComoValidos) {
        // Si se cuentan como válidos, porcentaje sobre votos válidos
        porcentajeBlancos = resultadosGlobales.votosValidos > 0 
            ? (resultadosGlobales.blancos / resultadosGlobales.votosValidos * 100)
            : 0;
    } else {
        // Si NO se cuentan como válidos, porcentaje sobre asistentes
        porcentajeBlancos = resultadosGlobales.asistentes > 0 
            ? (resultadosGlobales.blancos / resultadosGlobales.asistentes * 100)
            : 0;
    }
    
    // Agregar votos blancos
    resultadosArray.push({
        id: 'blancos',
        nombre: 'Votos Blancos',
        color: '#95a5a6',
        votos: resultadosGlobales.blancos,
        porcentaje: porcentajeBlancos,
        esBarra: incluirBlancosComoValidos, // Solo mostrar barra si se cuentan como válidos
        orden: incluirBlancosComoValidos ? 0 : 2 // 0 = con barra, 2 = último sin barra
    });
    
    // Agregar votos nulos (siempre sin barra, siempre al final)
    const porcentajeNulos = resultadosGlobales.asistentes > 0 
        ? (resultadosGlobales.nulos / resultadosGlobales.asistentes * 100)
        : 0;
    
    resultadosArray.push({
        id: 'nulos',
        nombre: 'Votos Nulos',
        color: '#7f8c8d',
        votos: resultadosGlobales.nulos,
        porcentaje: porcentajeNulos,
        esBarra: false, // Nunca mostrar barra
        orden: 3 // Siempre al final
    });
    
    // Calcular distribución de cargos si es elección legislativa
    if (configEleccion.eleccion.esLegislativa && configEleccion.eleccion.cantidadCargos > 0) {
        
        // Extraer solo los votos de los frentes (sin blancos ni nulos)
        const votosParaDHondt = [];
        const indicesFrentes = []; // Para mapear resultados de D'Hondt con frentes
        
        configEleccion.eleccion.frentes.forEach(frente => {
            votosParaDHondt.push(resultadosGlobales.frentes[frente.id]);
            indicesFrentes.push(frente.id);
        });
        
        // Calcular distribución de cargos
        const distribucionCargos = calcularDHondt(votosParaDHondt, configEleccion.eleccion.cantidadCargos);
        
        // Asignar cargos a cada frente en resultadosArray
        resultadosArray.forEach(resultado => {
            // Solo para frentes reales (no blancos ni nulos)
            if (resultado.esBarra === true && resultado.id !== 'blancos' && resultado.id !== 'nulos') {
                const indice = indicesFrentes.indexOf(resultado.id);
                if (indice !== -1) {
                    resultado.cargos = distribucionCargos[indice].length;
                }
            }
        });
    }
    
    // Ordenar: primero los que tienen barra (por porcentaje), luego blancos sin barra, luego nulos
    resultadosArray.sort((a, b) => {
        const ordenA = a.orden !== undefined ? a.orden : 0;
        const ordenB = b.orden !== undefined ? b.orden : 0;
        
        if (ordenA !== ordenB) return ordenA - ordenB;
        return b.porcentaje - a.porcentaje;
    });
    
    // Renderizar gráfico de barras
    renderizarGraficoBarras(resultadosArray);
    
    // Actualizar resultados individuales de cada grupo
    actualizarResultadosGrupos();
}

// Renderizar gráfico de barras
    function renderizarGraficoBarras(resultados) {
    const contenedor = document.getElementById('grafico-resultados');
    const barrasExistentes = contenedor.querySelectorAll('.barra-contenedor');
    
    let necesitaReconstruir = false;
    
    // Verificar si el número de barras cambió
    if (barrasExistentes.length !== resultados.length) {
        necesitaReconstruir = true;
    } else {
        // Verificar si alguna barra cambió de ID (orden diferente) o de tipo
        for (let i = 0; i < resultados.length; i++) {
            const barraExistente = barrasExistentes[i];
            const idExistente = barraExistente.dataset.resultadoId;
            const idNuevo = resultados[i].id;
            const tieneBarraProgreso = barraExistente.querySelector('.barra-progreso') !== null;
            const deberaTenerBarra = resultados[i].esBarra !== false;
            
            // Si cambió el ID (diferente frente en esta posición) o el tipo de barra, reconstruir
            if (idExistente !== idNuevo || tieneBarraProgreso !== deberaTenerBarra) {
                necesitaReconstruir = true;
                break;
            }
        }
    }
    
    if (necesitaReconstruir) {
        // Recrear todo
        contenedor.innerHTML = '';
        resultados.forEach(resultado => {
            const barraDiv = crearBarraHTML(resultado);
            contenedor.appendChild(barraDiv);
        });
    } else {
        // Actualizar barras existentes (solo valores numéricos, el orden no cambió)
        resultados.forEach((resultado, index) => {
            const barraDiv = barrasExistentes[index];
            actualizarBarraExistente(barraDiv, resultado);
        });
    }
}

// Función auxiliar para crear una barra nueva
    function crearBarraHTML(resultado) {
    const barraDiv = document.createElement('div');
    barraDiv.className = 'barra-contenedor';
    barraDiv.dataset.resultadoId = resultado.id;
    
    // Si esBarra es false, mostrar solo información sin barra de progreso
    if (resultado.esBarra === false) {
        barraDiv.innerHTML = `
            <div class="barra-info">
                <span class="frente-nombre">
                    ${obtenerIndicadorVisual(resultado)}
                    ${resultado.nombre}
                </span>
                <span>
                    <span class="frente-porcentaje">${formatearPorcentaje(resultado.porcentaje)}%</span>
                    <span class="frente-votos">(${formatearNumero(resultado.votos)} votos)</span>
                </span>
            </div>
        `;
    } else {
        // Generar texto de cargos si corresponde
        let textoCargos = '';
        
        if (resultado.cargos !== undefined && resultado.cargos > 0 && 
            configEleccion.eleccion.esLegislativa) {
            const nombreCargo = resultado.cargos === 1 
                ? obtenerNombreCargoSingular(resultado.id)
                : configEleccion.eleccion.nombreCargoPlural;
            textoCargos = `<div class="cargos-obtenidos">${resultado.cargos} ${nombreCargo}</div>`;
        }
        
        // Mostrar con barra de progreso
        barraDiv.innerHTML = `
            <div class="barra-info">
                <span class="frente-nombre">
                    ${obtenerIndicadorVisual(resultado)}
                    ${resultado.nombre}
                </span>
                <span>
                    <span class="frente-porcentaje">${formatearPorcentaje(resultado.porcentaje)}%</span>
                    <span class="frente-votos">(${formatearNumero(resultado.votos)} votos)</span>
                </span>
            </div>
            ${textoCargos}
            <div class="barra-progreso">
                <div class="barra-fill" 
                     style="width: ${resultado.porcentaje}%; background-color: ${resultado.color}">
                </div>
            </div>
        `;
    }
    
    return barraDiv;
}

/**
 * Obtiene el nombre del cargo singular según el género del candidato
 * @param {string} frenteId - ID del frente electoral
 * @returns {string} - Nombre del cargo en singular con el género apropiado
 */
function obtenerNombreCargoSingular(frenteId) {
    const frente = configEleccion.eleccion.frentes.find(f => f.id === frenteId);
    
    if (!frente || !frente.canidate) {
        // Si no se encuentra el frente o no tiene género, usar masculino como fallback
        return configEleccion.eleccion.nombreCargoSingularM;
    }
    
    // Retornar según el género del candidato
    return frente.canidate === 'F' 
        ? configEleccion.eleccion.nombreCargoSingularF 
        : configEleccion.eleccion.nombreCargoSingularM;
}

// Función auxiliar para actualizar una barra existente
    function actualizarBarraExistente(barraDiv, resultado) {
    const porcentajeSpan = barraDiv.querySelector('.frente-porcentaje');
    const votosSpan = barraDiv.querySelector('.frente-votos');
    const barraFill = barraDiv.querySelector('.barra-fill');
    
    if (porcentajeSpan) {
        porcentajeSpan.textContent = `${formatearPorcentaje(resultado.porcentaje)}%`;
    }
    if (votosSpan) {
        votosSpan.textContent = `(${formatearNumero(resultado.votos)} votos)`;
    }
    if (barraFill) {
        barraFill.style.width = `${resultado.porcentaje}%`;
    }
    
    // Actualizar o crear elemento de cargos si es elección legislativa
    let cargosDiv = barraDiv.querySelector('.cargos-obtenidos');
    
    if (resultado.cargos !== undefined && resultado.cargos > 0 && 
        configEleccion.eleccion.esLegislativa) {
        const nombreCargo = resultado.cargos === 1 
            ? obtenerNombreCargoSingular(resultado.id)
            : configEleccion.eleccion.nombreCargoPlural;
        const textoCargos = `${resultado.cargos} ${nombreCargo}`;
        
        if (cargosDiv) {
            // Actualizar texto existente
            cargosDiv.textContent = textoCargos;
        } else {
            // Crear elemento nuevo
            cargosDiv = document.createElement('div');
            cargosDiv.className = 'cargos-obtenidos';
            cargosDiv.textContent = textoCargos;
            // Insertar antes de la barra de progreso
            const barraProgreso = barraDiv.querySelector('.barra-progreso');
            if (barraProgreso) {
                barraDiv.insertBefore(cargosDiv, barraProgreso);
            }
        }
    } else {
        if (cargosDiv) {
            // Remover elemento si ya no tiene cargos
            cargosDiv.remove();
        }
    }
}


// Actualizar resultados de cada grupo individual
    function actualizarResultadosGrupos() {
    configGrupos.grupos.forEach(grupo => {
        // Solo actualizar grupos de simulación (no los que tienen datos reales)
        if (gruposConDatosReales.has(grupo.id)) {
            return; // Saltar grupos con datos reales
        }
        
        const resultados = calcularResultadosGrupo(grupo);
        const contenedor = document.getElementById(`resultados-${grupo.id}`);
        
        // Verificar que el contenedor existe
        if (!contenedor) {
            return;
        }
        
        // Verificar si ya existe la estructura
        let datosAdicionales = contenedor.querySelector('.datos-adicionales');
        
        if (!datosAdicionales) {
            // Primera vez: crear la estructura
            let html = `
                <div class="datos-adicionales">
                    <div class="dato-item">
                        <span class="dato-label">Asistentes:</span>
                        <span class="dato-value">${formatearNumero(resultados.asistentes)}</span>
                    </div>
                    <div class="dato-item">
                        <span class="dato-label">Votos Válidos:</span>
                        <span class="dato-value">${formatearNumero(resultados.votosValidos)}</span>
                    </div>
                </div>
            `;
            contenedor.innerHTML = html;
        } else {
            // Actualizar solo los valores existentes
            const datoValues = datosAdicionales.querySelectorAll('.dato-value');
            if (datoValues[0]) datoValues[0].textContent = formatearNumero(resultados.asistentes);
            if (datoValues[1]) datoValues[1].textContent = formatearNumero(resultados.votosValidos);
        }
    });
}

// Formatear número con separadores de miles
    function formatearNumero(numero) {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Formatear porcentaje con coma decimal (ej: 37.94 -> 37,94)
    function formatearPorcentaje(numero, decimales = 2) {
    return numero.toFixed(decimales).replace('.', ',');
}

// Inicializar controles generales
    function inicializarControlesGenerales() {
    // Switch de incluir blancos
    const switchBlancos = document.getElementById('incluir-blancos');
    switchBlancos.addEventListener('change', (e) => {
        incluirBlancosComoValidos = e.target.checked;
        
        // Actualizar tarjetas de datos reales
        configGrupos.grupos.forEach(grupo => {
            if (gruposConDatosReales.has(grupo.id)) {
                actualizarTarjetaGrupo(grupo);
            } else {
                // Para grupos de simulación, actualizar colores de ranges
                actualizarColoresRangeGrupo(grupo.id);
            }
        });
        
        // Actualizar resultados globales y de simulación
        calcularYActualizarResultados();
        
        // Guardar en localStorage
        guardarEstadoEnLocalStorage();
    });

    // Botones para abrir modales
    document.getElementById('btn-asistencia-masiva').addEventListener('click', () => {
        abrirModal('modal-asistencia');
    });

    document.getElementById('btn-nulos-masivos').addEventListener('click', () => {
        abrirModal('modal-nulos');
    });

    // Botones para aplicar cambios
    document.getElementById('btn-aplicar-asistencia').addEventListener('click', () => {
        aplicarAsistenciaGlobal();
    });

    document.getElementById('btn-aplicar-nulos').addEventListener('click', () => {
        aplicarNulosGlobal();
    });

    // Botón para resetear configuración
    document.getElementById('btn-resetear-configuracion').addEventListener('click', () => {
        resetearConfiguracion();
    });

    // Cerrar modales
    document.querySelectorAll('.close, .btn-modal-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modal;
            cerrarModal(modalId);
        });
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Calcular promedio de asistencia de datos reales
    function calcularPromedioAsistencia() {
    if (!datosServidor || !datosServidor.grupos_con_datos || datosServidor.grupos_con_datos.length === 0) {
        return null;
    }
    
    let sumaAsistencia = 0;
    datosServidor.grupos_con_datos.forEach(grupo => {
        const porcentaje = grupo.electores > 0 ? (grupo.asistentes / grupo.electores * 100) : 0;
        sumaAsistencia += porcentaje;
    });
    
    return sumaAsistencia / datosServidor.grupos_con_datos.length;
}

// Calcular promedio de votos nulos de datos reales
    function calcularPromedioNulos() {
    if (!datosServidor || !datosServidor.grupos_con_datos || datosServidor.grupos_con_datos.length === 0) {
        return null;
    }
    
    let sumaNulos = 0;
    datosServidor.grupos_con_datos.forEach(grupo => {
        const porcentaje = grupo.asistentes > 0 ? (grupo.nulos / grupo.asistentes * 100) : 0;
        sumaNulos += porcentaje;
    });
    
    return sumaNulos / datosServidor.grupos_con_datos.length;
}

// Configurar botones de promedio en modales
    function configurarBotonesPromedio() {
    const btnPromedioAsistencia = document.getElementById('btn-promedio-asistencia');
    const btnPromedioNulos = document.getElementById('btn-promedio-nulos');
    
    const hayDatosReales = datosServidor && datosServidor.grupos_con_datos && datosServidor.grupos_con_datos.length > 0;
    
    // Configurar botón de asistencia
    if (hayDatosReales) {
        btnPromedioAsistencia.disabled = false;
        btnPromedioAsistencia.addEventListener('click', () => {
            const promedio = calcularPromedioAsistencia();
            if (promedio !== null) {
                document.getElementById('input-asistencia-global').value = promedio.toFixed(1);
            }
        });
    } else {
        btnPromedioAsistencia.disabled = true;
    }
    
    // Configurar botón de nulos
    if (hayDatosReales) {
        btnPromedioNulos.disabled = false;
        btnPromedioNulos.addEventListener('click', () => {
            const promedio = calcularPromedioNulos();
            if (promedio !== null) {
                document.getElementById('input-nulos-global').value = promedio.toFixed(1);
            }
        });
    } else {
        btnPromedioNulos.disabled = true;
    }
}

// Abrir modal
    function abrirModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// Cerrar modal
    function cerrarModal(modalId) {
    if (!modalId) {
        return;
    }
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Aplicar asistencia global a todos los grupos
    async function aplicarAsistenciaGlobal() {
    const valor = parseFloat(document.getElementById('input-asistencia-global').value);
    
    if (valor < 0 || valor > 100) {
        await alerta('El valor debe estar entre 0 y 100', '⚠️ Valor Inválido');
        return;
    }

    configGrupos.grupos.forEach(grupo => {
        // Solo aplicar a grupos de simulación (no a grupos con datos reales)
        if (!gruposConDatosReales.has(grupo.id)) {
            estadoGrupos[grupo.id].asistencia = valor;
            
            // Actualizar el input visual
            const card = document.getElementById(`grupo-${grupo.id}`);
            if (card) {
                const inputAsistencia = card.querySelector('.range-asistencia');
                if (inputAsistencia) {
                    inputAsistencia.value = valor;
                }
                const valorLabel = document.getElementById(`valor-${grupo.id}-asistencia`);
                if (valorLabel) {
                    valorLabel.textContent = `${formatearPorcentaje(valor, 1)}%`;
                }
            }
        }
    });

    calcularYActualizarResultados();
    guardarEstadoEnLocalStorage();
    cerrarModal('modal-asistencia');
}

// Aplicar votos nulos global a todos los grupos
    async function aplicarNulosGlobal() {
    const valor = parseFloat(document.getElementById('input-nulos-global').value);
    
    if (valor < 0 || valor > 100) {
        await alerta('El valor debe estar entre 0 y 100', '⚠️ Valor Inválido');
        return;
    }

    configGrupos.grupos.forEach(grupo => {
        // Solo aplicar a grupos de simulación (no a grupos con datos reales)
        if (!gruposConDatosReales.has(grupo.id)) {
            estadoGrupos[grupo.id].votosNulos = valor;
            
            // Actualizar el input visual
            const card = document.getElementById(`grupo-${grupo.id}`);
            if (card) {
                const inputNulos = card.querySelector('.range-nulos');
                if (inputNulos) {
                    inputNulos.value = valor;
                }
                const valorLabel = document.getElementById(`valor-${grupo.id}-nulos`);
                if (valorLabel) {
                    valorLabel.textContent = `${formatearPorcentaje(valor, 1)}%`;
                }
            }
        }
    });

    calcularYActualizarResultados();
    guardarEstadoEnLocalStorage();
    cerrarModal('modal-nulos');
    }

    // ========================================
    // API PÚBLICA
    // ========================================

    /**
     * Inicializa la aplicación EspeculApp
     * @public
     * @returns {Promise<void>}
     */
    async function init() {
        if (isInitialized) {
            return;
        }

        try {
            await cargarConfiguraciones();
            await cargarDatosServidor(); // Cargar datos reales del servidor
            cargarEstadoDesdeLocalStorage(); // Cargar estado guardado
            inicializarEstadoGrupos();
            renderizarUI();
            inicializarControlesGenerales();
            sincronizarSwitchBlancos(); // Sincronizar el switch con el estado cargado
            configurarBotonesPromedio(); // Configurar botones de promedio en modales
            inicializarPolleo(); // Iniciar polling automático
            inicializarDeteccionVisibilidad(); // Detectar cuando el usuario vuelve a la app
            calcularYActualizarResultados();
            
            isInitialized = true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Destruye la instancia de la aplicación y limpia recursos
     * @public
     */
    function destroy() {
        if (!isInitialized) {
            return;
        }

        // Limpiar intervalos
        if (intervaloPolleoId) {
            clearInterval(intervaloPolleoId);
            intervaloPolleoId = null;
        }

        // Limpiar event listeners de visibilidad
        document.removeEventListener('visibilitychange', inicializarDeteccionVisibilidad);

        isInitialized = false;
    }

    /**
     * Verifica si la aplicación está inicializada
     * @public
     * @returns {boolean}
     */
    function isReady() {
        return isInitialized;
    }

    // Retornar API pública
    return {
        init,
        destroy,
        isReady,
        version: '1.0.0'
    };
})();

// Auto-inicialización cuando el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        EspeculApp.init();
    });
} else {
    // DOM ya está listo
    EspeculApp.init();
}
