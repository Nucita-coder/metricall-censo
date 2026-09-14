import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#22272B',
    width: '100%',
    maxHeight: '85%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    backgroundColor: '#1D2125',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  btnLimpiar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
  },
  btnLimpiarTxt: {
    fontSize: 11,
    color: '#8C9BAB',
    fontWeight: '600',
  },
  btnClose: {
    padding: 4,
  },
  body: {
    padding: 16,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#384148',
    backgroundColor: '#1D2125',
  },
  btnAplicar: {
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnAplicarTxt: {
    color: '#B6C2CF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
