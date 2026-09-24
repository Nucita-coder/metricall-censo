import React from 'react';
import { Text, View } from 'react-native';
import { History } from 'lucide-react-native';
import { getResultadoColor } from '../../../constants/theme';
import { RESULTADOS_EFECTIVOS } from './faseCobranzaConstants';
import { styles } from './FaseCobranza.styles';

interface Props {
  gestiones: Array<Record<string, unknown>>;
}

export const SeccionHistorialCobranza: React.FC<Props> = ({ gestiones }) => {
  if (!gestiones || gestiones.length === 0) return null;

  return (
    <View style={styles.historialContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <History size={14} color="#8C9BAB" />
        <Text style={styles.historialTitle}>Historial de Contactos ({gestiones.length})</Text>
      </View>
      {gestiones.map((g, idx) => {
        const accion = String(
          g.tipoAccion ||
            g.categoriaAccion ||
            (RESULTADOS_EFECTIVOS.includes(String(g.resultado || ''))
              ? 'ACCIÓN EFECTIVA'
              : 'ACCIÓN NEGATIVA')
        );
        const esEfectiva = accion.includes('EFECTIVA');
        return (
          <View key={idx} style={styles.historialItem}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text style={styles.historialFecha}>
                {g.fecha ? new Date(String(g.fecha)).toLocaleString() : '—'}
              </Text>
              <View
                style={[
                  styles.historialAccionBadge,
                  {
                    backgroundColor: esEfectiva
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'rgba(239, 68, 68, 0.12)',
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: 'bold',
                    color: esEfectiva ? '#4ADE80' : '#F87171',
                  }}
                >
                  {accion}
                </Text>
              </View>
            </View>
            <Text style={styles.historialTxt}>
              • Contacto: <Text style={{ color: '#B6C2CF' }}>{String(g.tipoContacto || '')}</Text>
            </Text>
            <Text style={styles.historialTxt}>
              • Resultado:{' '}
              <Text
                style={{
                  color: getResultadoColor(String(g.resultado || '')).text,
                  fontWeight: 'bold',
                }}
              >
                {String(g.resultado || '')}
              </Text>
            </Text>
          </View>
        );
      })}
    </View>
  );
};
