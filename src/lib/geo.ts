/**
 * Resolución automática de País, Provincia y Comunidad Autónoma a partir del
 * nombre de una ciudad/localidad.
 *
 * Estrategia en 2 fases:
 *  1. Tabla local (instantánea, sin red) con las capitales de provincia y
 *     los municipios ya usados en la app (sobre todo Galicia/Pontevedra),
 *     todos ellos en España.
 *  2. Si la ciudad no está en la tabla local, se consulta la API pública y
 *     gratuita de geocodificación de OpenStreetMap (Nominatim) para
 *     resolverla igualmente, sin necesidad de API key — esto permite
 *     detectar también ciudades de cualquier otro país.
 *
 * Así cualquier ciudad del mundo queda cubierta, escriba lo que escriba
 * el usuario en el campo "Ciudad".
 */

const stripAccents = (value: string): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Las 17 comunidades autónomas + Ceuta y Melilla, con sus provincias.
// Dato administrativo fijo (no cambia), sirve de fuente de verdad para
// mapear "provincia" -> "comunidad autónoma".
const PROVINCE_TO_COMMUNITY: Record<string, string> = {
  ALMERIA: 'Andalucía', CADIZ: 'Andalucía', CORDOBA: 'Andalucía', GRANADA: 'Andalucía',
  HUELVA: 'Andalucía', JAEN: 'Andalucía', MALAGA: 'Andalucía', SEVILLA: 'Andalucía',
  HUESCA: 'Aragón', TERUEL: 'Aragón', ZARAGOZA: 'Aragón',
  ASTURIAS: 'Asturias',
  BALEARES: 'Islas Baleares', 'ILLES BALEARS': 'Islas Baleares', 'ISLAS BALEARES': 'Islas Baleares',
  'LAS PALMAS': 'Canarias', 'SANTA CRUZ DE TENERIFE': 'Canarias',
  CANTABRIA: 'Cantabria',
  ALBACETE: 'Castilla-La Mancha', 'CIUDAD REAL': 'Castilla-La Mancha', CUENCA: 'Castilla-La Mancha',
  GUADALAJARA: 'Castilla-La Mancha', TOLEDO: 'Castilla-La Mancha',
  AVILA: 'Castilla y León', BURGOS: 'Castilla y León', LEON: 'Castilla y León', PALENCIA: 'Castilla y León',
  SALAMANCA: 'Castilla y León', SEGOVIA: 'Castilla y León', SORIA: 'Castilla y León',
  VALLADOLID: 'Castilla y León', ZAMORA: 'Castilla y León',
  BARCELONA: 'Cataluña', GIRONA: 'Cataluña', LLEIDA: 'Cataluña', TARRAGONA: 'Cataluña',
  BADAJOZ: 'Extremadura', CACERES: 'Extremadura',
  'A CORUNA': 'Galicia', 'LA CORUNA': 'Galicia', LUGO: 'Galicia', OURENSE: 'Galicia', PONTEVEDRA: 'Galicia',
  'LA RIOJA': 'La Rioja', RIOJA: 'La Rioja',
  MADRID: 'Madrid',
  MURCIA: 'Murcia',
  NAVARRA: 'Navarra',
  ALAVA: 'País Vasco', 'ARABA/ALAVA': 'País Vasco', GIPUZKOA: 'País Vasco', GUIPUZCOA: 'País Vasco',
  BIZKAIA: 'País Vasco', VIZCAYA: 'País Vasco',
  ALICANTE: 'Valencia', CASTELLON: 'Valencia', 'CASTELLO': 'Valencia', VALENCIA: 'Valencia',
  CEUTA: 'Ceuta',
  MELILLA: 'Melilla',
};

// Comunidades uniprovinciales: el nombre de la provincia coincide (o se
// puede derivar directamente) con el de la comunidad. Útil cuando la API
// solo devuelve la comunidad autónoma pero no la provincia.
const COMMUNITY_TO_SINGLE_PROVINCE: Record<string, string> = {
  'Asturias': 'Asturias',
  'Islas Baleares': 'Illes Balears',
  'Cantabria': 'Cantabria',
  'La Rioja': 'La Rioja',
  'Madrid': 'Madrid',
  'Murcia': 'Murcia',
  'Navarra': 'Navarra',
};

