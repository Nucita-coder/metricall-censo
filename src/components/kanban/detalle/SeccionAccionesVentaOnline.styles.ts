import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  description: {
    fontSize: 13,
    color: '#8C9BAB',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionBtn: {
    backgroundColor: '#2C333A',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  actionBtnActive: {
    backgroundColor: '#384148',
  },
  actionBtnText: {
    color: '#B6C2CF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionBtnPrimary: {
    backgroundColor: '#A0B2C6',
    borderColor: '#A0B2C6',
  },
  actionBtnPrimaryText: {
    color: '#1D2125',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmBox: {
    backgroundColor: '#22272B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#384148',
  },
  confirmText: {
    color: '#B6C2CF',
    fontSize: 12,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  italicText: {
    fontStyle: 'italic',
  },
  cancelLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  cancelLinkText: {
    color: '#8C9BAB',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
