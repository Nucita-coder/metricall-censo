/**
 * Catálogo Maestro Oficial de Sectores, Urbanizaciones y Caseríos de Anaco
 * Módulo de Censo Comercial - Metricall
 */

export const SECTORES_ANACO: string[] = [
  '1ro de Mayo (Sectores A, B y C)',
  '3 de Diciembre',
  '5 de Julio',
  '12 de Octubre',
  '17 de Diciembre (Sectores I y II)',
  '19 de Abril',
  '23 de Enero',
  '24 de Julio',
  'Agrícola San Francisco',
  'Alí Primera',
  'Alta Vista',
  'Ana Soto',
  'Anaco II',
  'Andrés Eloy Blanco',
  'Bajo Lindo (Sectores I, II y III)',
  'Bella Vista',
  'Bicentenario (I y II)',
  'Brisas del Guario',
  'Buena Vista',
  'Buena Vista Campo Mensual',
  'Campo Alegre',
  'Campo Claro',
  'Campo Móvil',
  'Campo Norte',
  'Campo Sur',
  'Campos Los Pilones / Los Pilones',
  'Canaima',
  'Casco Central',
  'Caserío Cerro Pelón',
  'Caserío El Carito',
  'Caserío El Güario (Guario de la Cruz)',
  'Caserío El Roble (Caserío Rural Campesino El Roble)',
  'Caserío Guafita',
  'Caserío Guayabal Rural',
  'Caserío La Ceiba de Guario',
  'Caserío La Ceibita',
  'Caserío La Margarita',
  'Caserío Matachines',
  'Caserío Pirital',
  'Caucagüita',
  'Chorochoro',
  'Ciudad Bendita (Colinas II Parte Alta)',
  'Colinas de Anaco (Colinas I, II y III / Patriotas que Hicieron Historia)',
  'Country Club',
  'El Algarrobo',
  'El Bolivariano',
  'El Carmen (I y II)',
  'El Chaparral',
  'El Chaparro Rumbo al Socialismo',
  'El Chispero',
  'El Libertador',
  'El Magual',
  'El Merey',
  'El Milagro (I y II)',
  'El Morichal',
  'El Paraíso',
  'El Recreo',
  'El Samán',
  'El Siete',
  'El Sueño de Bolívar',
  'El Tanque',
  'Ezequiel Zamora',
  'Fernández Padilla',
  'Florida Natereña',
  'Francisco de Miranda',
  'Funda Anaco',
  'Fundacasa',
  'Guárico Lindo',
  'Guayabal',
  'Hugo Chávez',
  'Inavi',
  'José Antonio Anzoátegui',
  'José Antonio Páez',
  'José Félix Ribas (I y II)',
  'La Bombita',
  'La Ceiba',
  'La Cruz',
  'La Esperanza',
  'La Esperanza Socialista de Montecristo',
  'La Florida',
  'La Gloria',
  'La Laguna',
  'La Montañita',
  'La Palmera',
  'La Providencia',
  'La Represa',
  'La Toma',
  'Las Charas',
  'Las Lomas',
  'Las Palmas',
  'Las Parcelas',
  'Las Vegas',
  'Libertad',
  'Lomas de Altamira',
  'Los Algarrobos',
  'Los Ángeles',
  'Los Caobos',
  'Los Cardones',
  'Los Cujíes',
  'Los Chaguaramos',
  'Los Indios Revolucionarios de Mesaravasche',
  'Los Jardines (y Jardines I)',
  'Los Mangos',
  'Los Olivos',
  'Los Próceres',
  'Los Sauces',
  'Manuelita Sáenz',
  'Mapirikaki',
  'Mata Negra',
  'Monterrey',
  'Movimiento 13 de Abril Guario 1',
  'Nueva Guayana',
  'Parcelamiento Agrícola San Antonio',
  'Parcelamiento Guario',
  'Parcelamiento San Joaquín',
  'Pedro Camejo',
  'Pedro Pérez Delgado',
  'Pueblo Nuevo Norte',
  'Pueblo Nuevo San Joaquín',
  'Pueblo Nuevo Sur',
  'Rancho Grande',
  'Río Guario (I, II y III)',
  'San Antonio',
  'San Antonio de Padua',
  'San Froilán',
  'San Joaquín (Casco Central)',
  'San Joaquín Este',
  'San Joaquín Oeste',
  'San José',
  'San Rafael',
  'San Simón',
  'Santa Bárbara',
  'Santa Eduvigis',
  'Santa Inés',
  'Simón Bolívar',
  'Simón Rodríguez',
  'Terraplén',
  'Terrazas del Merey',
  'Tierras de Canaán',
  'Tropical',
  'Un Solo Pueblo (1 y 2)',
  'Unidos y Activos',
  'Urbanización Ana María Campos',
  'Urbanización Araguaney',
  'Urbanización Bella Vista',
  'Urbanización El Bosque',
  'Urbanización El Oasis',
  'Urbanización El Parque',
  'Urbanización El Portal',
  'Urbanización Flamingo',
  'Urbanización La Esperanza',
  'Urbanización La Floresta',
  'Urbanización Libertador',
  'Urbanización Lomas del Viento',
  'Urbanización Los Pinos',
  'Urbanización Maravilla',
  'Urbanización Paso Real',
  'Urbanización San Antonio',
  'Urbanización San Felipe',
  'Urbanización Santa Rosalía',
  'Urbanización Terrazas de Anaco',
  'Urbanización Villa Guacara',
  'Urbanización Villa Real',
  'Urbanización Villas de Anaco',
  'Urbanización Virgen del Valle',
  'Urbanización Vista Alegre',
  'Valle Lindo',
  'Valle Verde (Sectores 1, 2 y 3)',
  'Vencedores de la Patria Nueva',
  'Vidalia Figueroa',
  'Viento Fresco',
  'Villa Betania',
  'Villa Hermosa',
  'Vivir y Vencer',
  'Otro',
];

