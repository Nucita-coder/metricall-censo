import { KanbanColumnProps } from './KanbanColumn';

export const areEqualColumn = (prevProps: KanbanColumnProps, nextProps: KanbanColumnProps): boolean => {
  if (prevProps.isCobranzaBoard !== nextProps.isCobranzaBoard) return false;
  if (prevProps.item.id !== nextProps.item.id) return false;
  if (prevProps.item.nombre !== nextProps.item.nombre) return false;
  if (prevProps.item.color_fondo !== nextProps.item.color_fondo) return false;
  if (prevProps.baseOpacity !== nextProps.baseOpacity) return false;
  if (prevProps.item.tarjetas.length !== nextProps.item.tarjetas.length) return false;

  const prevIsMovingThisList = prevProps.listaEnMovimiento?.id === prevProps.item.id;
  const nextIsMovingThisList = nextProps.listaEnMovimiento?.id === nextProps.item.id;
  if (prevIsMovingThisList !== nextIsMovingThisList) return false;

  const prevIsListMoveMode = prevProps.listaEnMovimiento !== null;
  const nextIsListMoveMode = nextProps.listaEnMovimiento !== null;
  if (prevIsListMoveMode !== nextIsListMoveMode) return false;

  const prevIsSourceColumn = prevProps.tarjetaEnMovimiento?.lista_id === prevProps.item.id;
  const nextIsSourceColumn = nextProps.tarjetaEnMovimiento?.lista_id === nextProps.item.id;
  if (prevIsSourceColumn !== nextIsSourceColumn) return false;

  for (let i = 0; i < prevProps.item.tarjetas.length; i++) {
    const pt = prevProps.item.tarjetas[i];
    const nt = nextProps.item.tarjetas[i];
    if (pt.id !== nt.id) return false;
    if (pt.updated_at !== nt.updated_at) return false;
    if (JSON.stringify(pt.datos_valores) !== JSON.stringify(nt.datos_valores)) return false;
  }

  return true;
};
