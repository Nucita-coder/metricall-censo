import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#22272B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B6C2CF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnClose: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C333A',
    backgroundColor: '#1D2125',
  },
  btnCancelar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#384148',
    backgroundColor: '#22272B',
  },
  btnCancelarTxt: {
    color: '#8C9BAB',
    fontSize: 13,
    fontWeight: '600',
  },
  btnGuardar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#A0B2C6',
  },
  btnGuardarTxt: {
    color: '#1D2125',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
