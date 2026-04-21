import { create } from 'zustand';
import { BankBalance, Debt, DebtDetail, Branch, BranchDeposit, SavingCustomer, SavingTransaction, VoucherRecap } from '../types';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc, query, orderBy, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuthStore } from '../store/authStore';
import { sendWhatsAppMessage } from '../services/whatsappService';
import { formatRupiah } from '../utils/formatters';

interface FinanceState {
  fixedBalance: number;
  bankBalances: BankBalance[];
  debts: Debt[];
  savings: SavingCustomer[];
  branches: Branch[];
  voucherRecaps: VoucherRecap[];
  announcement: string;
  isLoaded: boolean;
  error: string | null;
  
  setError: (error: string | null) => void;
  updateFixedBalance: (amount: number) => Promise<void>;
  updateAnnouncement: (text: string) => Promise<void>;
  updateBranchCapital: (branchId: string, amount: number) => Promise<void>;
  updateBranchPhysicalCapital: (branchId: string, amount: number) => Promise<void>;
  addBankBalance: (bankName: string, balance: number) => Promise<void>;
  updateBankBalance: (id: string, balance: number) => Promise<void>;
  deleteBankBalance: (id: string) => Promise<void>;
  
  addDebtPerson: (personName: string) => Promise<void>;
  deleteDebtPerson: (id: string) => Promise<void>;
  addDebtDetail: (personId: string, amount: number, description: string, type: 'add' | 'pay') => Promise<void>;
  deleteDebtDetail: (personId: string, detailId: string) => Promise<void>;

  addSavingCustomer: (personName: string, phone: string) => Promise<void>;
  deleteSavingCustomer: (id: string) => Promise<void>;
  addSavingTransaction: (personId: string, amount: number, description: string, type: 'deposit' | 'withdraw') => Promise<void>;
  deleteSavingTransaction: (personId: string, transactionId: string) => Promise<void>;
  getTotalSavings: () => number;
  
  addBranch: (name: string, totalSetor?: number) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  addBranchDeposit: (branchId: string, totalSetor: number, sisaSetor: number, destination: string, description: string) => Promise<void>;
  deleteBranchDeposit: (branchId: string, depositId: string) => Promise<void>;
  updateBranchDepositStatus: (branchId: string, depositId: string, status: 'pending' | 'received' | 'verified') => Promise<void>;
  receiveBranchDeposit: (branchId: string, depositId: string) => Promise<void>;
  completeBranchDeposit: (branchId: string, depositId: string, berhasilDisetor: number, atmName: string) => Promise<void>;
  updateBranchDepositAmount: (branchId: string, depositId: string, berhasilDisetor: number) => Promise<void>;

  addVoucherRecap: (date: string, adminSiang: number, adminMalam: number, voucherSiang: number, voucherMalam: number, expenseAmount: number, expenseDescription: string, description: string, branchId: string, status?: 'draft' | 'reported') => Promise<void>;
  updateVoucherRecap: (id: string, data: Partial<VoucherRecap>) => Promise<void>;
  reportVoucherRecaps: (branchId: string) => Promise<void>;
  deleteVoucherRecap: (id: string) => Promise<void>;
  
  getTotalBankBalance: () => number;
  getPersonTotalDebt: (person: Debt) => number;
  getTotalDebt: () => number;
  getPersonTotalSavings: (person: SavingCustomer) => number;
  getBranchStats: (branch: Branch) => { totalSetor: number, sisaSetor: number, berhasilDisetor: number };
  getTotalAllBranches: () => { totalSetor: number, sisaSetor: number, berhasilDisetor: number };
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  fixedBalance: 0,
  bankBalances: [],
  debts: [],
  savings: [],
  branches: [],
  voucherRecaps: [],
  announcement: '',
  isLoaded: false,
  error: null,

  setError: (error) => set({ error }),
  updateFixedBalance: async (amount: number) => {
    try {
      // Optimistic update
      set({ fixedBalance: amount });
      await setDoc(doc(db, 'settings', 'general'), { fixedBalance: amount, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    }
  },
  updateAnnouncement: async (text: string) => {
    try {
      // Optimistic update
      set({ announcement: text });
      await setDoc(doc(db, 'settings', 'general'), { announcement: text, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    }
  },

  updateBranchCapital: async (branchId: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'branches', branchId), { capital: amount, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `branches/${branchId}`);
    }
  },

  updateBranchPhysicalCapital: async (branchId: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'branches', branchId), { physicalCapital: amount, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `branches/${branchId}`);
    }
  },