// Ciudades/municipios conocidos -> provincia. Cubre las capitales de
// provincia de toda España y, con más detalle, los municipios de Galicia
// (zona principal de esta app), para resolver al instante sin llamar a la API.
const CITY_TO_PROVINCE: Record<string, string> = {
  // Pontevedra
  VIGO: 'Pontevedra', PONTEVEDRA: 'Pontevedra', CANGAS: 'Pontevedra', 'CANGAS DO MORRAZO': 'Pontevedra',
  VILAGARCIA: 'Pontevedra', 'VILAGARCIA DE AROUSA': 'Pontevedra', PORRINO: 'Pontevedra', 'O PORRINO': 'Pontevedra',
  REDONDELA: 'Pontevedra', ARBO: 'Pontevedra', TUI: 'Pontevedra', 'CALDELAS DE TUI': 'Pontevedra',
  PORTONOVO: 'Pontevedra', PONTEAREAS: 'Pontevedra', SANXENXO: 'Pontevedra', MARIN: 'Pontevedra',
  'VILANOVA DE AROUSA': 'Pontevedra', BAIONA: 'Pontevedra', NIGRAN: 'Pontevedra', GONDOMAR: 'Pontevedra',
  MOANA: 'Pontevedra', 'O GROVE': 'Pontevedra', 'A ESTRADA': 'Pontevedra', LALIN: 'Pontevedra',
  // A Coruña
  'A CORUNA': 'A Coruña', CORUNA: 'A Coruña', 'SANTIAGO DE COMPOSTELA': 'A Coruña', FERROL: 'A Coruña',
  CARBALLO: 'A Coruña', NARON: 'A Coruña', OLEIROS: 'A Coruña', CULLEREDO: 'A Coruña', ARTEIXO: 'A Coruña',
  RIBEIRA: 'A Coruña', BETANZOS: 'A Coruña',
  // Lugo
  LUGO: 'Lugo', VIVEIRO: 'Lugo', 'MONFORTE DE LEMOS': 'Lugo', SARRIA: 'Lugo', CHANTADA: 'Lugo',
  // Ourense
  OURENSE: 'Ourense', VERIN: 'Ourense', 'O CARBALLINO': 'Ourense',
  // Capitales de provincia / grandes ciudades de España
  MADRID: 'Madrid', BARCELONA: 'Barcelona', VALENCIA: 'Valencia', SEVILLA: 'Sevilla', ZARAGOZA: 'Zaragoza',
  MALAGA: 'Málaga', MURCIA: 'Murcia', PALMA: 'Illes Balears', 'PALMA DE MALLORCA': 'Illes Balears',
  'LAS PALMAS DE GRAN CANARIA': 'Las Palmas', BILBAO: 'Bizkaia', ALICANTE: 'Alicante', CORDOBA: 'Córdoba',
  VALLADOLID: 'Valladolid', GIJON: 'Asturias', VITORIA: 'Álava', 'VITORIA-GASTEIZ': 'Álava',
  GRANADA: 'Granada', ELCHE: 'Alicante', OVIEDO: 'Asturias', CARTAGENA: 'Murcia',
  'JEREZ DE LA FRONTERA': 'Cádiz', PAMPLONA: 'Navarra', ALMERIA: 'Almería', 'SAN SEBASTIAN': 'Gipuzkoa',
  DONOSTIA: 'Gipuzkoa', SANTANDER: 'Cantabria', 'CASTELLON DE LA PLANA': 'Castellón', BURGOS: 'Burgos',
  ALBACETE: 'Albacete', LOGRONO: 'La Rioja', BADAJOZ: 'Badajoz', HUELVA: 'Huelva', LLEIDA: 'Lleida',
  TARRAGONA: 'Tarragona', LEON: 'León', CADIZ: 'Cádiz', JAEN: 'Jaén', GIRONA: 'Girona', CACERES: 'Cáceres',
  GUADALAJARA: 'Guadalajara', TOLEDO: 'Toledo', AVILA: 'Ávila', SEGOVIA: 'Segovia', SORIA: 'Soria',
  CUENCA: 'Cuenca', 'CIUDAD REAL': 'Ciudad Real', PALENCIA: 'Palencia', ZAMORA: 'Zamora', TERUEL: 'Teruel',
  HUESCA: 'Huesca', CEUTA: 'Ceuta', MELILLA: 'Melilla', SALAMANCA: 'Salamanca',
};

export type GeoResolution = {
  country: string | null;
  province: string | null;
  autonomous_community: string | null;
  source: 'local' | 'api' | null;
};

const communityForProvince = (province: string): string | null =>
  PROVINCE_TO_COMMUNITY[stripAccents(province)] || null;

// Caché en memoria de la sesión para no repetir llamadas a la API por la
// misma ciudad.
const geoCache = new Map<string, GeoResolution>();

/**
 * Resuelve país, provincia y comunidad autónoma a partir del nombre de una
 * ciudad. Nunca lanza: si todo falla devuelve los 3 campos a null.
 */
export async function resolveProvinceAndCommunity(cityRaw: string): Promise<GeoResolution> {
  const city = (cityRaw || '').trim();
  if (!city) return { country: null, province: null, autonomous_community: null, source: null };

  const key = stripAccents(city);
  if (geoCache.has(key)) return geoCache.get(key)!;

  // 1. Tabla local (instantánea) — todas las ciudades de esta tabla son de España.
  const localProvince = CITY_TO_PROVINCE[key];
  if (localProvince) {
    const result: GeoResolution = {
      country: 'España',
      province: localProvince,
      autonomous_community: communityForProvince(localProvince),
      source: 'local',
    };
    geoCache.set(key, result);
    return result;
  }

  // 2. Fallback: geocodificación gratuita vía Nominatim (OpenStreetMap), sin
  //    API key. Sin restringir el país, para poder detectar también clubes
  //    de fuera de España.
  try {
    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q: city,
      format: 'jsonv2',
      addressdetails: '1',
      'accept-language': 'es',
      limit: '1',
    })}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Nominatim respondió ${response.status}`);
    const results = await response.json();
    const address = results?.[0]?.address;
    if (!address) {
      const empty: GeoResolution = { country: null, province: null, autonomous_community: null, source: null };
      geoCache.set(key, empty);
      return empty;
    }

    const country: string | null = address.country || null;
    // Provincia/Comunidad Autónoma solo aplica dentro de España.
    let province: string | null = null;
    let community: string | null = null;
    if (country === 'España') {
      community = address.state || null;
      province = address.province || address.state_district || address.county || null;
      // Si la comunidad es uniprovincial, la provincia coincide aunque la API
      // no la devuelva explícitamente.
      if (!province && community && COMMUNITY_TO_SINGLE_PROVINCE[community]) {
        province = COMMUNITY_TO_SINGLE_PROVINCE[community];
      }
    }

    const result: GeoResolution = { country, province, autonomous_community: community, source: 'api' };
    geoCache.set(key, result);
    return result;
  } catch (err) {
    console.warn('No se pudo geocodificar la ciudad', city, err);
    const empty: GeoResolution = { country: null, province: null, autonomous_community: null, source: null };
    geoCache.set(key, empty);
    return empty;
  }
}
