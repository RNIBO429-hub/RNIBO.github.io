// Este script maneja la lógica de listado, búsqueda y descarga de EXCEL
const db = firebase.firestore();

// Referencias de la página
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const itemsContainer = document.getElementById('items-container');
const downloadExcelButton = document.getElementById('download-excel-button');

// -------------------------------------------------------------
// 🌟 VARIABLES DE PAGINACIÓN (OPTIMIZACIÓN) 🌟
// -------------------------------------------------------------
const PAGE_SIZE = 10;
let currentPage = 1;
let lastVisible = null;
// pageHistory[0] es siempre null (inicio), pageHistory[1] es el doc de la página 1, etc.
const pageHistory = [null];
const prevPageButton = document.getElementById('prev-page-button');
const nextPageButton = document.getElementById('next-page-button');
const pageStatus = document.getElementById('page-status');
let activeSearchTerm = ''; // Para mantener el término de búsqueda al cambiar de página


// =================================================================
// 1. FUNCIÓN PARA CARGAR Y FILTRAR DATOS (PAGINADA)
// =================================================================

searchButton.addEventListener('click', () => {
    // Solo actualiza el término de búsqueda, no reinicia la paginación.
    // La búsqueda se aplica a la página que ya está cargada.
    activeSearchTerm = searchInput.value.trim().toLowerCase();
    loadRecords(false); // Carga la página actual con el nuevo filtro
});

function loadRecords(resetSearch = true) {
    itemsContainer.innerHTML = '<li>Buscando...</li>';
    pageStatus.textContent = 'Cargando...';

    prevPageButton.disabled = true;
    nextPageButton.disabled = true;

    // Si es la primera carga o si se está navegando, el término de búsqueda activo se borra, 
    // y solo se usa si se presiona el botón "Filtrar Página".
    if (resetSearch) {
        activeSearchTerm = '';
        searchInput.value = '';
    }

    let query = db.collection('registrosRNIBO').orderBy('timestamp', 'desc');

    // Usar el documento guardado en el historial para iniciar la página actual
    const startAfterDoc = pageHistory[currentPage - 1];

    if (startAfterDoc) {
        query = query.startAfter(startAfterDoc);
    }

    // Aplicar el límite de lecturas (OPTIMIZACIÓN CLAVE)
    query = query.limit(PAGE_SIZE);

    query.get().then((snapshot) => {
        itemsContainer.innerHTML = '';
        const term = activeSearchTerm;
        let foundOnPage = false;

        if (snapshot.empty) {
            itemsContainer.innerHTML = '<li>No hay más registros disponibles.</li>';

            if (currentPage > 1) {
                currentPage--;
                pageHistory.pop();
            }

        } else {
            // Mostrar los resultados
            snapshot.forEach((doc, index) => {
                const data = doc.data();
                const recordText = `${data.nombre} ${data.ciudad} ${data.detalle}`.toLowerCase();

                // Aplicar el filtro: solo muestra el ítem si NO hay término de búsqueda O si coincide
                if (!term || recordText.includes(term)) {

                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <strong>Nombre:</strong> ${data.nombre} (${data.edad} años)<br>
                        <strong>Ciudad:</strong> ${data.ciudad}<br>
                        <strong>Detalle:</strong> ${data.detalle}
                    `;
                    itemsContainer.appendChild(listItem);
                    foundOnPage = true;
                }

                // Almacenar el último documento visible para la paginación 'siguiente'
                if (index === snapshot.docs.length - 1) {
                    lastVisible = doc;
                }
            });

            // Si se usó un filtro y no se encontró nada en el cliente
            if (term && !foundOnPage) {
                itemsContainer.innerHTML = `<li>No se encontró ningún registro que coincida con "${term}" en esta página. Use los botones de página para buscar en otras páginas.</li>`;
            }

            // 🌟 Lógica de Paginación 🌟
            prevPageButton.disabled = (currentPage === 1);

            // Habilitar 'Siguiente' SOLO si obtuvimos el número MÁXIMO de elementos (10)
            nextPageButton.disabled = snapshot.docs.length < PAGE_SIZE;

            pageStatus.textContent = `Página ${currentPage}`;
        }
    }).catch(error => {
        console.error("Error al obtener datos: ", error);
        itemsContainer.innerHTML = '<li>Error al cargar los datos. Revisa la conexión a Firebase.</li>';
    });
}


// -------------------------------------------------------------
// 🌟 MANEJO DE EVENTOS DE PAGINACIÓN 🌟
// -------------------------------------------------------------

nextPageButton.addEventListener('click', () => {
    if (lastVisible) {
        pageHistory.push(lastVisible);
        currentPage++;
        loadRecords(true); // Reinicia el filtro de búsqueda al cambiar de página
    }
});

prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        pageHistory.pop();
        currentPage--;
        loadRecords(true); // Reinicia el filtro de búsqueda al cambiar de página
    }
});


// =================================================================
// 2. FUNCIÓN PARA DESCARGAR EXCEL (.xlsx)
// =================================================================
// NOTA: Esta acción SIEMPRE consume TODAS las lecturas.

downloadExcelButton.addEventListener('click', () => {
    db.collection('registrosRNIBO').orderBy('timestamp', 'asc').get()
        .then((snapshot) => {
            const dataForExcel = [];

            dataForExcel.push([
                "Nombre",
                "Ciudad",
                "Edad",
                "Detalle del Caso",
                "Fecha de Registro"
            ]);

            snapshot.forEach((doc) => {
                const data = doc.data();

                let dateRegistered = 'N/A';
                if (data.timestamp && data.timestamp.toDate) {
                    dateRegistered = data.timestamp.toDate().toLocaleString('es-BO');
                }

                dataForExcel.push([
                    data.nombre,
                    data.ciudad,
                    data.edad,
                    data.detalle,
                    dateRegistered
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "RegistrosRNIBO");
            XLSX.writeFile(wb, `RNIBO_Reporte_${new Date().toISOString().slice(0, 10)}.xlsx`);

        })
        .catch(error => {
            console.error("Error al obtener datos para Excel:", error);
            alert("Error al descargar el archivo: " + error.message);
        });
});

// Inicializa la carga de la primera página al abrir la pestaña
document.addEventListener('DOMContentLoaded', () => {
    loadRecords(true); // Carga inicial con reinicio de filtro
});