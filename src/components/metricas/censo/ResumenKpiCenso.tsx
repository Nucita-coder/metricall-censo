import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users, UserCheck, HelpCircle, UserX, PhoneCall, MapPin } from 'lucide-react-native';
import { SelectDropdown } from '../../venta/CamposVenta';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { ModalGestionSectores } from '../../censo/ModalGestionSectores';
import { styles } from './ResumenKpiCenso.styles';
import { CensoKpis, PeriodoCensoTipo } from './types';
import {
  OPCIONES_PERIODO_CENSO,
  PERIODO_CENSO_MAP_TO_KEY,
  PERIODO_CENSO_MAP_TO_LABEL,
  NOMBRES_MESES_CENSO,
  OPCIONES_ANIO_CENSO,
  COLORES_CENSO,
} from './censoConstants';

interface ResumenKpiCensoProps {
  periodoLocal: PeriodoCensoTipo;
  setPeriodoLocal: (p: PeriodoCensoTipo) => void;
  mesEspecificoNum: number;
  setMesEspecificoNum: (m: number) => void;
  anioEspecificoStr: string;
  setAnioEspecificoStr: (a: string) => void;
  asesorFiltro: string;
  setAsesorFiltro: (a: string) => void;
  listaAsesores: string[];
  kpis: CensoKpis;
  isDesktop: boolean;
}

