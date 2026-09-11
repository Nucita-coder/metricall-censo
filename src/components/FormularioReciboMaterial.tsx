import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useFormularioReciboMaterial } from '../hooks/useFormularioReciboMaterial';
import { FormularioReciboMaterialProps } from './almacen/formulario/types';
import { ModalInsumosPrecargados } from './almacen/formulario/ModalInsumosPrecargados';
import { SeccionGuiaOrden } from './almacen/formulario/SeccionGuiaOrden';
import { SeccionInsumosMateriales } from './almacen/formulario/SeccionInsumosMateriales';
import { SeccionAdjuntosResponsables } from './almacen/formulario/SeccionAdjuntosResponsables';

export * from './almacen/formulario/types';

export default function FormularioReciboMaterial({
  formData,
  handleChange,
  readOnly = false,
}: FormularioReciboMaterialProps) {
  const {
    nombreCompleto,
    stockInfoMap,
    setStockInfoMap,
    modalPrecargadosIndex,
    setModalPrecargadosIndex,
    subiendoImagen,
    miembrosList,
    stockDisponibles,
    stockCustodiaMiembro,
    isDevolucionMode,
    isDevolucionCentralMode,
    isDevolucionAsignacionMode,
    isAsignadoMode,
    adjuntos,
    items,
    updateHeaderField,
    updateItemField,
    updateMultipleItemFields,
    handleAddItem,
    handleRemoveItem,
    checkStockForCodigo,
    handleCodigoChangeForItem,
    handleAdjuntarFotoFactura,
    handleRemoveAdjunto,
  } = useFormularioReciboMaterial({ formData, handleChange, readOnly });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. GUÍA Y ORDEN DE ENTREGA */}
      <SeccionGuiaOrden
        formData={formData}
        updateHeaderField={updateHeaderField}
        readOnly={readOnly}
        isDevolucionMode={isDevolucionMode}
        isDevolucionCentralMode={isDevolucionCentralMode}
        isDevolucionAsignacionMode={isDevolucionAsignacionMode}
        isAsignadoMode={isAsignadoMode}
        miembrosList={miembrosList}
        nombreCompleto={nombreCompleto}
      />

      {/* 2. INSUMOS / MATERIALES */}
      <SeccionInsumosMateriales
        items={items}
        readOnly={readOnly}
        isDevolucionMode={isDevolucionMode}
        isDevolucionCentralMode={isDevolucionCentralMode}
        isDevolucionAsignacionMode={isDevolucionAsignacionMode}
        isAsignadoMode={isAsignadoMode}
        stockDisponibles={stockDisponibles}
        stockCustodiaMiembro={stockCustodiaMiembro}
        stockInfoMap={stockInfoMap}
        handleRemoveItem={handleRemoveItem}
        handleAddItem={handleAddItem}
        updateMultipleItemFields={updateMultipleItemFields}
        updateItemField={updateItemField}
        handleCodigoChangeForItem={handleCodigoChangeForItem}
        onOpenModalPrecargados={(idx) => setModalPrecargadosIndex(idx)}
        setStockInfoMap={setStockInfoMap}
      />

      {/* 3. ADJUNTO Y 4. RESPONSABLES Y MOTIVO */}
      <SeccionAdjuntosResponsables
        formData={formData}
        updateHeaderField={updateHeaderField}
        readOnly={readOnly}
        isDevolucionMode={isDevolucionMode}
        adjuntos={adjuntos}
        subiendoImagen={subiendoImagen}
        handleAdjuntarFotoFactura={handleAdjuntarFotoFactura}
        handleRemoveAdjunto={handleRemoveAdjunto}
        nombreCompleto={nombreCompleto}
      />

      {/* MODAL DE INSUMOS PRECARGADOS */}
      <ModalInsumosPrecargados
        visible={modalPrecargadosIndex !== null}
        onClose={() => setModalPrecargadosIndex(null)}
        onSelectInsumo={(p) => {
          if (modalPrecargadosIndex !== null) {
            updateMultipleItemFields(modalPrecargadosIndex, {
              codigoMaterial: p.codigo,
              nombreMaterial: p.nombre,
              modeloMaterial: p.modelo,
            });
            checkStockForCodigo(modalPrecargadosIndex, p.codigo);
          }
          setModalPrecargadosIndex(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 10,
  },
});
