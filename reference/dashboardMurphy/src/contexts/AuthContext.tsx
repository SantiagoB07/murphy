import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/diabetes';
import { 
  AuthContextType, 
  Profile, 
  PatientProfile, 
  CoadminProfile,
  PatientRegistrationData, 
  CoadminRegistrationData,
  CoadminEmailCheckResult,
  Gender 
} from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [coadminProfile, setCoadminProfile] = useState<CoadminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);

  // Fetch user profile and role
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (roleData) {
        setUserRole(roleData.role as UserRole);
      }

      // If patient, fetch patient profile
      if (roleData?.role === 'patient') {
        const { data: patientData } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (patientData) {
          setPatientProfile(patientData as PatientProfile);
        }
      }

      // If coadmin, fetch coadmin profile
      if (roleData?.role === 'coadmin') {
        const { data: coadminData } = await supabase
          .from('coadmin_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (coadminData) {
          setCoadminProfile(coadminData as CoadminProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
          setPatientProfile(null);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (data: PatientRegistrationData) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      // Create auth user with all patient data in metadata
      // The handle_new_user trigger will create profiles, user_roles, and patient_profiles
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
            phone: data.phone,
            role: 'patient',
            // Patient profile data
            gender: data.gender,
            id_number: data.idNumber,
            birth_date: data.birthDate.toISOString().split('T')[0],
            diabetes_type: data.diabetesType,
            diagnosis_year: data.diagnosisYear,
            city: data.city,
            estrato: data.estrato,
            coadmin_name: data.coadminName || null,
            coadmin_phone: data.coadminPhone || null,
            coadmin_email: data.coadminEmail || null,
          },
        },
      });

      if (authError) {
        return { error: new Error(authError.message) };
      }

      if (!authData.user) {
        return { error: new Error('No se pudo crear el usuario') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const checkCoadminEmail = async (email: string): Promise<CoadminEmailCheckResult | null> => {
    try {
      const { data, error } = await supabase.rpc('is_authorized_coadmin_email', {
        _email: email,
      });

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0] as CoadminEmailCheckResult;
    } catch (error) {
      console.error('Error checking coadmin email:', error);
      return null;
    }
  };

  const signUpAsCoadmin = async (data: CoadminRegistrationData) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: data.fullName,
            phone: data.phone,
            role: 'coadmin',
            patient_id: data.patientId,
          },
        },
      });

      if (authError) {
        return { error: new Error(authError.message) };
      }

      if (!authData.user) {
        return { error: new Error('No se pudo crear el usuario') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
    setPatientProfile(null);
    setCoadminProfile(null);
    setIsDemoMode(false);
    setDemoRole(null);
  };

  const enterDemoMode = (role: UserRole) => {
    setIsDemoMode(true);
    setDemoRole(role);
    setIsLoading(false);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoRole(null);
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchUserData(user.id);
  };

  const value: AuthContextType = {
    user,
    session,
    userRole: isDemoMode ? demoRole : userRole,
    profile,
    patientProfile,
    coadminProfile,
    isLoading,
    isDemoMode,
    demoRole,
    signIn,
    signUp,
    signUpAsCoadmin,
    checkCoadminEmail,
    signOut,
    enterDemoMode,
    exitDemoMode,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
