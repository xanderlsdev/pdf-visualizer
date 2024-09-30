# PDFVisualizer

A modular PDF visualizer that works as a modal in various JavaScript frameworks.

## Installation

```bash
npm install pdf-visualizer
```

## Usage

### Vanilla JavaScript

![Examples 1](example/example1.gif)
```javascript
import PDFViewer from "pdf-visualizer";

// Create the PDF visualizer basically
await PDFViewer.init({
  url: "https://api.syssoftintegra.com/servicios/syssoft/api/reporte/facturacion/venta/pdf/a4/VT0002",
});

```

![Example 2](example/example2.gif)
```javascript
// Create the PDF visualizer with custom styles and events
await PDFViewer.init({
  url: "https://api.syssoftintegra.com/servicios/syssoft/api/reporte/facturacion/venta/pdf/ticket/VT0002",
  title: "PDF Visualizer",
  titlePageNumber: "Página",
  titleLoading: "Cargando PDF...",
  styleContent: "background-color: red;",
  styleHeader: "background-color: orange;",
  styleControls: "background-color: yellow;",
  styleBody: "background-color: green;",
  styleTextTitle: "color: red; font-size: 50px;",
  styleTextPageNumber: "color: blue;",
  stylTextZoomInfo: "color: pink;",
  styleTextLoading: "color: green;",
  styleButtonClose: "color: red; padding: 6px;",
  styleButtonPrev: "color: orange;",
  styleButtonNext: "color: purple;",
  styleButtonZoomIn: "color: white;",
  styleButtonZoomOut: "color: brown;",
  styleButtonDownload: "color: black;",
  styleButtonPrint: "color: red;",
  isMoveable: true,
  isClosingOnEscape: true,
  isClosingOnClickOutside: true,
  isDownloadingOnClick: true,
  isPrintingOnClick: true,
  onAfterOpen: () => {
    console.log("PDF opened");
  },
  onBeforeOpen: () => {
    console.log("Opening PDF");
  },
  // Event execute before closing the PDF by not using the function close 
  onBeforeClose: () => {
    console.log("Closing PDF");
  },
  // Event execute after closing the PDF by not using the function close
  onAfterClose: () => {
    console.log("PDF closed");
  },
});
```

```javascript
await PDFViewer.init({
  url: "https://api.syssoftintegra.com/servicios/syssoft/api/reporte/facturacion/venta/pdf/ticket/VT0002",
  title: "PDF Visualizer",
  titlePageNumber: "Página",
  titleLoading: "Cargando PDF...",
  styleContent: "background-color: red;",
  styleHeader: "background-color: orange;",
  styleControls: "background-color: yellow;",
  styleBody: "background-color: green;",
  styleTextTitle: "color: red; font-size: 50px;",
  styleTextPageNumber: "color: blue;",
  stylTextZoomInfo: "color: pink;",
  styleTextLoading: "color: green;",
  styleButtonClose: "color: red; padding: 6px;",
  styleButtonPrev: "color: orange;",
  styleButtonNext: "color: purple;",
  styleButtonZoomIn: "color: white;",
  styleButtonZoomOut: "color: brown;",
  styleButtonDownload: "color: black;",
  styleButtonPrint: "color: red;",
  isMoveable: true,
  isClosingOnEscape: true,
  isClosingOnClickOutside: true,
  isDownloadingOnClick: true,
  isPrintingOnClick: true,
  onAfterOpen: () => {
    console.log("PDF opened");
  },
  onBeforeOpen: () => {
    console.log("Opening PDF");
  },
  // Event execute before closing the PDF by not using the function close 
  onBeforeClose: () => {
    console.log("Closing PDF");
  },
  // Event execute after closing the PDF by not using the function close
  onAfterClose: () => {
    console.log("PDF closed");
  },
});

// Close the PDF visualizer with custom events and example of timeout
setTimeout(() => {
  PDFViewer.close({
    onBeforeClose: () => {
      console.log("Closing 1 PDF");
    },
    onAfterClose: () => {
      console.log("PDF closed 1");
    },
  });
}, 5000);

// Close the PDF visualizer with custom events
PDFViewer.close({
  onBeforeClose: () => {
    console.log("Closing 1 PDF");
  },
  onAfterClose: () => {
    console.log("PDF closed 1");
  },
});
```

### React

```jsx
import React, { useEffect, useRef } from "react";
import PDFViewer from "pdf-visualizer";

function PDFViewerComponent({ url }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    viewerRef.current = PDFViewer;

    return () => {
      if (viewerRef.current) {
        viewerRef.current.close();
      }
    };
  }, [url]);

  const openViewer = async () => {
    if (viewerRef.current) {
      await viewerRef.current.init({
        url: url,
      });
    }
  };

  return <button onClick={openViewer}>Ver PDF</button>;
}
```

### Vue

```vue
<template>
  <button @click="openViewer">Ver PDF</button>
</template>

<script>
import PDFViewer from "pdf-visualizer";

export default {
  props: ["url"],
  data() {
    return {
      viewer: null,
    };
  },
  mounted() {
    this.viewer = PDFViewer;
  },
  beforeDestroy() {
    if (this.viewer) {
      this.viewer.close();
    }
  },
  methods: {
    openViewer() {
      async if (this.viewer) {
        await this.viewer.init({
          url: this.url,
        });
      }
    },
  },
};
</script>
```

### Angular

```typescript
import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import PDFViewer from "pdf-visualizer";

@Component({
  selector: "app-pdf-viewer",
  template: '<button (click)="openViewer()">Ver PDF</button>',
})
export class PDFViewerComponent implements OnInit, OnDestroy {
  @Input() url: string;
  private viewer: any;

  ngOnInit() {
    this.viewer = PDFViewer;
  }

  ngOnDestroy() {
    if (this.viewer) {
      this.viewer.close();
    }
  }

  async openViewer() {
    if (this.viewer) {
      await this.viewer.init({
        url: this.url,
      });
    }
  }
}
```
