import React from 'react';
import { Moon } from 'lucide-react';

interface OvernightAvailabilityDisplayProps {
  overnightAvailability?: Record<string, boolean>;
  className?: string;
}

const DAYS = [
  { key: 'Mo', label: 'Mo' },
  { key: 'Di', label: 'Di' },
  { key: 'Mi', label: 'Mi' },
  { key: 'Do', label: 'Do' },
  { key: 'Fr', label: 'Fr' },
  { key: 'Sa', label: 'Sa' },
  { key: 'So', label: 'So' },
];

export default function OvernightAvailabilityDisplay({ 
  overnightAvailability, 
  className = '' 
}: OvernightAvailabilityDisplayProps) {
  
  if (!overnightAvailability) {
    return null;
  }

  const availableDays = DAYS.filter(day => overnightAvailability[day.key]);
  const hasAnyOvernight = availableDays.length > 0;

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm ${className}`}>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Moon className="h-5 w-5 text-green-600" />
        Übernachtungen
      </h2>
      
      <div className="space-y-3">
        {hasAnyOvernight ? (
          <>
            <div className="flex items-center gap-2 text-green-700">
              <Moon className="h-4 w-4" />
              <span className="font-medium">
                Verfügbar: {availableDays.map(day => day.label).join(', ')}
              </span>
            </div>
            
            <p className="text-sm text-gray-600">
              Übernachtungen sind verfügbar an den markierten Tagen. 
              Kontaktieren Sie den Betreuer für Details zu Zeiten und Preisen.
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2 text-gray-600">
            <Moon className="h-4 w-4" />
            <span className="font-medium">
              Keine Übernachtungen verfügbar
            </span>
          </div>
        )}
        
        <div className="flex gap-1">
          {DAYS.map(day => (
            <div
              key={day.key}
              className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-xs font-medium ${
                overnightAvailability[day.key]
                  ? 'bg-green-500 border-green-600 text-white'
                  : 'bg-gray-100 border-gray-200 text-gray-400'
              }`}
              title={overnightAvailability[day.key] ? `${day.label}: Übernachtungen verfügbar` : `${day.label}: Keine Übernachtungen`}
            >
              {day.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
