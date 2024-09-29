# PDFVisualizer

A modular PDF visualizer that works as a modal in various JavaScript frameworks.

## Installation

```bash
npm install pdf-visualizer
```

## Usage

### Vanilla JavaScript

```javascript
import PDFViewer from "pdf-visualizer";

await PDFViewer.open(
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

  const openViewer = async () => {
    if (viewerRef.current) {
      await viewerRef.current.open(url);
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
        await this.viewer.open(this.url);
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
      await this.viewer.open(this.url);
    }
  }
}
```
