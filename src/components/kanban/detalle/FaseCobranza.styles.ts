import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  cardSection: {
    backgroundColor: '#1D2125',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#384148',
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  formContainer: {
    gap: 4,
  },
  btnGuardar: {
    backgroundColor: '#A0B2C6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnGuardarText: {
    color: '#1D2125',
    fontWeight: 'bold',
    fontSize: 15,
  },
  historialContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#384148',
  },
  historialTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8C9BAB',
  },
  historialItem: {
    backgroundColor: '#2C333A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#384148',
  },
  historialFecha: {
    fontSize: 11,
    color: '#8C9BAB',
    marginBottom: 4,
  },
  historialTxt: {
    fontSize: 12,
    color: '#B6C2CF',
  },
});
