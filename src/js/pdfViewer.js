// pdfViewer.js
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import printJS from 'print-js';
import feather from 'feather-icons';
import '../css/style.css';

/**
 * Clase que representa un visor de documentos PDF.
 * 
 * La clase `PDFViewer` se encarga de gestionar la visualización de 
 * archivos PDF, incluyendo la navegación entre páginas, el zoom, 
 * la impresión y la descarga de documentos. Proporciona métodos para 
 * interactuar con el documento PDF, así como para manejar la 
 * interfaz de usuario, incluyendo eventos de arrastre y desplazamiento. 
 * Utiliza la biblioteca PDF.js para la carga y renderización de los 
 * documentos PDF de manera eficiente.
 */
class PDFViewer {

  /**
   * Crea una instancia de la clase PDF Visualizer.
   * 
   * Este constructor inicializa las propiedades de la instancia necesarias 
   * para manejar la visualización de archivos PDF. Configura la URL del 
   * documento PDF, el contenedor para la visualización, títulos por 
   * defecto, y diversas variables de estado relacionadas con la paginación, 
   * el zoom, y la interacción del usuario (como el desplazamiento y el 
   * arrastre). También establece el origen del worker de PDF.js para 
   * procesar los documentos PDF de manera eficiente.
   */
  constructor() {
    this.url = '';
    this.container = null;
    this.title = 'PDF Visualizer';
    this.titlePageNumber = 'Page';
    this.titleLoading = 'Loading PDF...';
    this.pdfDoc = null;
    this.page = null;
    this.pageNum = 1;
    this.pageRendering = false;
    this.pageNumPending = null;
    this.scale = 1.0;
    this.canvas = null;
    this.ctx = null;
    this.isDraggingHeader = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isDraggingScroll = false;
    this.startX = 0;
    this.startY = 0;
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.previousFocusedElement = null;
    this.isClosing = false;
    this.isDownloading = false;
    this.isPrinting = false;
    GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  }

