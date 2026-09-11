import { StyleSheet, Dimensions, Platform } from 'react-native';
import { KANBAN_THEME } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
export const COLUMN_WIDTH = Platform.OS === 'web' || width > 768 ? 350 : width * 0.85;
export const GAP = 16;
export const SNAP_INTERVAL = COLUMN_WIDTH + GAP;

export const styles = StyleSheet.create({
  kanbanColumnWrapper: {
    width: COLUMN_WIDTH,
    marginRight: GAP,
    height: height * 0.86,
    paddingBottom: 10,
  },
  kanbanColumn: {
    flex: 1,
    borderRadius: KANBAN_THEME.column.borderRadius,
    paddingHorizontal: KANBAN_THEME.column.paddingHorizontal,
    paddingTop: KANBAN_THEME.column.paddingTop,
    paddingBottom: KANBAN_THEME.column.paddingBottom,
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  columnTitle: {
    fontWeight: '900',
    fontSize: 16,
    color: '#1A202C',
    marginRight: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnCount: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
  },
  moreBtn: {
    padding: 4,
  },
  columnHighlightOverlay: {
    ...StyleSheet.absoluteFill,
    borderColor: '#0C66E4',
    borderWidth: 2.5,
    borderRadius: KANBAN_THEME.column.borderRadius,
    shadowColor: '#579DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
});
