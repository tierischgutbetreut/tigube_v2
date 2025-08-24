import React from 'react';
import { Moon } from 'lucide-react';

interface OvernightAvailabilitySelectorProps {
  overnightAvailability: Record<string, boolean>;
  onOvernightAvailabilityChange: (availability: Record<string, boolean>) => void;
  disabled?: boolean;
}

const DAYS = [
  { key: 'Mo', label: 'Montag' },
  { key: 'Di', label: 'Dienstag' },
  { key: 'Mi', label: 'Mittwoch' },
  { key: 'Do', label: 'Donnerstag' },
  { key: 'Fr', label: 'Freitag' },
  { key: 'Sa', label: 'Samstag' },
  { key: 'So', label: 'Sonntag' },
];

export default function OvernightAvailabilitySelector({
  overnightAvailability,
  onOvernightAvailabilityChange,
  disabled = false
}: OvernightAvailabilitySelectorProps) {
  
  const handleDayToggle = (day: string) => {
    if (disabled) return;
    
    const newAvailability = {
      ...overnightAvailability,
      [day]: !overnightAvailability[day]
    };
    // Sofort lokalen State aktualisieren
    onOvernightAvailabilityChange(newAvailability);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    const newAvailability: Record<string, boolean> = {};
    DAYS.forEach(day => {
      newAvailability[day.key] = true;
    });
    onOvernightAvailabilityChange(newAvailability);
  };

  const handleSelectNone = () => {
    if (disabled) return;
    
    const newAvailability: Record<string, boolean> = {};
    DAYS.forEach(day => {
      newAvailability[day.key] = false;
    });
    onOvernightAvailabilityChange(newAvailability);
  };

  const selectedDays = DAYS.filter(day => overnightAvailability[day.key]);
  const hasAnyOvernight = selectedDays.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Übernachtungen</h3>
        </div>
        
        {!disabled && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Alle auswählen
            </button>
            <button
              type="button"
              onClick={handleSelectNone}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Keine
            </button>
          </div>
        )}
      </div>

      {/* Info Text */}
      <p className="text-sm text-gray-600">
        Wähle die Tage aus, an denen du Übernachtungen anbietest. 
        Dies wird in deinem Profil angezeigt und hilft Tierbesitzern bei der Suche.
      </p>

      {/* Day Checkboxes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {DAYS.map(day => (
          <label
            key={day.key}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all min-h-[48px] ${
              overnightAvailability[day.key]
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={overnightAvailability[day.key]}
              onChange={() => handleDayToggle(day.key)}
              disabled={disabled}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              overnightAvailability[day.key]
                ? 'border-green-500 bg-green-500'
                : 'border-gray-300 bg-white'
            }`}>
              {overnightAvailability[day.key] && (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="font-medium text-sm truncate">{day.label}</span>
          </label>
        ))}
      </div>

      {/* Summary */}
      {hasAnyOvernight && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700">
            <Moon className="h-4 w-4" />
            <span className="font-medium">
              Übernachtungen verfügbar: {selectedDays.map(day => day.label).join(', ')}
            </span>
          </div>
        </div>
      )}

      {!hasAnyOvernight && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Moon className="h-4 w-4" />
            <span>Keine Übernachtungen ausgewählt</span>
          </div>
        </div>
      )}
    </div>
  );
}
