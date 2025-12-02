// Obtiene la instancia de Firestore
const db = firebase.firestore();

// Referencias a inputs y botones
const nombreInput = document.getElementById('nombre-input');
const ciudadInput = document.getElementById('ciudad-input');
const edadInput = document.getElementById('edad-input');
const detalleInput = document.getElementById('detalle-input');
const addButton = document.getElementById('add-button');
const messageElement = document.getElementById('message');

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const itemsContainer = document.getElementById('items-container');

// Referencias para el PDF
const downloadPdfButton = document.getElementById('download-pdf-button');

// =================================================================
// 1. FUNCIÓN PARA GUARDAR DATOS
// =================================================================

addButton.addEventListener('click', async() => {
    const nombre = nombreInput.value.trim();
    const ciudad = ciudadInput.value.trim();
    const edad = parseInt(edadInput.value);
    const detalle = detalleInput.value.trim();

    if (!nombre || !ciudad || !edad || !detalle || isNaN(edad)) {
        messageElement.textContent = "⚠️ Todos los campos son obligatorios y la edad debe ser un número.";
        messageElement.style.color = 'orange';
        return;
    }

    const newRecord = {
        nombre: nombre,
        ciudad: ciudad,
        edad: edad,
        detalle: detalle,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('registrosRNIBO').add(newRecord);

        messageElement.textContent = `✅ Registro de ${nombre} guardado exitosamente.`;
        messageElement.style.color = 'green';

        nombreInput.value = '';
        ciudadInput.value = '';
        edadInput.value = '';
        detalleInput.value = '';

        loadRecords(); // Recargar la lista automáticamente

    } catch (error) {
        console.error("Error al añadir el documento: ", error);
        messageElement.textContent = `❌ Error al guardar: ${error.message}`;
        messageElement.style.color = 'red';
    }
});


// =================================================================
// 2. FUNCIÓN PARA CARGAR Y FILTRAR DATOS
// =================================================================

searchButton.addEventListener('click', () => {
    loadRecords(searchInput.value.trim());
});

function loadRecords(searchTerm = '') {
    itemsContainer.innerHTML = '<li>Buscando...</li>';
    let query = db.collection('registrosRNIBO').orderBy('timestamp', 'desc');

    query.get().then((snapshot) => {
        itemsContainer.innerHTML = '';
        let found = false;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const recordText = `${data.nombre} ${data.ciudad} ${data.detalle}`.toLowerCase();
            const term = searchTerm.toLowerCase();

            if (!term || recordText.includes(term)) {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>Nombre:</strong> ${data.nombre} (${data.edad} años)<br>
                    <strong>Ciudad:</strong> ${data.ciudad}<br>
                    <strong>Detalle:</strong> ${data.detalle}
                `;
                itemsContainer.appendChild(listItem);
                found = true;
            }
        });

        if (!found) {
            itemsContainer.innerHTML = `<li>No se encontraron registros para "${searchTerm}".</li>`;
        }
        if (itemsContainer.children.length === 0 && !searchTerm) {
            itemsContainer.innerHTML = '<li>Aún no hay registros en la base de datos. ¡Agrega el primero!</li>';
        }

    }).catch(error => {
        console.error("Error al obtener datos: ", error);
        itemsContainer.innerHTML = '<li>Error al cargar los datos. Revisa la conexión a Firebase.</li>';
    });
}


// =================================================================
// 3. FUNCIÓN PARA DESCARGAR PDF
// =================================================================

downloadPdfButton.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;

    // Asegurar que el área de impresión tiene fondo blanco para el PDF
    const printArea = document.createElement('div');
    printArea.style.backgroundColor = 'white';
    printArea.style.padding = '20px';
    printArea.style.color = 'black';
    printArea.style.width = '794px'; // Ancho aproximado de A4 para una mejor renderización

    // Añadir encabezado y clonar contenido
    const header = document.createElement('h1');
    header.textContent = "RNIBO - Reporte de Registros";
    header.style.textAlign = 'center';
    header.style.color = '#18191A';
    printArea.appendChild(header);

    const listClone = itemsContainer.cloneNode(true);
    listClone.style.backgroundColor = 'white';
    listClone.style.listStyleType = 'none'; // Eliminar viñetas HTML que se ven mal en PDF

    // Asegurar que el contenido del clon sea legible y sin estilos de dark mode
    Array.from(listClone.children).forEach(li => {
        li.style.color = 'black';
        li.style.borderLeft = '5px solid #FDD835'; // Mantener el acento
        li.style.backgroundColor = '#f7f7f7';
        li.querySelector('strong').style.color = 'black';
    });

    printArea.appendChild(listClone);
    document.body.appendChild(printArea);

    downloadPdfButton.style.display = 'none'; // Ocultar botón durante la captura

    // Generar PDF
    html2canvas(printArea, { scale: 2, logging: false, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`RNIBO_Reporte_${new Date().toISOString().slice(0, 10)}.pdf`);

        // Limpiar
        document.body.removeChild(printArea);
        downloadPdfButton.style.display = 'block';
    });
});


// Inicializa la carga de todos los registros al abrir la página
document.addEventListener('DOMContentLoaded', () => {
    loadRecords();
});