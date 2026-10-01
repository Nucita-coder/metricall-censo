import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { SECTORES_ANACO } from './sectoresAnaco';

export function useSectoresEmpresa(empresaId?: string | null) {
  const [sectoresAprobados, setSectoresAprobados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarSectores = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sectores_empresa')
        .select('nombre')
        .eq('empresa_id', empresaId)
        .order('nombre', { ascending: true });

      if (!error && data) {
        setSectoresAprobados(data.map((s) => String(s.nombre)).filter(Boolean));
      }
    } catch (err) {
      console.warn('Error cargando sectores aprobados de empresa:', err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarSectores();
  }, [cargarSectores]);

  // Combinar sectores base con los aprobados por la empresa y garantizar 'Otro' al final
  const listaBaseSinOtro = SECTORES_ANACO.filter((s) => s !== 'Otro');
  const combinadosSet = new Set<string>([...listaBaseSinOtro, ...sectoresAprobados]);
  const sectoresOpciones = Array.from(combinadosSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
  sectoresOpciones.push('Otro');

  return {
    sectoresOpciones,
    loading,
    recargarSectores: cargarSectores,
  };
}
