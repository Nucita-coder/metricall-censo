import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DatePickerInput, SelectDropdown } from './CamposVenta';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  OPCIONES_HOGAR_CINEFILOS,
  OPCIONES_HOGAR_CONECTADOS,
  OPCIONES_HOGAR_FAMILIAR,
  OPCIONES_HOGAR_GAMER,
  OPCIONES_INSTALACION,
  OPCIONES_PYMES_PLAN,
  OPCIONES_TIPO_SERVICIO,
} from './constantes';

import { TarjetaDatosValores } from '../../types/kanban';

interface Props {
  formData: TarjetaDatosValores;
  update: (key: string, val: unknown) => void;
  readOnly?: boolean;
}

interface PerfilVendedor {
  id: string;
  nombre_completo: string | null;
  rol: string | null;
  etiquetas: string[] | null;
}

export const SeccionDatosComerciales = ({ formData, update, readOnly = false }: Props) => {
  const { empresaId } = useAuth();
  const [listaVendedores, setListaVendedores] = useState<string[]>([]);
  const [cargandoVendedores, setCargandoVendedores] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchVendedores = async () => {
      setCargandoVendedores(true);
      try {
        let query = supabase
          .from('perfiles')
          .select('id, nombre_completo, rol, etiquetas')
          .order('nombre_completo', { ascending: true });

        if (empresaId) {
          query = query.eq('empresa_id', empresaId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const perfiles = ((data || []) as unknown as PerfilVendedor[]).filter(
          (p) => Boolean(p.nombre_completo && p.nombre_completo.trim())
        );

        // Filtrar usuarios con rol o etiqueta de asesor / vendedor
        const filtrados = perfiles.filter((u) => {
          const rol = (u.rol || '').toLowerCase().trim();
          const hasRol = rol === 'asesor' || rol === 'vendedor' || rol === 'ventas' || rol === 'venta';
          const hasEtiqueta =
            Array.isArray(u.etiquetas) &&
            u.etiquetas.some((e: string) => {
              const clean = String(e).toLowerCase().trim();
              return clean === 'asesor' || clean === 'vendedor' || clean === 'ventas' || clean === 'venta';
            });
          return hasRol || hasEtiqueta;
        });

        // Usar los que tengan perfil comercial o todos los perfiles disponibles como fallback
        const base = filtrados.length > 0 ? filtrados : perfiles;
        const nombres = base.map((p) => String(p.nombre_completo).trim());
        const uniqueNombres = Array.from(new Set(nombres));

        // Si ya hay un vendedor asignado en la tarjeta, conservarlo en las opciones
        if (formData.vendedor && typeof formData.vendedor === 'string') {
          const actual = formData.vendedor.trim();
          if (actual && !uniqueNombres.includes(actual)) {
            uniqueNombres.unshift(actual);
          }
        }

        if (isMounted) {
          setListaVendedores(uniqueNombres);
        }
      } catch (err: unknown) {
        console.warn('Error al cargar vendedores:', err);
      } finally {
        if (isMounted) setCargandoVendedores(false);
      }
    };

    fetchVendedores();
    return () => {
      isMounted = false;
    };
  }, [empresaId, formData.vendedor]);

  const hayPlanHogarSeleccionado = Boolean(
    formData.phConectados || formData.phGamer || formData.phCinefilos || formData.phFamiliar
  );
  const hayPlanPymesSeleccionado = Boolean(
    formData.ppEmprendedores || formData.ppComercios || formData.ppOficinas || formData.ppNegocios
  );

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>DATOS COMERCIALES</Text>
      <DatePickerInput
        label="Fecha de Venta"
        value={formData.fechaVenta}
        onDateChange={(v: string) => update('fechaVenta', v)}
        placeholder="DD/MM/YYYY"
        disabled={readOnly}
      />
      <SelectDropdown
        label="Vendedor"
        value={String(formData.vendedor || '')}
        onSelect={(v: string) => update('vendedor', v)}
        options={listaVendedores}
        placeholder={cargandoVendedores ? 'Cargando vendedores...' : 'Seleccione vendedor'}
        disabled={readOnly || cargandoVendedores}
        isRequired
      />
      <SelectDropdown
        label="Tipo de Servicio"
        value={formData.tipoServicio}
        onSelect={(v: string) => {
          update('tipoServicio', v);
          update('phInstalacion', ''); update('phConectados', ''); update('phGamer', ''); update('phCinefilos', ''); update('phFamiliar', '');
          update('ppInstalacion', ''); update('ppEmprendedores', ''); update('ppComercios', ''); update('ppOficinas', ''); update('ppNegocios', '');
        }}
        options={OPCIONES_TIPO_SERVICIO}
        placeholder="Seleccione servicio"
        isRequired
        disabled={readOnly}
      />

      {/* PLANES HOGAR */}
      {formData.tipoServicio === 'hogar' && (
        <View style={styles.subCard}>
          <Text style={styles.subSectionTitle}>Planes Hogar</Text>
          <SelectDropdown label="Tipo de Instalación" value={formData.phInstalacion} onSelect={(v: string) => update('phInstalacion', v)} options={OPCIONES_INSTALACION} placeholder="Seleccione" disabled={readOnly} />
          <SelectDropdown label="Conectados" value={formData.phConectados} onSelect={(v: string) => update('phConectados', v)} options={OPCIONES_HOGAR_CONECTADOS} placeholder="Seleccione" disabled={readOnly || (hayPlanHogarSeleccionado && !formData.phConectados)} />
          <SelectDropdown label="Gamer" value={formData.phGamer} onSelect={(v: string) => update('phGamer', v)} options={OPCIONES_HOGAR_GAMER} placeholder="Seleccione" disabled={readOnly || (hayPlanHogarSeleccionado && !formData.phGamer)} />
          <SelectDropdown label="Cinéfilos" value={formData.phCinefilos} onSelect={(v: string) => update('phCinefilos', v)} options={OPCIONES_HOGAR_CINEFILOS} placeholder="Seleccione" disabled={readOnly || (hayPlanHogarSeleccionado && !formData.phCinefilos)} />
          <SelectDropdown label="Familiar" value={formData.phFamiliar} onSelect={(v: string) => update('phFamiliar', v)} options={OPCIONES_HOGAR_FAMILIAR} placeholder="Seleccione" disabled={readOnly || (hayPlanHogarSeleccionado && !formData.phFamiliar)} />
        </View>
      )}

      {/* PLANES PYMES */}
      {formData.tipoServicio === 'pymes' && (
        <View style={styles.subCard}>
          <Text style={styles.subSectionTitle}>Planes PYMES</Text>
          <SelectDropdown label="Tipo de Instalación" value={formData.ppInstalacion} onSelect={(v: string) => update('ppInstalacion', v)} options={OPCIONES_INSTALACION} placeholder="Seleccione" disabled={readOnly} />
          <SelectDropdown label="Emprendedores" value={formData.ppEmprendedores} onSelect={(v: string) => update('ppEmprendedores', v)} options={OPCIONES_PYMES_PLAN} placeholder="Seleccione" disabled={readOnly || (hayPlanPymesSeleccionado && !formData.ppEmprendedores)} />
          <SelectDropdown label="Comercios" value={formData.ppComercios} onSelect={(v: string) => update('ppComercios', v)} options={OPCIONES_PYMES_PLAN} placeholder="Seleccione" disabled={readOnly || (hayPlanPymesSeleccionado && !formData.ppComercios)} />
          <SelectDropdown label="Oficinas" value={formData.ppOficinas} onSelect={(v: string) => update('ppOficinas', v)} options={OPCIONES_PYMES_PLAN} placeholder="Seleccione" disabled={readOnly || (hayPlanPymesSeleccionado && !formData.ppOficinas)} />
          <SelectDropdown label="Negocios" value={formData.ppNegocios} onSelect={(v: string) => update('ppNegocios', v)} options={OPCIONES_PYMES_PLAN} placeholder="Seleccione" disabled={readOnly || (hayPlanPymesSeleccionado && !formData.ppNegocios)} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#2C333A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#384148',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#B6C2CF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subCard: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#384148',
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B6C2CF',
    marginBottom: 12,
  },
});
