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
  avatarUrl: string | null;
  mensaje: string;
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
  avatarUrl: null,
  mensaje: '',
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      let data: any = null;
      let error: any = null;

      const res = await supabase
        .from('perfiles')
        .select('rol, empresa_id, permisos_especiales, etiquetas, nombre_completo, avatar_url, mensaje, empresas!empresa_id(nombre)')
        .eq('id', userId)
        .single();

      data = res.data;
      error = res.error;
        
      if (error && error.message?.includes('avatar_url')) {
        // Fallback si la migración 42 aún no se ha ejecutado en Supabase SQL Editor
        const fallbackRes = await supabase
          .from('perfiles')
          .select('rol, empresa_id, permisos_especiales, etiquetas, nombre_completo, empresas!empresa_id(nombre)')
          .eq('id', userId)
          .single();
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) {
        console.warn("AuthContext - Error fetching profile:", error.message);
        if (error.code === 'PGRST116' || error.message?.includes('JWT') || error.message?.includes('token')) {
          await supabase.auth.signOut().catch(() => {});
          setSession(null);
        }
        return;
      }

      if (data) {
        setUserRol(data.rol || '');
        setEmpresaId(data.empresa_id || null);
        setNombreCompleto(data.nombre_completo || '');
        setAvatarUrl((data as any).avatar_url || null);
        setMensaje((data as any).mensaje || '');
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

  useEffect(() => {
    let isMounted = true;

    const processSession = async (currentSession: Session | null) => {
      try {
        setIsLoading(true);
        setSession(currentSession);

        if (currentSession?.user) {
          const newUserId = currentSession.user.id;
          try {
            const lastUserId = await AsyncStorage.getItem('@last_session_user_id');
            if (lastUserId && lastUserId !== newUserId) {
              const keys = await AsyncStorage.getAllKeys();
              const oldCacheKeys = keys.filter(k => k.startsWith('@cache_tablero_'));
              if (oldCacheKeys.length > 0) {
                await AsyncStorage.multiRemove(oldCacheKeys);
              }
            }
            await AsyncStorage.setItem('@last_session_user_id', newUserId);
          } catch (e) {
            console.warn("AuthContext - Cache cleanup error:", e);
          }

          // Cargar perfil completo antes de dar por terminada la carga de sesión
          await fetchProfile(currentSession.user.id);
        } else {
          setUserRol('');
          setEmpresaId(null);
          setNombreCompleto('');
          setEmpresaNombre('');
          setPermisosEspeciales({});
          setEtiquetas([]);
          setAvatarUrl(null);
          setMensaje('');

          try {
            const keys = await AsyncStorage.getAllKeys();
            const oldCacheKeys = keys.filter(k => k.startsWith('@cache_tablero_'));
            if (oldCacheKeys.length > 0) {
              await AsyncStorage.multiRemove(oldCacheKeys);
            }
            await AsyncStorage.removeItem('@last_session_user_id');
          } catch (e) {
            console.warn("AuthContext - Signout cache cleanup error:", e);
          }
        }
      } catch (err) {
        console.warn("AuthContext - Error processing session:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Obtenemos sesión inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      processSession(initialSession);
    }).catch(err => {
      console.warn("AuthContext - Error getting session:", err);
      if (isMounted) setIsLoading(false);
    });

    // Escuchamos cambios de estado de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'INITIAL_SESSION') return; // Ya se procesa con getSession()
      processSession(currentSession);
    });

    return () => {
      isMounted = false;
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
      avatarUrl,
      mensaje,
      isLoading, 
      refreshProfile: () => session?.user ? fetchProfile(session.user.id) : Promise.resolve() 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

