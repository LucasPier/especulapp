// Variables globales
let configEleccion = null;
let configGrupos = null;
let estadoGrupos = {};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await cargarConfiguraciones();
    inicializarEstadoGrupos();
    renderizarUI();
    calcularYActualizarResultados();
});

// Cargar archivos de configuración
async function cargarConfiguraciones() {
    try {
        const [respuestaEleccion, respuestaGrupos] = await Promise.all([
            fetch('configuracion_eleccion.json'),
            fetch('configuracion_grupos.json')
        ]);

        configEleccion = await respuestaEleccion.json();
        configGrupos = await respuestaGrupos.json();

        // Mostrar información de la elección
        document.getElementById('eleccion-info').textContent = 
            `${configEleccion.eleccion.nombre} - ${configEleccion.eleccion.fecha}`;
    } catch (error) {
        console.error('Error al cargar configuraciones:', error);
        alert('Error al cargar las configuraciones. Verifica que los archivos JSON existan.');
    }
}

// Inicializar estado de cada grupo con valores por defecto
function inicializarEstadoGrupos() {
    // Obtener el primer escenario por defecto
    const primerEscenario = configEleccion.eleccion.escenarios[0];
    
    configGrupos.grupos.forEach(grupo => {
        estadoGrupos[grupo.id] = {
            asistencia: 75, // 75% por defecto
            votosNulos: 2, // 2% por defecto
            frentes: {},
            escenarioActivo: primerEscenario.id // Primer escenario activo por defecto
        };

        // Aplicar porcentajes del primer escenario
        aplicarEscenario(grupo.id, primerEscenario.id);
    });
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

// Renderizar interfaz de usuario
function renderizarUI() {
    const gruposGrid = document.getElementById('grupos-grid');
    gruposGrid.innerHTML = '';

    configGrupos.grupos.forEach(grupo => {
        const grupoCard = crearTarjetaGrupo(grupo);
        gruposGrid.appendChild(grupoCard);
    });
}

// Crear tarjeta de grupo
function crearTarjetaGrupo(grupo) {
    const card = document.createElement('div');
    card.className = 'grupo-card';
    card.id = `grupo-${grupo.id}`;

    const estado = estadoGrupos[grupo.id];

    let controlesHTML = '';

    // Controles para cada frente
    configEleccion.eleccion.frentes.forEach(frente => {
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
                       value="${estado.frentes[frente.id]}"
                       data-grupo="${grupo.id}"
                       data-frente="${frente.id}"
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
                   class="range-blancos">
        </div>
    `;

    // Controles de asistencia y nulos (también con range)
    controlesHTML += `
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
            <div class="grupo-nombre">${grupo.nombre}</div>
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
    setTimeout(() => actualizarLabelsGrupo(grupo.id), 0);

    return card;
}

// Calcular porcentajes normalizados para un grupo
function calcularPorcentajesNormalizados(grupoId) {
    const estado = estadoGrupos[grupoId];
    
    // Calcular suma de proporciones (frentes + blancos)
    let sumaProporcion = 0;
    Object.values(estado.frentes).forEach(valor => {
        sumaProporcion += valor;
    });
    sumaProporcion += estado.votosBlancos;
    
    const porcentajes = {
        frentes: {},
        blancos: 0
    };
    
    if (sumaProporcion > 0) {
        // Calcular porcentaje normalizado para cada frente
        configEleccion.eleccion.frentes.forEach(frente => {
            const proporcion = estado.frentes[frente.id];
            porcentajes.frentes[frente.id] = (proporcion / sumaProporcion * 100);
        });
        
        // Calcular porcentaje para votos blancos
        porcentajes.blancos = (estado.votosBlancos / sumaProporcion * 100);
    }
    
    return porcentajes;
}

// Actualizar labels de porcentajes en un grupo
function actualizarLabelsGrupo(grupoId) {
    const porcentajes = calcularPorcentajesNormalizados(grupoId);
    
    // Actualizar labels de frentes
    configEleccion.eleccion.frentes.forEach(frente => {
        const porcentaje = porcentajes.frentes[frente.id].toFixed(2);
        document.getElementById(`valor-${grupoId}-${frente.id}`).textContent = `${porcentaje}%`;
    });
    
    // Actualizar label de blancos
    const porcentajeBlancos = porcentajes.blancos.toFixed(2);
    document.getElementById(`valor-${grupoId}-blancos`).textContent = `${porcentajeBlancos}%`;
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
            
            // Actualizar labels y resultados
            actualizarLabelsGrupo(grupoId);
            calcularYActualizarResultados();
        });
    });
    
    // Ranges de frentes
    card.querySelectorAll('.range-frente').forEach(input => {
        input.addEventListener('input', (e) => {
            const frenteId = e.target.dataset.frente;
            const valor = parseInt(e.target.value);
            estadoGrupos[grupoId].frentes[frenteId] = valor;
            deseleccionarEscenario(grupoId);
            actualizarLabelsGrupo(grupoId);
            calcularYActualizarResultados();
        });
    });

    // Range de blancos
    card.querySelectorAll('.range-blancos').forEach(input => {
        input.addEventListener('input', (e) => {
            const valor = parseInt(e.target.value);
            estadoGrupos[grupoId].votosBlancos = valor;
            deseleccionarEscenario(grupoId);
            actualizarLabelsGrupo(grupoId);
            calcularYActualizarResultados();
        });
    });

    // Range asistencia
    card.querySelectorAll('.range-asistencia').forEach(input => {
        input.addEventListener('input', (e) => {
            let valor = parseFloat(e.target.value);
            estadoGrupos[grupoId].asistencia = valor;
            document.getElementById(`valor-${grupoId}-asistencia`).textContent = `${valor.toFixed(1)}%`;
            calcularYActualizarResultados();
        });
    });

    // Range nulos
    card.querySelectorAll('.range-nulos').forEach(input => {
        input.addEventListener('input', (e) => {
            let valor = parseFloat(e.target.value);
            estadoGrupos[grupoId].votosNulos = valor;
            document.getElementById(`valor-${grupoId}-nulos`).textContent = `${valor.toFixed(1)}%`;
            calcularYActualizarResultados();
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
    
    // Votos válidos (sin nulos)
    const votosValidos = asistentes - nulos;
    
    // Calcular suma de proporciones (frentes + blancos)
    let sumaProporcion = 0;
    Object.values(estado.frentes).forEach(valor => {
        sumaProporcion += valor;
    });
    sumaProporcion += estado.votosBlancos;
    
    // Calcular votos por frente
    const resultados = {
        frentes: {},
        blancos: 0,
        nulos: nulos,
        asistentes: asistentes,
        votosValidos: votosValidos
    };
    
    if (sumaProporcion > 0) {
        // Calcular votos para cada frente
        configEleccion.eleccion.frentes.forEach(frente => {
            const proporcion = estado.frentes[frente.id];
            const votos = Math.round(votosValidos * proporcion / sumaProporcion);
            resultados.frentes[frente.id] = votos;
        });
        
        // Calcular votos blancos
        resultados.blancos = Math.round(votosValidos * estado.votosBlancos / sumaProporcion);
    }
    
    return resultados;
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
        const resultadoGrupo = calcularResultadosGrupo(grupo);
        
        resultadosGlobales.totalElectores += grupo.electores;
        resultadosGlobales.asistentes += resultadoGrupo.asistentes;
        resultadosGlobales.nulos += resultadoGrupo.nulos;
        resultadosGlobales.votosValidos += resultadoGrupo.votosValidos;
        resultadosGlobales.blancos += resultadoGrupo.blancos;
        
        configEleccion.eleccion.frentes.forEach(frente => {
            resultadosGlobales.frentes[frente.id] += resultadoGrupo.frentes[frente.id];
        });
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
        ? (resultadosGlobales.asistentes / resultadosGlobales.totalElectores * 100).toFixed(2)
        : 0;
    document.getElementById('participacion-global').textContent = `${participacion}%`;
    
    // Crear array de resultados para ordenar
    const resultadosArray = [];
    
    configEleccion.eleccion.frentes.forEach(frente => {
        const votos = resultadosGlobales.frentes[frente.id];
        const porcentaje = resultadosGlobales.votosValidos > 0 
            ? (votos / resultadosGlobales.votosValidos * 100).toFixed(2)
            : 0;
        
        resultadosArray.push({
            id: frente.id,
            nombre: frente.nombre,
            color: frente.color,
            votos: votos,
            porcentaje: parseFloat(porcentaje)
        });
    });
    
    // Agregar votos blancos
    const porcentajeBlancos = resultadosGlobales.votosValidos > 0 
        ? (resultadosGlobales.blancos / resultadosGlobales.votosValidos * 100).toFixed(2)
        : 0;
    
    resultadosArray.push({
        id: 'blancos',
        nombre: 'Votos Blancos',
        color: '#95a5a6',
        votos: resultadosGlobales.blancos,
        porcentaje: parseFloat(porcentajeBlancos)
    });
    
    // Ordenar por porcentaje descendente
    resultadosArray.sort((a, b) => b.porcentaje - a.porcentaje);
    
    // Renderizar gráfico de barras
    renderizarGraficoBarras(resultadosArray);
    
    // Actualizar resultados individuales de cada grupo
    actualizarResultadosGrupos();
}

// Renderizar gráfico de barras
function renderizarGraficoBarras(resultados) {
    const contenedor = document.getElementById('grafico-resultados');
    contenedor.innerHTML = '';
    
    resultados.forEach(resultado => {
        const barraDiv = document.createElement('div');
        barraDiv.className = 'barra-contenedor';
        
        barraDiv.innerHTML = `
            <div class="barra-info">
                <span class="frente-nombre">
                    <span class="color-indicator" style="background-color: ${resultado.color}"></span>
                    ${resultado.nombre}
                </span>
                <span>
                    <span class="frente-porcentaje">${resultado.porcentaje.toFixed(2)}%</span>
                    <span class="frente-votos">(${formatearNumero(resultado.votos)} votos)</span>
                </span>
            </div>
            <div class="barra-progreso">
                <div class="barra-fill" 
                     style="width: ${resultado.porcentaje}%; background-color: ${resultado.color}">
                </div>
            </div>
        `;
        
        contenedor.appendChild(barraDiv);
    });
}

// Actualizar resultados de cada grupo individual
function actualizarResultadosGrupos() {
    configGrupos.grupos.forEach(grupo => {
        const resultados = calcularResultadosGrupo(grupo);
        const contenedor = document.getElementById(`resultados-${grupo.id}`);
        
        let html = '<h4 style="margin-bottom: 10px; font-size: 0.95em;">Resultados:</h4>';
        
        html += `
            <div class="resultado-item">
                <span class="resultado-label">Asistentes:</span>
                <span class="resultado-value">${formatearNumero(resultados.asistentes)}</span>
            </div>
            <div class="resultado-item">
                <span class="resultado-label">Votos Nulos:</span>
                <span class="resultado-value">${formatearNumero(resultados.nulos)}</span>
            </div>
            <div class="resultado-item">
                <span class="resultado-label">Votos Válidos:</span>
                <span class="resultado-value">${formatearNumero(resultados.votosValidos)}</span>
            </div>
        `;
        
        contenedor.innerHTML = html;
    });
}

// Formatear número con separadores de miles
function formatearNumero(numero) {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
