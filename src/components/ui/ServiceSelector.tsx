import React, { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';

interface ServiceSelectorProps {
  title: string;
  description?: string;
  predefinedServices: string[];
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
  placeholder?: string;
}

function ServiceSelector({
  title,
  description,
  predefinedServices,
  selectedServices,
  onServicesChange,
  placeholder = "Weitere Leistung hinzufügen..."
}: ServiceSelectorProps) {
  const [customInput, setCustomInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  const togglePredefinedService = (service: string) => {
    if (selectedServices.includes(service)) {
      onServicesChange(selectedServices.filter(s => s !== service));
    } else {
      onServicesChange([...selectedServices, service]);
    }
  };

  const addCustomService = () => {
    if (customInput.trim() && !selectedServices.includes(customInput.trim())) {
      onServicesChange([...selectedServices, customInput.trim()]);
      setCustomInput('');
      setShowInput(false);
    }
  };

  const removeService = (service: string) => {
    onServicesChange(selectedServices.filter(s => s !== service));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomService();
    } else if (e.key === 'Escape') {
      setCustomInput('');
      setShowInput(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-3">{description}</p>
      )}
      
      {/* Vordefinierte Services als Checkboxen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {predefinedServices.map(service => (
          <label key={service} className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" 
              checked={selectedServices.includes(service)} 
              onChange={() => togglePredefinedService(service)} 
            />
            <span className="ml-3 text-gray-700">{service}</span>
          </label>
        ))}
      </div>

      {/* Nur benutzerdefinierte Services als Badges anzeigen */}
      {selectedServices.filter(service => !predefinedServices.includes(service)).length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Weitere Leistungen:</p>
          <div className="flex flex-wrap gap-2">
            {selectedServices
              .filter(service => !predefinedServices.includes(service))
              .map(service => (
                <Badge
                  key={service}
                  variant="primary"
                  removable
                  onRemove={() => removeService(service)}
                >
                  {service}
                </Badge>
              ))}
          </div>
        </div>
      )}

      {/* Custom Service hinzufügen */}
      <div className="border-t pt-4">
        {!showInput ? (
          <Button
            variant="ghost"
            onClick={() => setShowInput(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="text-primary-600 hover:text-primary-700"
          >
            Weitere Leistung hinzufügen
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={placeholder}
              className="input flex-1"
              autoFocus
            />
            <button
              type="button"
              onClick={addCustomService}
              disabled={!customInput.trim()}
              className={`p-2 rounded-lg transition-colors ${
                !customInput.trim()
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-green-600 hover:bg-green-50 hover:text-green-700'
              }`}
              title="Hinzufügen"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomInput('');
                setShowInput(false);
              }}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              title="Abbrechen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceSelector; 