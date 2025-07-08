import React from 'react';
import { X } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'danger' | 'outline';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

function Badge({ 
  children, 
  variant = 'primary', 
  removable = false, 
  onRemove, 
  className = '' 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors';
  
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 border border-primary-200',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    outline: 'bg-transparent text-gray-700 border border-gray-300',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 -mr-1 h-4 w-4 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
          aria-label="Entfernen"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export default Badge; 