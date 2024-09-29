// pdfViewer.js
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import printJS from 'print-js';
import feather from 'feather-icons';
import '../css/style.css';

class PDFViewer {
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
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.previousFocusedElement = null;
    GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  }

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

    const pdfContent = this.container.children[0];

    this.container.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!pdfContent) return;

      const isClickInsidePdfContent = pdfContent.contains(e.target);
      if (!isClickInsidePdfContent) {
        this.close();
      }
    });

    // Configurar funcionalidad de captura de foco
    this.trapFocus();
  }

  trapFocus() {
    const focusableElements = this.container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const isTabPressed = e.key === 'Tab';

        if (!isTabPressed) return;

        if (e.shiftKey) {
          console.log('Shift + Tab');
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
          }
        } else {
          console.log('Tab');
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

  onPrevPage() {
    if (this.pageRendering) return;

    if (this.pageNum <= 1) return;
    this.pageNum--;
    this.queueRenderPage(this.pageNum);
  }

  onNextPage() {
    if (this.pageRendering) return;

    if (this.pageNum >= this.pdfDoc.numPages) return;
    this.pageNum++;
    this.queueRenderPage(this.pageNum);
  }

  onZoomIn() {
    if (this.pageRendering) return;
    if (this.scale < 3.0) {
      this.scale = Math.min(3.0, this.scale + 0.1);
      this.queueRenderPage(this.pageNum);
      this.updateZoomInfo();
    }
  }

  onZoomOut() {
    if (this.pageRendering) return;

    if (this.scale > 0.5) {
      this.scale = Math.max(0.5, this.scale - 0.1);
      this.queueRenderPage(this.pageNum);
      this.updateZoomInfo();
    }
  }

  updateZoomInfo() {
    this.container.querySelector('#zoom-info').textContent = `${Math.round(this.scale * 100)}%`;
  }

  onPrint() {
    if (this.pageRendering) return;

    printJS({
      printable: this.url,
      type: 'pdf',
      showModal: true,
      modalMessage: 'Preparando documento para imprimir...'
    });
  }

  async onDownload() {
    if (this.pageRendering) return;

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
      console.error(error);

      const downloadButton = this.container.querySelector('#donwload');
      downloadButton.innerHTML = `${feather.icons.download.toSvg({ width: 15, height: 15 })}`;
      downloadButton.disabled = false;
    }
  }

  getFileNameFromUrl(url) {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return fileName.split('?')[0] || null; // Elimina cualquier parámetro de consulta
  }

  updateUI() {
    this.container.querySelector('#prev').disabled = this.pageNum <= 1;
    this.container.querySelector('#next').disabled = this.pageNum >= this.pdfDoc.numPages;
    this.container.querySelector('#zoomIn').disabled = this.scale >= 3.0;
    this.container.querySelector('#zoomOut').disabled = this.scale <= 0.5;
  }

  startDragging(e) {
    this.isDragging = true;
    this.startX = e.pageX - this.container.offsetLeft;
    this.startY = e.pageY - this.container.offsetTop;
    this.scrollLeft = this.container.querySelector('#pdf-container').scrollLeft;
    this.scrollTop = this.container.querySelector('#pdf-container').scrollTop;
  }

  stopDragging() {
    this.isDragging = false;
  }

  drag(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    const x = e.pageX - this.container.offsetLeft;
    const y = e.pageY - this.container.offsetTop;
    const walkX = (x - this.startX) * 2;
    const walkY = (y - this.startY) * 2;
    this.container.querySelector('#pdf-container').scrollLeft = this.scrollLeft - walkX;
    this.container.querySelector('#pdf-container').scrollTop = this.scrollTop - walkY;
  }

  /**
   * Abre el visor PDF agregando el contenedor al cuerpo del documento.
   * @param {string} url - La URL del PDF a cargar.
   * @returns {Promise<void>} - Una promesa que se resuelve una vez que el PDF se ha cargado y renderizado.
   */
  async open(url) {
    this.previousFocusedElement = document.activeElement;
    this.container.setAttribute('aria-hidden', 'false');
    this.container.focus();
    document.body.appendChild(this.container);
    await this.loadPDF(url);
  }

  /**
   * Cierra el visor PDF removiendo el contenedor del cuerpo del documento.
   * @returns {void}
   */
  close() {
    if (this.pageRendering) return;

    document.body.removeChild(this.container);

    this.url = '';
    this.pageNum = 1;
    this.pageNumPending = null;
    this.scale = 1.0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.canvas.width = 0
    this.canvas.height = 0
    this.container.querySelector('#preloader').style.display = 'flex';
    this.updateZoomInfo();
    this.container.querySelector('#page-info').innerHTML = 'Página: <span id="page_num"></span> / <span id="page_count"></span>'
    this.container.querySelector('#prev').disabled = true;
    this.container.querySelector('#next').disabled = true;
    this.container.querySelector('#zoomIn').disabled = true;
    this.container.querySelector('#zoomOut').disabled = true;
    this.container.setAttribute('aria-hidden', 'true');
    this.previousFocusedElement?.focus();

    if (this.pdfDoc) {
      this.pdfDoc.destroy();
    }
  }
}

export default PDFViewer;