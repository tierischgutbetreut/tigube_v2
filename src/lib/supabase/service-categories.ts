export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface CategorizedService {
  name: string;
  category_id: number;
  category_name: string;
}

export const DEFAULT_SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 1, name: 'Gassi gehen', description: 'Spaziergänge und Auslauf für Hunde' },
  { id: 2, name: 'Tierbetreuung zu Hause', description: 'Betreuung in der gewohnten Umgebung des Tieres' },
  { id: 3, name: 'Tierbetreuung beim Betreuer', description: 'Aufnahme des Tieres im Zuhause des Betreuers' },
  { id: 4, name: 'Tagesbetreuung', description: 'Ganztägige Betreuung während der Arbeitszeit' },
  { id: 5, name: 'Tierarztbesuche', description: 'Begleitung zu Tierarztterminen' },
  { id: 6, name: 'Tierpflege', description: 'Fellpflege, Baden und allgemeine Hygiene' },
  { id: 7, name: 'Training', description: 'Erziehung und Verhaltensschulung' },
  { id: 8, name: 'Allgemein', description: 'Sonstige Dienstleistungen' }
];

export class ServiceUtils {
  /**
   * Konvertiert ein String-Array von Services zu kategorisierten Services
   * Alle Services werden der Kategorie "Allgemein" (ID 8) zugeordnet
   */
  static migrateStringArrayToCategories(services: string[]): CategorizedService[] {
    return services.map(service => ({
      name: service,
      category_id: 8, // Allgemein
      category_name: 'Allgemein'
    }));
  }

  /**
   * Extrahiert Service-Namen aus kategorisierten Services für Rückwärtskompatibilität
   */
  static extractServiceNames(categorizedServices: CategorizedService[]): string[] {
    return categorizedServices.map(service => service.name);
  }

  /**
   * Gruppiert kategorisierte Services nach Kategorien
   */
  static groupServicesByCategory(services: CategorizedService[]): Record<number, CategorizedService[]> {
    return services.reduce((groups, service) => {
      if (!groups[service.category_id]) {
        groups[service.category_id] = [];
      }
      groups[service.category_id].push(service);
      return groups;
    }, {} as Record<number, CategorizedService[]>);
  }

  /**
   * Findet eine Kategorie anhand ihrer ID
   */
  static getCategoryById(categoryId: number): ServiceCategory | undefined {
    return DEFAULT_SERVICE_CATEGORIES.find(cat => cat.id === categoryId);
  }

  /**
   * Prüft ob Services bereits kategorisiert sind oder als String-Array vorliegen
   */
  static isLegacyFormat(services: any): services is string[] {
    return Array.isArray(services) && 
           services.length > 0 && 
           typeof services[0] === 'string';
  }

  /**
   * Normalisiert Services - konvertiert String-Arrays zu kategorisierten Services
   */
  static normalizeServices(services: string[] | CategorizedService[]): CategorizedService[] {
    if (this.isLegacyFormat(services)) {
      return this.migrateStringArrayToCategories(services);
    }
    return services as CategorizedService[];
  }

  /**
   * Filtert Services nach Kategorie-ID
   */
  static getServicesByCategory(services: any[], categoryId: number): CategorizedService[] {
    if (!Array.isArray(services)) return [];
    
    return services.filter((service: any) => {
      // Für kategorisierte Services
      if (typeof service === 'object' && service.category_id !== undefined) {
        return service.category_id === categoryId;
      }
      // Für Legacy String-Services - alle werden als "Allgemein" (ID 8) behandelt
      if (typeof service === 'string') {
        return categoryId === 8;
      }
      return false;
    });
  }
}