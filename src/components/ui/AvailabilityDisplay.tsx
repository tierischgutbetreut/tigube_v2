import React from 'react';
import { Clock } from 'lucide-react';

type TimeSlot = { start: string; end: string };
type AvailabilityState = Record<string, TimeSlot[]>;

interface AvailabilityDisplayProps {
  availability?: AvailabilityState;
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

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6); // 6:00 bis 19:00

function AvailabilityDisplay({ availability = {}, className = '' }: AvailabilityDisplayProps) {
  // Konvertiere Verfügbarkeitsdaten falls sie im Database-Format (string[]) vorliegen
  const convertDbAvailability = (dbAvailability: any): AvailabilityState => {
    if (!dbAvailability || typeof dbAvailability !== 'object') {
      return {};
    }
    
    const converted: AvailabilityState = {};
    
    for (const [day, slots] of Object.entries(dbAvailability)) {
      if (Array.isArray(slots)) {
        converted[day] = slots
          .filter((slot: any) => typeof slot === 'string' && slot.includes('-'))
          .map((slot: string) => {
            const [start, end] = slot.split('-');
            return { start: start.trim(), end: end.trim() };
          })
          .filter(slot => slot.start && slot.end);
      }
    }
    
    return converted;
  };

  // Konvertiere Verfügbarkeitsdaten falls nötig
  const normalizedAvailability = (() => {
    // Prüfe ob es schon im richtigen Format ist (TimeSlot[])
    const firstDay = Object.values(availability)[0];
    if (Array.isArray(firstDay) && firstDay.length > 0 && typeof firstDay[0] === 'object' && 'start' in firstDay[0]) {
      return availability as AvailabilityState;
    }
    
    // Konvertiere aus Database-Format
    return convertDbAvailability(availability);
  })();

  // Hilfsfunktion: Prüft ob eine bestimmte Stunde verfügbar ist
  const isHourAvailable = (day: string, hour: number): boolean => {
    const daySlots = normalizedAvailability[day] || [];
    
    return daySlots.some(slot => {
      const startHour = parseInt(slot.start.split(':')[0]);
      const endHour = parseInt(slot.end.split(':')[0]);
      const startMinute = parseInt(slot.start.split(':')[1]);
      const endMinute = parseInt(slot.end.split(':')[1]);
      
      // Konvertiere zu Dezimalstunden für präzisen Vergleich
      const startDecimal = startHour + startMinute / 60;
      const endDecimal = endHour + endMinute / 60;
      
      return hour >= startDecimal && hour < endDecimal;
    });
  };

  // Prüfe ob überhaupt Verfügbarkeit vorhanden ist
  const hasAnyAvailability = Object.values(normalizedAvailability).some(slots => slots.length > 0);

  if (!hasAnyAvailability) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm ${className}`}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-500" />
          Verfügbarkeit
        </h2>
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Keine Verfügbarkeit hinterlegt</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm ${className}`}>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary-500" />
        Verfügbarkeit
      </h2>
      
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Grid Container */}
          <div className="grid grid-cols-8 gap-1">
            {/* Header: Leere Ecke + Wochentage */}
            <div className="text-xs font-medium text-gray-600 text-center py-2">
              Zeit
            </div>
            {DAYS.map(day => (
              <div key={day.key} className="text-xs font-medium text-gray-600 text-center py-2">
                {day.label}
              </div>
            ))}
            
            {/* Stundenzeilen */}
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                {/* Stunden-Label (Y-Achse) */}
                <div className="text-xs text-gray-600 text-right pr-2 py-1 flex items-center justify-end">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                
                {/* Verfügbarkeits-Blöcke für jeden Tag */}
                {DAYS.map(day => {
                  const isAvailable = isHourAvailable(day.key, hour);
                  return (
                    <div
                      key={`${day.key}-${hour}`}
                      className={`h-8 rounded border ${
                        isAvailable
                          ? 'bg-primary-500 border-primary-600 shadow-sm'
                          : 'bg-gray-100 border-gray-200'
                      } transition-colors`}
                      title={
                        isAvailable
                          ? `Verfügbar: ${day.label} ${hour}:00`
                          : `Nicht verfügbar: ${day.label} ${hour}:00`
                      }
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legende */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary-500 rounded border border-primary-600"></div>
          <span>Verfügbar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded border border-gray-200"></div>
          <span>Nicht verfügbar</span>
        </div>
      </div>
      
      {/* Hinweis */}
      <div className="mt-3 text-xs text-gray-500">
        Zeiten sind Richtwerte. Bitte kontaktieren Sie für genaue Verfügbarkeit.
      </div>
    </div>
  );
}

export default AvailabilityDisplay; 