export function ResumenKpiCenso({
  periodoLocal,
  setPeriodoLocal,
  mesEspecificoNum,
  setMesEspecificoNum,
  anioEspecificoStr,
  setAnioEspecificoStr,
  asesorFiltro,
  setAsesorFiltro,
  listaAsesores,
  kpis,
  isDesktop,
}: ResumenKpiCensoProps) {
  const { userRol: authRol, isDeveloper, etiquetas = [], empresaId } = useAuth();
  const currentRol = (authRol || '').toLowerCase();
  const isDevUser = isDeveloper || currentRol === 'developer' || currentRol === 'desarrollador';
  const isLiderEtiqueta = (etiquetas || []).some((e) => e.toLowerCase() === 'líder' || e.toLowerCase() === 'lider');
  const canManageSectores = isDevUser || isLiderEtiqueta || ['admin', 'lider', 'administrador', 'supervisor'].includes(currentRol);

  const [modalSectoresVisible, setModalSectoresVisible] = useState(false);
  const [solicitudesCount, setSolicitudesCount] = useState(0);

  const fetchSolicitudesCount = useCallback(async () => {
    if (!empresaId || !canManageSectores) return;
    try {
      const { count, error } = await supabase
        .from('solicitudes_sectores')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .eq('estado', 'pendiente');
      if (!error && count !== null) {
        setSolicitudesCount(count);
      }
    } catch {
      // Ignorar silenciosamente
    }
  }, [empresaId, canManageSectores]);

  useEffect(() => {
    fetchSolicitudesCount();
  }, [fetchSolicitudesCount]);
  return (
    <View style={styles.container}>
      {/* BARRA DE FILTROS SUPERIOR */}
      <View style={styles.filterBar}>
        <View style={styles.filterBarRow}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <SelectDropdown
              label="Período de Análisis (Censo)"
              value={PERIODO_CENSO_MAP_TO_LABEL[periodoLocal] || 'Este Mes'}
              options={OPCIONES_PERIODO_CENSO}
              onSelect={(selected: string) => {
                const key = PERIODO_CENSO_MAP_TO_KEY[selected];
                if (key) setPeriodoLocal(key);
              }}
            />
          </View>

          {periodoLocal === 'mes_especifico' && (
            <>
              <View style={{ flex: 1, minWidth: 140 }}>
                <SelectDropdown
                  label="Mes"
                  value={NOMBRES_MESES_CENSO[mesEspecificoNum] || 'Enero'}
                  options={NOMBRES_MESES_CENSO}
                  onSelect={(selected: string) => {
                    const idx = NOMBRES_MESES_CENSO.indexOf(selected);
                    if (idx >= 0) setMesEspecificoNum(idx);
                  }}
                />
              </View>
              <View style={{ width: 100 }}>
                <SelectDropdown
                  label="Año"
                  value={anioEspecificoStr}
                  options={OPCIONES_ANIO_CENSO}
                  onSelect={(selected: string) => setAnioEspecificoStr(selected)}
                />
              </View>
            </>
          )}

          <View style={{ flex: 1, minWidth: 200 }}>
            <SelectDropdown
              label="Filtrar por Asesor"
              value={asesorFiltro}
              options={listaAsesores}
              onSelect={(selected: string) => setAsesorFiltro(selected)}
            />
          </View>

          {canManageSectores && (
            <View style={styles.botonContainer}>
              <TouchableOpacity
                style={styles.botonGestionSectores}
                onPress={() => setModalSectoresVisible(true)}
                activeOpacity={0.7}
              >
                <MapPin size={14} color="#B6C2CF" />
                <Text style={styles.botonGestionSectoresText}>Sectores</Text>
                {solicitudesCount > 0 && (
                  <View style={styles.badgeSolicitudes}>
                    <Text style={styles.badgeSolicitudesText}>{solicitudesCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* FILA DE TARJETAS KPI (TOTALMENTE CUADRADAS Y PEGADAS) */}
      <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
        {/* KPI 1: TOTAL CENSADOS */}
        <View style={[styles.kpiCard, isDesktop ? styles.borderRight : styles.borderBottom]}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Personas Censadas</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <Users size={16} color="#B6C2CF" />
            </View>
          </View>
          <Text style={styles.kpiMainValue}>{kpis.totalCensados}</Text>
          <Text style={styles.kpiSubtitle}>Total general registrado</Text>
        </View>

        {/* KPI 2: INTERESADAS */}
        <View style={[styles.kpiCard, isDesktop ? styles.borderRight : styles.borderBottom]}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Interesadas en Servicio</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <UserCheck size={16} color={COLORES_CENSO.interesados} />
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.kpiMainValue}>{kpis.totalInteresados}</Text>
            <View style={[styles.pillBadge, { borderColor: COLORES_CENSO.interesados }]}>
              <Text style={[styles.pillText, { color: COLORES_CENSO.interesados }]}>
                {kpis.tasaInteres.toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text style={styles.kpiSubtitle}>Prospectos con disposición afirmativa</Text>
        </View>

        {/* KPI 3: INDECISOS */}
        <View style={[styles.kpiCard, isDesktop ? styles.borderRight : styles.borderBottom]}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Indecisos en Contratar</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <HelpCircle size={16} color={COLORES_CENSO.indecisos} />
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.kpiMainValue}>{kpis.totalIndecisos}</Text>
            <View style={[styles.pillBadge, { borderColor: COLORES_CENSO.indecisos }]}>
              <Text style={[styles.pillText, { color: COLORES_CENSO.indecisos }]}>
                {kpis.tasaIndecision.toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text style={styles.kpiSubtitle}>Posible contratación o en evaluación</Text>
        </View>

        {/* KPI 4: NO INTERESADOS */}
        <View style={[styles.kpiCard, isDesktop ? styles.borderRight : styles.borderBottom]}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>No Interesados</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <UserX size={16} color={COLORES_CENSO.noInteresados} />
            </View>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.kpiMainValue}>{kpis.totalNoInteresados}</Text>
            <View style={[styles.pillBadge, { borderColor: COLORES_CENSO.noInteresados }]}>
              <Text style={[styles.pillText, { color: COLORES_CENSO.noInteresados }]}>
                {kpis.tasaNoInteres.toFixed(1)}%
              </Text>
            </View>
          </View>
          <Text style={styles.kpiSubtitle}>Rechazaron contratación o con contrato</Text>
        </View>

        {/* KPI 5: GESTIONES REALIZADAS */}
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiLabel}>Gestión Realizada</Text>
            <View style={[styles.iconBox, { backgroundColor: '#1D2125' }]}>
              <PhoneCall size={16} color={COLORES_CENSO.gestiones} />
            </View>
          </View>
          <Text style={styles.kpiMainValue}>{kpis.totalGestiones}</Text>
          <Text style={styles.kpiSubtitle}>Contactos comerciales efectuados</Text>
        </View>
      </View>

      {canManageSectores && (
        <ModalGestionSectores
          visible={modalSectoresVisible}
          onClose={() => {
            setModalSectoresVisible(false);
            fetchSolicitudesCount();
          }}
          onSectorAprobado={fetchSolicitudesCount}
        />
      )}
    </View>
  );
}
