import { patientRepo } from '@/server/repositories/patient.repo';
import { nextPatientCode } from '@/server/utils/id';
import { logAudit } from '@/server/services/audit.service';
import type { CreatePatientInput, UpdatePatientInput } from '@/lib/validators/patient.schema';

export const patientService = {
  async create(input: CreatePatientInput, actorUserId: string) {
    const patientCode = await nextPatientCode();
    const patient = await patientRepo.create({
      patientCode,
      name: input.name,
      age: input.age,
      ageUnit: input.ageUnit,
      gender: input.gender,
      mobile: input.mobile,
      address: input.address ?? null,
    });
    await logAudit({
      userId: actorUserId,
      action: 'PATIENT_CREATED',
      entity: 'Patient',
      entityId: patient.id,
      meta: { patientCode, name: patient.name },
    });
    return patient;
  },

  async update(id: string, input: UpdatePatientInput, actorUserId: string) {
    const updated = await patientRepo.update(id, {
      name: input.name,
      age: input.age,
      ageUnit: input.ageUnit,
      gender: input.gender,
      mobile: input.mobile,
      address: input.address ?? null,
    });
    await logAudit({
      userId: actorUserId,
      action: 'PATIENT_UPDATED',
      entity: 'Patient',
      entityId: id,
    });
    return updated;
  },

  search(q?: string) {
    return patientRepo.search(q);
  },

  list() {
    return patientRepo.list();
  },

  details(id: string) {
    return patientRepo.withVisitHistory(id);
  },
};
