'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Patient, Test } from '@/types/domain';

type DraftState = {
  patient: Patient | null;
  patientQuery: string;
  selectedTestIds: string[];
  discount: number;
  setPatientQuery: (q: string) => void;
  setPatient: (p: Patient | null) => void;
  toggleTest: (testId: string) => void;
  clearTests: () => void;
  setDiscount: (d: number) => void;
  reset: () => void;
};

export const useInvoiceDraft = create<DraftState>()(
  persist(
    (set, get) => ({
      patient: null,
      patientQuery: '',
      selectedTestIds: [],
      discount: 0,
      setPatientQuery: (q) => set({ patientQuery: q }),
      setPatient: (p) => set({ patient: p }),
      toggleTest: (id) => {
        const cur = get().selectedTestIds;
        set({
          selectedTestIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        });
      },
      clearTests: () => set({ selectedTestIds: [] }),
      setDiscount: (d) => set({ discount: Math.max(0, Number(d) || 0) }),
      reset: () =>
        set({
          patient: null,
          patientQuery: '',
          selectedTestIds: [],
          discount: 0,
        }),
    }),
    { name: 'invoice-draft' },
  ),
);
