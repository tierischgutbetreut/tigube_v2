import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DayOption {
  value: string;
  label: string;
}

interface MultiDaySelectorProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
  options?: DayOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DEFAULT_DAY_OPTIONS: DayOption[] = [
  { value: 'montag', label: 'Montag' },
  { value: 'dienstag', label: 'Dienstag' },
  { value: 'mittwoch', label: 'Mittwoch' },
  { value: 'donnerstag', label: 'Donnerstag' },
  { value: 'freitag', label: 'Freitag' },
  { value: 'samstag', label: 'Samstag' },
  { value: 'sonntag', label: 'Sonntag' }
];

export default function MultiDaySelector({
  selectedDays,
  onDaysChange,
  options = DEFAULT_DAY_OPTIONS,
  placeholder = "Wochentage auswählen...",
  className = "",
  disabled = false
}: MultiDaySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Schließe Dropdown beim Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDayToggle = (dayValue: string) => {
    if (dayValue === 'alle') {
      // "Alle Tage" wurde ausgewählt
      onDaysChange([]);
    } else {
      // Einzelner Tag wurde ausgewählt
      const newSelectedDays = selectedDays.includes(dayValue)
        ? selectedDays.filter(day => day !== dayValue)
        : [...selectedDays, dayValue];
      onDaysChange(newSelectedDays);
    }
  };



  const getDisplayText = () => {
    if (selectedDays.length === 0) {
      return "Alle Tage";
    }
    if (selectedDays.length === 1) {
      const day = options.find(opt => opt.value === selectedDays[0]);
      return day?.label || selectedDays[0];
    }
    if (selectedDays.length === 2) {
      const day1 = options.find(opt => opt.value === selectedDays[0])?.label;
      const day2 = options.find(opt => opt.value === selectedDays[1])?.label;
      return `${day1}, ${day2}`;
    }
    return `${selectedDays.length} Tage ausgewählt`;
  };

  const isAllDaysSelected = selectedDays.length === 0;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Wochentag</label>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "hover:border-gray-400"
          )}
        >
                     <span className={selectedDays.length === 0 ? "text-gray-400" : "text-gray-900"}>
             {getDisplayText()}
           </span>
        </button>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Header mit "Alle Tage" Option */}
          <div className="p-3 border-b border-gray-200">
            <button
              type="button"
              onClick={() => handleDayToggle('alle')}
              className={cn(
                "w-full px-3 py-2 text-left rounded-md flex items-center justify-between",
                isAllDaysSelected
                  ? "bg-primary-50 text-primary-700 border border-primary-200"
                  : "hover:bg-gray-50"
              )}
            >
              <span className="font-medium">Alle Tage</span>
              {isAllDaysSelected && <Check className="w-4 h-4" />}
            </button>
          </div>

          {/* Einzelne Tage */}
          <div className="max-h-40 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleDayToggle(option.value)}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between",
                  selectedDays.includes(option.value) && "bg-primary-50 text-primary-700"
                )}
              >
                <span>{option.label}</span>
                {selectedDays.includes(option.value) && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>

          
        </div>
      )}
    </div>
  );
}
