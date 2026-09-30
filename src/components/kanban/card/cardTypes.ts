export interface StatusBadgeItem {
  text: string;
  bg: string;
  color: string;
  border?: string;
}

export interface UniversalCardData {
  topBadgeText: string;
  topBadgeBg: string;
  topBadgeColor: string;
  isCobranzaBadge: boolean;
  topMetricText: string;
  title: string;
  subtitle: string;
  statusBadges: StatusBadgeItem[];
  footerLeft: string;
  footerRight: string;
  cardBg: string;
  isBloqueada: boolean;
  bloqueadaText: string;
}

export const cleanEmojis = (str: string): string =>
  !str
    ? ''
    : str
        .replace(
          /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu,
          ''
        )
        .replace(/\s{2,}/g, ' ')
        .trim();

export const toTitleCase = (str: string): string =>
  !str
    ? ''
    : str.toLowerCase().replace(/(?:^|\s)\S/g, (m) => m.toUpperCase());

export const formatCedula = (doc?: string | number): string => {
  if (!doc) return '';
  const digits = String(doc).replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') || String(doc);
};

export const formatTelefono = (tel?: string | number): string => {
  if (!tel) return '';
  const clean = String(tel).replace(/\D/g, '');
  return clean.length === 11 && clean.startsWith('0')
    ? `${clean.slice(0, 4)}-${clean.slice(4, 7)}-${clean.slice(7)}`
    : String(tel);
};