  /**
   * Inicializa el visor de PDF creando la interfaz de usuario y configurando 
   * los eventos necesarios para la interacción.
   * 
   * Este método realiza las siguientes acciones:
   * - Crea el contenedor principal para el visor PDF y lo configura con 
   *   los atributos ARIA necesarios para la accesibilidad.
   * - Establece el contenido HTML del visor, que incluye controles de 
   *   navegación, zoom, descarga e impresión.
   * - Configura eventos para los botones de control, incluyendo navegación 
   *   entre páginas, zoom, descarga e impresión.
   * - Configura el canvas y el contexto para renderizar las páginas del PDF.
   * - Implementa la funcionalidad de arrastre para mover el contenido del 
   *   visor.
   * - Añade manejadores de eventos para cerrar el visor al hacer clic en el 
   *   botón de cerrar o fuera del contenido del PDF, así como al presionar 
   *   la tecla ESC.
   * - Asegura que el foco se mantenga dentro del visor.
   * 
   * @async
   */
  async init() {
    // Crear el contenedor principal
    this.container = document.createElement('div');
    this.container.className = 'pdf-visualizer-modal';
    this.container.setAttribute('tabindex', '-1');
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');
    this.container.setAttribute('aria-labelledby', 'pdf-visualizer');
    this.container.innerHTML = `
        <div class="pdf-visualizer-content">
          <div class="pdf-visualizer-header">
            <h2>${this.title}</h2>
            <button id="close-btn-pdf-visualizer" class="button-control">${feather.icons.x.toSvg({ width: 15, height: 15 })}</button>
          </div>
          <div class="pdf-visualizer-controls">
            <div>
              <button id="prev" class="button-control" disabled>${feather.icons["chevrons-left"].toSvg({ width: 15, height: 15 })}</button>
              <button id="next" class="button-control" disabled>${feather.icons["chevrons-right"].toSvg({ width: 15, height: 15 })}</button>
              <span id="page-info">${this.titlePageNumber}: <span id="page_num"></span> / <span id="page_count"></span></span>
            </div>
            <div class="zoom-controls">
              <button id="zoomOut" class="button-control" disabled>${feather.icons.minus.toSvg({ width: 15, height: 15 })}</button>
              <span id="zoom-info">100%</span>
              <button id="zoomIn" class="button-control" disabled>${feather.icons.plus.toSvg({ width: 15, height: 15 })}</button>
              <button id="donwload" class="button-control">${feather.icons.download.toSvg({ width: 15, height: 15 })}</button>
              <button id="print" class="button-control">${feather.icons.printer.toSvg({ width: 15, height: 15 })}</button>
            </div>
          </div>
          <div id="pdf-container">
            <canvas id="the-canvas"></canvas>
            <div id="preloader">
              <div class="spinner"></div>
              ${this.titleLoading}
            </div>
          </div>
        </div>
      `;

    // Configurar eventos
    this.container.querySelector('#close-btn-pdf-visualizer').addEventListener('click', () => this.close());
    this.container.querySelector('#prev').addEventListener('click', () => this.onPrevPage());
    this.container.querySelector('#next').addEventListener('click', () => this.onNextPage());
    this.container.querySelector('#zoomIn').addEventListener('click', () => this.onZoomIn());
    this.container.querySelector('#zoomOut').addEventListener('click', () => this.onZoomOut());
    this.container.querySelector('#donwload').addEventListener('click', () => this.onDownload());
    this.container.querySelector('#print').addEventListener('click', () => this.onPrint());

    // Configurar canvas y contexto
    this.canvas = this.container.querySelector('#the-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Configurar funcionalidad de arrastre
    const pdfContainer = this.container.querySelector('#pdf-container');
    pdfContainer.addEventListener('mousedown', (e) => this.startDragging(e));
    pdfContainer.addEventListener('mousemove', (e) => this.drag(e));
    pdfContainer.addEventListener('mouseup', () => this.stopDragging());
    pdfContainer.addEventListener('mouseleave', () => this.stopDragging());

    const pdfContent = this.container.querySelector('.pdf-visualizer-content');

    const pdfHeader = this.container.querySelector('.pdf-visualizer-header');
    pdfHeader.addEventListener('mousedown', (e) => {
      this.isDraggingHeader = true;
      this.offsetX = e.clientX - pdfContent.offsetLeft;
      this.offsetY = e.clientY - pdfContent.offsetTop;
    });

    pdfHeader.addEventListener('mousemove', (e) => {
      if (!this.isDraggingHeader) return;

      pdfContent.style.left = `${e.clientX - this.offsetX}px`;
      pdfContent.style.top = `${e.clientY - this.offsetY}px`;
    });

    pdfHeader.addEventListener('mouseup', () => {
      this.isDraggingHeader = false;
    });

    // Configurar funcionalidad de cierre al pulsar ESC
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.close();
      }
    });

    // Configurar funcionalidad de cierre al hacer clic fuera del PDF
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        e.stopPropagation();
        this.close();
      }
    });

    // Configurar funcionalidad de captura de foco
    this.trapFocus();
  }

  /**
   * Captura el foco dentro del modal del visor PDF para mejorar la accesibilidad
   * y la navegación mediante el teclado.
   * 
   * Este método realiza las siguientes acciones:
   * - Selecciona todos los elementos que son enfocables dentro del contenedor
   *   del visor PDF, incluyendo botones, enlaces, entradas de texto y 
   *   elementos con un atributo tabindex válido.
   * - Determina el primer y el último elemento enfocables en la lista.
   * - Añade un manejador de eventos para la tecla 'Tab' que controla la 
   *   navegación cíclica entre los elementos enfocables:
   *   - Al presionar 'Shift + Tab', si el elemento activo es el primero, 
   *     se mueve el foco al último elemento.
   *   - Al presionar 'Tab', si el elemento activo es el último, se mueve 
   *     el foco al primer elemento.
   * 
   * Esto asegura que los usuarios que navegan mediante el teclado puedan
   * interactuar con el modal sin salir de él.
   */
  trapFocus() {
    const focusableElements = this.container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const isTabPressed = e.key === 'Tab';

        if (!isTabPressed) return;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  /**
   * Carga y renderiza un documento PDF a partir de una URL proporcionada.
   * @param {string} url - Un objeto que contiene la URL del PDF a cargar.
   * @returns {Promise<void>} - Una promesa que se resuelve una vez que el PDF se ha cargado y renderizado.
   */
  async loadPDF(url) {
    try {
      this.pageRendering = true;
      this.url = url;
      const loadingTask = getDocument(this.url);
      const pdfDoc_ = await loadingTask.promise;
      this.pdfDoc = pdfDoc_;
      this.container.querySelector('#page_count').textContent = this.pdfDoc.numPages;
      this.container.querySelector('#preloader').style.display = 'none';
      await this.renderPage(this.pageNum);
    } catch (error) {
      console.error('Error al cargar el PDF:', error);
      this.container.querySelector('#preloader').textContent = 'Error al cargar el PDF. Por favor, intente de nuevo.';
    }
  }

  /**
   * Renderiza la página PDF especificada por el número.
   * @param {number} num - El número de la página a renderizar.
   * @returns {void}
   */
  async renderPage(num) {
    this.page = await this.pdfDoc.getPage(num);
    const viewport = this.page.getViewport({ scale: this.scale });
    this.canvas.height = viewport.height;
    this.canvas.width = viewport.width;

    const renderContext = {
      canvasContext: this.ctx,
      viewport: viewport
    };
    const renderTask = this.page.render(renderContext);

    await renderTask.promise;

    this.pageRendering = false;
    if (this.pageNumPending !== null) {
      this.renderPage(this.pageNumPending);
      this.pageNumPending = null;
    }

    this.container.querySelector('#page_num').textContent = num;
    this.updateUI();
  }

  /**
   * Cola la página para renderizarla. Si ya hay una página siendo renderizada,
   * guarda el número de la página pendiente; de lo contrario, la renderiza inmediatamente.
   * @param {number} num - El número de la página a renderizar.
   * @returns {void}
   */
  queueRenderPage(num) {
    if (this.pageRendering) {
      this.pageNumPending = num;
    } else {
      this.renderPage(num);
    }
  }

  /**
   * Navega a la página anterior del documento PDF.
   *
   * Este método realiza las siguientes acciones:
   * - Verifica si se está renderizando una página actualmente. Si es así,
   *   no hace nada.
   * - Comprueba si la página actual es la primera. Si es así, no hace nada.
   * - Decrementa el número de página actual y llama a la función para
   *   renderizar la nueva página.
   *
   * @returns {void}
   */
  onPrevPage() {
    if (this.pageRendering) return;

    if (this.pageNum <= 1) return;
    this.pageNum--;
    this.queueRenderPage(this.pageNum);
  }

  /**
   * Navega a la siguiente página en la cola de renderizado.
   * 
   * Este método verifica si una página se está renderizando actualmente 
   * y previene la navegación si es así. También comprueba si el número 
   * de página actual es mayor o igual al número total de páginas en el 
   * documento PDF, en cuyo caso no hace nada. Si se cumplen las condiciones, 
   * incrementa el número de página y añade la nueva página a la cola para renderizado.
   *
   * @returns {void} Esta función no retorna ningún valor.
   */
  onNextPage() {
    if (this.pageRendering) return;

    if (this.pageNum >= this.pdfDoc.numPages) return;
    this.pageNum++;
    this.queueRenderPage(this.pageNum);
  }

  /**
   * Aumenta el nivel de zoom de la página actual.
   * 
   * Este método verifica si una página se está renderizando actualmente 
   * y previene la acción si es así. Luego, comprueba si el nivel de 
   * zoom actual es menor que 3.0. Si se cumplen estas condiciones, 
   * incrementa el nivel de zoom en 0.1 (sin exceder 3.0), 
   * añade la página actual a la cola para renderizado y actualiza la 
   * información del zoom.
   *
   * @returns {void} Esta función no retorna ningún valor.
   */
  onZoomIn() {
    if (this.pageRendering) return;
    if (this.scale < 3.0) {
      this.scale = Math.min(3.0, this.scale + 0.1);
      this.queueRenderPage(this.pageNum);
      this.updateZoomInfo();
    }
  }

  /**
   * Disminuye el nivel de zoom de la página actual.
   * 
   * Este método verifica si una página se está renderizando actualmente 
   * y previene la acción si es así. Luego, comprueba si el nivel de 
   * zoom actual es mayor que 0.5. Si se cumplen estas condiciones, 
   * disminuye el nivel de zoom en 0.1 (sin caer por debajo de 0.5), 
   * añade la página actual a la cola para renderizado y actualiza la 
   * información del zoom.
   *
   * @returns {void} Esta función no retorna ningún valor.
   */
  onZoomOut() {
    if (this.pageRendering) return;

    if (this.scale > 0.5) {
      this.scale = Math.max(0.5, this.scale - 0.1);
      this.queueRenderPage(this.pageNum);
      this.updateZoomInfo();
    }
  }

  /**
   * Actualiza la información del nivel de zoom en el contenedor.
   * 
   * Esta función selecciona el elemento con el id 'zoom-info' dentro del 
   * contenedor y actualiza su contenido de texto para mostrar el nivel 
   * de zoom actual como un porcentaje, redondeado al entero más cercano.
   *
   * @returns {void} Esta función no retorna ningún valor.
   */
  updateZoomInfo() {
    this.container.querySelector('#zoom-info').textContent = `${Math.round(this.scale * 100)}%`;
  }

  /**
   * Imprime el documento PDF actual.
   * 
   * Este método verifica si una página se está renderizando actualmente 
   * y previene la acción si es así. Si no se está renderizando, utiliza 
   * la biblioteca `printJS` para iniciar el proceso de impresión del 
   * documento PDF, especificando la URL del documento y mostrando un 
   * mensaje modal que indica que se está preparando el documento para 
   * imprimir.
   *
   * @returns {void} Esta función no retorna ningún valor.
   */
  async onPrint() {
    if (this.pageRendering || this.isClosing || this.isDownloading || this.isPrinting) return;

    this.isPrinting = true;

    // Mostrar un indicador de carga
    const printButton = this.container.querySelector('#print');
    const originalContent = printButton.innerHTML;
    printButton.innerHTML = `${feather.icons.loader.toSvg({ width: 15, height: 15 })}`;
    printButton.disabled = true;


    printJS({
      printable: this.url,
      type: 'pdf',
      showModal: false,
      modalMessage: 'Preparando documento para imprimir...',
      onLoadingEnd: () => {
        printButton.innerHTML = originalContent;
        printButton.disabled = false;
        this.isPrinting = false;
      }
    });
  }

  /**
   * Descarga el documento PDF actual.
   * 
   * Este método verifica si una página se está renderizando actualmente 
   * y previene la acción si es así. Si no se está renderizando, intenta 
   * descargar el PDF desde la URL especificada. Durante el proceso de 
   * descarga, muestra un indicador de carga en el botón de descarga. 
   * Después de obtener el PDF como un blob, crea un enlace temporal 
   * para activar la descarga y luego limpia el objeto URL temporal. 
   * Si ocurre un error durante la descarga, muestra un mensaje de error 
   * en la consola y restaura el botón de descarga a su estado original.
   *
   * @returns {Promise<void>} Esta función es asíncrona y no retorna ningún valor.
   */
  async onDownload() {
    if (this.pageRendering || this.isClosing || this.isDownloading || this.isPrinting) return;

    this.isDownloading = true;

    try {
      // Mostrar un indicador de carga
      const downloadButton = this.container.querySelector('#donwload');
      const originalContent = downloadButton.innerHTML;
      downloadButton.innerHTML = `${feather.icons.loader.toSvg({ width: 15, height: 15 })}`;
      downloadButton.disabled = true;

      // Fetch el PDF como un blob
      const response = await fetch(this.url);
      const pdfBlob = await response.blob();

      // Crear un objeto URL temporal
      const blobUrl = window.URL.createObjectURL(pdfBlob);

      // Crear un enlace temporal y activar la descarga
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = this.getFileNameFromUrl(this.url) || 'documento.pdf';
      link.click();

      // Limpiar el objeto URL temporal
      window.URL.revokeObjectURL(blobUrl);

      // Restaurar el botón
      downloadButton.innerHTML = originalContent;
      downloadButton.disabled = false;
    } catch (error) {
      const downloadButton = this.container.querySelector('#donwload');
      downloadButton.innerHTML = `${feather.icons.download.toSvg({ width: 15, height: 15 })}`;
      downloadButton.disabled = false;
    } finally {
      this.isDownloading = false;
    }
  }

  /**
   * Extrae el nombre del archivo de una URL.
   * 
   * Esta función toma una URL como entrada y divide la URL en partes 
   * utilizando '/' como separador. Luego, obtiene la última parte de la 
   * URL, que se asume que es el nombre del archivo. También elimina 
   * cualquier parámetro de consulta al final del nombre del archivo.
   *
   * @param {string} url - La URL de la que se extraerá el nombre del archivo.
   * @returns {string|null} El nombre del archivo o null si no se encuentra.
   */
  getFileNameFromUrl(url) {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return fileName.split('?')[0] || null; // Elimina cualquier parámetro de consulta
  }

  /**
   * Actualiza la interfaz de usuario según el estado actual.
   * 
   * Esta función habilita o deshabilita los botones de navegación y 
   * zoom según el número de página actual y el nivel de zoom. Los botones 
   * de "anterior" y "siguiente" se deshabilitan si el usuario está en 
   * la primera o última página, respectivamente. Asimismo, los botones 
   * de zoom se deshabilitan si el nivel de zoom alcanza sus límites.
   *
   * @returns {void} Esta función no retorna ningún valor.
   */
  updateUI() {
    this.container.querySelector('#prev').disabled = this.pageNum <= 1;
    this.container.querySelector('#next').disabled = this.pageNum >= this.pdfDoc.numPages;
    this.container.querySelector('#zoomIn').disabled = this.scale >= 3.0;
    this.container.querySelector('#zoomOut').disabled = this.scale <= 0.5;
  }

  /**
   * Inicia la acción de arrastrar para desplazar el contenido.
   * 
   * Este método establece las propiedades necesarias para realizar 
   * el desplazamiento del contenido en función de la posición inicial 
   * del cursor. Guarda la posición inicial del cursor y la posición 
   * de desplazamiento actual para poder calcular el movimiento posterior.
   *
   * @param {MouseEvent} e - El evento del ratón que contiene la información de la posición.
   * @returns {void} Esta función no retorna ningún valor.
   */
  startDragging(e) {
    this.isDraggingScroll = true;
    this.startX = e.pageX - this.container.offsetLeft;
    this.startY = e.pageY - this.container.offsetTop;
    this.scrollLeft = this.container.querySelector('#pdf-container').scrollLeft;
    this.scrollTop = this.container.querySelector('#pdf-container').scrollTop;
  }

  /**
   * Detiene la acción de arrastrar.
   * 
   * Este método cambia el estado de `isDraggingScroll` a falso, 
   * lo que indica que ya no se está arrastrando el contenido. 
   *
   * @returns {void} Esta función no retorna ningún valor.
   */
  stopDragging() {
    this.isDraggingScroll = false;
  }

  /**
   * Maneja el desplazamiento del contenido mientras se arrastra.
   * 
   * Este método verifica si la acción de arrastrar está activa. Si 
   * es así, previene el comportamiento predeterminado del evento y 
   * calcula la nueva posición de desplazamiento en función del movimiento 
   * del cursor. Actualiza la posición de desplazamiento horizontal y 
   * vertical del contenedor del PDF en consecuencia.
   *
   * @param {MouseEvent} e - El evento del ratón que contiene la información de la posición.
   * @returns {void} Esta función no retorna ningún valor.
   */
  drag(e) {
    if (!this.isDraggingScroll) return;
    e.preventDefault();
    const x = e.pageX - this.container.offsetLeft;
    const y = e.pageY - this.container.offsetTop;
    const walkX = (x - this.startX) * 2;
    const walkY = (y - this.startY) * 2;
    this.container.querySelector('#pdf-container').scrollLeft = this.scrollLeft - walkX;
    this.container.querySelector('#pdf-container').scrollTop = this.scrollTop - walkY;
  }

  /**
   * Abre el visor PDF y carga un documento PDF desde la URL proporcionada.
   *
   * Este método realiza las siguientes acciones:
   * - Espera a que se complete el cierre de la instancia anterior del visor
   *   si está en proceso de cierre.
   * - Almacena el elemento que tenía el foco anteriormente para poder
   *   restaurarlo al cerrar el visor.
   * - Establece el atributo 'aria-hidden' del contenedor en 'false' para
   *   indicar que el modal es visible.
   * - Asigna el foco al contenedor del visor PDF.
   * - Agrega el contenedor al cuerpo del documento.
   * - Llama al método `loadPDF()` para cargar el documento PDF a partir
   *   de la URL proporcionada.
   *
   * @param {string} url - La URL del documento PDF que se va a cargar.
   * @returns {Promise<void>} - Una promesa que se resuelve cuando el PDF se carga.
   */
  async open(url) {
    if (this.isClosing) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa para asegurar que el cierre se complete
    }
    this.previousFocusedElement = document.activeElement;
    this.container.setAttribute('aria-hidden', 'false');
    this.container.focus();
    document.body.appendChild(this.container);
    await this.loadPDF(url);
  }

  /**
   * Cierra el visor PDF y reinicia su estado interno.
   *
   * Este método realiza las siguientes acciones:
   * - Verifica si se está renderizando una página o si ya se está
   *   cerrando el visor. Si es así, no hace nada.
   * - Establece el estado de cierre (`isClosing`) en `true` para evitar
   *   múltiples cierres simultáneos.
   * - Agrega una clase CSS para animar el cierre del contenido del visor.
   * - Al final de la animación, elimina el contenedor del documento
   *   y reinicia el estado interno del visor.
   * - Limpia el canvas y restablece la interfaz de usuario.
   * - Devuelve el foco al elemento que tenía el foco antes de abrir el visor.
   * - Destruye el documento PDF si existe.
   *
   * @returns {void}
   */
  close() {
    if (this.pageRendering || this.isClosing || this.isDownloading || this.isPrinting) return;

    this.isClosing = true;
    const pdfContent = this.container.querySelector('.pdf-visualizer-content');
    pdfContent.classList.add('pdf-visualizer-content-closed');

    pdfContent.addEventListener('animationend', () => {
      document.body.removeChild(this.container);

      // Reiniciar el estado
      this.url = '';
      this.pageNum = 1;
      this.pageNumPending = null;
      this.scale = 1.0;
      this.isDraggingHeader = false;
      this.offsetX = 0;
      this.offsetY = 0;
      this.isDraggingScroll = false;
      this.startX = 0;
      this.startY = 0;
      this.scrollLeft = 0;
      this.scrollTop = 0;

      // Limpiar el canvas
      this.canvas.width = 0
      this.canvas.height = 0

      // Restablecer la UI
      this.container.querySelector('#preloader').style.display = 'flex';
      this.updateZoomInfo();
      this.container.querySelector('#page-info').innerHTML = `${this.titlePageNumber}: <span id="page_num"></span> / <span id="page_count"></span>`;
      this.container.querySelector('#prev').disabled = true;
      this.container.querySelector('#next').disabled = true;
      this.container.querySelector('#zoomIn').disabled = true;
      this.container.querySelector('#zoomOut').disabled = true;
      this.container.setAttribute('aria-hidden', 'true');

      // Restablecer la posición del contenido
      pdfContent.style.left = 'auto';
      pdfContent.style.top = 'auto';

      // Devolver el foco al elemento anterior
      this.previousFocusedElement?.focus();

      // Destruir el documento PDF si existe
      if (this.pdfDoc) {
        this.pdfDoc.destroy();
      }

      this.isClosing = false;
      this.isDownloading = false;
      pdfContent.classList.remove('pdf-visualizer-content-closed');

    }, { once: true });
  }
}

export default PDFViewer;