// pdfViewer.js
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import printJS from 'print-js';
import feather from 'feather-icons';
import '../css/style.css';

class PDFViewer {
  constructor() {
    this.loadingTask = true;
    this.url = '';
    this.container = null;
    this.pdfDoc = null;
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
    GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  }

  async init() {
    // Crear el contenedor principal
    this.container = document.createElement('div');
    this.container.className = 'pdf-viewer-modal';
    this.container.innerHTML = `
        <div class="pdf-viewer-content">
          <div class="pdf-viewer-header">
            <h2>Visor de PDF</h2>
            <button id="close-btn-pdf-viewer">${feather.icons.x.toSvg({ width: 15, height: 15 })}</button>
          </div>
          <div class="pdf-viewer-controls">
            <div>
              <button id="prev">${feather.icons["chevrons-left"].toSvg({ width: 15, height: 15 })}</button>
              <button id="next">${feather.icons["chevrons-right"].toSvg({ width: 15, height: 15 })}</button>
              <span id="page-info">Página: <span id="page_num"></span> / <span id="page_count"></span></span>
            </div>
            <div class="zoom-controls">
              <button id="zoomOut">${feather.icons.minus.toSvg({ width: 15, height: 15 })}</button>
              <span id="zoom-info">100%</span>
              <button id="zoomIn">${feather.icons.plus.toSvg({ width: 15, height: 15 })}</button>
              <button id="print">${feather.icons.printer.toSvg({ width: 15, height: 15 })}</button>
            </div>
          </div>
          <div id="pdf-container">
            <canvas id="the-canvas"></canvas>
            <div id="preloader">
              <div class="spinner"></div>
              Cargando PDF...
            </div>
          </div>
        </div>
      `;

    // Configurar eventos
    this.container.querySelector('#close-btn-pdf-viewer').addEventListener('click', () => this.close());
    this.container.querySelector('#prev').addEventListener('click', () => this.onPrevPage());
    this.container.querySelector('#next').addEventListener('click', () => this.onNextPage());
    this.container.querySelector('#zoomIn').addEventListener('click', () => this.onZoomIn());
    this.container.querySelector('#zoomOut').addEventListener('click', () => this.onZoomOut());
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
  }

  /**
   * Carga y renderiza un documento PDF a partir de una URL proporcionada.
   * @param {string} url - Un objeto que contiene la URL del PDF a cargar.
   * @returns {Promise<void>} - Una promesa que se resuelve una vez que el PDF se ha cargado y renderizado.
   */
  async loadPDF(url) {
    try {
      this.url = url;
      const loadingTask = getDocument(this.url);
      const pdfDoc_ = await loadingTask.promise;
      this.pdfDoc = pdfDoc_;
      this.container.querySelector('#page_count').textContent = this.pdfDoc.numPages;
      this.container.querySelector('#preloader').style.display = 'none';
      this.renderPage(this.pageNum);
      this.loadingTask = false;
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
  renderPage(num) {
    this.pageRendering = true;
    this.pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale: this.scale });
      this.canvas.height = viewport.height;
      this.canvas.width = viewport.width;

      const renderContext = {
        canvasContext: this.ctx,
        viewport: viewport
      };
      const renderTask = page.render(renderContext);

      renderTask.promise.then(() => {
        this.pageRendering = false;
        if (this.pageNumPending !== null) {
          this.renderPage(this.pageNumPending);
          this.pageNumPending = null;
        }
      });
    });

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
    if (this.loadingTask) return;
    if (this.pageNum <= 1) return;
    this.pageNum--;
    this.queueRenderPage(this.pageNum);
  }

  onNextPage() {
    if (this.loadingTask) return;
    if (this.pageNum >= this.pdfDoc.numPages) return;
    this.pageNum++;
    this.queueRenderPage(this.pageNum);
  }

  onZoomIn() {
    if (this.loadingTask) return;
    if (this.scale < 3.0) {
      this.scale = Math.min(3.0, this.scale + 0.1);
      this.queueRenderPage(this.pageNum);
      this.updateZoomInfo();
    }
  }

  onZoomOut() {
    if (this.loadingTask) return;
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
    if (this.loadingTask) return;
    printJS({
      printable: this.url,
      type: 'pdf',
      showModal: true,
      modalMessage: 'Preparando documento para imprimir...'
    });
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
   * @returns {void}
   */
  open() {
    document.body.appendChild(this.container);
  }

  /**
   * Cierra el visor PDF removiendo el contenedor del cuerpo del documento.
   * @returns {void}
   */
  close() {
    document.body.removeChild(this.container);
  }
}

export default PDFViewer;