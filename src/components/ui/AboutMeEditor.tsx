import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AboutMeEditorProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minLength?: number;
  maxLength?: number;
  description?: string;
  required?: boolean;
}

function AboutMeEditor({
  title,
  value,
  onChange,
  placeholder,
  minLength,
  maxLength,
  description,
  required = false
}: AboutMeEditorProps) {
  const currentLength = value.length;
  const isMinValid = !minLength || currentLength >= minLength;
  const isMaxValid = !maxLength || currentLength <= maxLength;
  const isValid = isMinValid && isMaxValid;

  const getCharacterCountColor = () => {
    if (!isValid) return 'text-red-600';
    if (minLength && currentLength < minLength) return 'text-amber-600';
    if (maxLength && currentLength > maxLength * 0.9) return 'text-amber-600';
    return 'text-green-600';
  };

  const getValidationMessage = () => {
    if (maxLength && currentLength > maxLength) {
      return `Text ist ${currentLength - maxLength} Zeichen zu lang`;
    }
    if (minLength && currentLength < minLength) {
      return `Noch ${minLength - currentLength} Zeichen benötigt`;
    }
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-900">
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        
        {/* Validation Icon */}
        <div className="flex items-center space-x-2">
          {currentLength > 0 && (
            <>
              {isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`input w-full resize-none transition-colors ${
            currentLength > 0 
              ? isValid 
                ? 'border-green-300 focus:border-green-500 focus:ring-green-500' 
                : 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : ''
          }`}
          rows={minLength && minLength > 140 ? 6 : 4}
          style={{ minHeight: minLength && minLength > 140 ? '120px' : '80px' }}
        />
      </div>

      {/* Character Count and Validation */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          {/* Character Count */}
          <span className={getCharacterCountColor()}>
            {currentLength}
            {maxLength && ` / ${maxLength}`}
            {minLength && !maxLength && ` (min. ${minLength})`}
            {maxLength && ` Zeichen`}
          </span>

          {/* Validation Message */}
          {getValidationMessage() && (
            <span className="text-red-600 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {getValidationMessage()}
            </span>
          )}
        </div>

        {/* Progress Indicator */}
        {minLength && (
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isMinValid ? 'bg-green-500' : 'bg-amber-500'
                }`}
                style={{
                  width: `${Math.min(100, (currentLength / minLength) * 100)}%`
                }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {Math.round((currentLength / minLength) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Guidelines */}
      {minLength && currentLength === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 mb-2">
            <strong>Tipps für deinen Text:</strong>
          </p>
          <ul className="text-xs text-blue-700 space-y-1">
            {minLength <= 140 ? (
              <>
                <li>• Beschreibe dich in wenigen Worten</li>
                <li>• Was macht dich zu einem guten Betreuer?</li>
                <li>• Erwähne deine Leidenschaft für Tiere</li>
              </>
            ) : (
              <>
                <li>• Erzähle deine Geschichte mit Tieren</li>
                <li>• Beschreibe deine Erfahrungen</li>
                <li>• Was ist dir bei der Tierbetreuung wichtig?</li>
                <li>• Warum können Tierbesitzer dir vertrauen?</li>
                <li>• Teile persönliche Anekdoten</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AboutMeEditor; 