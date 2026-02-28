-- ============================================================
-- SCHEMA COMPLETO FARMASI SAAS - POSTGRESQL
-- Incluye modulo de consignaciones
-- ============================================================

-- TABLA PLANES
CREATE TABLE planes (
    id SERIAL PRIMARY KEY,
    nombre_plan VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    limite_usuarios INTEGER NOT NULL,
    limite_productos INTEGER NOT NULL
);

-- TABLA COMPANIES
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(255) NOT NULL,
    plan_id INTEGER REFERENCES planes(id),
    estado VARCHAR(50) DEFAULT 'activo',
    fecha_vencimiento TIMESTAMP NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'empleado', -- super_admin, owner, empleado
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA PRODUCTOS GLOBALES
CREATE TABLE productos_globales (
    id SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    marca VARCHAR(100),
    codigo_base VARCHAR(100) UNIQUE NOT NULL,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA INVENTARIO EMPRESA
CREATE TABLE inventario_empresa (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    producto_global_id INTEGER REFERENCES productos_globales(id),
    stock INTEGER DEFAULT 0,
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA CLIENTES
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    direccion TEXT,
    saldo_pendiente DECIMAL(10,2) DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA VENTAS
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    cliente_id INTEGER REFERENCES clientes(id),
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pagado', -- pagado, parcial, fiado
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA DETALLE VENTA
CREATE TABLE detalle_venta (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES ventas(id),
    producto_global_id INTEGER REFERENCES productos_globales(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    -- Relacion opcional: si este item era de consignacion
    venta_consignacion_id INTEGER -- se agrega FK luego, ver abajo
);

-- TABLA CUENTAS POR COBRAR
CREATE TABLE cuentas_por_cobrar (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER UNIQUE REFERENCES ventas(id),
    monto_pendiente DECIMAL(10,2) NOT NULL,
    fecha_vencimiento TIMESTAMP NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente' -- pendiente, pagado, mora
);

-- TABLA PAGOS
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    cuenta_id INTEGER REFERENCES cuentas_por_cobrar(id),
    monto_pagado DECIMAL(10,2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA GASTOS
CREATE TABLE gastos (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    tipo_gasto VARCHAR(100) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(10,2) NOT NULL,
    fecha_gasto TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- MODULO DE CONSIGNACIONES (TABLAS NUEVAS)
-- ============================================================
-- Logica:
--   Una "proveedora" es otra distribuidora Farmasi que le deja
--   productos a esta empresa para que los venda.
--   - precio_venta_proveedora = lo que se le reporta/paga a ella por unidad
--   - precio_venta_tuyo       = lo que cobra esta empresa al cliente final
--   - ganancia por unidad     = precio_venta_tuyo - precio_venta_proveedora
-- ============================================================

-- TABLA PROVEEDORAS
-- Otras distribuidoras Farmasi que dejan productos en consignacion
CREATE TABLE proveedoras (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA CONSIGNACIONES
-- Cada registro = un lote de productos recibidos de una proveedora
CREATE TABLE consignaciones (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    proveedora_id INTEGER NOT NULL REFERENCES proveedoras(id),
    producto_global_id INTEGER NOT NULL REFERENCES productos_globales(id),

    -- Cantidades
    cantidad_recibida INTEGER NOT NULL,                  -- cuantos llego
    cantidad_disponible INTEGER NOT NULL,                -- cuantos quedan sin vender
    -- cantidad_vendida = cantidad_recibida - cantidad_disponible (calculado)

    -- Precios
    precio_costo DECIMAL(10,2) NOT NULL,                 -- lo que paga esta empresa (puede ser 0 si es a consignacion pura)
    precio_venta_proveedora DECIMAL(10,2) NOT NULL,      -- lo que se le reporta a ella por cada unidad vendida
    precio_venta_tuyo DECIMAL(10,2) NOT NULL,            -- precio al que esta empresa vende al cliente final

    -- Estado del lote
    estado VARCHAR(50) DEFAULT 'activo',                 -- activo, liquidado, devuelto
    notas TEXT,
    fecha_recepcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA VENTAS_CONSIGNACION
-- Registra cada vez que se vende un producto de consignacion.
-- Se crea automaticamente cuando detalle_venta tiene un item de consignacion.
CREATE TABLE ventas_consignacion (
    id SERIAL PRIMARY KEY,
    consignacion_id INTEGER NOT NULL REFERENCES consignaciones(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    proveedora_id INTEGER NOT NULL REFERENCES proveedoras(id),

    cantidad_vendida INTEGER NOT NULL,

    -- Snapshot de precios al momento de la venta (para historial confiable)
    precio_venta_proveedora DECIMAL(10,2) NOT NULL,      -- lo que se le debe reportar a ella
    precio_venta_usado DECIMAL(10,2) NOT NULL,           -- precio real al que se vendio

    -- Calculos automaticos (triggers o aplicacion)
    monto_a_reportar DECIMAL(10,2) NOT NULL,             -- precio_venta_proveedora * cantidad_vendida
    tu_ganancia DECIMAL(10,2) NOT NULL,                  -- (precio_venta_usado - precio_venta_proveedora) * cantidad_vendida

    -- Referencia a la venta origen
    detalle_venta_id INTEGER,                            -- FK a detalle_venta (se agrega abajo)

    liquidada BOOLEAN DEFAULT FALSE,                     -- si ya se incluyo en una liquidacion
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA LIQUIDACIONES_PROVEEDORA
-- Cuando se "cierra" la deuda con una proveedora: agrupa todas
-- las ventas_consignacion pendientes y genera un monto total a pagar.
CREATE TABLE liquidaciones_proveedora (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    proveedora_id INTEGER NOT NULL REFERENCES proveedoras(id),

    monto_total DECIMAL(10,2) NOT NULL,                  -- suma de todos los monto_a_reportar pendientes
    monto_pagado DECIMAL(10,2) DEFAULT 0,
    -- monto_pendiente = monto_total - monto_pagado (calculado)

    estado VARCHAR(50) DEFAULT 'pendiente',              -- pendiente, parcial, pagado
    notas TEXT,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_pago TIMESTAMP
);

-- TABLA DETALLE_LIQUIDACION
-- Que ventas_consignacion se incluyeron en esta liquidacion
CREATE TABLE detalle_liquidacion (
    id SERIAL PRIMARY KEY,
    liquidacion_id INTEGER NOT NULL REFERENCES liquidaciones_proveedora(id) ON DELETE CASCADE,
    venta_consignacion_id INTEGER NOT NULL REFERENCES ventas_consignacion(id),
    monto DECIMAL(10,2) NOT NULL
);

-- TABLA PAGOS_LIQUIDACION
-- Historial de pagos parciales contra una liquidacion
CREATE TABLE pagos_liquidacion (
    id SERIAL PRIMARY KEY,
    liquidacion_id INTEGER NOT NULL REFERENCES liquidaciones_proveedora(id),
    monto_pagado DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(100),                            -- efectivo, transferencia, etc
    notas TEXT,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- FOREIGN KEYS CRUZADAS (se agregan despues de crear tablas)
-- ============================================================

-- detalle_venta -> ventas_consignacion (opcional, solo si el item era consignado)
ALTER TABLE detalle_venta
    ADD CONSTRAINT fk_detalle_venta_consignacion
    FOREIGN KEY (venta_consignacion_id)
    REFERENCES ventas_consignacion(id)
    ON DELETE SET NULL;

-- ventas_consignacion -> detalle_venta
ALTER TABLE ventas_consignacion
    ADD CONSTRAINT fk_venta_consig_detalle
    FOREIGN KEY (detalle_venta_id)
    REFERENCES detalle_venta(id)
    ON DELETE SET NULL;


-- ============================================================
-- INDICES ORIGINALES
-- ============================================================
CREATE INDEX idx_company_users ON users(company_id);
CREATE INDEX idx_company_inventario ON inventario_empresa(company_id);
CREATE INDEX idx_company_ventas ON ventas(company_id);
CREATE INDEX idx_company_clientes ON clientes(company_id);
CREATE INDEX idx_company_gastos ON gastos(company_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_cuentas_vencimiento ON cuentas_por_cobrar(fecha_vencimiento);

-- ============================================================
-- INDICES NUEVOS PARA CONSIGNACIONES
-- ============================================================
CREATE INDEX idx_proveedoras_company ON proveedoras(company_id);
CREATE INDEX idx_consignaciones_company ON consignaciones(company_id);
CREATE INDEX idx_consignaciones_proveedora ON consignaciones(proveedora_id);
CREATE INDEX idx_consignaciones_estado ON consignaciones(estado);
CREATE INDEX idx_ventas_consig_company ON ventas_consignacion(company_id);
CREATE INDEX idx_ventas_consig_proveedora ON ventas_consignacion(proveedora_id);
CREATE INDEX idx_ventas_consig_liquidada ON ventas_consignacion(liquidada);
CREATE INDEX idx_liquidaciones_company ON liquidaciones_proveedora(company_id);
CREATE INDEX idx_liquidaciones_proveedora ON liquidaciones_proveedora(proveedora_id);
CREATE INDEX idx_liquidaciones_estado ON liquidaciones_proveedora(estado);


-- ============================================================
-- QUERIES UTILES PARA EL BACKEND
-- ============================================================

-- 1. Cuanto le debes a una proveedora (ventas sin liquidar)
-- SELECT
--     p.nombre,
--     SUM(vc.monto_a_reportar) AS total_deuda,
--     SUM(vc.tu_ganancia)      AS tu_ganancia_total
-- FROM ventas_consignacion vc
-- JOIN proveedoras p ON p.id = vc.proveedora_id
-- WHERE vc.company_id = $1
--   AND vc.proveedora_id = $2
--   AND vc.liquidada = FALSE
-- GROUP BY p.nombre;

-- 2. Resumen de todas las proveedoras de una empresa
-- SELECT
--     p.id,
--     p.nombre,
--     p.telefono,
--     COUNT(DISTINCT c.id)         AS total_consignaciones,
--     SUM(c.cantidad_recibida)     AS total_unidades_recibidas,
--     SUM(c.cantidad_recibida - c.cantidad_disponible) AS total_vendidas,
--     SUM(vc.monto_a_reportar)     AS deuda_total,
--     SUM(vc.tu_ganancia)          AS ganancia_total
-- FROM proveedoras p
-- LEFT JOIN consignaciones c ON c.proveedora_id = p.id AND c.company_id = $1
-- LEFT JOIN ventas_consignacion vc ON vc.proveedora_id = p.id AND vc.company_id = $1 AND vc.liquidada = FALSE
-- WHERE p.company_id = $1 AND p.activo = TRUE
-- GROUP BY p.id, p.nombre, p.telefono;

-- 3. Detalle de consignaciones con calculos
-- SELECT
--     c.id,
--     pg.nombre_producto,
--     pg.imagen_url,
--     c.cantidad_recibida,
--     c.cantidad_disponible,
--     (c.cantidad_recibida - c.cantidad_disponible) AS cantidad_vendida,
--     c.precio_venta_proveedora,
--     c.precio_venta_tuyo,
--     (c.precio_venta_tuyo - c.precio_venta_proveedora) AS ganancia_por_unidad,
--     ((c.cantidad_recibida - c.cantidad_disponible) * c.precio_venta_proveedora) AS total_a_reportar,
--     ((c.cantidad_recibida - c.cantidad_disponible) * (c.precio_venta_tuyo - c.precio_venta_proveedora)) AS tu_ganancia_total
-- FROM consignaciones c
-- JOIN productos_globales pg ON pg.id = c.producto_global_id
-- WHERE c.company_id = $1 AND c.estado = 'activo';