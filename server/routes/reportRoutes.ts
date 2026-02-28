// server/routes/reportRoutes.ts
// Todos los reportes que puede generar la app desde la BD real
import { Router } from "express";
import { authenticateToken } from "../middlewares/auth";
import prisma from "../prisma";

const router = Router();

// ── REPORTE VENTAS GENERAL ──────────────────────────────────
router.get("/ventas", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    const { desde, hasta, estado } = req.query;

    const where: any = { company_id: companyId };
    if (desde || hasta) {
      where.fecha_venta = {};
      if (desde) where.fecha_venta.gte = new Date(String(desde));
      if (hasta) {
        const h = new Date(String(hasta));
        h.setHours(23,59,59);
        where.fecha_venta.lte = h;
      }
    }
    if (estado && estado !== "todos") where.estado = String(estado);

    const ventas = await prisma.venta.findMany({
      where,
      include: {
        cliente: true,
        detalles: { include: { producto: true } }
      },
      orderBy: { fecha_venta: "desc" }
    });

    const totalIngresos = ventas.reduce((s, v) => s + v.total, 0);
    const totalCobrado  = ventas.reduce((s, v) => s + v.monto_pagado, 0);
    const totalPendiente = totalIngresos - totalCobrado;

    res.json({
      resumen: {
        total_ventas: ventas.length,
        total_ingresos: totalIngresos,
        total_cobrado: totalCobrado,
        total_pendiente: totalPendiente,
        ventas_pagadas: ventas.filter(v => v.estado === "pagado").length,
        ventas_fiadas: ventas.filter(v => v.estado === "fiado").length,
      },
      ventas: ventas.map(v => ({
        id: v.id,
        cliente: v.cliente?.nombre || "Consumidor Final",
        fecha: v.fecha_venta,
        total: v.total,
        monto_pagado: v.monto_pagado,
        pendiente: v.total - v.monto_pagado,
        estado: v.estado,
        items: v.detalles.map(d => ({
          producto: d.producto.nombre_producto,
          cantidad: d.cantidad,
          precio: d.precio_unitario,
          descuento: d.descuento,
          subtotal: d.subtotal,
        }))
      }))
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── REPORTE PRODUCTOS MÁS VENDIDOS ─────────────────────────
router.get("/productos-top", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    const { desde, hasta } = req.query;

    const where: any = { venta: { company_id: companyId } };
    if (desde || hasta) {
      where.venta = { ...where.venta, fecha_venta: {} };
      if (desde) where.venta.fecha_venta.gte = new Date(String(desde));
      if (hasta) {
        const h = new Date(String(hasta)); h.setHours(23,59,59);
        where.venta.fecha_venta.lte = h;
      }
    }

    const detalles = await prisma.detalleVenta.findMany({
      where,
      include: {
        producto: true,
        venta: true
      }
    });

    // Agrupar por producto
    const porProducto = new Map<number, any>();
    detalles.forEach(d => {
      const key = d.producto_global_id;
      const inv = porProducto.get(key) || {
        id: d.producto_global_id,
        nombre: d.producto.nombre_producto,
        categoria: d.producto.categoria,
        marca: d.producto.marca,
        cantidad_vendida: 0,
        ingresos: 0,
      };
      inv.cantidad_vendida += d.cantidad;
      inv.ingresos += d.subtotal;
      porProducto.set(key, inv);
    });

    // Agregar info de inventario (costo)
    const inventario = await prisma.inventarioEmpresa.findMany({
      where: { company_id: companyId }
    });

    const result = Array.from(porProducto.values()).map(p => {
      const inv = inventario.find(i => i.producto_global_id === p.id);
      const costo_total = p.cantidad_vendida * (inv?.precio_compra || 0);
      const ganancia = p.ingresos - costo_total;
      return {
        ...p,
        precio_venta: inv?.precio_venta || 0,
        precio_costo: inv?.precio_compra || 0,
        costo_total,
        ganancia,
        margen: p.ingresos > 0 ? (ganancia / p.ingresos) * 100 : 0,
        stock_actual: inv?.stock || 0,
      };
    }).sort((a, b) => b.cantidad_vendida - a.cantidad_vendida);

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── REPORTE CLIENTES ────────────────────────────────────────
router.get("/clientes", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;

    const clientes = await prisma.cliente.findMany({
      where: { company_id: companyId },
      include: {
        ventas: {
          include: { detalles: { include: { producto: true } } }
        }
      }
    });

    const result = clientes.map(c => {
      const totalGastado = c.ventas.reduce((s, v) => s + v.total, 0);
      const totalPagado  = c.ventas.reduce((s, v) => s + v.monto_pagado, 0);
      const productosComprados = new Map<string, number>();
      c.ventas.forEach(v => {
        v.detalles.forEach(d => {
          const prev = productosComprados.get(d.producto.nombre_producto) || 0;
          productosComprados.set(d.producto.nombre_producto, prev + d.cantidad);
        });
      });

      const topProducto = Array.from(productosComprados.entries())
        .sort((a, b) => b[1] - a[1])[0];

      return {
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        direccion: c.direccion,
        total_compras: c.ventas.length,
        total_gastado: totalGastado,
        total_pagado: totalPagado,
        saldo_pendiente: c.saldo_pendiente,
        ticket_promedio: c.ventas.length > 0 ? totalGastado / c.ventas.length : 0,
        producto_favorito: topProducto ? topProducto[0] : null,
        ultima_compra: c.ventas.length > 0
          ? c.ventas.sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())[0].fecha_venta
          : null,
        frecuencia: c.ventas.length,
      };
    }).sort((a, b) => b.total_gastado - a.total_gastado);

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── REPORTE FINANCIERO ──────────────────────────────────────
router.get("/financiero", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    const { desde, hasta } = req.query;

    const ventaWhere: any = { company_id: companyId };
    const gastoWhere: any = { company_id: companyId };
    if (desde || hasta) {
      const dateFilter: any = {};
      if (desde) dateFilter.gte = new Date(String(desde));
      if (hasta) { const h = new Date(String(hasta)); h.setHours(23,59,59); dateFilter.lte = h; }
      ventaWhere.fecha_venta = dateFilter;
      gastoWhere.fecha_gasto = dateFilter;
    }

    const [ventas, gastos, inventario] = await Promise.all([
      prisma.venta.findMany({ where: ventaWhere, include: { detalles: true } }),
      prisma.gasto.findMany({ where: gastoWhere }),
      prisma.inventarioEmpresa.findMany({ where: { company_id: companyId } })
    ]);

    const totalIngresos  = ventas.reduce((s, v) => s + v.total, 0);
    const totalGastos    = gastos.reduce((s, g) => s + g.monto, 0);
    const inventoryMap   = new Map(inventario.map(i => [i.producto_global_id, i]));

    let costoVentas = 0;
    ventas.forEach(v => {
      v.detalles.forEach(d => {
        const inv = inventoryMap.get(d.producto_global_id);
        costoVentas += d.cantidad * (inv?.precio_compra || 0);
      });
    });

    const gananciaBruta = totalIngresos - costoVentas;
    const gananciaNeta  = gananciaBruta - totalGastos;
    const valorInventario = inventario.reduce((s, i) => s + i.stock * i.precio_compra, 0);

    // Gastos por categoría
    const gastosPorTipo = gastos.reduce((acc: any, g) => {
      acc[g.tipo_gasto] = (acc[g.tipo_gasto] || 0) + g.monto;
      return acc;
    }, {});

    // Ventas por día (últimos 30 días)
    const ventasPorDia = ventas.reduce((acc: any, v) => {
      const dia = v.fecha_venta.toISOString().split("T")[0];
      acc[dia] = (acc[dia] || 0) + v.total;
      return acc;
    }, {});

    res.json({
      resumen: {
        total_ingresos: totalIngresos,
        costo_ventas: costoVentas,
        ganancia_bruta: gananciaBruta,
        total_gastos: totalGastos,
        ganancia_neta: gananciaNeta,
        margen_bruto: totalIngresos > 0 ? (gananciaBruta / totalIngresos) * 100 : 0,
        margen_neto: totalIngresos > 0 ? (gananciaNeta / totalIngresos) * 100 : 0,
        roi: valorInventario > 0 ? (gananciaNeta / valorInventario) * 100 : 0,
        valor_inventario: valorInventario,
      },
      gastos_por_categoria: Object.entries(gastosPorTipo).map(([tipo, monto]) => ({ tipo, monto })),
      ventas_por_dia: Object.entries(ventasPorDia).map(([fecha, monto]) => ({ fecha, monto })),
      detalle_gastos: gastos.map(g => ({
        id: g.id,
        tipo: g.tipo_gasto,
        descripcion: g.descripcion,
        monto: g.monto,
        fecha: g.fecha_gasto,
      }))
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── REPORTE INVENTARIO ──────────────────────────────────────
router.get("/inventario", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;

    const inventario = await prisma.inventarioEmpresa.findMany({
      where: { company_id: companyId },
      include: { producto: true }
    });

    const result = inventario.map(i => ({
      id: i.id,
      producto: i.producto.nombre_producto,
      categoria: i.producto.categoria,
      marca: i.producto.marca,
      stock: i.stock,
      precio_compra: i.precio_compra,
      precio_venta: i.precio_venta,
      valor_stock: i.stock * i.precio_compra,
      valor_potencial: i.stock * i.precio_venta,
      ganancia_potencial: i.stock * (i.precio_venta - i.precio_compra),
      margen: i.precio_venta > 0 ? ((i.precio_venta - i.precio_compra) / i.precio_venta) * 100 : 0,
      estado: i.stock === 0 ? "agotado" : i.stock <= 5 ? "bajo" : "normal",
    }));

    const totales = {
      valor_total_costo: result.reduce((s, i) => s + i.valor_stock, 0),
      valor_total_venta: result.reduce((s, i) => s + i.valor_potencial, 0),
      ganancia_potencial: result.reduce((s, i) => s + i.ganancia_potencial, 0),
      productos_agotados: result.filter(i => i.estado === "agotado").length,
      productos_bajos: result.filter(i => i.estado === "bajo").length,
    };

    res.json({ totales, productos: result });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── REPORTE CUENTAS POR COBRAR ──────────────────────────────
router.get("/cuentas-cobrar", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;

    const cuentas = await prisma.cuentaPorCobrar.findMany({
      where: {
        venta: { company_id: companyId },
        estado: { not: "pagado" }
      },
      include: {
        venta: { include: { cliente: true } },
        pagos: true
      },
      orderBy: { fecha_vencimiento: "asc" }
    });

    const hoy = new Date();
    const result = cuentas.map(c => ({
      id: c.id,
      cliente: c.venta.cliente?.nombre || "Consumidor Final",
      venta_id: c.venta_id,
      monto_original: c.venta.total,
      monto_pendiente: c.monto_pendiente,
      monto_pagado: c.pagos.reduce((s, p) => s + p.monto_pagado, 0),
      fecha_vencimiento: c.fecha_vencimiento,
      estado: c.estado,
      dias_vencida: c.fecha_vencimiento < hoy
        ? Math.floor((hoy.getTime() - c.fecha_vencimiento.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      en_mora: c.fecha_vencimiento < hoy,
    }));

    const resumen = {
      total_pendiente: result.reduce((s, c) => s + c.monto_pendiente, 0),
      total_en_mora: result.filter(c => c.en_mora).reduce((s, c) => s + c.monto_pendiente, 0),
      clientes_con_deuda: new Set(result.map(c => c.cliente)).size,
    };

    res.json({ resumen, cuentas: result });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── REPORTE CONSIGNACIONES ──────────────────────────────────
router.get("/consignaciones", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;

    const consignaciones = await prisma.consignacion.findMany({
      where: { company_id: companyId },
      include: {
        proveedora: true,
        producto: true,
        ventas_consignacion: true
      },
      orderBy: { fecha_recepcion: "desc" }
    });

    const proveedoras = await prisma.proveedora.findMany({
      where: { company_id: companyId, activo: true }
    });

    // Deuda por proveedora
    const deudaPorProveedora = await prisma.ventaConsignacion.groupBy({
      by: ["proveedora_id"],
      where: {
        company_id: companyId,
        liquidada: false
      },
      _sum: { monto_a_reportar: true, tu_ganancia: true }
    });

    const result = consignaciones.map(c => ({
      id: c.id,
      proveedora: c.proveedora.nombre,
      producto: c.producto.nombre_producto,
      recibidas: c.cantidad_recibida,
      disponibles: c.cantidad_disponible,
      vendidas: c.cantidad_recibida - c.cantidad_disponible,
      precio_costo: c.precio_costo,
      precio_proveedora: c.precio_venta_proveedora,
      precio_tuyo: c.precio_venta_tuyo,
      ganancia_por_unidad: c.precio_venta_tuyo - c.precio_venta_proveedora,
      total_reportar: c.ventas_consignacion.reduce((s, v) => s + v.monto_a_reportar, 0),
      tu_ganancia: c.ventas_consignacion.reduce((s, v) => s + v.tu_ganancia, 0),
      estado: c.estado,
      fecha: c.fecha_recepcion,
    }));

    const resumenProveedoras = proveedoras.map(p => {
      const deuda = deudaPorProveedora.find(d => d.proveedora_id === p.id);
      return {
        id: p.id,
        nombre: p.nombre,
        telefono: p.telefono,
        deuda_pendiente: deuda?._sum?.monto_a_reportar || 0,
        tu_ganancia_pendiente: deuda?._sum?.tu_ganancia || 0,
      };
    });

    res.json({
      resumen: {
        total_consignaciones: result.length,
        total_unidades_recibidas: result.reduce((s, c) => s + c.recibidas, 0),
        total_unidades_vendidas: result.reduce((s, c) => s + c.vendidas, 0),
        total_deuda_proveedoras: resumenProveedoras.reduce((s, p) => s + p.deuda_pendiente, 0),
        tu_ganancia_total: resumenProveedoras.reduce((s, p) => s + p.tu_ganancia_pendiente, 0),
      },
      por_proveedora: resumenProveedoras,
      detalle: result
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── REPORTE VENTAS POR PERÍODO (gráficas) ──────────────────
router.get("/tendencias", authenticateToken, async (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    const dias = Number(req.query.dias) || 30;
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    const [ventas, gastos] = await Promise.all([
      prisma.venta.findMany({
        where: { company_id: companyId, fecha_venta: { gte: desde } },
        include: { detalles: true }
      }),
      prisma.gasto.findMany({
        where: { company_id: companyId, fecha_gasto: { gte: desde } }
      })
    ]);

    // Inventario para calcular costo
    const inventario = await prisma.inventarioEmpresa.findMany({
      where: { company_id: companyId }
    });
    const invMap = new Map(inventario.map(i => [i.producto_global_id, i]));

    // Agrupar por día
    const porDia = new Map<string, { ventas: number; gastos: number; ganancia: number }>();

    // Generar todos los días del rango
    for (let i = 0; i < dias; i++) {
      const d = new Date(desde.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      porDia.set(key, { ventas: 0, gastos: 0, ganancia: 0 });
    }

    ventas.forEach(v => {
      const key = v.fecha_venta.toISOString().split("T")[0];
      const d = porDia.get(key) || { ventas: 0, gastos: 0, ganancia: 0 };
      let costo = 0;
      v.detalles.forEach(det => {
        const inv = invMap.get(det.producto_global_id);
        costo += det.cantidad * (inv?.precio_compra || 0);
      });
      d.ventas += v.total;
      d.ganancia += v.total - costo;
      porDia.set(key, d);
    });

    gastos.forEach(g => {
      const key = g.fecha_gasto.toISOString().split("T")[0];
      const d = porDia.get(key) || { ventas: 0, gastos: 0, ganancia: 0 };
      d.gastos += g.monto;
      porDia.set(key, d);
    });

    const result = Array.from(porDia.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, data]) => ({
        fecha,
        label: new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
        ventas: data.ventas,
        gastos: data.gastos,
        ganancia: data.ganancia,
      }));

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
