import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { clsx } from 'clsx';

// Verfügbare Sprachen für Tierbetreuer
const AVAILABLE_LANGUAGES = [
  'Deutsch',
  'English',
  'Français',
  'Español',
  'Italiano',
  'Nederlands',
  'Polski',
  'Русский',
  'Türkçe',
  'العربية',
  'Português',
  '中文',
  'हिन्दी',
  'Dansk',
  'Svenska',
  'Norsk',
  'Suomi',
  'Ελληνικά',
  'Română',
  'Magyar',
  'Čeština',
  'Slovenčina',
  'Hrvatski',
  'Български',
  'Lietuvių',
  'Latviešu',
  'Eesti',
  'Slovenščina'
];

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onChange: (languages: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function LanguageSelector({ 
  selectedLanguages, 
  onChange, 
  placeholder = "Sprachen auswählen...",
  className,
  disabled = false
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');

  // Filter verfügbare Sprachen basierend auf Suchanfrage
  const filteredLanguages = AVAILABLE_LANGUAGES.filter(lang => 
    lang.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedLanguages.includes(lang)
  );

  const handleLanguageToggle = (language: string) => {
    if (selectedLanguages.includes(language)) {
      onChange(selectedLanguages.filter(l => l !== language));
    } else {
      onChange([...selectedLanguages, language]);
    }
  };

  const handleRemoveLanguage = (language: string) => {
    onChange(selectedLanguages.filter(l => l !== language));
  };

  const handleAddCustomLanguage = () => {
    if (customLanguage.trim() && !selectedLanguages.includes(customLanguage.trim())) {
      onChange([...selectedLanguages, customLanguage.trim()]);
      setCustomLanguage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (customLanguage.trim()) {
        handleAddCustomLanguage();
      }
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={clsx("relative", className)}>
      {/* Selected Languages Display */}
      <div 
        className={clsx(
          "min-h-[2.75rem] border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-pointer",
          "focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500",
          disabled && "bg-gray-50 cursor-not-allowed",
          selectedLanguages.length === 0 && "text-gray-500"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedLanguages.length === 0 ? (
          <span>{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedLanguages.map((language) => (
              <span
                key={language}
                className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-sm"
              >
                {language}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLanguage(language);
                    }}
                    className="hover:bg-primary-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Sprache suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>

          {/* Language Options */}
          <div className="max-h-40 overflow-y-auto">
            {filteredLanguages.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => handleLanguageToggle(language)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between group"
              >
                <span className="text-sm">{language}</span>
                <Check className="w-4 h-4 text-primary-600 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
            
            {filteredLanguages.length === 0 && searchQuery && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Keine passende Sprache gefunden
              </div>
            )}
          </div>

          {/* Custom Language Input */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Andere Sprache hinzufügen..."
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                onKeyDown={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={handleAddCustomLanguage}
                disabled={!customLanguage.trim()}
                className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Close Button */}
          <div className="p-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default LanguageSelector; 