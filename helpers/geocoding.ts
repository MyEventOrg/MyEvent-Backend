/**
 * Servicio de geocodificación usando Strategy + Factory Pattern
 * Optimizado para extraer información de ubicación de manera eficiente
 */

export interface LocationData {
  ubicacion?: string;
  ciudad?: string;
  distrito?: string;
}

export interface ExtractionResult {
  distrito: string | null;
  ciudad: string;
}

export enum Region {
  LIMA = 'lima',
  CALLAO = 'callao'
}

// Configuración optimizada con Maps para búsquedas O(1)
const DISTRICTS_CONFIG = {
  [Region.LIMA]: new Map([
    ['miraflores', 'Miraflores'],
    ['san isidro', 'San Isidro'],
    ['surco', 'Santiago de Surco'],
    ['santiago de surco', 'Santiago de Surco'],
    ['surquillo', 'Surquillo'],
    ['la molina', 'La Molina'],
    ['san borja', 'San Borja'],
    ['barranco', 'Barranco'],
    ['chorrillos', 'Chorrillos'],
    ['magdalena', 'Magdalena del Mar'],
    ['magdalena del mar', 'Magdalena del Mar'],
    ['jesús maría', 'Jesús María'],
    ['jesus maria', 'Jesús María'],
    ['lince', 'Lince'],
    ['pueblo libre', 'Pueblo Libre'],
    ['san miguel', 'San Miguel'],
    ['los olivos', 'Los Olivos'],
    ['san martín de porres', 'San Martín de Porres'],
    ['san martin de porres', 'San Martín de Porres'],
    ['smp', 'San Martín de Porres'],
    ['independencia', 'Independencia'],
    ['comas', 'Comas'],
    ['carabayllo', 'Carabayllo'],
    ['puente piedra', 'Puente Piedra'],
    ['san juan de lurigancho', 'San Juan de Lurigancho'],
    ['sjl', 'San Juan de Lurigancho'],
    ['el agustino', 'El Agustino'],
    ['santa anita', 'Santa Anita'],
    ['ate', 'Ate'],
    ['ate vitarte', 'Ate'],
    ['la victoria', 'La Victoria'],
    ['cercado de lima', 'Cercado de Lima'],
    ['cercado', 'Cercado de Lima'],
    ['lima centro', 'Cercado de Lima'],
    ['rimac', 'Rímac'],
    ['rímac', 'Rímac'],
    ['breña', 'Breña'],
    ['san juan de miraflores', 'San Juan de Miraflores'],
    ['sjm', 'San Juan de Miraflores'],
    ['villa maría del triunfo', 'Villa María del Triunfo'],
    ['villa maria del triunfo', 'Villa María del Triunfo'],
    ['vmt', 'Villa María del Triunfo'],
    ['villa el salvador', 'Villa El Salvador'],
    ['ves', 'Villa El Salvador'],
    ['pachacamac', 'Pachacamac'],
    ['lurín', 'Lurín'],
    ['lurin', 'Lurín']
  ]),
  
  [Region.CALLAO]: new Map([
    ['callao', 'Callao'],
    ['bellavista', 'Bellavista'],
    ['carmen de la legua reynoso', 'Carmen de la Legua Reynoso'],
    ['la perla', 'La Perla'],
    ['la punta', 'La Punta'],
    ['mi perú', 'Mi Perú'],
    ['ventanilla', 'Ventanilla']
  ])
} as const;

// Strategy Pattern: Interface para extractores de región
interface RegionExtractor {
  extractDistrict(text: string): string | null;
  getCityName(): string;
  getDistrictsMap(): Map<string, string>;
}

// Concrete Strategy: Extractor para Lima
class LimaExtractor implements RegionExtractor {
  extractDistrict(text: string): string | null {
    const normalizedText = text.toLowerCase().trim();
    
    for (const [key, value] of DISTRICTS_CONFIG[Region.LIMA]) {
      if (normalizedText.includes(key)) {
        return value;
      }
    }
    return null;
  }

  getCityName(): string {
    return 'Lima';
  }

  getDistrictsMap(): Map<string, string> {
    return DISTRICTS_CONFIG[Region.LIMA];
  }
}

