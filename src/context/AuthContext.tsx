import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextData {
  session: Session | null | undefined;
  userRol: string;
  empresaId: string | null;
  nombreCompleto: string;
  empresaNombre: string;
  permisosEspeciales: any;
  etiquetas: string[];
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({
  session: undefined,
  userRol: '',
  empresaId: null,
  nombreCompleto: '',
  empresaNombre: '',
  permisosEspeciales: {},
  etiquetas: [],
  isLoading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [userRol, setUserRol] = useState<string>('');
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState<string>('');
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [permisosEspeciales, setPermisosEspeciales] = useState<any>({});
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('rol, empresa_id, permisos_especiales, etiquetas, nombre_completo, empresas(nombre)')
        .eq('id', userId)
        .single();
        
      if (!error && data) {
        setUserRol(data.rol);
        setEmpresaId(data.empresa_id);
        setNombreCompleto(data.nombre_completo || '');
        const empresaData: any = data.empresas;
        const nombreEmpresa = Array.isArray(empresaData) ? empresaData[0]?.nombre : empresaData?.nombre;
        setEmpresaNombre(nombreEmpresa || '');
        setPermisosEspeciales(data.permisos_especiales || {});
        setEtiquetas(data.etiquetas || []);
      }
    } catch (e) {
      console.warn("AuthContext - Error fetching profile:", e);
    }
  };

  const initSession = async () => {
    setIsLoading(true);
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    if (currentSession?.user) {
      await fetchProfile(currentSession.user.id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (event === 'SIGNED_IN' && currentSession?.user) {
        const newUserId = currentSession.user.id;
        const lastUserId = await AsyncStorage.getItem('@last_session_user_id');
        
        if (lastUserId && lastUserId !== newUserId) {
          const keys = await AsyncStorage.getAllKeys();
          const oldCacheKeys = keys.filter(k => k.startsWith('@cache_tablero_'));
          if (oldCacheKeys.length > 0) {
            await AsyncStorage.multiRemove(oldCacheKeys);
          }
        }
        await AsyncStorage.setItem('@last_session_user_id', newUserId);

        await fetchProfile(currentSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserRol('');
        setEmpresaId(null);
        setPermisosEspeciales({});

        const keys = await AsyncStorage.getAllKeys();
        const oldCacheKeys = keys.filter(k => k.startsWith('@cache_tablero_'));
        if (oldCacheKeys.length > 0) {
          await AsyncStorage.multiRemove(oldCacheKeys);
        }
        await AsyncStorage.removeItem('@last_session_user_id');
      }
      // Si cambia de estado y es inicializado, lo actualizamos rápido
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      session, 
      userRol, 
      empresaId, 
      nombreCompleto,
      empresaNombre,
      permisosEspeciales,
      etiquetas,
      isLoading, 
      refreshProfile: () => session?.user ? fetchProfile(session.user.id) : Promise.resolve() 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
