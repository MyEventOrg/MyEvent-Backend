/**
 * Servicio de Google Maps usando Strategy + Factory + Builder Pattern
 * Optimizado para generar URLs de manera eficiente y escalable
 */

// Types e interfaces
export interface MapUrlOptions {
  ubicacion?: string;
  latitud?: string;
  longitud?: string;
  ciudad?: string;
  distrito?: string;
}

export interface MapUrlResult {
  url: string | null;
  type: UrlType;
  isValid: boolean;
}

export enum UrlType {
  COORDINATES = 'coordinates',
  LOCATION = 'location',
  COMBINED = 'combined',
  DIRECTIONS = 'directions'
}

export enum MapMode {
  SEARCH = 'search',
  DIRECTIONS = 'directions',
  EMBED = 'embed'
}

// Strategy Pattern - Interface para diferentes estrategias de generación de URLs
export interface UrlGeneratorStrategy {
  canHandle(options: MapUrlOptions): boolean;
  generateUrl(options: MapUrlOptions): string | null;
  getUrlType(): UrlType;
  getPriority(): number;
}

// Estrategias concretas
export class CoordinatesUrlStrategy implements UrlGeneratorStrategy {
  canHandle(options: MapUrlOptions): boolean {
    return !!(options.latitud && options.longitud);
  }

  generateUrl(options: MapUrlOptions): string | null {
    if (!this.canHandle(options)) return null;
    
    const { latitud, longitud } = options;
    return `https://www.google.com/maps?q=${latitud},${longitud}`;
  }

  getUrlType(): UrlType {
    return UrlType.COORDINATES;
  }

  getPriority(): number {
    return 1; // Máxima prioridad (más preciso)
  }
}

export class LocationUrlStrategy implements UrlGeneratorStrategy {
  canHandle(options: MapUrlOptions): boolean {
    return !!(options.ubicacion && options.ubicacion.trim());
  }

  generateUrl(options: MapUrlOptions): string | null {
    if (!this.canHandle(options)) return null;
    
    const encodedLocation = encodeURIComponent(options.ubicacion!.trim());
    return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  }

  getUrlType(): UrlType {
    return UrlType.LOCATION;
  }

  getPriority(): number {
    return 2; // Segunda prioridad
  }
}

export class CombinedLocationUrlStrategy implements UrlGeneratorStrategy {
  canHandle(options: MapUrlOptions): boolean {
    return !!(options.ciudad || options.distrito);
  }

  generateUrl(options: MapUrlOptions): string | null {
    if (!this.canHandle(options)) return null;
    
    const locationParts = GoogleMapsUtils.buildLocationParts(options);
    if (locationParts.length === 0) return null;
    
    const encodedLocation = encodeURIComponent(locationParts.join(', '));
    return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
  }

  getUrlType(): UrlType {
    return UrlType.COMBINED;
  }

  getPriority(): number {
    return 3; // Menor prioridad
  }
}

// Factory Pattern - gestiona las estrategias de generación
export class UrlGeneratorFactory {
  private static strategies: Map<UrlType, UrlGeneratorStrategy> = new Map([
    [UrlType.COORDINATES, new CoordinatesUrlStrategy()],
    [UrlType.LOCATION, new LocationUrlStrategy()],
    [UrlType.COMBINED, new CombinedLocationUrlStrategy()]
  ]);

  static getStrategy(type: UrlType): UrlGeneratorStrategy | null {
    return this.strategies.get(type) || null;
  }

  static getAllStrategies(): UrlGeneratorStrategy[] {
    return Array.from(this.strategies.values())
      .sort((a, b) => a.getPriority() - b.getPriority());
  }

  static getBestStrategy(options: MapUrlOptions): UrlGeneratorStrategy | null {
    const strategies = this.getAllStrategies();
    
    for (const strategy of strategies) {
      if (strategy.canHandle(options)) {
        return strategy;
      }
    }
    
    return null;
  }

  static addStrategy(type: UrlType, strategy: UrlGeneratorStrategy): void {
    this.strategies.set(type, strategy);
  }
}

// Builder Pattern: Para construcción de URLs complejas
export class MapUrlBuilder {
  private options: MapUrlOptions = {};
  private mode: MapMode = MapMode.SEARCH;
  private origin?: string;

  setCoordinates(latitud: string, longitud: string): MapUrlBuilder {
    this.options.latitud = latitud;
    this.options.longitud = longitud;
    return this;
  }

  setLocation(ubicacion: string): MapUrlBuilder {
    this.options.ubicacion = ubicacion;
    return this;
  }

  setCityAndDistrict(ciudad: string, distrito?: string): MapUrlBuilder {
    this.options.ciudad = ciudad;
    if (distrito) this.options.distrito = distrito;
    return this;
  }

  setMode(mode: MapMode): MapUrlBuilder {
    this.mode = mode;
    return this;
  }

  setOrigin(origin: string): MapUrlBuilder {
    this.origin = origin;
    return this;
  }

