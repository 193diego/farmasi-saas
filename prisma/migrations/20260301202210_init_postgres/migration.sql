-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "nombre_plan" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "limite_usuarios" INTEGER NOT NULL,
    "limite_productos" INTEGER NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "nombre_empresa" TEXT NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'empleado',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoGlobal" (
    "id" SERIAL NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "marca" TEXT,
    "codigo_base" TEXT NOT NULL,
    "imagen_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductoGlobal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventarioEmpresa" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "producto_global_id" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "precio_compra" DOUBLE PRECISION NOT NULL,
    "precio_venta" DOUBLE PRECISION NOT NULL,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventarioEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "saldo_pendiente" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "cliente_id" INTEGER,
    "total" DOUBLE PRECISION NOT NULL,
    "monto_pagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'pagado',
    "fecha_venta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleVenta" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "producto_global_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "DetalleVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaPorCobrar" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "monto_pendiente" DOUBLE PRECISION NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "CuentaPorCobrar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "cuenta_id" INTEGER NOT NULL,
    "monto_pagado" DOUBLE PRECISION NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "tipo_gasto" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha_gasto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedora" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proveedora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consignacion" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "proveedora_id" INTEGER NOT NULL,
    "producto_global_id" INTEGER NOT NULL,
    "cantidad_recibida" INTEGER NOT NULL,
    "cantidad_disponible" INTEGER NOT NULL,
    "precio_costo" DOUBLE PRECISION NOT NULL,
    "precio_venta_proveedora" DOUBLE PRECISION NOT NULL,
    "precio_venta_tuyo" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "fecha_recepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,
    "notas" TEXT,

    CONSTRAINT "Consignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentaConsignacion" (
    "id" SERIAL NOT NULL,
    "consignacion_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "proveedora_id" INTEGER NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "detalle_venta_id" INTEGER NOT NULL,
    "cantidad_vendida" INTEGER NOT NULL,
    "precio_venta_usado" DOUBLE PRECISION NOT NULL,
    "precio_proveedora" DOUBLE PRECISION NOT NULL,
    "monto_a_reportar" DOUBLE PRECISION NOT NULL,
    "tu_ganancia" DOUBLE PRECISION NOT NULL,
    "liquidada" BOOLEAN NOT NULL DEFAULT false,
    "fecha_venta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VentaConsignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidacionProveedora" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "proveedora_id" INTEGER NOT NULL,
    "monto_total" DOUBLE PRECISION NOT NULL,
    "monto_pagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha_corte" TIMESTAMP(3) NOT NULL,
    "fecha_pago" TIMESTAMP(3),
    "notas" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidacionProveedora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleLiquidacion" (
    "id" SERIAL NOT NULL,
    "liquidacion_id" INTEGER NOT NULL,
    "consignacion_id" INTEGER NOT NULL,
    "ventas_incluidas" INTEGER NOT NULL,
    "monto_consignacion" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DetalleLiquidacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoGlobal_codigo_base_key" ON "ProductoGlobal"("codigo_base");

-- CreateIndex
CREATE UNIQUE INDEX "InventarioEmpresa_company_id_producto_global_id_key" ON "InventarioEmpresa"("company_id", "producto_global_id");

-- CreateIndex
CREATE UNIQUE INDEX "CuentaPorCobrar_venta_id_key" ON "CuentaPorCobrar"("venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "VentaConsignacion_detalle_venta_id_key" ON "VentaConsignacion"("detalle_venta_id");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioEmpresa" ADD CONSTRAINT "InventarioEmpresa_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventarioEmpresa" ADD CONSTRAINT "InventarioEmpresa_producto_global_id_fkey" FOREIGN KEY ("producto_global_id") REFERENCES "ProductoGlobal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_producto_global_id_fkey" FOREIGN KEY ("producto_global_id") REFERENCES "ProductoGlobal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaPorCobrar" ADD CONSTRAINT "CuentaPorCobrar_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "CuentaPorCobrar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedora" ADD CONSTRAINT "Proveedora_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consignacion" ADD CONSTRAINT "Consignacion_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consignacion" ADD CONSTRAINT "Consignacion_proveedora_id_fkey" FOREIGN KEY ("proveedora_id") REFERENCES "Proveedora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consignacion" ADD CONSTRAINT "Consignacion_producto_global_id_fkey" FOREIGN KEY ("producto_global_id") REFERENCES "ProductoGlobal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaConsignacion" ADD CONSTRAINT "VentaConsignacion_consignacion_id_fkey" FOREIGN KEY ("consignacion_id") REFERENCES "Consignacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaConsignacion" ADD CONSTRAINT "VentaConsignacion_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaConsignacion" ADD CONSTRAINT "VentaConsignacion_proveedora_id_fkey" FOREIGN KEY ("proveedora_id") REFERENCES "Proveedora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaConsignacion" ADD CONSTRAINT "VentaConsignacion_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaConsignacion" ADD CONSTRAINT "VentaConsignacion_detalle_venta_id_fkey" FOREIGN KEY ("detalle_venta_id") REFERENCES "DetalleVenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionProveedora" ADD CONSTRAINT "LiquidacionProveedora_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidacionProveedora" ADD CONSTRAINT "LiquidacionProveedora_proveedora_id_fkey" FOREIGN KEY ("proveedora_id") REFERENCES "Proveedora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleLiquidacion" ADD CONSTRAINT "DetalleLiquidacion_liquidacion_id_fkey" FOREIGN KEY ("liquidacion_id") REFERENCES "LiquidacionProveedora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleLiquidacion" ADD CONSTRAINT "DetalleLiquidacion_consignacion_id_fkey" FOREIGN KEY ("consignacion_id") REFERENCES "Consignacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
