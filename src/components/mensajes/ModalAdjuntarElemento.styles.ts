import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#2C333A',
    borderRadius: 12,
    width: '90%',
    maxWidth: 340,
    maxHeight: '80%',
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#384148',
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#B6C2CF',
  },
  closeBtn: {
    padding: 4,
  },
  breadcrumbBar: {
    backgroundColor: '#1D2125',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  breadcrumbText: {
    color: '#8C9BAB',
    fontSize: 11,
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  centered: {
    padding: 24,
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#384148',
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1D2125',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitulo: {
    color: '#B6C2CF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemDetalles: {
    color: '#8C9BAB',
    fontSize: 10,
    marginTop: 2,
  },
  btnAdjuntarContainer: {
    padding: 6,
  },
});