// Concrete Strategy: Extractor para Callao
class CallaoExtractor implements RegionExtractor {
  extractDistrict(text: string): string | null {
    const normalizedText = text.toLowerCase().trim();
    
    for (const [key, value] of DISTRICTS_CONFIG[Region.CALLAO]) {
      if (normalizedText.includes(key)) {
        return value;
      }
    }
    return null;
  }

  getCityName(): string {
    return 'Callao';
  }

  getDistrictsMap(): Map<string, string> {
    return DISTRICTS_CONFIG[Region.CALLAO];
  }
}

// Factory Pattern: Crear extractores específicos
class RegionExtractorFactory {
  private static extractors = new Map<Region, RegionExtractor>([
    [Region.LIMA, new LimaExtractor()],
    [Region.CALLAO, new CallaoExtractor()]
  ]);

  static createExtractor(region: Region): RegionExtractor {
    const extractor = this.extractors.get(region);
    if (!extractor) {
      throw new Error(`Extractor no encontrado para región: ${region}`);
    }
    return extractor;
  }

  static getAllExtractors(): RegionExtractor[] {
    return Array.from(this.extractors.values());
  }
}

// Utility class: Métodos helper para procesamiento de texto
class GeocodingUtils {
  static normalizeText(text?: string): string {
    return (text || '').toLowerCase().trim();
  }

  static hasValidDistrict(distrito?: string): boolean {
    return !!(distrito && distrito.trim());
  }

  static findBestMatch(text: string, extractors: RegionExtractor[]): ExtractionResult {
    for (const extractor of extractors) {
      const district = extractor.extractDistrict(text);
      if (district) {
        return {
          distrito: district,
          ciudad: extractor.getCityName()
        };
      }
    }
    
    // Default fallback
    return {
      distrito: null,
      ciudad: 'Lima'
    };
  }
}

// Context class: Usa las estrategias a través del Factory
export class GeocodingService {
  /**
   * Extrae distrito usando Strategy Pattern con optimización de rendimiento
   */
  static extractDistrito(locationData: LocationData): string | null {
    // Early return si ya tiene distrito válido
    if (GeocodingUtils.hasValidDistrict(locationData.distrito)) {
      return locationData.distrito!.trim();
    }

    // Si no hay ubicación, no se puede extraer
    if (!locationData.ubicacion) {
      return null;
    }

    const normalizedText = GeocodingUtils.normalizeText(locationData.ubicacion);
    const extractors = RegionExtractorFactory.getAllExtractors();
    
    // Buscar en todas las regiones usando strategies
    for (const extractor of extractors) {
      const district = extractor.extractDistrict(normalizedText);
      if (district) {
        return district;
      }
    }

    return null;
  }

  /**
   * Extrae ciudad usando Strategy Pattern
   */
  static extractCiudad(ubicacion: string, distrito?: string): string {
    if (!ubicacion && !distrito) {
      return 'Lima'; // Default fallback
    }

    const extractors = RegionExtractorFactory.getAllExtractors();
    
    // Priorizar búsqueda por distrito si existe
    if (distrito) {
      const normalizedDistrict = GeocodingUtils.normalizeText(distrito);
      
      for (const extractor of extractors) {
        const districtsMap = extractor.getDistrictsMap();
        // Verificar si el distrito pertenece a esta región
        for (const [key, value] of districtsMap) {
          if (normalizedDistrict.includes(key) || value.toLowerCase() === normalizedDistrict) {
            return extractor.getCityName();
          }
        }
      }
    }

    // Buscar por ubicación si no se encontró por distrito
    if (ubicacion) {
      const result = GeocodingUtils.findBestMatch(ubicacion, extractors);
      return result.ciudad;
    }

    return 'Lima'; // Default fallback
  }

  /**
   * Extrae información completa de ubicación (distrito + ciudad)
   */
  static extractLocationInfo(locationData: LocationData): ExtractionResult {
    const distrito = this.extractDistrito(locationData);
    const ciudad = this.extractCiudad(locationData.ubicacion || '', distrito || undefined);
    
    return {
      distrito,
      ciudad
    };
  }

  /**
   * Obtiene todos los distritos disponibles por región
   */
  static getAvailableDistricts(): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    
    for (const region of Object.values(Region)) {
      const extractor = RegionExtractorFactory.createExtractor(region);
      const districts = Array.from(extractor.getDistrictsMap().values());
      result[extractor.getCityName()] = districts.sort();
    }
    
    return result;
  }
}