// Seed data for first-time setup. Idempotent: safe to re-run.
// Creates 3 users (admin/reception/lab), 4 test categories and ~10 common tests
// with realistic reference ranges, plus center settings.

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database…');

  // --- Users ---
  const adminHash = await bcrypt.hash('admin123', 10);
  const receptionHash = await bcrypt.hash('reception123', 10);
  const labHash = await bcrypt.hash('lab123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: adminHash, name: 'Chairman', role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { username: 'reception' },
    update: {},
    create: { username: 'reception', passwordHash: receptionHash, name: 'Receptionist', role: 'RECEPTION' },
  });
  await prisma.user.upsert({
    where: { username: 'lab' },
    update: {},
    create: { username: 'lab', passwordHash: labHash, name: 'Lab Technician', role: 'LAB' },
  });

  // --- Center settings ---
  const settings = [
    { key: 'centerName', value: 'Sachar Diagnostic Center' },
    { key: 'centerAddress', value: 'Main Bazar Road, Cityville' },
    { key: 'centerPhone', value: '+92 300 0000000' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  // --- Categories & tests ---
  type SeedTest = {
    code: string;
    name: string;
    category: string;
    price: number;
    referenceRanges: Array<{
      analyte: string;
      unit?: string;
      maleRef?: string;
      femaleRef?: string;
      generalRef?: string;
    }>;
  };

  const tests: SeedTest[] = [
    {
      code: 'CBC',
      name: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      price: 600,
      referenceRanges: [
        { analyte: 'Hemoglobin', unit: 'g/dL', maleRef: '13.0–17.0', femaleRef: '12.0–15.5' },
        { analyte: 'WBC Count', unit: '×10⁹/L', generalRef: '4.0–11.0' },
        { analyte: 'RBC Count', unit: '×10¹²/L', maleRef: '4.5–5.5', femaleRef: '3.8–4.8' },
        { analyte: 'Platelets', unit: '×10⁹/L', generalRef: '150–400' },
        { analyte: 'Hematocrit', unit: '%', maleRef: '40–54', femaleRef: '36–48' },
      ],
    },
    {
      code: 'BSF',
      name: 'Blood Sugar (Fasting)',
      category: 'Biochemistry',
      price: 250,
      referenceRanges: [{ analyte: 'Glucose (Fasting)', unit: 'mg/dL', generalRef: '70–100' }],
    },
    {
      code: 'BSR',
      name: 'Blood Sugar (Random)',
      category: 'Biochemistry',
      price: 250,
      referenceRanges: [{ analyte: 'Glucose (Random)', unit: 'mg/dL', generalRef: '<140' }],
    },
    {
      code: 'LIPID',
      name: 'Lipid Profile',
      category: 'Biochemistry',
      price: 1500,
      referenceRanges: [
        { analyte: 'Total Cholesterol', unit: 'mg/dL', generalRef: '<200' },
        { analyte: 'Triglycerides', unit: 'mg/dL', generalRef: '<150' },
        { analyte: 'HDL', unit: 'mg/dL', maleRef: '>40', femaleRef: '>50' },
        { analyte: 'LDL', unit: 'mg/dL', generalRef: '<100' },
      ],
    },
    {
      code: 'LFT',
      name: 'Liver Function Test (LFT)',
      category: 'Biochemistry',
      price: 1800,
      referenceRanges: [
        { analyte: 'ALT (SGPT)', unit: 'U/L', generalRef: '7–56' },
        { analyte: 'AST (SGOT)', unit: 'U/L', generalRef: '10–40' },
        { analyte: 'Total Bilirubin', unit: 'mg/dL', generalRef: '0.1–1.2' },
        { analyte: 'Direct Bilirubin', unit: 'mg/dL', generalRef: '0.0–0.3' },
        { analyte: 'Alkaline Phosphatase', unit: 'U/L', generalRef: '44–147' },
      ],
    },
    {
      code: 'URE',
      name: 'Urine Routine Examination (R/E)',
      category: 'Urine Analysis',
      price: 350,
      referenceRanges: [
        { analyte: 'Color', generalRef: 'Pale Yellow' },
        { analyte: 'Appearance', generalRef: 'Clear' },
        { analyte: 'pH', generalRef: '5.0–8.0' },
        { analyte: 'Protein', generalRef: 'Negative' },
        { analyte: 'Sugar', generalRef: 'Negative' },
      ],
    },
    {
      code: 'XRAY-CHEST',
      name: 'X-Ray Chest PA View',
      category: 'Radiology',
      price: 1200,
      referenceRanges: [],
    },
    {
      code: 'US-ABD',
      name: 'Ultrasound Abdomen',
      category: 'Radiology',
      price: 2500,
      referenceRanges: [],
    },
    {
      code: 'TFT',
      name: 'Thyroid Function Test (TFT)',
      category: 'Biochemistry',
      price: 2200,
      referenceRanges: [
        { analyte: 'TSH', unit: 'µIU/mL', generalRef: '0.4–4.0' },
        { analyte: 'Free T4', unit: 'ng/dL', generalRef: '0.8–1.8' },
        { analyte: 'Free T3', unit: 'pg/mL', generalRef: '2.3–4.2' },
      ],
    },
    {
      code: 'HBA1C',
      name: 'HbA1c (Glycated Hemoglobin)',
      category: 'Biochemistry',
      price: 1300,
      referenceRanges: [{ analyte: 'HbA1c', unit: '%', generalRef: '<5.7' }],
    },
  ];

  const categoryIds: Record<string, string> = {};
  const uniqueCategories = Array.from(new Set(tests.map((t) => t.category)));
  for (const name of uniqueCategories) {
    const cat = await prisma.testCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryIds[name] = cat.id;
  }

  for (const t of tests) {
    await prisma.test.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        price: t.price,
        referenceRanges: t.referenceRanges as unknown as object,
        categoryId: categoryIds[t.category],
      },
      create: {
        code: t.code,
        name: t.name,
        price: t.price,
        referenceRanges: t.referenceRanges as unknown as object,
        categoryId: categoryIds[t.category],
      },
    });
  }

  console.log('✅ Seed complete.');
  console.log('   admin / admin123');
  console.log('   reception / reception123');
  console.log('   lab / lab123');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });