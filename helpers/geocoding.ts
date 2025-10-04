/**
 * Utilidad simple para extraer distrito de ubicaciones en Lima/Perú
 */

export interface LocationData {
  ubicacion?: string;
  ciudad?: string;
  distrito?: string;
}

export class GeocodingService {
  
  // Configuración centralizada de distritos
  private static readonly DISTRITOS_CONFIG = {
    lima: [
      { nombres: ['miraflores'], distrito: 'Miraflores' },
      { nombres: ['san isidro'], distrito: 'San Isidro' },
      { nombres: ['surco', 'santiago de surco'], distrito: 'Santiago de Surco' },
      { nombres: ['surquillo'], distrito: 'Surquillo' },
      { nombres: ['la molina'], distrito: 'La Molina' },
      { nombres: ['san borja'], distrito: 'San Borja' },
      { nombres: ['barranco'], distrito: 'Barranco' },
      { nombres: ['chorrillos'], distrito: 'Chorrillos' },
      { nombres: ['magdalena', 'magdalena del mar'], distrito: 'Magdalena del Mar' },
      { nombres: ['jesús maría', 'jesus maria'], distrito: 'Jesús María' },
      { nombres: ['lince'], distrito: 'Lince' },
      { nombres: ['pueblo libre'], distrito: 'Pueblo Libre' },
      { nombres: ['san miguel'], distrito: 'San Miguel' },
      { nombres: ['los olivos'], distrito: 'Los Olivos' },
      { nombres: ['san martín de porres', 'san martin de porres', 'smp'], distrito: 'San Martín de Porres' },
      { nombres: ['independencia'], distrito: 'Independencia' },
      { nombres: ['comas'], distrito: 'Comas' },
      { nombres: ['carabayllo'], distrito: 'Carabayllo' },
      { nombres: ['puente piedra'], distrito: 'Puente Piedra' },
      { nombres: ['san juan de lurigancho', 'sjl'], distrito: 'San Juan de Lurigancho' },
      { nombres: ['el agustino'], distrito: 'El Agustino' },
      { nombres: ['santa anita'], distrito: 'Santa Anita' },
      { nombres: ['ate', 'ate vitarte'], distrito: 'Ate' },
      { nombres: ['la victoria'], distrito: 'La Victoria' },
      { nombres: ['cercado de lima', 'cercado', 'lima centro'], distrito: 'Cercado de Lima' },
      { nombres: ['rimac', 'rímac'], distrito: 'Rímac' },
      { nombres: ['breña'], distrito: 'Breña' },
      { nombres: ['san juan de miraflores', 'sjm'], distrito: 'San Juan de Miraflores' },
      { nombres: ['villa maría del triunfo', 'villa maria del triunfo', 'vmt'], distrito: 'Villa María del Triunfo' },
      { nombres: ['villa el salvador', 'ves'], distrito: 'Villa El Salvador' },
      { nombres: ['pachacamac'], distrito: 'Pachacamac' },
      { nombres: ['lurín', 'lurin'], distrito: 'Lurín' }
    ],
    callao: [
      { nombres: ['callao'], distrito: 'Callao' },
      { nombres: ['bellavista'], distrito: 'Bellavista' },
      { nombres: ['carmen de la legua reynoso'], distrito: 'Carmen de la Legua Reynoso' },
      { nombres: ['la perla'], distrito: 'La Perla' },
      { nombres: ['la punta'], distrito: 'La Punta' },
      { nombres: ['mi perú'], distrito: 'Mi Perú' },
      { nombres: ['ventanilla'], distrito: 'Ventanilla' }
    ]
  };

  /**
   * Extrae distrito automáticamente de la información de ubicación
   */
  static extractDistrito(locationData: LocationData): string | null {
    // Si ya tiene distrito, retornarlo
    if (locationData.distrito && locationData.distrito.trim()) {
      return locationData.distrito.trim();
    }

    const text = (locationData.ubicacion || '').toLowerCase();
    
    // Buscar en todos los distritos (Lima y Callao)
    const todosDistritos = [...this.DISTRITOS_CONFIG.lima, ...this.DISTRITOS_CONFIG.callao];
    
    for (const distritoInfo of todosDistritos) {
      for (const nombre of distritoInfo.nombres) {
        if (text.includes(nombre)) {
          return distritoInfo.distrito;
        }
      }
    }

    return null;
  }

  /**
   * Extrae la ciudad principal basada en el distrito y ubicación
   */
  static extractCiudad(ubicacion: string, distrito?: string): string {
    if (!ubicacion) return 'Lima';

    // Obtener nombres de distritos de Callao
    const distritosCallao = this.DISTRITOS_CONFIG.callao.flatMap(d => d.nombres);
    
    // Verificar por distrito
    if (distrito) {
      const distritoLower = distrito.toLowerCase();
      if (distritosCallao.some(d => distritoLower.includes(d))) {
        return 'Callao';
      }
    }

    // Verificar por ubicación
    const ubicacionLower = ubicacion.toLowerCase();
    if (distritosCallao.some(d => ubicacionLower.includes(d))) {
      return 'Callao';
    }

    return 'Lima';
  }
}