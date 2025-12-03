// =================================================================
// LÓGICA DEL MODAL DE BIENVENIDA
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('welcome-modal');
    const acceptButton = document.getElementById('accept-button');

    // 1. Mostrar el modal inmediatamente al cargar la página
    modal.style.display = 'block';

    // 2. Ocultar el modal al hacer clic en aceptar
    acceptButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
});
// =================================================================

// Obtiene la instancia de Firestore
const db = firebase.firestore();

// Referencias a inputs y botones
const nombreInput = document.getElementById('nombre-input');
const ciudadInput = document.getElementById('ciudad-input');
const edadInput = document.getElementById('edad-input');
const detalleInput = document.getElementById('detalle-input');
const addButton = document.getElementById('add-button');
const messageElement = document.getElementById('message');

// =================================================================
// Función auxiliar para normalizar el texto (Capitalización y limpieza)
// =================================================================
function normalizeText(text) {
    if (!text) return '';
    // 1. Limpiar espacios extra
    text = text.trim();

    // 2. Capitalizar la primera letra de cada palabra (ideal para nombres y ciudades)
    return text.toLowerCase().split(' ').map(word => {
        if (word.length === 0) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}


// =================================================================
// 3. FUNCIÓN PARA GUARDAR DATOS
// =================================================================

addButton.addEventListener('click', async() => {
    // Aplicamos limpieza y normalización a los valores antes de usarlos
    const nombre = normalizeText(nombreInput.value);
    const ciudad = normalizeText(ciudadInput.value);
    const edad = parseInt(edadInput.value);
    const detalle = detalleInput.value.trim();

    if (!nombre || !ciudad || !edad || !detalle || isNaN(edad)) {
        messageElement.textContent = "⚠️ Nombre, Ciudad, Edad y Detalle son campos obligatorios.";
        messageElement.style.color = 'orange';
        return;
    }

    messageElement.textContent = "⏳ Guardando registro...";
    messageElement.style.color = 'orange';

    try {
        const newRecord = {
            nombre: nombre,
            ciudad: ciudad,
            edad: edad,
            detalle: detalle,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('registrosRNIBO').add(newRecord);

        messageElement.textContent = `✅ Registro de ${nombre} guardado exitosamente.`;
        messageElement.style.color = 'green';

        // Limpiar campos
        nombreInput.value = '';
        ciudadInput.value = '';
        edadInput.value = '';
        detalleInput.value = '';

    } catch (error) {
        console.error("Error al añadir el documento: ", error);
        messageElement.textContent = `❌ Error al guardar: ${error.message}`;
        messageElement.style.color = 'red';
    }
});