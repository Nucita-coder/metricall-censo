import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2125',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C333A',
    backgroundColor: '#22272B',
  },
  botInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(87, 157, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  botBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#579DFF',
    letterSpacing: 0.5,
  },
  statusOnline: {
    fontSize: 12,
    color: '#4ADE80',
    fontWeight: '500',
  },
  btnReiniciar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#2C333A',
  },
  btnReiniciarText: {
    fontSize: 12,
    color: '#8C9BAB',
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  rowUsuario: {
    justifyContent: 'flex-end',
  },
  rowAsistente: {
    justifyContent: 'flex-start',
  },
  avatarBot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(87, 157, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUsuario: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0C66E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUsuario: {
    backgroundColor: '#0C66E4',
    borderBottomRightRadius: 2,
  },
  bubbleAsistente: {
    backgroundColor: '#22272B',
    borderWidth: 1,
    borderColor: '#384148',
    borderBottomLeftRadius: 2,
  },
  bubbleLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#8C9BAB',
    fontStyle: 'italic',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUsuario: {
    color: '#FFFFFF',
  },
  textAsistente: {
    color: '#B6C2CF',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeUsuario: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
  timeAsistente: {
    color: '#8C9BAB',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#2C333A',
    backgroundColor: '#22272B',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1D2125',
    borderWidth: 1,
    borderColor: '#384148',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#B6C2CF',
    fontSize: 14,
    maxHeight: 90,
  },
  sendBtn: {
    backgroundColor: '#B6C2CF',
    width: 38,
    height: 38,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
