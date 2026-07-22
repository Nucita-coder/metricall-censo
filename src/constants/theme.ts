export const KANBAN_THEME = {
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  column: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 8,
  }
};

export const KANBAN_COLORS = {
  card: {
    defaultBg: '#FFFFFF',
    censoInteresadosBg: '#E8F5E9',
    censoNoInteresadosBg: '#FFEBEE',
    censoPosiblesBg: '#E3F2FD',
    bloqueadaBg: '#D1D5DB',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
  },
  badge: {
    hogar: { bg: '#EBF4FF', text: '#2B6CB0' },
    pymes: { bg: '#FEEBC8', text: '#C05621' },
    dedicado: { bg: '#E6FFFA', text: '#2C7A7B' },
    isp: { bg: '#E9D8FD', text: '#6B46C1' },
    default: { bg: '#E2E8F0', text: '#4A5568' }
  },
  text: {
    primary: '#1A202C',
    secondary: '#4A5568',
    muted: '#718096',
    empty: '#A0AEC0',
    danger: '#FFF',
    light: '#A0AEC0',
  },
  tags: {
    bloqueadaBg: '#EF4444'
  }
};

import { Platform } from 'react-native';

export const WEB_MODAL_CONTAINER = Platform.OS === 'web' ? {
  width: '100%',
  maxWidth: 1100,
  alignSelf: 'center',
  flex: 1,
} as const : {};
