/**
 * Utilidad para generar URLs de Google Maps
 */

export interface MapUrlOptions {
  ubicacion?: string;
  latitud?: string;
  longitud?: string;
  ciudad?: string;
  distrito?: string;
}

export class GoogleMapsHelper {
  
  /**
   * Genera una URL de Google Maps basada en la información disponible
   * Prioriza coordenadas > ubicación completa > ciudad + distrito
   */
  static generateMapUrl(options: MapUrlOptions): string | null {
    const { ubicacion, latitud, longitud, ciudad, distrito } = options;
    
    // Si tenemos coordenadas, usar esas (más preciso)
    if (latitud && longitud) {
      return `https://www.google.com/maps?q=${latitud},${longitud}`;
    }
    
    // Si tenemos ubicación específica, usarla
    if (ubicacion && ubicacion.trim()) {
      const encodedLocation = encodeURIComponent(ubicacion.trim());
      return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    }
    
    // Si tenemos ciudad y distrito, combinar
    if (ciudad || distrito) {
      const locationParts = [];
      if (distrito && distrito.trim()) locationParts.push(distrito.trim());
      if (ciudad && ciudad.trim()) locationParts.push(ciudad.trim());
      
      if (locationParts.length > 0) {
        const encodedLocation = encodeURIComponent(locationParts.join(', '));
        return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
      }
    }
    
    // Si no hay información suficiente, retornar null
    return null;
  }

  /**
   * Genera una URL de Google Maps para direcciones (modo driving)
   * Útil para navegación desde el usuario al evento
   */
  static generateDirectionsUrl(destination: MapUrlOptions, origin?: string): string | null {
    const destinationUrl = this.generateMapUrl(destination);
    if (!destinationUrl) return null;
    
    // Extraer la query del destination
    let destinationQuery = '';
    
    if (destination.latitud && destination.longitud) {
      destinationQuery = `${destination.latitud},${destination.longitud}`;
    } else if (destination.ubicacion) {
      destinationQuery = encodeURIComponent(destination.ubicacion);
    } else if (destination.ciudad || destination.distrito) {
      const locationParts = [];
      if (destination.distrito) locationParts.push(destination.distrito);
      if (destination.ciudad) locationParts.push(destination.ciudad);
      destinationQuery = encodeURIComponent(locationParts.join(', '));
    }
    
    if (!destinationQuery) return null;
    
    if (origin) {
      const encodedOrigin = encodeURIComponent(origin);
      return `https://www.google.com/maps/dir/?api=1&origin=${encodedOrigin}&destination=${destinationQuery}`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;
    }
  }

  /**
   * Valida si una URL es una URL válida de Google Maps
   */
  static isValidGoogleMapsUrl(url: string): boolean {
    if (!url) return false;
    
    const googleMapsPatterns = [
      /^https:\/\/www\.google\.com\/maps/,
      /^https:\/\/maps\.google\.com/,
      /^https:\/\/goo\.gl\/maps/,
      /^https:\/\/maps\.app\.goo\.gl/
    ];
    
    return googleMapsPatterns.some(pattern => pattern.test(url));
  }
}