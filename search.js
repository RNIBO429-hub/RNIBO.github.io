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
const pageHistory = [null];
const prevPageButton = document.getElementById('prev-page-button');
const nextPageButton = document.getElementById('next-page-button');
const pageStatus = document.getElementById('page-status');
let activeSearchTerm = '';


// =================================================================
// 1. FUNCIÓN PARA CARGAR Y FILTRAR DATOS (PAGINADA)
// =================================================================

searchButton.addEventListener('click', () => {
    activeSearchTerm = searchInput.value.trim().toLowerCase();
    loadRecords(false);
});

function loadRecords(resetSearch = true) {
    itemsContainer.innerHTML = '<li>Buscando...</li>';
    pageStatus.textContent = 'Cargando...';

    prevPageButton.disabled = true;
    nextPageButton.disabled = true;

    if (resetSearch) {
        activeSearchTerm = '';
        searchInput.value = '';
    }

    let query = db.collection('registrosRNIBO').orderBy('timestamp', 'desc');

    const startAfterDoc = pageHistory[currentPage - 1];

    if (startAfterDoc) {
        query = query.startAfter(startAfterDoc);
    }

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
            snapshot.forEach((doc, index) => {
                const data = doc.data();
                const recordText = `${data.nombre} ${data.ciudad} ${data.detalle}`.toLowerCase();

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

                if (index === snapshot.docs.length - 1) {
                    lastVisible = doc;
                }
            });

            if (term && !foundOnPage) {
                itemsContainer.innerHTML = `<li>No se encontró ningún registro que coincida con "${term}" en esta página. Use los botones de página para buscar en otras páginas.</li>`;
            }

            // 🌟 Lógica de Paginación 🌟
            prevPageButton.disabled = (currentPage === 1);
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
        loadRecords(true);
    }
});

prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        pageHistory.pop();
        currentPage--;
        loadRecords(true);
    }
});


// =================================================================
// 2. FUNCIÓN PARA DESCARGAR EXCEL (.xlsx) - ORDENADO POR NOMBRE (SIMPLE)
// =================================================================

downloadExcelButton.addEventListener('click', () => {
    // Mantenemos la ordenación por nombre (ascendente) para un reporte útil
    db.collection('registrosRNIBO').orderBy('nombre', 'asc').get()
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
                    // Formato de fecha simple
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
    loadRecords(true);
});