  build(): MapUrlResult {
    if (this.mode === MapMode.DIRECTIONS) {
      return this.buildDirectionsUrl();
    }
    
    const strategy = UrlGeneratorFactory.getBestStrategy(this.options);
    if (!strategy) {
      return {
        url: null,
        type: UrlType.LOCATION,
        isValid: false
      };
    }

    const url = strategy.generateUrl(this.options);
    return {
      url,
      type: strategy.getUrlType(),
      isValid: !!url
    };
  }

  private buildDirectionsUrl(): MapUrlResult {
    const destinationQuery = GoogleMapsUtils.extractDestinationQuery(this.options);
    
    if (!destinationQuery) {
      return {
        url: null,
        type: UrlType.DIRECTIONS,
        isValid: false
      };
    }

    let url: string;
    if (this.origin) {
      const encodedOrigin = encodeURIComponent(this.origin);
      url = `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${destinationQuery}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;
    }

    return {
      url,
      type: UrlType.DIRECTIONS,
      isValid: true
    };
  }
}

// Utility class: Operaciones comunes y validaciones
export class GoogleMapsUtils {
  // Patrones de validación optimizados con Map para O(1)
  private static readonly VALIDATION_PATTERNS = new Map([
    ['google_maps', /^https:\/\/www\.google\.com\/maps/],
    ['maps_google', /^https:\/\/maps\.google\.com/],
    ['goo_gl', /^https:\/\/goo\.gl\/maps/],
    ['maps_app', /^https:\/\/maps\.app\.goo\.gl/]
  ]);

  static isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    for (const pattern of this.VALIDATION_PATTERNS.values()) {
      if (pattern.test(url)) return true;
    }
    
    return false;
  }

  static buildLocationParts(options: MapUrlOptions): string[] {
    const parts: string[] = [];
    
    if (options.distrito && options.distrito.trim()) {
      parts.push(options.distrito.trim());
    }
    
    if (options.ciudad && options.ciudad.trim()) {
      parts.push(options.ciudad.trim());
    }
    
    return parts;
  }

  static extractDestinationQuery(options: MapUrlOptions): string | null {
    if (options.latitud && options.longitud) {
      return `${options.latitud},${options.longitud}`;
    }
    
    if (options.ubicacion && options.ubicacion.trim()) {
      return encodeURIComponent(options.ubicacion.trim());
    }
    
    const locationParts = this.buildLocationParts(options);
    if (locationParts.length > 0) {
      return encodeURIComponent(locationParts.join(', '));
    }
    
    return null;
  }

  static validateMapOptions(options: MapUrlOptions): boolean {
    return !!(options.latitud && options.longitud) ||
           !!(options.ubicacion && options.ubicacion.trim()) ||
           !!(options.ciudad || options.distrito);
  }
}

// Context class: API principal que usa las estrategias
export class GoogleMapsService {
  /*
    Genera una URL de Google Maps usando Strategy Pattern
   */
  static generateMapUrl(options: MapUrlOptions): string | null {
    const strategy = UrlGeneratorFactory.getBestStrategy(options);
    return strategy ? strategy.generateUrl(options) : null;
  }

  /*
    Genera una URL con información detallada usando Builder Pattern
   */
  static generateDetailedMapUrl(options: MapUrlOptions): MapUrlResult {
    return new MapUrlBuilder()
      .setCoordinates(options.latitud || '', options.longitud || '')
      .setLocation(options.ubicacion || '')
      .setCityAndDistrict(options.ciudad || '', options.distrito)
      .build();
  }

  /*
   Genera una URL para direcciones
   */
  static generateDirectionsUrl(destination: MapUrlOptions, origin?: string): string | null {
    const result = new MapUrlBuilder()
      .setCoordinates(destination.latitud || '', destination.longitud || '')
      .setLocation(destination.ubicacion || '')
      .setCityAndDistrict(destination.ciudad || '', destination.distrito)
      .setMode(MapMode.DIRECTIONS)
      .setOrigin(origin || '')
      .build();
    
    return result.url;
  }

  /*
    Valida si una URL es válida de Google Maps
   */
  static isValidGoogleMapsUrl(url: string): boolean {
    return GoogleMapsUtils.isValidUrl(url);
  }

  /*
   Obtiene información sobre los tipos de URL disponibles
   */
  static getAvailableUrlTypes(): UrlType[] {
    return Object.values(UrlType);
  }

  /*
   Valida las opciones de mapa antes de generar URL
   */
  static validateOptions(options: MapUrlOptions): boolean {
    return GoogleMapsUtils.validateMapOptions(options);
  }
}

// Compatibility layer: Mantiene la API anterior
export class GoogleMapsHelper {
  /**
    @deprecated 
   */
  static generateMapUrl(options: MapUrlOptions): string | null {
    return GoogleMapsService.generateMapUrl(options);
  }

  /**
    @deprecated 
   */
  static generateDirectionsUrl(destination: MapUrlOptions, origin?: string): string | null {
    return GoogleMapsService.generateDirectionsUrl(destination, origin);
  }

  /**
   @deprecated 
   */
  static isValidGoogleMapsUrl(url: string): boolean {
    return GoogleMapsService.isValidGoogleMapsUrl(url);
  }
}