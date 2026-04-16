import { create } from 'zustand';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthState {
  user: User | null;
  role: 'bos' | 'mandor' | 'karyawan' | null;
  branchId: string | null;
  isAuthLoaded: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: 'bos' | 'mandor' | 'karyawan' | null) => void;
  setBranchId: (branchId: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  branchId: null,
  isAuthLoaded: false,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setBranchId: (branchId) => set({ branchId }),
}));

let userUnsubscribe: (() => void) | null = null;

// Initialize auth listener
onAuthStateChanged(auth, (user) => {
  if (userUnsubscribe) {
    userUnsubscribe();
    userUnsubscribe = null;
  }

  if (user) {
    useAuthStore.getState().setUser(user);
    
    // Listen to user document in real-time
    const userDocRef = doc(db, 'users', user.uid);
    userUnsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const role = data.role || 'karyawan';
        const branchId = data.branchId || null;
        const phone = data.phone || null;
        
        useAuthStore.setState({
          role: role as 'bos' | 'mandor' | 'karyawan',
          branchId: branchId,
          isAuthLoaded: true
        });
      } else {
        // Create new user if doesn't exist
        const role = user.email === 'alfathpulsa27@gmail.com' ? 'bos' : 'karyawan';
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'Pengguna',
          role: role,
          branchId: null,
          phone: null,
          createdAt: new Date().toISOString()
        });
        // The next snapshot will trigger the state update
      }
    }, (error) => {
      console.error("Error listening to user doc:", error);
      useAuthStore.setState({ isAuthLoaded: true });
    });
  } else {
    useAuthStore.setState({
      user: null,
      role: null,
      branchId: null,
      isAuthLoaded: true
    });
  }
});