  addBankBalance: async (bankName: string, balance: number) => {
    try {
      const authState = useAuthStore.getState();
      const branchId = authState.branchId || null;
      await addDoc(collection(db, 'banks'), { bankName, balance, branchId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'banks');
    }
  },

  updateBankBalance: async (id: string, balance: number) => {
    try {
      await updateDoc(doc(db, 'banks', id), { balance, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `banks/${id}`);
    }
  },

  deleteBankBalance: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'banks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `banks/${id}`);
    }
  },

  addDebtPerson: async (personName: string) => {
    const authState = useAuthStore.getState();
    if (!authState.branchId && authState.role !== 'bos') {
      console.error("Cannot add debt person: No branch assigned.");
      return;
    }
    try {
      const branchId = authState.branchId || null;
      await addDoc(collection(db, 'customers'), { personName, branchId, createdAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'customers');
    }
  },

  deleteDebtPerson: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
    }
  },

  addDebtDetail: async (personId: string, amount: number, description: string, type: 'add' | 'pay') => {
    try {
      const user = useAuthStore.getState().user;
      await addDoc(collection(db, 'customers', personId, 'transactions'), {
        amount, description, type, date: new Date().toISOString(), createdBy: user?.uid || 'unknown'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `customers/${personId}/transactions`);
    }
  },

  deleteDebtDetail: async (personId: string, detailId: string) => {
    try {
      await deleteDoc(doc(db, 'customers', personId, 'transactions', detailId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customers/${personId}/transactions/${detailId}`);
    }
  },

  addSavingCustomer: async (personName: string, phone: string) => {
    const authState = useAuthStore.getState();
    if (!authState.branchId && authState.role !== 'bos') {
      console.error("Cannot add saving customer: No branch assigned.");
      return;
    }
    try {
      const branchId = authState.branchId || null;
      await addDoc(collection(db, 'savings'), { personName, phone, branchId, createdAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'savings');
    }
  },

  deleteSavingCustomer: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'savings', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `savings/${id}`);
    }
  },

  addSavingTransaction: async (personId: string, amount: number, description: string, type: 'deposit' | 'withdraw') => {
    try {
      const user = useAuthStore.getState().user;
      await addDoc(collection(db, 'savings', personId, 'transactions'), {
        amount, description, type, date: new Date().toISOString(), createdBy: user?.uid || 'unknown', createdByName: user?.displayName || 'Karyawan'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `savings/${personId}/transactions`);
    }
  },

  deleteSavingTransaction: async (personId: string, transactionId: string) => {
    try {
      await deleteDoc(doc(db, 'savings', personId, 'transactions', transactionId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `savings/${personId}/transactions/${transactionId}`);
    }
  },

  addBranch: async (name: string) => {
    try {
      await addDoc(collection(db, 'branches'), { name, createdAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'branches');
    }
  },

  deleteBranch: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'branches', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `branches/${id}`);
    }
  },

  addBranchDeposit: async (branchId: string, totalSetor: number, sisaSetor: number, destination: string, description: string) => {
    try {
      const user = useAuthStore.getState().user;
      // Initialize with 0 successfully deposited, so sisa is the total amount
      await addDoc(collection(db, 'branches', branchId, 'deposits'), {
        totalSetor, 
        sisaSetor: totalSetor, 
        berhasilDisetor: 0, 
        destination, 
        description, 
        date: new Date().toISOString(), 
        createdBy: user?.uid || 'unknown', 
        createdByName: user?.displayName || 'Karyawan', 
        status: 'pending'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `branches/${branchId}/deposits`);
    }
  },

  deleteBranchDeposit: async (branchId: string, depositId: string) => {
    try {
      await deleteDoc(doc(db, 'branches', branchId, 'deposits', depositId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `branches/${branchId}/deposits/${depositId}`);
    }
  },

  updateBranchDepositStatus: async (branchId: string, depositId: string, status: 'pending' | 'received' | 'verified') => {
    try {
      await updateDoc(doc(db, 'branches', branchId, 'deposits', depositId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `branches/${branchId}/deposits/${depositId}`);
    }
  },

  receiveBranchDeposit: async (branchId: string, depositId: string) => {
    try {
      const user = useAuthStore.getState().user;
      await updateDoc(doc(db, 'branches', branchId, 'deposits', depositId), {
        status: 'received',
        receivedBy: user?.uid || 'unknown',
        receivedByName: user?.displayName || 'Mandor',
        receivedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `branches/${branchId}/deposits/${depositId}`);
    }
  },

  completeBranchDeposit: async (branchId: string, depositId: string, berhasilDisetor: number, atmName: string) => {
    try {
      const user = useAuthStore.getState().user;
      const branch = get().branches.find(b => b.id === branchId);
      const deposit = branch?.deposits.find(d => d.id === depositId);
      if (!deposit) return;

      const sisaSetor = deposit.totalSetor - berhasilDisetor;

      // Update deposit status to verified
      await updateDoc(doc(db, 'branches', branchId, 'deposits', depositId), {
        status: 'verified',
        berhasilDisetor,
        sisaSetor,
        atmName,
        completedBy: user?.uid || 'unknown',
        completedByName: user?.displayName || 'Mandor',
        completedAt: new Date().toISOString()
      });

      // If there is a remaining amount, automatically add it to "Bon/Hutang"
      if (sisaSetor > 0) {
        const personName = "SISA SETOR";
        // Find if "SISA SETOR" person already exists for this branch
        let debtPerson = get().debts.find(d => d.personName === personName && d.branchId === branchId);
        let personId = debtPerson?.id;

        // If not exists, create the person first
        if (!personId) {
          const docRef = await addDoc(collection(db, 'customers'), { 
            personName, 
            branchId, 
            createdAt: new Date().toISOString() 
          });
          personId = docRef.id;
        }

        // Add the debt detail
        if (personId) {
          await addDoc(collection(db, 'customers', personId, 'transactions'), {
            amount: sisaSetor,
            description: `Sisa Setor: ${deposit.description} (${branch?.name || ''})`,
            type: 'add',
            date: new Date().toISOString(),
            createdBy: user?.uid || 'unknown'
          });
        }
      }

      // --- WhatsApp Notification ---
      try {
        // Find all users in this branch to notify
        const usersSnapshot = await getDocs(query(collection(db, 'users'), where('branchId', '==', branchId)));
        const branchUsers = usersSnapshot.docs.map(doc => doc.data());
        
        // Also notify Bos (Global)
        const bosSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'bos')));
        const bosUsers = bosSnapshot.docs.map(doc => doc.data());
        
        const allTargets = [...branchUsers, ...bosUsers];
        const uniquePhones = Array.from(new Set(allTargets.map(u => u.phone).filter(Boolean)));

        if (uniquePhones.length > 0) {
          const message = `*NOTIFIKASI SETORAN SELESAI*\n\n` +
            `Cabang: ${branch?.name || '...'}\n` +
            `Oleh: ${user?.displayName || 'Mandor'}\n` +
            `Total Setor: ${formatRupiah(deposit.totalSetor)}\n` +
            `Berhasil: ${formatRupiah(berhasilDisetor)}\n` +
            `Sisa: ${formatRupiah(sisaSetor)}\n` +
            `ATM: ${atmName}\n` +
            `Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
            `_Pesan otomatis dari ALFATHPulsa App_`;

          // Send to all unique phones
          for (const phone of uniquePhones) {
            if (phone) await sendWhatsAppMessage(phone as string, message);
          }
        }
      } catch (waError) {
        console.warn("WhatsApp notification failed:", waError);
        // Don't throw, we don't want to block the main process
      }
      // -----------------------------
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `branches/${branchId}/deposits/${depositId}`);
    }
  },

  updateBranchDepositAmount: async (branchId: string, depositId: string, berhasilDisetor: number) => {
    try {
      await updateDoc(doc(db, 'branches', branchId, 'deposits', depositId), { berhasilDisetor, totalSetor: berhasilDisetor, sisaSetor: 0 });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `branches/${branchId}/deposits/${depositId}`);
    }
  },

  addVoucherRecap: async (date: string, adminSiang: number, adminMalam: number, voucherSiang: number, voucherMalam: number, expenseAmount: number, expenseDescription: string, description: string, branchId: string, status: 'draft' | 'reported' = 'reported') => {
    try {
      const user = useAuthStore.getState().user;
      // Total is (Admin Siang + Malam - Expense) + Voucher Siang + Malam
      const total = (adminSiang + adminMalam - expenseAmount) + voucherSiang + voucherMalam;
      await addDoc(collection(db, 'voucherRecaps'), {
        date,
        adminSiang,
        adminMalam,
        voucherSiang,
        voucherMalam,
        expenseAmount,
        expenseDescription,
        total,
        description,
        branchId,
        status,
        createdAt: new Date().toISOString(),
        createdBy: user?.uid || 'unknown',
        createdByName: user?.displayName || 'Admin'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'voucherRecaps');
    }
  },

  updateVoucherRecap: async (id: string, data: Partial<VoucherRecap>) => {
    try {
      // Recalculate total if any components changed
      if ('adminSiang' in data || 'adminMalam' in data || 'voucherSiang' in data || 'voucherMalam' in data || 'expenseAmount' in data) {
        const current = get().voucherRecaps.find(r => r.id === id);
        if (current) {
          const admS = data.adminSiang ?? current.adminSiang;
          const admM = data.adminMalam ?? current.adminMalam;
          const vouS = data.voucherSiang ?? current.voucherSiang;
          const vouM = data.voucherMalam ?? current.voucherMalam;
          const exp = data.expenseAmount ?? current.expenseAmount;
          data.total = (admS + admM - exp) + vouS + vouM;
        }
      }
      
      await updateDoc(doc(db, 'voucherRecaps', id), { 
        ...data, 
        updatedAt: new Date().toISOString() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `voucherRecaps/${id}`);
    }
  },

  reportVoucherRecaps: async (branchId: string) => {
    try {
      const recaps = get().voucherRecaps.filter(r => r.branchId === branchId && r.status === 'draft');
      const promises = recaps.map(recap => 
        updateDoc(doc(db, 'voucherRecaps', recap.id), { 
          status: 'reported',
          updatedAt: new Date().toISOString()
        })
      );
      await Promise.all(promises);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'voucherRecaps');
    }
  },

  deleteVoucherRecap: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'voucherRecaps', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `voucherRecaps/${id}`);
    }
  },

  getTotalBankBalance: () => {
    const authState = useAuthStore.getState();
    const isBosGlobal = authState.role === 'bos' && !authState.branchId;
    
    if (isBosGlobal) {
      // For Bos Global, sum all bank balances across all branches
      return get().bankBalances.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
    } else {
      // For Branch users, only sum balances belonging to their branch
      return get().bankBalances
        .filter(b => b.branchId === authState.branchId)
        .reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
    }
  },
  
  getPersonTotalDebt: (person: Debt) => {
    if (!person || !person.details) return 0;
    return person.details.reduce((sum, detail) => {
      return detail.type === 'add' ? sum + (Number(detail.amount) || 0) : sum - (Number(detail.amount) || 0);
    }, 0);
  },

  getTotalDebt: () => get().debts.reduce((sum, person) => sum + get().getPersonTotalDebt(person), 0),

  getTotalSavings: () => get().savings.reduce((sum, person) => sum + get().getPersonTotalSavings(person), 0),

  getPersonTotalSavings: (person: SavingCustomer) => {
    if (!person || !person.transactions) return 0;
    return person.transactions.reduce((sum, detail) => {
      return detail.type === 'deposit' ? sum + (Number(detail.amount) || 0) : sum - (Number(detail.amount) || 0);
    }, 0);
  },

  getBranchStats: (branch: Branch) => {
    if (!branch || !branch.deposits) return { totalSetor: 0, sisaSetor: 0, berhasilDisetor: 0 };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Filter deposits for today only
    const todayDeposits = branch.deposits.filter(d => d && d.date && new Date(d.date).getTime() >= startOfToday);
    
    // Total received today (all statuses)
    const totalSetor = todayDeposits.reduce((sum, d) => sum + (Number(d.totalSetor) || 0), 0);
    
    // Sisa setor today (only from non-verified deposits)
    const sisaSetor = todayDeposits
      .filter(d => d.status !== 'verified')
      .reduce((sum, d) => sum + (Number(d.totalSetor) || 0), 0);
      
    const berhasilDisetor = todayDeposits
      .filter(d => d.status === 'verified')
      .reduce((sum, d) => sum + (Number(d.berhasilDisetor) || 0), 0);
      
    return { totalSetor, sisaSetor, berhasilDisetor };
  },

  getTotalAllBranches: () => {
    return get().branches.reduce((acc, b) => {
      const stats = get().getBranchStats(b);
      return {
        totalSetor: acc.totalSetor + stats.totalSetor,
        sisaSetor: acc.sisaSetor + stats.sisaSetor,
        berhasilDisetor: acc.berhasilDisetor + stats.berhasilDisetor
      };
    }, { totalSetor: 0, sisaSetor: 0, berhasilDisetor: 0 });
  }
}));

