# PDFVisualizer

A modular PDF viewer that works as a modal in various JavaScript frameworks.

## Installation

```bash
npm install pdf-visualizer
```

## Usage

### Vanilla JavaScript

```javascript
import PDFViewer from "pdf-visualizer";

PDFViewer.open();

await PDFViewer.loadPDF(
  "https://api.syssoftintegra.com/servicios/leatsac/api/reporte/facturacion/venta/pdf/a4/VT0593"
);
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

  const openViewer = () => {
    if (viewerRef.current) {
      viewerRef.current.open();
      viewerRef.current.loadPDF(
        "https://api.syssoftintegra.com/servicios/leatsac/api/reporte/facturacion/venta/pdf/a4/VT0593"
      );
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
      if (this.viewer) {
        this.viewer.open();
        this.viewer.loadPDF(
          "https://api.syssoftintegra.com/servicios/leatsac/api/reporte/facturacion/venta/pdf/a4/VT0593"
        );
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

  openViewer() {
    if (this.viewer) {
      this.viewer.open();
      this.viewer.loadPDF(
        "https://api.syssoftintegra.com/servicios/leatsac/api/reporte/facturacion/venta/pdf/a4/VT0593"
      );
    }
  }
}
```
