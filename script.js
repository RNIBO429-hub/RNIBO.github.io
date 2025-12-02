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
// 1. FUNCIÓN PARA GUARDAR DATOS (SOLO EN INDEX.HTML)
// =================================================================

addButton.addEventListener('click', async() => {
    const nombre = nombreInput.value.trim();
    const ciudad = ciudadInput.value.trim();
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