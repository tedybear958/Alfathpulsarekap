import { create } from 'zustand';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  role: 'bos' | 'mandor' | 'karyawan' | null;
  branchId: string | null;
  users: UserProfile[];
  isAuthLoaded: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: 'bos' | 'mandor' | 'karyawan' | null) => void;
  setBranchId: (branchId: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  branchId: null,
  users: [],
  isAuthLoaded: false,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setBranchId: (branchId) => set({ branchId }),
}));

let userUnsubscribe: (() => void) | null = null;
let usersUnsubscribe: (() => void) | null = null;

// Initialize auth listener
const authTimeout = setTimeout(() => {
  if (!useAuthStore.getState().isAuthLoaded) {
    console.warn("Auth loading timed out - setting isAuthLoaded to true as fallback");
    useAuthStore.setState({ isAuthLoaded: true });
  }
}, 8000); // 8 seconds timeout

onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed:", user ? "User logged in" : "User logged out");
  
  if (userUnsubscribe) {
    userUnsubscribe();
    userUnsubscribe = null;
  }
  if (usersUnsubscribe) {
    usersUnsubscribe();
    usersUnsubscribe = null;
  }

  if (user) {
    useAuthStore.getState().setUser(user);
    
    // Listen to user document in real-time
    const userDocRef = doc(db, 'users', user.uid);
    console.log("Listening to user doc:", user.uid);
    
    userUnsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      console.log("User doc snapshot received. Exists:", docSnap.exists());
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const role = data.role || 'karyawan';
        const branchId = data.branchId || null;
        
        useAuthStore.setState({
          role: role as 'bos' | 'mandor' | 'karyawan',
          branchId: branchId,
          isAuthLoaded: true
        });
        clearTimeout(authTimeout);

        // Fetch all users list if bos or mandor
        if (role === 'bos' || role === 'mandor') {
          console.log("User is admin/mandor, listening to all users");
          if (usersUnsubscribe) usersUnsubscribe();
          const usersQuery = collection(db, 'users');
          usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const users = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
            useAuthStore.setState({ users: users.filter(u => u.role === 'karyawan' || u.role === 'mandor') });
          }, (error) => {
            console.error("Error listening to users collection:", error);
          });
        }
      } else {
        console.log("User doc does not exist, creating one for:", user.email);
        // Create new user if doesn't exist
        const role = user.email === 'alfathpulsa27@gmail.com' ? 'bos' : 'karyawan';
        try {
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName || 'Pengguna',
            role: role,
            branchId: null,
            phone: null,
            createdAt: new Date().toISOString()
          });
          console.log("User doc created successfully");
          // The next snapshot will trigger the state update
        } catch (error) {
          console.error("Error creating user doc:", error);
          useAuthStore.setState({ isAuthLoaded: true });
          clearTimeout(authTimeout);
        }
      }
    }, (error) => {
      console.error("Error listening to user doc:", error);
      useAuthStore.setState({ isAuthLoaded: true });
      clearTimeout(authTimeout);
    });
  } else {
    useAuthStore.setState({
      user: null,
      role: null,
      branchId: null,
      isAuthLoaded: true
    });
    clearTimeout(authTimeout);
  }
});
