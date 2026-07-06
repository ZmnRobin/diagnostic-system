import { testRepo, testCategoryRepo } from '@/server/repositories/test.repo';
import { logAudit } from '@/server/services/audit.service';
import type { CreateTestInput, UpdateTestInput } from '@/lib/validators/test.schema';

export const testService = {
  list(q?: string, includeInactive = false, categoryId?: string) {
    return testRepo.list({ q, includeInactive, categoryId });
  },
  get(id: string) {
    return testRepo.findById(id);
  },

  async create(input: CreateTestInput, actorUserId: string) {
    const test = await testRepo.create({
      code: input.code,
      name: input.name,
      price: input.price,
      referenceRanges: input.referenceRanges as unknown as object,
      isActive: input.isActive,
      category: { connect: { id: input.categoryId } },
    });
    await logAudit({
      userId: actorUserId,
      action: 'TEST_CREATED',
      entity: 'Test',
      entityId: test.id,
      meta: { code: input.code },
    });
    return test;
  },

  async update(id: string, input: UpdateTestInput, actorUserId: string) {
    const t = await testRepo.update(id, {
      code: input.code,
      name: input.name,
      price: input.price,
      referenceRanges: input.referenceRanges as unknown as object,
      isActive: input.isActive,
      category: { connect: { id: input.categoryId } },
    });
    await logAudit({ userId: actorUserId, action: 'TEST_UPDATED', entity: 'Test', entityId: id });
    return t;
  },

  async remove(id: string, actorUserId: string) {
    const t = await testRepo.softDelete(id);
    await logAudit({ userId: actorUserId, action: 'TEST_DELETED', entity: 'Test', entityId: id });
    return t;
  },

  listCategories() {
    return testCategoryRepo.list();
  },
  async createCategory(name: string) {
    return testCategoryRepo.create(name);
  },
  async deleteCategory(id: string) {
    return testCategoryRepo.delete(id);
  },
};
