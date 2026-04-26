export interface BankBalance {
  id: string;
  bankName: string;
  balance: number;
  branchId?: string;
  updatedAt?: string;
}

export interface DebtDetail {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'add' | 'pay';
}

export interface Debt {
  id: string;
  personName: string;
  branchId?: string;
  details: DebtDetail[];
}

export interface BankDepositDetail {
  bankName: string;
  amount: number;
}

export interface SavingTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'deposit' | 'withdraw';
  createdBy: string;
  createdByName: string;
}

export interface SavingCustomer {
  id: string;
  personName: string;
  phone?: string;
  branchId: string;
  transactions: SavingTransaction[];
}

export interface BranchDeposit {
  id: string;
  date: string;
  amount?: number; // legacy
  targetAmount?: number; // legacy
  actualAmount?: number; // legacy
  totalSetor: number;
  sisaSetor: number;
  berhasilDisetor: number;
  destination?: string;
  bankDetails?: BankDepositDetail[]; // legacy
  description: string;
  createdBy?: string;
  createdByName?: string;
  status?: 'pending' | 'received' | 'verified';
  receivedBy?: string;
  receivedByName?: string;
  receivedAt?: string;
  atmName?: string;
  completedBy?: string;
  completedByName?: string;
  completedAt?: string;
  editHistory?: { previousAmount: number; editedAt: string; editedBy: string; editedByName: string }[];
}

export interface Branch {
  id: string;
  name: string;
  capital?: number;
  physicalCapital?: number;
  totalSetor?: number;
  deposits: BranchDeposit[];
}

export interface VoucherRecap {
  id: string;
  date: string;
  adminSiang: number;
  adminMalam: number;
  voucherSiang: number;
  voucherMalam: number;
  expenseAmount: number;
  expenseDescription: string;
  total: number;
  description: string;
  branchId: string;
  status?: 'draft' | 'reported';
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'bos' | 'mandor' | 'karyawan';
  branchId: string | null;
  phone?: string;
  baseSalary?: number;
  createdAt: string;
}

export interface SalarySlip {
  id: string;
  userId: string;
  userName: string;
  role: string;
  branchId?: string;
  branchName?: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
  createdBy: string;
  createdByName?: string;
}

