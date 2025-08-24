// Service Category Types
export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Service with Category Information
export interface CategorizedService {
  name: string;
  category_id: number;
  category_name: string;
}

// Extended Caretaker Profile Types
export interface CaretakerProfileWithCategories {
  id: string;
  services: string[] | null; // Legacy field for backward compatibility
  services_with_categories: CategorizedService[] | null; // New categorized services
  animal_types: string[] | null;
  availability: any | null;
  bio: string | null;
  company_name: string | null;
  created_at: string | null;
  experience_description: string | null;
  experience_years: number | null;
  home_photos: string[] | null;
  hourly_rate: number | null;
  is_commercial: boolean | null;
  is_verified: boolean | null;
  short_term_available: boolean | null;
  languages: string[] | null;
  long_about_me: string | null;
  prices: any | null;
  qualifications: string[] | null;
  rating: number | null;
  review_count: number | null;
  service_radius: number | null;
  short_about_me: string | null;
  tax_number: string | null;
  updated_at: string | null;
  vat_id: string | null;
}

// Service Management Types for UI
export interface ServiceWithCategory {
  name: string;
  categoryId: number;
  categoryName: string;
}

export interface ServiceFormData {
  name: string;
  categoryId: number;
}

// Default Service Categories (matching database)
export const DEFAULT_SERVICE_CATEGORIES = [
  { id: 1, name: 'Ernährung', description: 'Fütterung, Diätberatung und ernährungsbezogene Leistungen' },
  { id: 2, name: 'Zubehör', description: 'Bereitstellung und Pflege von Tierzubehör' },
  { id: 3, name: 'Urlaub mit Tier', description: 'Reisebegleitung und urlaubsbezogene Betreuung' },
  { id: 4, name: 'Gesundheit', description: 'Medizinische Betreuung und Gesundheitsvorsorge' },
  { id: 5, name: 'Züchter', description: 'Zuchtberatung und züchterspezifische Dienstleistungen' },
  { id: 6, name: 'Verein', description: 'Vereinsaktivitäten und Gemeinschaftsbetreuung' },
  { id: 7, name: 'Training', description: 'Ausbildung, Erziehung und Verhaltensschulung' },
  { id: 8, name: 'Allgemein', description: 'Grundlegende Betreuungsleistungen' }
] as const;

// Helper functions for service management
export const ServiceUtils = {
  // Convert legacy string array to categorized services
  convertLegacyServices: (services: string[]): CategorizedService[] => {
    const generalCategory = DEFAULT_SERVICE_CATEGORIES.find(cat => cat.name === 'Allgemein')!;
    return services.map(service => ({
      name: service,
      category_id: generalCategory.id,
      category_name: generalCategory.name
    }));
  },

  // Extract service names from categorized services
  getServiceNames: (categorizedServices: CategorizedService[]): string[] => {
    return categorizedServices.map(service => service.name);
  },

  // Group services by category
  groupByCategory: (categorizedServices: CategorizedService[]): Record<string, CategorizedService[]> => {
    return categorizedServices.reduce((acc, service) => {
      const categoryName = service.category_name;
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(service);
      return acc;
    }, {} as Record<string, CategorizedService[]>);
  },

  // Get services for a specific category
  getServicesByCategory: (categorizedServices: CategorizedService[], categoryName: string): CategorizedService[] => {
    return categorizedServices.filter(service => service.category_name === categoryName);
  }
};

// Type guards
export const isLegacyServices = (services: any): services is string[] => {
  return Array.isArray(services) && services.every(item => typeof item === 'string');
};

export const isCategorizedServices = (services: any): services is CategorizedService[] => {
  return Array.isArray(services) && services.every(item => 
    typeof item === 'object' && 
    'name' in item && 
    'category_id' in item && 
    'category_name' in item
  );
};