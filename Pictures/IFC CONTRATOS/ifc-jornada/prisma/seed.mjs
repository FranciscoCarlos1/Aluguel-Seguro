import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient, PunchType, RecordSource, Role } from "@prisma/client";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ifc_fiscaliza?schema=public";
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

const employees = ["Alana", "Keise", "Luciana", "Viviane", "Zenaide", "Marineida", "Ivonete"];

const initialPunches = [
  { employee: "Alana", workDate: "2026-07-01", type: PunchType.ENTRY, time: "05:48" },
  { employee: "Alana", workDate: "2026-07-01", type: PunchType.EXIT, time: "14:56" },
  { employee: "Keise", workDate: "2026-07-01", type: PunchType.ENTRY, time: "11:54" },
  { employee: "Keise", workDate: "2026-07-01", type: PunchType.EXIT, time: "21:04" },
  { employee: "Luciana", workDate: "2026-07-01", type: PunchType.ENTRY, time: "06:53" },
  { employee: "Luciana", workDate: "2026-07-01", type: PunchType.EXIT, time: "16:02" },
  { employee: "Viviane", workDate: "2026-07-01", type: PunchType.ENTRY, time: "06:29" },
  { employee: "Viviane", workDate: "2026-07-01", type: PunchType.EXIT, time: "11:21" },
  { employee: "Viviane", workDate: "2026-07-01", type: PunchType.ENTRY, time: "12:13" },
  { employee: "Viviane", workDate: "2026-07-01", type: PunchType.EXIT, time: "15:32" },
  { employee: "Zenaide", workDate: "2026-07-01", type: PunchType.ENTRY, time: "11:23" },
  { employee: "Zenaide", workDate: "2026-07-01", type: PunchType.EXIT, time: "16:02" },
  { employee: "Zenaide", workDate: "2026-07-01", type: PunchType.ENTRY, time: "16:45" },
  { employee: "Zenaide", workDate: "2026-07-01", type: PunchType.EXIT, time: "20:32" },
  { employee: "Marineida", workDate: "2026-07-01", type: PunchType.ENTRY, time: "05:56" },
  { employee: "Marineida", workDate: "2026-07-01", type: PunchType.EXIT, time: "10:30" },
  { employee: "Marineida", workDate: "2026-07-01", type: PunchType.ENTRY, time: "11:23" },
  { employee: "Marineida", workDate: "2026-07-01", type: PunchType.EXIT, time: "14:56" },
  { employee: "Alana", workDate: "2026-07-02", type: PunchType.ENTRY, time: "05:51" },
  { employee: "Luciana", workDate: "2026-07-02", type: PunchType.ENTRY, time: "07:54" },
  { employee: "Viviane", workDate: "2026-07-02", type: PunchType.ENTRY, time: "06:20" },
  { employee: "Marineida", workDate: "2026-07-02", type: PunchType.ENTRY, time: "05:56" },
];

const costSnapshot = {
  contractCode: "73/2026",
  procurement: "Licitação nº 181/2026",
  process: "23821.000303/2026-10",
  municipality: "São Bento do Sul",
  contractor: "RGF AMBIENTAL LTDA",
  cnpj: "24.490.730/0001-86",
  executionMonths: 30,
  calculatedEmployees: 6,
  monthlyProposed: 30210.45,
  annualProposed: 906313.50,
  thirtyMonthProposed: 906313.50,
  costPerEmployee: 5514.53,
  costPerEmployeeAlt: 5848.07,
  costPerM2Total: 30210.45,
  locationsArea: 5924.80,
  locationsDailyArea: 3634.69678030303,
  laborBase: 2049.30,
  module2: 2381.23,
  module3: 140.01937125,
  module4: 272.02911132375,
  module5: 110.990833333333,
  module6: 560.962391021197,
  materialsAnnual: 67390.85,
  materialsMonthly: 524.25,
  equipmentMonthly: 36.01,
  equipmentPerEmployeeMonthly: 6,
  uniformsAnnual: 156.81,
  uniformsMonthly: 13.0675,
  epiAnnual: 54.58,
  epiMonthly: 4.54833333333333,
  utensilsAnnual: 0,
  utensilsMonthly: 0,
  sourceSheets: ["RESUMO", "Custos por posto", "Cálculo custoM²", "MAT.UTEN", "EQU", "UNI.EPI", "UTE", "Locais"],
  workbookData: null,
  importedFileName: "Planilha de Custos - Limpeza(2).xlsx (base inicial)",
};

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@ifcfiscaliza.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const operatorEmail = "operacao@ifcfiscaliza.local";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const operatorHash = await bcrypt.hash("Operacao@12345", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: "Administrador IFC Fiscaliza", email: adminEmail, passwordHash, role: Role.ADMIN, isActive: true, forcePasswordChange: false },
  });

  await prisma.user.upsert({
    where: { email: operatorEmail },
    update: {},
    create: { name: "Operação IFC Fiscaliza", email: operatorEmail, passwordHash: operatorHash, role: Role.OPERATOR, isActive: true, forcePasswordChange: false },
  });

  const employeeByName = {};
  for (const name of employees) {
    const employee = await prisma.employee.upsert({ where: { name }, update: {}, create: { name, active: true } });
    employeeByName[name] = employee.id;
  }

  await prisma.timePunch.createMany({
    data: initialPunches.map((punch) => ({
      employeeId: employeeByName[punch.employee],
      workDate: new Date(`${punch.workDate}T00:00:00.000Z`),
      type: punch.type,
      time: punch.time,
      source: RecordSource.IMPORT,
      createdById: admin.id,
    })),
    skipDuplicates: true,
  });

  const existingCost = await prisma.contractCostSnapshot.findFirst({ where: { importedFileName: costSnapshot.importedFileName } });
  if (!existingCost) {
    await prisma.contractCostSnapshot.create({ data: { ...costSnapshot, importedById: admin.id } });
  }

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "SEED_EXECUTED",
      entity: "system",
      payload: { users: 2, employees: employees.length, punches: initialPunches.length, costSnapshot: true },
    },
  });
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
