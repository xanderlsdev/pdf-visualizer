'use strict';

import Browser from './browser';
import Modal from './modal';
import Pdf from './pdf';
import Html from './html';
import RawHtml from './raw-html';
import Image from './image';
import Json from './json';

const printTypes = ['pdf', 'html', 'image', 'json', 'raw-html'];

/**
 * Main printJS module.
 * @module printJS
 */
export default {
  /**
   * Initialize the printJS module.
   * @param {Object|string} args - The printable document or object.
   * @param {string} [args.printable] - Document source: pdf or image url, html element id or json data object.
   * @param {string} [args.type='pdf'] - Printable type. Available print options are: pdf, html, image, json and raw-html.
   * @param {Object} [args.headers] - An object containing custom HTTP headers to be sent with the request. Use this to include any additional headers required for authentication or other purposes.
   * @param {string} [args.header] - Optional header to be used with HTML, Image or JSON printing.
   * @param {string} [args.headerStyle='font-weight: 300;'] - Optional header style to be applied to the header text.
   * @param {number} [args.maxWidth=800] - Max document width in pixels.
   * @param {string|Array} [args.css] - One or more css files URLs that should be applied to the html being printed.
   * @param {string} [args.style] - Custom style that should be applied to the html being printed.
   * @param {boolean} [args.scanStyles=true] - When set to false, the library will not process styles applied to the html being printed.
   * @param {Array} [args.targetStyle] - Array of styles that you want to be processed.
   * @param {Array} [args.targetStyles] - Range of styles to be processed.
   * @param {Array} [args.ignoreElements] - Array of html ids that should be ignored when printing a parent html element.
   * @param {Array} [args.properties] - Object property names when printing JSON.
   * @param {string} [args.gridHeaderStyle='font-weight: bold;'] - Optional style for the grid header when printing JSON data.
   * @param {string} [args.gridStyle='border: 1px solid lightgray; margin-bottom: -1px;'] - Optional style for the grid rows when printing JSON data.
   * @param {boolean} [args.repeatTableHeader=true] - When set to false, the data table header will show in first page only.
   * @param {boolean} [args.showModal=false] - Enable this option to show user feedback when retrieving or processing large PDF files.
   * @param {string} [args.modalMessage='Retrieving Document...'] - Message displayed to users when showModal is set to true.
   * @param {Function} [args.onLoadingStart] - Function to be executed when PDF is being loaded.
   * @param {Function} [args.onLoadingEnd] - Function to be executed after PDF has loaded.
   * @param {string} [args.documentTitle='Document'] - Document title when printing html, image or json.
   * @param {string} [args.fallbackPrintable] - Alternate pdf document to be opened if the browser is not compatible.
   * @param {Function} [args.onPdfOpen] - Callback function executed when the pdf is opened in a new tab.
   * @param {Function} [args.onPrintDialogClose] - Callback function executed once the browser print dialog is closed.
   * @param {Function} [args.onError] - Callback function to be executed when an error occurs.
   * @param {boolean} [args.base64=false] - Used when printing PDF documents passed as base64 data.
   * @param {boolean} [args.honorMarginPadding=true] - Keep or remove padding and margin from elements that are being printed.
   * @param {boolean} [args.honorColor=false] - Print text in color.
   * @param {string} [args.font='TimesNewRoman'] - Typeface used when printing HTML or JSON.
   * @param {string} [args.font_size='12pt'] - Font size used when printing HTML or JSON.
   * @param {string} [args.imageStyle='width:100%;'] - Custom styles to be applied to each image when printing images.
   */
  init(args) {
    const params = {
      printable: null,
      fallbackPrintable: null,
      type: 'pdf',
      headers: null,
      header: null,
      headerStyle: 'font-weight: 300;',
      footer: null,
      footerStyle: 'font-weight: 300;',
      maxWidth: 800,
      properties: null,
      gridHeaderStyle: 'font-weight: bold; padding: 5px; border: 1px solid #dddddd;',
      gridStyle: 'border: 1px solid lightgray; margin-bottom: -1px;',
      showModal: false,
      onError: (error) => { throw error },
      onLoadingStart: null,
      onLoadingEnd: null,
      onPrintDialogClose: () => {},
      onIncompatibleBrowser: () => {},
      modalMessage: 'Retrieving Document...',
      frameId: 'printJS',
      frameRemoveDelay: null,
      printableElement: null,
      documentTitle: 'Document',
      targetStyle: ['clear', 'display', 'width', 'min-width', 'height', 'min-height', 'max-height'],
      targetStyles: ['border', 'box', 'break', 'text-decoration'],
      ignoreElements: [],
      repeatTableHeader: true,
      css: null,
      style: null,
      scanStyles: true,
      base64: false,

      // Deprecated
      onPdfOpen: null,
      font: 'TimesNewRoman',
      font_size: '12pt',
      honorMarginPadding: true,
      honorColor: false,
      imageStyle: 'max-width: 100%;'
    };

    // Check if a printable document or object was supplied
    if (args === undefined) {
      throw new Error('printJS expects at least 1 attribute.');
    }

    // Process parameters
    switch (typeof args) {
      case 'string':
        params.printable = encodeURI(args);
        params.fallbackPrintable = params.printable;
        params.type = arguments[1] || params.type;
        break;
      case 'object':
        params.printable = args.printable;
        params.fallbackPrintable = typeof args.fallbackPrintable !== 'undefined' ? args.fallbackPrintable : params.printable;
        params.fallbackPrintable = params.base64 ? `data:application/pdf;base64,${params.fallbackPrintable}` : params.fallbackPrintable;
        for (var k in params) {
          if (k === 'printable' || k === 'fallbackPrintable') continue;

          params[k] = typeof args[k] !== 'undefined' ? args[k] : params[k];
        }
        break;
      default:
        throw new Error('Unexpected argument type! Expected "string" or "object", got ' + typeof args);
    }

    // Validate printable
    if (!params.printable) throw new Error('Missing printable information.');

    // Validate type
    if (!params.type || typeof params.type !== 'string' || printTypes.indexOf(params.type.toLowerCase()) === -1) {
      throw new Error('Invalid print type. Available types are: pdf, html, image and json.');
    }

    // Check if we are showing a feedback message to the user (useful for large files)
    if (params.showModal) Modal.show(params);

    // Check for a print start hook function
    if (params.onLoadingStart) params.onLoadingStart();

    // To prevent duplication and issues, remove any used printFrame from the DOM
    const usedFrame = document.getElementById(params.frameId);

    if (usedFrame) usedFrame.parentNode.removeChild(usedFrame);

    // Create a new iframe for the print job
    const printFrame = document.createElement('iframe');

    if (Browser.isFirefox()) {
      // Set the iframe to be is visible on the page (guaranteed by fixed position) but hidden using opacity 0, because
      // this works in Firefox. The height needs to be sufficient for some part of the document other than the PDF
      // viewer's toolbar to be visible in the page
      printFrame.setAttribute('style', 'width: 1px; height: 100px; position: fixed; left: 0; top: 0; opacity: 0; border-width: 0; margin: 0; padding: 0');
    } else {
      // Hide the iframe in other browsers
      printFrame.setAttribute('style', 'visibility: hidden; height: 0; width: 0; position: absolute; border: 0');
    }

    // Set iframe element id
    printFrame.setAttribute('id', params.frameId);

    // For non pdf printing, pass an html document string to srcdoc (force onload callback)
    if (params.type !== 'pdf') {
      printFrame.srcdoc = '<html><head><title>' + params.documentTitle + '</title>';

      // Attach css files
      if (params.css) {
        // Add support for single file
        if (!Array.isArray(params.css)) params.css = [params.css];

        // Create link tags for each css file
        params.css.forEach(file => {
          printFrame.srcdoc += '<link rel="stylesheet" href="' + file + '">';
        });
      }

      printFrame.srcdoc += '</head><body></body></html>';
    }

    // Check printable type
    switch (params.type) {
      case 'pdf':
        // Check browser support for pdf and if not supported we will just open the pdf file instead
        if (Browser.isIE()) {
          try {
            console.info('Print.js doesn\'t support PDF printing in Internet Explorer.');
            const win = window.open(params.fallbackPrintable, '_blank');
            win.focus();
            params.onIncompatibleBrowser();
          } catch (error) {
            params.onError(error);
          } finally {
            // Make sure there is no loading modal opened
            if (params.showModal) Modal.close();
            if (params.onLoadingEnd) params.onLoadingEnd();
          }
        } else {
          Pdf.print(params, printFrame);
        }
        break;
      case 'image':
        Image.print(params, printFrame);
        break;
      case 'html':
        Html.print(params, printFrame);
        break;
      case 'raw-html':
        RawHtml.print(params, printFrame);
        break;
      case 'json':
        Json.print(params, printFrame);
        break;
    }
  }
};
