// src/utils/print.ts
// Impresión térmica (80mm), PDF y TXT de ventas
// ── IMPRESIÓN TÉRMICA (80mm) ────────────────────────────────
export function printThermal(sale) {
    const linea = "─".repeat(32);
    const centro = (txt, w = 32) => {
        const pad = Math.max(0, Math.floor((w - txt.length) / 2));
        return " ".repeat(pad) + txt;
    };
    const fila = (izq, der, w = 32) => {
        const espacio = Math.max(1, w - izq.length - der.length);
        return izq + " ".repeat(espacio) + der;
    };
    let ticket = "";
    ticket += centro("★ FARMASI ★") + "\n";
    ticket += centro(sale.empresa) + "\n";
    ticket += linea + "\n";
    ticket += centro("COMPROBANTE DE VENTA") + "\n";
    ticket += `Nro: ${sale.id}\n`;
    ticket += `Fecha: ${sale.fecha}\n`;
    ticket += `Cliente: ${sale.cliente}\n`;
    ticket += linea + "\n";
    ticket += fila("PRODUCTO", "SUBTOTAL") + "\n";
    ticket += linea + "\n";
    sale.items.forEach(item => {
        const nombre = item.name.substring(0, 20);
        const subtotal = item.quantity * item.price - (item.discount || 0);
        ticket += `${nombre}\n`;
        ticket += fila(`  ${item.quantity} x $${item.price.toFixed(2)}`, `$${subtotal.toFixed(2)}`) + "\n";
        if (item.discount && item.discount > 0) {
            ticket += fila("  Descuento:", `-$${item.discount.toFixed(2)}`) + "\n";
        }
    });
    ticket += linea + "\n";
    ticket += fila("TOTAL:", `$${sale.total.toFixed(2)}`) + "\n";
    if (sale.pendiente > 0) {
        ticket += fila("PAGADO:", `$${sale.pagado.toFixed(2)}`) + "\n";
        ticket += fila("PENDIENTE:", `$${sale.pendiente.toFixed(2)}`) + "\n";
        ticket += `Estado: ${sale.estado.toUpperCase()}\n`;
    }
    else {
        ticket += fila("Estado:", "✓ PAGADO") + "\n";
    }
    ticket += linea + "\n";
    ticket += centro("¡Gracias por tu compra!") + "\n";
    ticket += centro("www.farmasi.com") + "\n";
    ticket += "\n\n\n"; // Espacio para cortar
    // Abrir ventana de impresión
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) {
        alert("Permite las ventanas emergentes para imprimir");
        return;
    }
    win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket ${sale.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          width: 80mm;
          margin: 0 auto;
          padding: 4px;
          color: #000;
          background: #fff;
        }
        pre { white-space: pre-wrap; font-family: inherit; font-size: inherit; }
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { padding: 2px; }
        }
      </style>
    </head>
    <body>
      <pre>${ticket}</pre>
      <script>
        window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
      </script>
    </body>
    </html>
  `);
    win.document.close();
}
// ── DESCARGA TXT ─────────────────────────────────────────────
export function downloadTxt(sale) {
    const linea = "─".repeat(40);
    let txt = `FARMASI - ${sale.empresa}\n`;
    txt += `COMPROBANTE DE VENTA\n`;
    txt += `${linea}\n`;
    txt += `Nro: ${sale.id}\n`;
    txt += `Fecha: ${sale.fecha}\n`;
    txt += `Cliente: ${sale.cliente}\n`;
    txt += `${linea}\n`;
    txt += `PRODUCTO                      CANT  PRECIO   TOTAL\n`;
    txt += `${linea}\n`;
    sale.items.forEach(item => {
        const subtotal = item.quantity * item.price - (item.discount || 0);
        const name = item.name.padEnd(28).substring(0, 28);
        txt += `${name}  ${String(item.quantity).padStart(3)}  $${item.price.toFixed(2).padStart(7)}  $${subtotal.toFixed(2).padStart(7)}\n`;
    });
    txt += `${linea}\n`;
    txt += `TOTAL:    $${sale.total.toFixed(2)}\n`;
    if (sale.pendiente > 0) {
        txt += `PAGADO:   $${sale.pagado.toFixed(2)}\n`;
        txt += `PENDIENTE: $${sale.pendiente.toFixed(2)}\n`;
    }
    txt += `${linea}\n`;
    txt += `¡Gracias por tu compra!\n`;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `venta-${sale.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
// ── EXPORTAR TABLA A PDF (html2canvas + jsPDF) ──────────────
export async function exportTableToPDF(elementId, filename, titulo, subtitulo) {
    // Importación dinámica para code splitting
    const [{ jsPDF }, html2canvas] = await Promise.all([
        import("jspdf"),
        import("html2canvas").then(m => m.default)
    ]);
    const element = document.getElementById(elementId);
    if (!element) {
        alert("No se encontró el elemento para exportar");
        return;
    }
    // Mostrar loading
    const loadingEl = document.createElement("div");
    loadingEl.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:9999;color:white;font-size:18px;font-family:sans-serif;`;
    loadingEl.textContent = "Generando PDF...";
    document.body.appendChild(loadingEl);
    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        // Header Farmasi
        pdf.setFillColor(244, 91, 105); // #F45B69
        pdf.rect(0, 0, pageW, 20, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("FARMASI", 14, 13);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(titulo, pageW / 2, 13, { align: "center" });
        pdf.setFontSize(8);
        pdf.text(new Date().toLocaleString("es-ES"), pageW - 14, 13, { align: "right" });
        if (subtitulo) {
            pdf.setFillColor(250, 212, 216); // #FAD4D8
            pdf.rect(0, 20, pageW, 8, "F");
            pdf.setTextColor(46, 46, 46);
            pdf.setFontSize(8);
            pdf.text(subtitulo, 14, 25);
        }
        const topOffset = subtitulo ? 30 : 22;
        const availH = pageH - topOffset - 10;
        const imgW = pageW - 16;
        const imgH = (canvas.height * imgW) / canvas.width;
        if (imgH <= availH) {
            pdf.addImage(imgData, "PNG", 8, topOffset, imgW, imgH);
        }
        else {
            // Dividir en páginas
            let yPos = 0;
            let isFirstPage = true;
            while (yPos < canvas.height) {
                if (!isFirstPage) {
                    pdf.addPage();
                    pdf.setFillColor(244, 91, 105);
                    pdf.rect(0, 0, pageW, 10, "F");
                }
                const sliceH = isFirstPage ? availH : pageH - 16;
                const srcY = yPos;
                const srcH = Math.min((sliceH * canvas.width) / imgW, canvas.height - srcY);
                const tmpCanvas = document.createElement("canvas");
                tmpCanvas.width = canvas.width;
                tmpCanvas.height = srcH;
                const ctx = tmpCanvas.getContext("2d");
                ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
                pdf.addImage(tmpCanvas.toDataURL("image/png"), "PNG", 8, isFirstPage ? topOffset : 12, imgW, (srcH * imgW) / canvas.width);
                yPos += srcH;
                isFirstPage = false;
            }
        }
        // Footer
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Generado por Farmasi SaaS", 14, pageH - 4);
        pdf.save(`${filename}-${new Date().toISOString().split("T")[0]}.pdf`);
    }
    finally {
        document.body.removeChild(loadingEl);
    }
}
// ── EXPORTAR CSV ─────────────────────────────────────────────
export function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        alert("No hay datos para exportar");
        return;
    }
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined)
            return "";
        if (typeof val === "string" && val.includes(","))
            return `"${val}"`;
        return String(val);
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