// Setup Firebase Listeners
let unsubscribers: (() => void)[] = [];
let subListeners = new Map<string, () => void>();

const clearSubListeners = () => {
  subListeners.forEach(unsub => unsub());
  subListeners.clear();
};

export const initFinanceStoreListeners = () => {
  const authState = useAuthStore.getState();
  
  useFinanceStore.setState({ error: null });
  
  // Clear existing listeners
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  clearSubListeners();

  // Settings
  unsubscribers.push(
    onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        useFinanceStore.setState({ 
          fixedBalance: data.fixedBalance || 0,
          announcement: data.announcement || ''
        });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/general'))
  );

  // Banks
  if (authState.branchId || authState.role === 'bos') {
    const banksQuery = authState.branchId
      ? query(collection(db, 'banks'), where('branchId', '==', authState.branchId))
      : query(collection(db, 'banks'));

    unsubscribers.push(
      onSnapshot(banksQuery, (snapshot) => {
        const banks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankBalance));
        useFinanceStore.setState({ bankBalances: banks });
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'banks'))
    );
  } else {
    useFinanceStore.setState({ bankBalances: [] });
  }

  // Customers & Debts
  if (authState.role) {
    const customersQuery = authState.branchId 
      ? query(collection(db, 'customers'), where('branchId', '==', authState.branchId))
      : (authState.role === 'bos' ? query(collection(db, 'customers')) : query(collection(db, 'customers'), where('branchId', '==', null)));

    unsubscribers.push(
      onSnapshot(customersQuery, (snapshot) => {
        useFinanceStore.setState(state => {
          const customers = snapshot.docs.map(doc => {
            const data = doc.data();
            const existing = state.debts.find(d => d.id === doc.id);
            return { 
              id: doc.id, 
              personName: data.personName, 
              branchId: data.branchId, 
              createdAt: data.createdAt,
              details: existing ? existing.details : [] 
            } as Debt & { branchId?: string, createdAt?: string };
          });

          // Sort client-side by createdAt desc
          customers.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          // Manage sub-listeners for transactions
          const currentCustomerIds = new Set(customers.map(c => c.id));
          
          subListeners.forEach((unsub, key) => {
            if (key.startsWith('debt_') && !currentCustomerIds.has(key.replace('debt_', ''))) {
              unsub();
              subListeners.delete(key);
            }
          });

          customers.forEach(customer => {
            const key = `debt_${customer.id}`;
            if (!subListeners.has(key)) {
              const unsub = onSnapshot(query(collection(db, 'customers', customer.id, 'transactions'), orderBy('date', 'asc')), (txSnapshot) => {
                const details = txSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as DebtDetail));
                useFinanceStore.setState(s => ({
                  debts: s.debts.map(c => c.id === customer.id ? { ...c, details } : c)
                }));
              }, (error) => handleFirestoreError(error, OperationType.GET, `customers/${customer.id}/transactions`));
              subListeners.set(key, unsub);
            }
          });

          return { debts: customers };
        });
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers'))
    );
  }

  // Savings
  if (authState.role) {
    const savingsQuery = authState.branchId
      ? query(collection(db, 'savings'), where('branchId', '==', authState.branchId))
      : (authState.role === 'bos' ? query(collection(db, 'savings')) : query(collection(db, 'savings'), where('branchId', '==', null)));

    unsubscribers.push(
      onSnapshot(savingsQuery, (snapshot) => {
        useFinanceStore.setState(state => {
          const savingsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const existing = state.savings.find(s => s.id === doc.id);
            return { 
              id: doc.id, 
              personName: data.personName, 
              phone: data.phone, 
              branchId: data.branchId, 
              createdAt: data.createdAt,
              transactions: existing ? existing.transactions : [] 
            } as SavingCustomer & { createdAt?: string };
          });

          // Sort client-side by createdAt desc
          savingsData.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

          // Manage sub-listeners for transactions
          const currentSavingIds = new Set(savingsData.map(s => s.id));
          
          subListeners.forEach((unsub, key) => {
            if (key.startsWith('saving_') && !currentSavingIds.has(key.replace('saving_', ''))) {
              unsub();
              subListeners.delete(key);
            }
          });

          savingsData.forEach(customer => {
            const key = `saving_${customer.id}`;
            if (!subListeners.has(key)) {
              const unsub = onSnapshot(query(collection(db, 'savings', customer.id, 'transactions'), orderBy('date', 'asc')), (txSnapshot) => {
                const transactions = txSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as SavingTransaction));
                useFinanceStore.setState(s => ({
                  savings: s.savings.map(c => c.id === customer.id ? { ...c, transactions } : c)
                }));
              }, (error) => handleFirestoreError(error, OperationType.GET, `savings/${customer.id}/transactions`));
              subListeners.set(key, unsub);
            }
          });

          return { savings: savingsData };
        });
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'savings'))
    );
  }

  // Branches & Deposits
  const branchesQuery = query(collection(db, 'branches'));

  unsubscribers.push(
    onSnapshot(branchesQuery, (snapshot) => {
      useFinanceStore.setState(state => {
        const branches = snapshot.docs.map(doc => {
          const data = doc.data();
          const existing = state.branches.find(b => b.id === doc.id);
          return { 
            id: doc.id, 
            name: data.name, 
            capital: data.capital, 
            physicalCapital: data.physicalCapital,
            totalSetor: data.totalSetor, 
            deposits: existing ? existing.deposits : [] 
          } as Branch;
        });

        // Manage sub-listeners for deposits
        const currentBranchIds = new Set(branches.map(b => b.id));
        
        subListeners.forEach((unsub, key) => {
          if (key.startsWith('branch_') && !currentBranchIds.has(key.replace('branch_', ''))) {
            unsub();
            subListeners.delete(key);
          }
        });

        branches.forEach(branch => {
          const key = `branch_${branch.id}`;
          if (!subListeners.has(key)) {
            const unsub = onSnapshot(query(collection(db, 'branches', branch.id, 'deposits'), orderBy('date', 'asc')), (depSnapshot) => {
              const deposits = depSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as BranchDeposit));
              useFinanceStore.setState(s => ({
                branches: s.branches.map(b => b.id === branch.id ? { ...b, deposits } : b)
              }));
            }, (error) => handleFirestoreError(error, OperationType.GET, `branches/${branch.id}/deposits`));
            subListeners.set(key, unsub);
          }
        });

        // Sort branches by name (Alfath 1, Alfath 2, Alfath 3)
        branches.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        return { branches };
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'branches'))
  );

  // Voucher Recaps
  if (authState.branchId || authState.role === 'bos') {
    const voucherQuery = authState.branchId
      ? query(collection(db, 'voucherRecaps'), where('branchId', '==', authState.branchId))
      : query(collection(db, 'voucherRecaps'));

    unsubscribers.push(
      onSnapshot(voucherQuery, (snapshot) => {
        const recaps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VoucherRecap));
        // Sort client-side by date desc
        recaps.sort((a, b) => {
          const dateA = a.date || '';
          const dateB = b.date || '';
          return dateB.localeCompare(dateA);
        });
        useFinanceStore.setState({ voucherRecaps: recaps });
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'voucherRecaps'))
    );
  } else {
    useFinanceStore.setState({ voucherRecaps: [] });
  }

  useFinanceStore.setState({ isLoaded: true });
};

export const stopFinanceStoreListeners = () => {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  clearSubListeners();
  useFinanceStore.setState({ isLoaded: false, fixedBalance: 0, bankBalances: [], debts: [], savings: [], branches: [] });
};
