import PDFVisualizer from './js/pdfVisualizer';

const pdfVisualizer = new PDFVisualizer();

if (typeof window !== 'undefined') {
    window.pdfVisualizer = pdfVisualizer;
}

export default pdfVisualizer;