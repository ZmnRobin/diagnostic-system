export type Role = 'ADMIN' | 'RECEPTION' | 'LAB';

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: Role;
};

export type Patient = {
  id: string;
  patientCode: string;
  name: string;
  age: number;
  ageUnit: 'YEAR' | 'MONTH' | 'DAY';
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  mobile: string;
  address: string | null;
  createdAt: string;
};

export type Test = {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  price: string;
  referenceRanges: RangeEntry[];
  isActive: boolean;
  category: { id: string; name: string };
};

export type RangeEntry = {
  analyte: string;
  unit?: string;
  maleRef?: string;
  femaleRef?: string;
  generalRef?: string;
};

export type InvoiceItemLite = {
  id: string;
  testId: string;
  priceAtBilling: string;
  test: { id: string; name: string; code: string };
  result?: { id: string; status: 'DRAFT' | 'APPROVED' } | null;
};

export type TestCategory = {
  id: string;
  name: string;
};

export type Invoice = {
  id: string;
  invoiceNo: string;
  visitId: string;
  subtotal: string;
  discount: string;
  total: string;
  paymentMethod: 'CASH';
  createdAt: string;
  visit: {
    patient: Patient;
  };
  items: InvoiceItemLite[];
  createdBy?: { id: string; name: string; username: string };
};

export type LabResultStatusLite = 'DRAFT' | 'APPROVED';
export type Flag = 'LOW' | 'NORMAL' | 'HIGH' | 'NIL';

export type ResultValueEntry = {
  analyte: string;
  value: string;
  unit?: string;
  flag?: Flag;
};

export type LabResult = {
  id: string;
  invoiceItemId: string;
  values: ResultValueEntry[];
  comments: string | null;
  status: LabResultStatusLite;
  enteredById: string;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportRow = {
  analyte: string;
  unit: string;
  value: string | null;
  reference: string;
  flag: Flag;
};

export type ReportData = {
  centerName: string;
  centerAddress: string;
  centerPhone: string;
  patient: Patient;
  invoiceNo: string;
  invoiceId: string;
  testCode: string;
  testName: string;
  categoryName: string;
  collectedAt: string;
  status: LabResultStatusLite;
  enteredByName: string;
  approvedByName: string | null;
  approvedAt: string | null;
  comments: string | null;
  rows: ReportRow[];
};
