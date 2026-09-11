import { StyleSheet } from 'react-native';

export const modalInventarioStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#22272B',
    width: '100%',
    maxHeight: '92%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384148',
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#384148',
    backgroundColor: '#2C333A',
  },
  footerTxt: { fontSize: 11, color: '#8C9BAB' },
});
