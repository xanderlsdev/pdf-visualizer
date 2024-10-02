// PDFVisualizer.js
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import printJS from 'print-js';
import feather from 'feather-icons';
import '../css/style.css';

/**
 * Clase que representa un visor de documentos PDF.
 * 
 * La clase `PDFVisualizer` se encarga de gestionar la visualización de 
 * archivos PDF, incluyendo la navegación entre páginas, el zoom, 
 * la impresión y la descarga de documentos. Proporciona métodos para 
 * interactuar con el documento PDF, así como para manejar la 
 * interfaz de usuario, incluyendo eventos de arrastre y desplazamiento. 
 * Utiliza la biblioteca PDF.js para la carga y renderización de los 
 * documentos PDF de manera eficiente.
 */
class PDFVisualizer {

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
    this.modal = null;
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
    this.isOpening = false;
    this.isClosing = false;
    this.isDownloading = false;
    this.isPrinting = false;
    this.isMoveable = true;
    this.isClosingOnEscape = true;
    this.isClosingOnClickOutside = true;
    this.isDownloadingOnClick = true;
    this.isPrintingOnClick = true;
    GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
  }

  /**
   * Inicializa el visualizador de PDF con configuraciones personalizadas y
   * crea el contenedor modal con controles de navegación, zoom, descarga e impresión.
   *
   * @param {Object} options - Opciones para personalizar el visualizador de PDF.
   * @param {string} [options.url] - URL del archivo PDF a cargar.
   * @param {string} [options.title='PDF Visualizer'] - El título del visor de PDF.
   * @param {string} [options.titlePageNumber='Page'] - El texto que se muestra antes del número de página.
   * @param {string} [options.titleLoading='Loading PDF...'] - El mensaje que se muestra durante la carga del PDF.
   * @param {boolean} [options.isMoveable=true] - Si el modal es movible arrastrando la cabecera.
   * @param {boolean} [options.isClosingOnEscape=true] - Si el modal se puede cerrar con la tecla Escape.
   * @param {boolean} [options.isClosingOnClickOutside=true] - Si el modal se cierra al hacer clic fuera del contenido.
   * @param {boolean} [options.isDownloadingOnClick=true] - Si el botón de descarga del PDF está habilitado.
   * @param {boolean} [options.isPrintingOnClick=true] - Si el botón de impresión del PDF está habilitado.
   * @param {string} [options.styleContent=''] - Estilo personalizado para el contenedor del modal.
   * @param {string} [options.styleHeader=''] - Estilo personalizado para el encabezado del modal.
   * @param {string} [options.styleControls=''] - Estilo personalizado para los controles del modal.
   * @param {string} [options.styleBody=''] - Estilo personalizado para el cuerpo del modal.
   * @param {string} [options.styleTextTitle=''] - Estilo personalizado para el título del modal.
   * @param {string} [options.styleTextPageNumber=''] - Estilo personalizado para el número de página del modal.
   * @param {string} [options.stylTextZoomInfo=''] - Estilo personalizado para el texto de información de zoom del modal.
   * @param {string} [options.styleTextLoading=''] - Estilo personalizado para el texto de carga del modal.
   * @param {string} [options.styleButtonClose=''] - Estilo personalizado para el botón de cierre del modal.
   * @param {string} [options.styleButtonPrev=''] - Estilo personalizado para el botón de navegación hacia atrás del modal.
   * @param {string} [options.styleButtonNext=''] - Estilo personalizado para el botón de navegación hacia adelante del modal.
   * @param {string} [options.styleButtonZoomIn=''] - Estilo personalizado para el botón de zoom en del modal.
   * @param {string} [options.styleButtonZoomOut=''] - Estilo personalizado para el botón de zoom out del modal.
   * @param {string} [options.styleButtonDownload=''] - Estilo personalizado para el botón de descarga del modal.
   * @param {string} [options.styleButtonPrint=''] - Estilo personalizado para el botón de impresión del modal.
   * @param {Function} [options.onBeforeOpen] - Función a ejecutar antes de que el PDF se haya cargado y el visor se haya abierto.
   * @param {Function} [options.onAfterOpen] - Función a ejecutar después de que el PDF se haya cargado y el visor se haya abierto.
   * @param {Function} [options.onBeforeClose] - Función a ejecutar antes de que el PDF se cierre.
   * @param {Function} [options.onAfterClose] - Función a ejecutar después de que el PDF se cierre.
   * @param {Function} [options.onError] - Función a ejecutar si ocurre un error al cargar el PDF.
   * 
   * @returns {Promise<void>} - No retorna un valor, pero puede usarse como promesa cuando la inicialización esté completa.
   */
  async init({
    url,
    title = 'PDF Visualizer',
    titlePageNumber = 'Page',
    titleLoading = 'Loading PDF...',
    isMoveable = true,
    isClosingOnEscape = true,
    isClosingOnClickOutside = true,
    isDownloadingOnClick = true,
    isPrintingOnClick = true,
    styleContent = '',
    styleHeader = '',
    styleControls = '',
    styleBody = '',
    styleTextTitle = '',
    styleTextPageNumber = '',
    stylTextZoomInfo = '',
    styleTextLoading = '',
    styleButtonClose = '',
    styleButtonPrev = '',
    styleButtonNext = '',
    styleButtonZoomIn = '',
    styleButtonZoomOut = '',
    styleButtonDownload = '',
    styleButtonPrint = '',
    onBeforeOpen,
    onAfterOpen,
    onBeforeClose,
    onAfterClose,
    onError,
  }) {
    try {
      // Se evita abrir el PDF dos veces
      if (this.isOpening) return;

      this.isOpening = true;
      this.title = title;
      this.titlePageNumber = titlePageNumber;
      this.titleLoading = titleLoading;
      this.isMoveable = isMoveable;
      this.isClosingOnEscape = isClosingOnEscape;
      this.isClosingOnClickOutside = isClosingOnClickOutside;
      this.isDownloadingOnClick = isDownloadingOnClick;
      this.isPrintingOnClick = isPrintingOnClick;

      // Se ejecuta antes de abrir el PDF
      if (typeof onBeforeOpen === 'function') {
        onBeforeOpen();
      }

      // Crear el contenedor principal
      this.modal = document.createElement('div');
      this.modal.className = 'pdf-visualizer-modal';
      this.modal.innerHTML = `
        <div class="pdf-visualizer-content" style="${styleContent}">
          <div class="pdf-visualizer-header" style="${styleHeader}">
            <h5 style="${styleTextTitle}">${this.title}</h5>
            <button id="close-btn-pdf-visualizer" class="button-control" style="${styleButtonClose}">${feather.icons.x.toSvg({ width: '1.378rem', height: '1.378rem' })}</button>
          </div>
          <div class="pdf-visualizer-controls" style="${styleControls}">
            <div class="navigate-controls">
              <button id="prev" class="button-control" style="${styleButtonPrev}" disabled>${feather.icons["chevrons-left"].toSvg({ width: '1.378rem', height: '1.378rem' })}</button>
              <button id="next" class="button-control" style="${styleButtonNext}" disabled>${feather.icons["chevrons-right"].toSvg({ width: '1.378rem', height: '1.378rem' })}</button>
              <span id="page-info" style="${styleTextPageNumber}">${this.titlePageNumber}: <span id="page_num"></span> / <span id="page_count"></span></span>
            </div>
            <div class="zoom-controls">
              <button id="zoomOut" class="button-control" style="${styleButtonZoomOut}" disabled>${feather.icons.minus.toSvg({ width: '1.378rem', height: '1.378rem' })}</button>
              <span id="zoom-info" style="${stylTextZoomInfo}">100%</span>
              <button id="zoomIn" class="button-control" style="${styleButtonZoomIn}" disabled>${feather.icons.plus.toSvg({ width: '1.378rem', height: '1.378rem' })}</button>
              <button id="download" class="button-control" style="${styleButtonDownload}" ${this.isDownloadingOnClick ? '' : 'disabled'}>${feather.icons.download.toSvg({ width: '1.378rem', height: '1.378rem' })}</button>
              <button id="print" class="button-control" style="${styleButtonPrint}" ${this.isPrintingOnClick ? '' : 'disabled'}>${feather.icons.printer.toSvg({ width: '1.378rem', height: '1.378rem' })}</button>
            </div>
          </div>
          <div id="pdf-body" style="${styleBody}">
            <canvas id="the-canvas"></canvas>
            <div id="preloader">
              <div class="spinner" style="${styleTextLoading}"></div>
              ${this.titleLoading}
            </div>
          </div>
        </div>
      `;

      // Configurar accesibilidad
      this.container = this.modal.querySelector('.pdf-visualizer-content');
      this.container.setAttribute('tabindex', '-1');
      this.container.setAttribute('role', 'dialog');
      this.container.setAttribute('aria-container', 'true');
      this.container.setAttribute('aria-labelledby', 'pdf-visualizer');

      // Configurar eventos
      this.container.querySelector('#close-btn-pdf-visualizer').addEventListener('click', () => this.close({
        onBeforeClose,
        onAfterClose,
      }));
      this.container.querySelector('#prev').addEventListener('click', () => this.onPrevPage());
      this.container.querySelector('#next').addEventListener('click', () => this.onNextPage());
      this.container.querySelector('#zoomIn').addEventListener('click', () => this.onZoomIn());
      this.container.querySelector('#zoomOut').addEventListener('click', () => this.onZoomOut());
      this.container.querySelector('#download').addEventListener('click', () => this.onDownload());
      this.container.querySelector('#print').addEventListener('click', () => this.onPrint());

      // Configurar canvas y contexto
      this.canvas = this.container.querySelector('#the-canvas');
      this.ctx = this.canvas.getContext('2d');

      // Configurar funcionalidad de arrastre
      const pdfBbody = this.container.querySelector('#pdf-body');
      pdfBbody.addEventListener('mousedown', (e) => this.startDragging(e));
      pdfBbody.addEventListener('mousemove', (e) => this.drag(e));
      pdfBbody.addEventListener('mouseup', () => this.stopDragging());
      pdfBbody.addEventListener('mouseleave', () => this.stopDragging());


      if (this.isMoveable) {
        const pdfHeader = this.container.querySelector('.pdf-visualizer-header');
        pdfHeader.addEventListener('mousedown', (e) => {
          this.isDraggingHeader = true;
          this.offsetX = e.clientX - this.container.offsetLeft;
          this.offsetY = e.clientY - this.container.offsetTop;
        });

        pdfHeader.addEventListener('mousemove', (e) => {
          if (!this.isDraggingHeader) return;

          this.container.style.left = `${e.clientX - this.offsetX}px`;
          this.container.style.top = `${e.clientY - this.offsetY}px`;
        });

        pdfHeader.addEventListener('mouseup', () => {
          this.isDraggingHeader = false;
        });
      }

      // Configurar funcionalidad de cierre al pulsar ESC
      if (this.isClosingOnEscape) {
        this.modal.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            this.close({
              onBeforeClose,
              onAfterClose,
            });
          }
        });
      }

      // Configurar funcionalidad de cierre al hacer clic fuera del PDF
      if (this.isClosingOnClickOutside) {
        this.modal.addEventListener('click', (e) => {
          if (e.target === this.modal) {
            e.stopPropagation();
            this.close({
              onBeforeClose,
              onAfterClose,
            });
          }
        });
      }

      // Configurar funcionalidad de captura de foco
      this.trapFocus();

      // Abrir el PDF
      await this.open({
        url,
        onAfterOpen,
      });
    } catch (error) {
      if (typeof onError === 'function') {
        onError(error);
      }
      this.container.querySelector('#preloader').textContent = 'Error al cargar el PDF. Por favor, intente de nuevo.';
    }
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
   * @throws {Error} Si hay algún error al cargar el PDF o al inicializar el visor.
   * 
   * @returns {Promise<void>} - Una promesa que se resuelve una vez que el PDF se ha cargado y renderizado.
   */
  async loadPDF(url) {
    try {
      this.pageRendering = true;
      this.url = url;

      // Cargar el documento PDF
      const loadingTask = getDocument(this.url);
      const pdfDoc_ = await loadingTask.promise;
      this.pdfDoc = pdfDoc_;

      // Actualizar el número de páginas
      this.container.querySelector('#page_count').textContent = this.pdfDoc.numPages;
      this.container.querySelector('#preloader').style.display = 'none';

      // Renderizar la primera página
      await this.renderPage(this.pageNum);
    } catch (error) {
      throw new Error(error);
    } finally {
      this.pageRendering = false;
    }
  }

  /**
   * Renderiza la página PDF especificada por el número.
   * @param {number} num - El número de la página a renderizar.
   * @returns {void}
   */
  async renderPage(num) {
    // Obtener la página específica
    this.page = await this.pdfDoc.getPage(num);

    // Obtener las dimensiones de la página
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
    if (!this.isPrintingOnClick) return;

    if (this.pageRendering || this.isClosing || this.isDownloading || this.isPrinting) return;

    this.isPrinting = true;

    // Mostrar un indicador de carga
    const printButton = this.container.querySelector('#print');
    const originalContent = printButton.innerHTML;
    printButton.innerHTML = `${feather.icons.loader.toSvg({ width: 15, height: 15, class: 'animated-spin' })}`;
    printButton.disabled = true;

    printJS({
      printable: this.url,
      type: 'pdf',
      showModal: false,
      onLoadingEnd: () => {
        printButton.innerHTML = originalContent;
        printButton.disabled = false;
        this.isPrinting = false;
      },
      onError: (error) => {
        console.error('Error al imprimir el PDF:', error);
        printButton.innerHTML = originalContent;
        printButton.disabled = false;
        this.isPrinting = false;
      },
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
    if (!this.isDownloadingOnClick) return;

    if (this.pageRendering || this.isClosing || this.isDownloading || this.isPrinting) return;

    this.isDownloading = true;

    const downloadButton = this.container.querySelector('#download');
    const originalContent = downloadButton.innerHTML;

    try {
      // Mostrar un indicador de carga
      downloadButton.innerHTML = feather.icons.loader.toSvg({ width: 15, height: 15, class: 'animated-spin' });
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
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
    } finally {
      // Restaurar el botón
      downloadButton.innerHTML = originalContent;
      downloadButton.disabled = false;

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
    this.startX = e.pageX - this.modal.offsetLeft;
    this.startY = e.pageY - this.modal.offsetTop;
    this.scrollLeft = this.container.querySelector('#pdf-body').scrollLeft;
    this.scrollTop = this.container.querySelector('#pdf-body').scrollTop;
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
    const x = e.pageX - this.modal.offsetLeft;
    const y = e.pageY - this.modal.offsetTop;
    const walkX = (x - this.startX) * 2;
    const walkY = (y - this.startY) * 2;
    this.container.querySelector('#pdf-body').scrollLeft = this.scrollLeft - walkX;
    this.container.querySelector('#pdf-body').scrollTop = this.scrollTop - walkY;
  }

  /**
   * Abre el visor de PDF y carga el archivo desde la URL proporcionada.
   * 
   * @async
   * @function open
   * @param {Object} options - Configuración para personalizar el visor PDF.
   * @param {string} [options.url] - URL del archivo PDF a cargar.
   * @param {Function} [options.onAfterOpen] - Función a ejecutar después de que el PDF se haya cargado y el visor se haya abierto.
   * @throws {Error} Si hay algún error al cargar el PDF o al inicializar el visor.
   * 
   * @returns {Promise<void>} - Retorna una promesa que se resuelve cuando el visor se ha abierto y el PDF ha sido cargado.
   */
  async open({
    url,
    onAfterOpen,
  }) {
    try {
      // Abrir el PDF
      this.previousFocusedElement = document.activeElement;
      // Se coloca al final del body para que se muestre por último
      document.body.appendChild(this.modal);
      // Inicializar el modal
      this.container.setAttribute('aria-hidden', 'false');
      // Se coloca al primer elemento enfocable
      this.container.focus();

      // Cargar el PDF
      await this.loadPDF(url);

      // Se ejecuta después de abrir el PDF
      if (typeof onAfterOpen === 'function') {
        onAfterOpen();
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Cierra el visor de PDF y restablece todos los estados y elementos de la interfaz.
   * 
   * @function close
   * @param {Object} options - Configuración para personalizar el visor PDF.
   * @param {Function} [options.onBeforeClose] - Función a ejecutar antes de que el PDF se cierre.
   * @param {Function} [options.onAfterClose] - Función a ejecutar después de que el PDF se cierre.
   * 
   * @returns {void}
   */
  close({
    onBeforeClose,
    onAfterClose,
  } = {}) {
    // Se evita cerrar el PDF si no está abierto
    if (!this.isOpening) return;

    // Se evita cerrar el PDF si se está renderizando una página
    if (this.pageRendering || this.isClosing || this.isDownloading || this.isPrinting) return;

    // Se ejecuta antes de cerrar el PDF
    if (typeof onBeforeClose === 'function') {
      onBeforeClose();
    }

    this.isClosing = true;
    this.container.classList.add('pdf-visualizer-content-closed');

    this.container.addEventListener('animationend', () => {
      document.body.removeChild(this.modal);

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
      this.container.style.left = 'auto';
      this.container.style.top = 'auto';

      // Devolver el foco al elemento anterior
      this.previousFocusedElement?.focus();

      // Destruir el documento PDF si existe
      if (this.pdfDoc) {
        this.pdfDoc.destroy();
      }

      this.isOpening = false;
      this.isClosing = false;
      this.isDownloading = false;
      this.isPrinting = false;
      this.container.classList.remove('pdf-visualizer-content-closed');

      // Se ejecuta después de cerrar el PDF
      if (typeof onAfterClose === 'function') {
        onAfterClose();
      }
    });
  }

  /**
   * Verifica si el PDF está abierto actualmente.
   * 
   * @function isOpen
   * @returns {boolean} True si el PDF está abierto, false en caso contrario.
   */
  isOpen() {
    return this.isOpening;
  }

  /**
   * Verifica si el PDF está cerrado actualmente.
   * 
   * @function isClosed
   * @returns {boolean} True si el PDF está cerrado, false en caso contrario.
   */
  isClosed() {
    return !this.isOpening;
  }
}

export default PDFVisualizer;