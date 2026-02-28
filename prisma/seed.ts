// prisma/seed.ts
// Solo crea lo MÍNIMO necesario: planes y usuario super_admin
// NO incluye datos de prueba — la app funciona desde cero

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de Farmasi SaaS...");

  // ── 1. PLANES ──────────────────────────────────────────────
  const planes = await prisma.plan.createMany({
    data: [
      { nombre_plan: "Básico",      precio: 0,     limite_usuarios: 1,  limite_productos: 50  },
      { nombre_plan: "Profesional", precio: 19.99, limite_usuarios: 3,  limite_productos: 200 },
      { nombre_plan: "Business",    precio: 39.99, limite_usuarios: 10, limite_productos: 1000 },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Planes creados: ${planes.count}`);

  // ── 2. EMPRESA DEMO ────────────────────────────────────────
  let empresa = await prisma.company.findFirst({
    where: { nombre_empresa: "Mi Farmasi" }
  });

  if (!empresa) {
    const planBasico = await prisma.plan.findFirst({ where: { nombre_plan: "Básico" } });
    empresa = await prisma.company.create({
      data: {
        nombre_empresa: "Mi Farmasi",
        plan_id: planBasico!.id,
        estado: "activo",
        fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      }
    });
    console.log(`✅ Empresa demo creada: ${empresa.nombre_empresa}`);
  }

  // ── 3. SUPER ADMIN ─────────────────────────────────────────
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@farmasi.com";
  const superAdminPass  = process.env.SUPER_ADMIN_PASS  || "farmasi2024";

  const existeAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });

  if (!existeAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPass, 10);
    await prisma.user.create({
      data: {
        company_id: empresa.id,
        nombre: "Super Administrador",
        email: superAdminEmail,
        password: hashedPassword,
        rol: "super_admin",
      }
    });
    console.log(`✅ Super Admin creado: ${superAdminEmail}`);
    console.log(`   Contraseña inicial: ${superAdminPass}`);
    console.log(`   ⚠️  Cámbiala desde el panel después del primer login`);
  } else {
    console.log(`ℹ️  Super Admin ya existe: ${superAdminEmail}`);
  }

  // ── 4. OWNER DE LA EMPRESA DEMO ───────────────────────────
  const ownerEmail = process.env.OWNER_EMAIL || "owner@mifarmasi.com";
  const ownerPass  = process.env.OWNER_PASS  || "owner2024";

  const existeOwner = await prisma.user.findUnique({ where: { email: ownerEmail } });

  if (!existeOwner) {
    const hashedPassword = await bcrypt.hash(ownerPass, 10);
    await prisma.user.create({
      data: {
        company_id: empresa.id,
        nombre: "Dueña del Negocio",
        email: ownerEmail,
        password: hashedPassword,
        rol: "owner",
      }
    });
    console.log(`✅ Owner creado: ${ownerEmail}`);
    console.log(`   Contraseña inicial: ${ownerPass}`);
  }

  // ── 5. PRODUCTOS GLOBALES FARMASI (CATÁLOGO BASE) ─────────
  const productos = await prisma.productoGlobal.createMany({
    data: [
      { nombre_producto: "Labial Matte",          categoria: "Maquillaje",    marca: "Farmasi",   codigo_base: "FAR-LM-001", descripcion: "Labial matte de larga duración en variedad de tonos" },
      { nombre_producto: "Crema Hidratante",       categoria: "Cuidado Piel",  marca: "Dr. C. Tuna", codigo_base: "FAR-CH-001", descripcion: "Crema hidratante con ingredientes naturales" },
      { nombre_producto: "Perfume Floral",         categoria: "Fragancias",    marca: "Farmasi",   codigo_base: "FAR-PF-001", descripcion: "Fragancia floral elegante" },
      { nombre_producto: "Máscara de Pestañas",    categoria: "Maquillaje",    marca: "Farmasi",   codigo_base: "FAR-MP-001", descripcion: "Máscara voluminizadora y alargadora" },
      { nombre_producto: "Sérum Vitamina C",       categoria: "Cuidado Piel",  marca: "Dr. C. Tuna", codigo_base: "FAR-SVC-001", descripcion: "Sérum iluminador con vitamina C" },
      { nombre_producto: "Base Maquillaje",        categoria: "Maquillaje",    marca: "Farmasi",   codigo_base: "FAR-BM-001", descripcion: "Base de alta cobertura" },
      { nombre_producto: "Sombras de Ojos",        categoria: "Maquillaje",    marca: "Farmasi",   codigo_base: "FAR-SO-001", descripcion: "Paleta de sombras multicolor" },
      { nombre_producto: "Crema Anti-Edad",        categoria: "Cuidado Piel",  marca: "Dr. C. Tuna", codigo_base: "FAR-CAE-001", descripcion: "Crema reductora de arrugas" },
      { nombre_producto: "Shampoo Nutrición",      categoria: "Cabello",       marca: "Farmasi",   codigo_base: "FAR-SH-001", descripcion: "Shampoo nutritivo para cabello seco" },
      { nombre_producto: "Perfume Oriental",       categoria: "Fragancias",    marca: "Farmasi",   codigo_base: "FAR-PO-001", descripcion: "Fragancia oriental intensa" },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Productos globales creados: ${productos.count}`);

  // ── 6. INICIALIZAR INVENTARIO EN CERO ────────────────────
  const todosProductos = await prisma.productoGlobal.findMany();
  const inventarioExistente = await prisma.inventarioEmpresa.findMany({
    where: { company_id: empresa.id }
  });
  const idsExistentes = new Set(inventarioExistente.map(i => i.producto_global_id));

  const nuevosInventarios = todosProductos
    .filter(p => !idsExistentes.has(p.id))
    .map(p => ({
      company_id: empresa.id,
      producto_global_id: p.id,
      stock: 0,
      precio_compra: 0,
      precio_venta: 0,
    }));

  if (nuevosInventarios.length > 0) {
    await prisma.inventarioEmpresa.createMany({ data: nuevosInventarios });
    console.log(`✅ Inventario inicializado: ${nuevosInventarios.length} productos en $0`);
  }

  console.log("\n🎉 Seed completado exitosamente!");
  console.log("═══════════════════════════════════════");
  console.log("📧 Super Admin:", superAdminEmail);
  console.log("🔑 Contraseña: ", superAdminPass);
  console.log("📧 Owner:      ", ownerEmail);
  console.log("🔑 Contraseña: ", ownerPass);
  console.log("═══════════════════════════════════════");
  console.log("⚠️  IMPORTANTE: Cambia las contraseñas después del primer login\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error en seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });