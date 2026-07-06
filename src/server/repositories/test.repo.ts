import { prisma } from '@/server/db';
import type { Prisma } from '@prisma/client';

export const testRepo = {
  list(filters?: { q?: string; includeInactive?: boolean; categoryId?: string }) {
    const where: Prisma.TestWhereInput = {
      AND: [
        filters?.categoryId ? { categoryId: filters.categoryId } : {},
        filters?.includeInactive ? {} : { isActive: true },
        filters?.q
          ? {
              OR: [
                { name: { contains: filters.q, mode: 'insensitive' } },
                { code: { contains: filters.q, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };
    return prisma.test.findMany({
      where,
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });
  },
  findById(id: string) {
    return prisma.test.findUnique({ where: { id }, include: { category: true } });
  },
  create(data: Prisma.TestCreateInput) {
    return prisma.test.create({ data });
  },
  update(id: string, data: Prisma.TestUpdateInput) {
    return prisma.test.update({ where: { id }, data });
  },
  softDelete(id: string) {
    return prisma.test.update({ where: { id }, data: { isActive: false } });
  },
};

export const testCategoryRepo = {
  list() {
    return prisma.testCategory.findMany({ orderBy: { name: 'asc' } });
  },
  create(name: string) {
    return prisma.testCategory.create({ data: { name } });
  },
  delete(id: string) {
    return prisma.testCategory.delete({ where: { id } });
  },
};