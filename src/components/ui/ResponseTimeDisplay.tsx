import React from 'react';
import { Clock } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ResponseTimeDisplayProps {
  responseTime?: string;
  messageCount?: number;
  isLoading?: boolean;
  className?: string;
}

function ResponseTimeDisplay({ responseTime, messageCount, isLoading = false, className = '' }: ResponseTimeDisplayProps) {
  // Zeige Loading-Spinner wenn Daten geladen werden
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
        <LoadingSpinner size="sm" />
        <span>Lade Antwortzeit...</span>
      </div>
    );
  }

  // Wenn keine Antwortzeit vorhanden ist, zeige nichts an
  if (!responseTime) {
    return null;
  }

  // Bestimme die Farbe basierend auf der Antwortzeit
  const getResponseTimeColor = (time: string) => {
    if (time.includes('unter 30 Minuten') || time.includes('unter 1 Stunde')) {
      return 'text-green-600';
    } else if (time.includes('1-2 Stunden') || time.includes('2-3 Stunden')) {
      return 'text-amber-600';
    } else {
      return 'text-gray-600';
    }
  };

  // Bestimme das Icon basierend auf der Antwortzeit
  const getResponseTimeIcon = (time: string) => {
    if (time.includes('unter 30 Minuten') || time.includes('unter 1 Stunde')) {
      return '⚡';
    } else if (time.includes('1-2 Stunden') || time.includes('2-3 Stunden')) {
      return '⏱️';
    } else {
      return '📱';
    }
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${getResponseTimeColor(responseTime)} ${className}`}>
      <span className="font-medium">
        {getResponseTimeIcon(responseTime)} Antwortzeit: {responseTime}
        {messageCount && messageCount > 0 && (
          <span className="text-gray-500 ml-1">
            (basierend auf {messageCount} Nachrichten)
          </span>
        )}
      </span>
    </div>
  );
}

export default ResponseTimeDisplay;
