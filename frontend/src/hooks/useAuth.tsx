"use client";
// src/hooks/useAuth.tsx — Role-based auth layer wrapping useStellar
// Manages user profiles, roles, and first-login onboarding state

import {
  createContext, useContext, useEffect, useState, useCallback, ReactNode
} from 'react';
import { useStellar } from './useStellar';
import { supabase } from '@/lib/supabase';
import type { UserRole, UserProfile, InstitutionType } from '@/lib/types';

// ── Platform Owner wallet (hardcoded — first admin) ──────────────────────────
// This wallet has supreme authority. Set to YOUR wallet address.
// If blank, the first wallet to connect and complete onboarding as 'owner' gets it.
const PLATFORM_OWNER_ADDRESS = ''; // Set your wallet address here

interface AuthContextType {
  profile: UserProfile | null;
  role: UserRole | null;
  institutionType: InstitutionType | null;
  isOwner: boolean;
  isAdmin: boolean;
  isInstitution: boolean;
  isStudent: boolean;
  isEmployer: boolean;
  isPrivileged: boolean; // owner OR admin
  needsOnboarding: boolean;
  loadingProfile: boolean;
  completeOnboarding: (role: UserRole, displayName?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useStellar();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [institutionType, setInstitutionType] = useState<InstitutionType | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Determine effective role — owner address always gets 'owner' role
  const effectiveRole = (() => {
    if (!profile) return null;
    if (PLATFORM_OWNER_ADDRESS && address === PLATFORM_OWNER_ADDRESS) return 'owner' as UserRole;
    return profile.role;
  })();

  const fetchProfile = useCallback(async (walletAddress: string) => {
    setLoadingProfile(true);
    try {
      // Check if platform owner
      if (PLATFORM_OWNER_ADDRESS && walletAddress === PLATFORM_OWNER_ADDRESS) {
        // Upsert owner profile
        const ownerProfile: UserProfile = {
          wallet_address: walletAddress,
          role: 'owner',
          display_name: 'Platform Owner',
        };
        await supabase.from('user_profiles').upsert(ownerProfile, { onConflict: 'wallet_address' });
        setProfile(ownerProfile);
        setNeedsOnboarding(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (error) {
        console.error('fetchProfile error:', error);
        setNeedsOnboarding(true);
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
        setNeedsOnboarding(false);

        // If institution, also fetch their institution type
        if ((data as UserProfile).role === 'institution') {
          const { data: instData } = await supabase
            .from('institutions')
            .select('institution_type')
            .eq('wallet_address', walletAddress)
            .maybeSingle();
          if (instData?.institution_type) {
            setInstitutionType(instData.institution_type as InstitutionType);
          }
        }
      } else {
        // New user — needs onboarding
        setProfile(null);
        setNeedsOnboarding(true);
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [address]);

  // Load profile whenever wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchProfile(address);
    } else {
      setProfile(null);
      setNeedsOnboarding(false);
      setInstitutionType(null);
    }
  }, [isConnected, address, fetchProfile]);

  const completeOnboarding = useCallback(async (role: UserRole, displayName?: string) => {
    if (!address) return;
    const newProfile: UserProfile = {
      wallet_address: address,
      role,
      display_name: displayName,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('user_profiles')
      .upsert(newProfile, { onConflict: 'wallet_address' });
    if (!error) {
      setProfile(newProfile);
      setNeedsOnboarding(false);
    } else {
      console.error('completeOnboarding error:', error);
    }
  }, [address]);

  const refreshProfile = useCallback(async () => {
    if (address) await fetchProfile(address);
  }, [address, fetchProfile]);

  return (
    <AuthContext.Provider value={{
      profile,
      role: effectiveRole,
      institutionType,
      isOwner: effectiveRole === 'owner',
      isAdmin: effectiveRole === 'admin' || effectiveRole === 'owner',
      isInstitution: effectiveRole === 'institution',
      isStudent: effectiveRole === 'student',
      isEmployer: effectiveRole === 'employer',
      isPrivileged: effectiveRole === 'admin' || effectiveRole === 'owner',
      needsOnboarding,
      loadingProfile,
      completeOnboarding,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
