import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { FaseProps, findListaTarget, getAtencionFallasListaId } from './types';
import { renderSection } from './SeccionRegistro';
import { Tarjeta, TarjetaMaterialItem } from '../../../types/kanban';
import { SeccionMaterialesEnProceso } from './SeccionMaterialesEnProceso';
import { SeccionGeolocalizacionEnProceso } from './SeccionGeolocalizacionEnProceso';

export const FaseEnProceso = ({
  tarjeta,
  onUpdateTarjeta,
  autoMoverTarjeta,
  isSaving,
  setIsSaving,
  listasGlobales = [],
  readOnly = false,
  onRemoveTarjetaLocal,
  setTarjetaSeleccionada,
}: FaseProps) => {
  const { nombreCompleto, empresaId } = useAuth();
  const data = tarjeta.datos_valores || {};

  const matchLista = listasGlobales.find(l => l.id === tarjeta.lista_id);
  const nombreTablero = (matchLista?.tableros?.nombre || '').toLowerCase();
  const isFalla = Boolean(
    data.tipoFalla ||
    data.estadoSoporte ||
    data.accionFalla ||
    (tarjeta.origen && String(tarjeta.origen).toLowerCase().includes('soporte')) ||
    nombreTablero.includes('atenci') ||
    nombreTablero.includes('falla')
  );

  const [tipoInstalacion, setTipoInstalacion] = useState(data.tipoInstalacion || '');
  const [serialEquipo, setSerialEquipo] = useState(data.serialEquipo || '');
  const [macEquipo, setMacEquipo] = useState(data.mac_equipo || '');
  const [puertoAsignado, setPuertoAsignado] = useState(data.puertoAsignado || '');
  const [puertosDisponibles, setPuertosDisponibles] = useState(data.puertosDisponibles || '');
  const [nroNap, setNroNap] = useState(data.nroNap || '');
  const [potenciaNap, setPotenciaNap] = useState(data.potenciaNap || '');
  const [potenciaCasa, setPotenciaCasa] = useState(data.potencia_casa || '');
  const [cableDrop, setCableDrop] = useState(data.cable_drop || '');
  const [geoNap, setGeoNap] = useState<{ lat: number; lng: number } | null>((data.geo_nap && typeof data.geo_nap.lat === 'number' && typeof data.geo_nap.lng === 'number') ? { lat: data.geo_nap.lat, lng: data.geo_nap.lng } : null);
  const [geoCasa, setGeoCasa] = useState<{ lat: number; lng: number } | null>((data.geo_casa && typeof data.geo_casa.lat === 'number' && typeof data.geo_casa.lng === 'number') ? { lat: data.geo_casa.lat, lng: data.geo_casa.lng } : null);
  const [geoFotos, setGeoFotos] = useState<string[]>(data.geofotos || []);

  const [materiales, setMateriales] = useState<Record<string, string>>((data.materiales as Record<string, string>) || {
    tensorPlastico: '',
    tensorHierro: '',
    grapas: '',
    tirrap: '',
    pachCordApc: '',
    pachCordUpc: '',
    pachCordApcUpc: '',
    cajaTerminalCon: '',
    cajaTerminalSin: '',
    conectorAcople: '',
    conectorMecanicoApc: '',
    conectorMecanicoUpc: '',
    precinto: '',
    cablePreconectorizado: ''
  });

  const [stockCustodia, setStockCustodia] = useState<Record<string, number>>({});

  useEffect(() => {
    const targetTecnico = (data.tecnicoAsignado || data.asignadoA || nombreCompleto || '').toString().trim().toUpperCase();
    const targetEmpresa = tarjeta.empresa_id || empresaId;
    if (!targetEmpresa || !targetTecnico) return;

    supabase.from('tarjetas').select('id, datos_valores').eq('empresa_id', targetEmpresa).then(({ data: rows }) => {
      if (!rows) return;
      const mapaStock: Record<string, number> = {};

      (rows as unknown as Tarjeta[]).forEach((row) => {
        const v = row.datos_valores || {};
        const tipo = (v.tipoCarga || '').toString().trim().toUpperCase();
        const miembro = (v.asignadoA || (v.recibidoPor as string) || '').toString().trim().toUpperCase();
        const isMatch = miembro === targetTecnico || (miembro && targetTecnico && (miembro.includes(targetTecnico) || targetTecnico.includes(miembro)));

        const isDevolucion = tipo.includes('DEVOLUCION') || tipo.includes('DEVOLUCIÓN');
        const isAsignado = !isDevolucion && (tipo.includes('ASIGNA') || Boolean(v.asignadoA && v.asignadoA.toString().trim()));

        if (isMatch && (isAsignado || isDevolucion)) {
          const itemsList = Array.isArray(v.items) && v.items.length > 0 ? v.items : [v];
          (itemsList as Array<TarjetaMaterialItem & Record<string, unknown>>).forEach((item) => {
            const cod = (item.codigoMaterial || '').trim().toUpperCase();
            const nom = (item.nombreMaterial || '').trim().toUpperCase();
            const cant = parseFloat(item.cantidadRecibida as string || '0') || 0;
            const key = cod || nom;
            if (key) {
              if (!mapaStock[key]) mapaStock[key] = 0;
              if (isAsignado) mapaStock[key] += cant;
              else if (isDevolucion) mapaStock[key] -= cant;
            }
          });
        }

        const tecCard = (v.tecnicoAsignado || v.asignadoA || v.creadorNombre || '').toString().trim().toUpperCase();
        const matchTec = tecCard === targetTecnico || (tecCard && targetTecnico && (tecCard.includes(targetTecnico) || targetTecnico.includes(miembro)));
        if (matchTec && row.id !== tarjeta.id && v.materiales && typeof v.materiales === 'object') {
          const fieldMap: Record<string, string> = {
            tensorPlastico: 'MAT-TENSOR-PLASTICO',
            tensorHierro: 'MAT-TENSOR-HIERRO',
            grapas: 'MAT-GRAPAS',
            tirrap: 'MAT-TIRRAP',
            pachCordApc: 'MAT-PACH-APC',
            pachCordUpc: 'MAT-PACH-UPC',
            pachCordApcUpc: 'MAT-PACH-APC-UPC',
            cajaTerminalCon: 'MAT-CAJA-TERM-CON',
            cajaTerminalSin: 'MAT-CAJA-TERM-SIN',
            conectorAcople: 'MAT-CONECTOR-ACOPLE-HH',
            conectorMecanicoApc: 'MAT-CONECTOR-MEC-APC',
            conectorMecanicoUpc: 'MAT-CONECTOR-MEC-UPC',
            precinto: 'MAT-PRECINTO',
            cablePreconectorizado: 'MAT-CABLE-PRECONECTORIZADO',
            cableDrop: 'MAT-CABLE-DROP'
          };

          if (v.materiales && typeof v.materiales === 'object') {
            Object.keys(v.materiales).forEach((fk) => {
              const cantUsed = parseFloat(String(v.materiales?.[fk] || '0')) || 0;
              if (cantUsed > 0 && fieldMap[fk]) {
                const k = fieldMap[fk];
                if (mapaStock[k] !== undefined) mapaStock[k] -= cantUsed;
              }
            });
          }
        }
      });

      setStockCustodia(mapaStock);
    });
  }, [tarjeta.id, tarjeta.empresa_id, empresaId, nombreCompleto, data.tecnicoAsignado, data.asignadoA]);

  return renderSection("Informe de Atención Técnica", (
    <View>
        {/* Banner de Advertencia si la instalación fue devuelta desde Por Activar */}
        {Boolean(data.motivoRetorno || data.ultimoMotivoRetorno) && (
          <View
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderLeftWidth: 4,
              borderLeftColor: '#EF4444',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#7F1D1D',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <AlertTriangle size={16} color="#EF4444" />
              <Text style={{ color: '#F87171', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' }}>
                Instalación Devuelta / No Activada
              </Text>
            </View>
            <Text style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 18 }}>
              {String(data.motivoRetorno || data.ultimoMotivoRetorno)}
            </Text>
            {Boolean(data.retornadoPor) && (
              <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>
                Devuelto por: {String(data.retornadoPor)}
              </Text>
            )}
          </View>
        )}

        <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>TIPO DE INSTALACIÓN / ATENCIÓN</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {['fibra', 'inalambrico'].map(tipo => (
            <TouchableOpacity
              key={tipo}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: tipoInstalacion === tipo ? '#0C66E4' : '#384148', backgroundColor: tipoInstalacion === tipo ? '#0C66E4' : '#1D2125', alignItems: 'center' }}
              onPress={() => !readOnly && !isSaving && setTipoInstalacion(tipo)}
              disabled={readOnly || isSaving}
            >
              <Text style={{ fontWeight: 'bold', color: tipoInstalacion === tipo ? '#FFF' : '#B6C2CF', textTransform: 'capitalize' }}>{tipo}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8 }}>SERIAL EQUIPO</Text>
            <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 10, color: '#B6C2CF' }} value={serialEquipo} onChangeText={setSerialEquipo} editable={!readOnly && !isSaving} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#8C9BAB', fontWeight: '600', marginBottom: 8 }}>MAC EQUIPO</Text>
            <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 10, color: '#B6C2CF' }} value={macEquipo} onChangeText={setMacEquipo} editable={!readOnly && !isSaving} />
          </View>
        </View>

        {/* Sección Modularizada de Materiales */}
        <SeccionMaterialesEnProceso
          materiales={materiales}
          setMateriales={setMateriales}
          stockCustodia={stockCustodia}
          readOnly={readOnly}
          isSaving={isSaving}
        />

        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <View style={{ width: '48%', marginBottom: 12 }}>
              <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>NRO DE NAP</Text>
              <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} value={nroNap} onChangeText={setNroNap} editable={!readOnly && !isSaving} />
            </View>
            <View style={{ width: '48%', marginBottom: 12 }}>
              <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>POTENCIA NAP</Text>
              <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} value={potenciaNap} onChangeText={setPotenciaNap} editable={!readOnly && !isSaving} />
            </View>
            <View style={{ width: '48%', marginBottom: 12 }}>
              <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>POTENCIA CASA</Text>
              <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} value={potenciaCasa} onChangeText={setPotenciaCasa} editable={!readOnly && !isSaving} />
            </View>
            <View style={{ width: '48%', marginBottom: 12 }}>
              <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>CABLE DROP</Text>
              <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} value={cableDrop} onChangeText={setCableDrop} editable={!readOnly && !isSaving} />
            </View>
            <View style={{ width: '48%', marginBottom: 12 }}>
              <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>PUERTO ASIGNADO</Text>
              <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} value={puertoAsignado} onChangeText={setPuertoAsignado} editable={!readOnly && !isSaving} />
            </View>
            <View style={{ width: '48%', marginBottom: 12 }}>
              <Text style={{ fontSize: 10, color: '#8C9BAB', fontWeight: '600', marginBottom: 4 }}>PUERTOS DISPONIBLES</Text>
              <TextInput style={{ backgroundColor: '#1D2125', borderWidth: 1, borderColor: '#384148', borderRadius: 8, padding: 8, color: '#B6C2CF' }} keyboardType="numeric" value={puertosDisponibles} onChangeText={setPuertosDisponibles} editable={!readOnly && !isSaving} />
            </View>
          </View>
        </View>

        {!isFalla && !readOnly && (
          <SeccionGeolocalizacionEnProceso
            geoNap={geoNap}
            setGeoNap={setGeoNap}
            geoCasa={geoCasa}
            setGeoCasa={setGeoCasa}
            geoFotos={geoFotos}
            setGeoFotos={setGeoFotos}
            isSaving={isSaving}
          />
        )}

        {!readOnly && (
          <TouchableOpacity
            style={{ backgroundColor: '#0C66E4', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 }}
            onPress={async () => {
              setIsSaving(true);
              try {
                await onUpdateTarjeta({
                  tipoInstalacion,
                  serialEquipo,
                  macEquipo,
                  materiales,
                  puertoAsignado,
                  puertosDisponibles,
                  nroNap,
                  potenciaNap,
                  potencia_casa: potenciaCasa,
                  cable_drop: cableDrop,
                  geo_nap: geoNap,
                  geo_casa: geoCasa,
                  geofotos: geoFotos,
                  estadoLiberacion: isFalla ? 'atendida' : 'exitosa',
                  puerto: puertoAsignado,
                  puertos_disponibles: puertosDisponibles,
                  nap: nroNap,
                  serial_onu: serialEquipo,
                  tecnico: data.tecnicoAsignado || tarjeta.asignado_a || '',
                  motivoRetorno: null,
                });

                let destId: string | undefined = undefined;

                if (isFalla) {
                  destId = (await getAtencionFallasListaId('En Revisión', tarjeta.empresa_id)) || undefined;
                }

                if (!destId) {
                  const matchGlobal = listasGlobales.find(l => {
                    const nombreL = (l.nombre || '').toLowerCase();
                    const isSameTablero = l.tablero_id === tarjeta.tablero_id;
                    return isSameTablero && nombreL.includes('revis');
                  });
                  if (matchGlobal) destId = matchGlobal.id;
                }

                if (!destId) {
                  const targetSlug = isFalla ? 'en_revision' : 'por_activar';
                  const fallback = findListaTarget(listasGlobales, targetSlug);
                  if (fallback) destId = fallback.id;
                }

                if (!destId) {
                  const targetSlug2 = isFalla ? 'revision' : 'activar';
                  const fallback2 = listasGlobales.find(l => (l.nombre || '').toLowerCase().includes(targetSlug2));
                  if (fallback2) destId = fallback2.id;
                }

                if (!destId) {
                  throw new Error(isFalla ? "No se encontró la lista 'En Revisión'" : "Lista destino 'Por Activar' no encontrada");
                }

                await autoMoverTarjeta(tarjeta, destId);

                if (onRemoveTarjetaLocal) onRemoveTarjetaLocal(tarjeta.id);
                if (setTarjetaSeleccionada) setTarjetaSeleccionada(null);
                Alert.alert(
                  isFalla ? '¡Falla Atendida!' : '¡Instalación Exitosa!',
                  isFalla ? "La tarjeta fue completada y enviada a 'En Revisión'." : "La tarjeta pasó a 'Por Activar'."
                );
              } catch (e: unknown) {
                console.error('[FaseEnProceso] Error al procesar:', e);
                Alert.alert('Error', (e as Error).message || 'No se pudo completar el proceso.');
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                {isFalla ? 'Falla Atendida (En Revisión)' : 'Instalación Exitosa (Activar)'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    ));
};
