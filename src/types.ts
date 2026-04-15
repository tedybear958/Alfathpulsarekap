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

export interface ShoppingRequestItem {
  provider: string;
  quota: string;
  pcs?: number;
}

export interface ShoppingRequest {
  id: string;
  branchId: string;
  branchName?: string;
  items: ShoppingRequestItem[];
  status: 'pending' | 'completed';
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface ShoppingCatalog {
  id: string;
  provider: string;
  options: string[];
}