const cleanStr = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Mapa de corrección directa para variantes históricas conocidas
const MAPA_ALIAS_DIRECTO: Record<string, string> = {
  inavi: 'Inavi',
  inavis: 'Inavi',
  'sector inavi': 'Inavi',
  'sector inavis': 'Inavi',
  'ali primera': 'Alí Primera',
  'sector ali primera': 'Alí Primera',
  'san rafael': 'San Rafael',
  'sector san rafael': 'San Rafael',
  'la esperanza': 'La Esperanza',
  'sector la esperanza': 'La Esperanza',
  'san simon': 'San Simón',
  'sector san simon': 'San Simón',
  flamingo: 'Urbanización Flamingo',
  'sector flamingo': 'Urbanización Flamingo',
  terraplen: 'Terraplén',
  'sector terraplen': 'Terraplén',
  'viento fresco': 'Viento Fresco',
  'sector viento fresco': 'Viento Fresco',
};

/**
 * Normaliza cualquier texto de sector al nombre canónico oficial de la lista maestra
 */
export function normalizarSectorCenso(rawSector?: string | null): string {
  if (!rawSector) return 'Sector No Especificado';
  const trimmed = rawSector.trim();
  if (!trimmed) return 'Sector No Especificado';

  const normalized = cleanStr(trimmed);

  // 1. Coincidencia directa en mapa de alias
  if (MAPA_ALIAS_DIRECTO[normalized]) {
    return MAPA_ALIAS_DIRECTO[normalized];
  }

  // 2. Si empieza con "sector " o "urb " o "urbanizacion ", remover el prefijo para buscar
  const sinPrefijo = normalized
    .replace(/^sector\s+/i, '')
    .replace(/^urb\.?\s+/i, '')
    .replace(/^urbanizacion\s+/i, '')
    .trim();

  if (MAPA_ALIAS_DIRECTO[sinPrefijo]) {
    return MAPA_ALIAS_DIRECTO[sinPrefijo];
  }

  // 3. Buscar coincidencia exacta en la lista oficial
  for (const oficial of SECTORES_ANACO) {
    const ofClean = cleanStr(oficial);
    if (ofClean === normalized || ofClean === sinPrefijo) {
      return oficial;
    }
  }

  return trimmed;
}
