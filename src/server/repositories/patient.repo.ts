import { prisma } from '@/server/db';
import type { Prisma } from '@prisma/client';

export const patientRepo = {
  create(data: Prisma.PatientCreateInput) {
    return prisma.patient.create({ data });
  },
  update(id: string, data: Prisma.PatientUpdateInput) {
    return prisma.patient.update({ where: { id }, data });
  },
  findById(id: string) {
    return prisma.patient.findUnique({ where: { id } });
  },
  search(q: string | undefined) {
    const where: Prisma.PatientWhereInput | undefined = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { mobile: { contains: q } },
            { patientCode: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined;
    return prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },
  list(limit = 50) {
    return prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
  findByCode(code: string) {
    return prisma.patient.findUnique({ where: { patientCode: code } });
  },
  withVisitHistory(id: string) {
    return prisma.patient.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { createdAt: 'desc' },
          include: {
            invoices: {
              orderBy: { createdAt: 'desc' },
              include: {
                items: { include: { test: true, result: true } },
              },
            },
          },
        },
      },
    });
  },
};
