import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  filterBar: {
    backgroundColor: '#22272B',
    borderRadius: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: '#384148',
    marginBottom: 16,
  },
  filterBarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  botonContainer: {
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  botonGestionSectores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
  },
  botonGestionSectoresText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B6C2CF',
  },
  badgeSolicitudes: {
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#8C9BAB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 2,
  },
  badgeSolicitudesText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  kpiGrid: {
    flexDirection: 'column',
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 0,
    overflow: 'hidden',
  },
  kpiGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#2C333A',
    borderRadius: 0,
    padding: 16,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#384148',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8C9BAB',
    textTransform: 'uppercase',
    flex: 1,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#384148',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  kpiMainValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 0,
    borderWidth: 1,
    backgroundColor: '#1D2125',
  },
  pillText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  kpiSubtitle: {
    fontSize: 11,
    color: '#8C9BAB',
    marginTop: 4,
  },
});
