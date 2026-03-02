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

  // ── 2. SUPER ADMIN ─────────────────────────────────────────
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@farmasi.com";
  const superAdminPass  = process.env.SUPER_ADMIN_PASS  || "farmasi2024";

  const existeAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });

  if (!existeAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPass, 10);
    await prisma.user.create({
      data: {
        company_id: null,
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
    if (existeAdmin.company_id !== null) {
      await prisma.user.update({
        where: { email: superAdminEmail },
        data: { company_id: null },
      });
      console.log(`🔧 company_id del Super Admin limpiado a null`);
    }
  }

  // ── 3. EMPRESA DEMO ────────────────────────────────────────
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
        fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    });
    console.log(`✅ Empresa demo creada: ${empresa.nombre_empresa}`);
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

  // ── 5. PRODUCTOS Y INVENTARIO ──────────────────────────────
  // ✅ Eliminado — los productos se agregan manualmente desde la app

  console.log("\n🎉 Seed completado exitosamente!");
  console.log("═══════════════════════════════════════════════════");
  console.log("👑 SUPER ADMIN (plataforma, sin empresa)");
  console.log("   📧 Email:     ", superAdminEmail);
  console.log("   🔑 Contraseña:", superAdminPass);
  console.log("───────────────────────────────────────────────────");
  console.log("🏪 OWNER DEMO (empresa Mi Farmasi)");
  console.log("   📧 Email:     ", ownerEmail);
  console.log("   🔑 Contraseña:", ownerPass);
  console.log("═══════════════════════════════════════════════════");
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