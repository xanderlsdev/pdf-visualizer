import Print from './print';
import { cleanUp } from './functions';

export default {
  print: async (params, printFrame) => {
    // Check if we have base64 data
    if (params.base64) {
      if (params.printable.indexOf(',') !== -1) {
        // If pdf base64 starts with `data:application/pdf;base64,`, executing the atob function will throw an error. So we get the content after `,`
        params.printable = params.printable.split(',')[1];
      }
      const bytesArray = Uint8Array.from(atob(params.printable), c => c.charCodeAt(0));
      createBlobAndPrint(params, printFrame, bytesArray);
      return;
    }

    // Format pdf url
    params.printable = /^(blob|http|\/\/)/i.test(params.printable)
      ? params.printable
      : window.location.origin + (params.printable.charAt(0) !== '/' ? '/' + params.printable : params.printable);

    try {
      const response = await fetch(params.printable, {
        method: 'GET',
        headers: params.headers || {},
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const data = await response.arrayBuffer();
      createBlobAndPrint(params, printFrame, new Uint8Array(data));
    } catch (error) {
      cleanUp(params);
      params.onError(error.message, error);
    }
  }
};

function createBlobAndPrint(params, printFrame, data) {
  // Pass response or base64 data to a blob and create a local object url
  let localPdf = new window.Blob([data], { type: 'application/pdf' });
  localPdf = window.URL.createObjectURL(localPdf);

  // Set iframe src with pdf document url
  printFrame.setAttribute('src', localPdf);

  Print.send(params, printFrame);
}
