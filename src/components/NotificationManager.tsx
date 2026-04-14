import React, { useEffect, useRef } from 'react';
import { useFinanceStore } from '../hooks/useFinanceStore';
import { useAuthStore } from '../store/authStore';

export const NotificationManager: React.FC = () => {
  const { branches, isLoaded } = useFinanceStore();
  const { role, branchId } = useAuthStore();
  
  // Track processed deposits to avoid double notifications
  const processedDepositsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);
  const appStartTimeRef = useRef(Date.now());

  // Sound URLs
  const NEW_DEPOSIT_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';
  const COMPLETED_DEPOSIT_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

  const playSound = (url: string) => {
    // Only play sound if user has interacted or after a short delay
    // and only if initialized
    if (!isInitializedRef.current) return;
    
    const audio = new Audio(url);
    audio.play().catch(err => console.error('Error playing sound:', err));
  };

  useEffect(() => {
    if (!isLoaded) return;

    const allDeposits = branches.flatMap(b => (b.deposits || []).map(d => ({ ...d, branchName: b.name, branchId: b.id })));
    
    // On first load with data, just populate the set without playing sounds
    if (!isInitializedRef.current) {
      allDeposits.forEach(d => {
        processedDepositsRef.current.add(`${d.id}_${d.status}`);
      });
      
      // Mark as initialized after a small delay to ensure initial data dump is processed
      const timer = setTimeout(() => {
        isInitializedRef.current = true;
      }, 2000);
      
      return () => clearTimeout(timer);
    }

    allDeposits.forEach(deposit => {
      const key = `${deposit.id}_${deposit.status}`;
      
      if (!processedDepositsRef.current.has(key)) {
        // New deposit logic (for Mandor)
        if (deposit.status === 'pending' && role === 'mandor') {
          const idExists = (Array.from(processedDepositsRef.current) as string[]).some(k => k.startsWith(deposit.id));
          if (!idExists) {
            playSound(NEW_DEPOSIT_SOUND);
          }
        }

        // Completed deposit logic (for Bos or related Branch)
        if (deposit.status === 'verified') {
          const wasNotVerified = !processedDepositsRef.current.has(`${deposit.id}_verified`);
          if (wasNotVerified) {
            if (role === 'bos' || (role === 'karyawan' && branchId === deposit.branchId)) {
              playSound(COMPLETED_DEPOSIT_SOUND);
            }
          }
        }

        processedDepositsRef.current.add(key);
      }
    });
  }, [branches, isLoaded, role, branchId]);

  return null; // This component doesn't render anything
};
