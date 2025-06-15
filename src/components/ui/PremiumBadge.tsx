import React from 'react';
import { Crown, Shield, Star } from 'lucide-react';

interface PremiumBadgeProps {
  variant?: 'crown' | 'shield' | 'star';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function PremiumBadge({ 
  variant = 'crown', 
  size = 'md', 
  showText = true,
  className = '' 
}: PremiumBadgeProps) {
  const getIcon = () => {
    switch (variant) {
      case 'crown':
        return <Crown className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />;
      case 'shield':
        return <Shield className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />;
      case 'star':
        return <Star className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} fill-current`} />;
      default:
        return <Crown className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-1 text-sm';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  return (
    <div className={`
      inline-flex items-center gap-1 
      bg-gradient-to-r from-yellow-500 to-orange-500 
      text-white font-medium rounded-full 
      shadow-sm
      ${getSizeClasses()}
      ${className}
    `}>
      {getIcon()}
      {showText && (
        <span>Professional</span>
      )}
    </div>
  );
}

// Varianten für verschiedene Anwendungsfälle
export function TrustedBadge({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  return (
    <div className={`
      inline-flex items-center gap-1 
      bg-gradient-to-r from-green-500 to-emerald-500 
      text-white font-medium rounded-full 
      shadow-sm
      ${size === 'sm' ? 'px-2 py-1 text-xs' : size === 'md' ? 'px-3 py-1 text-sm' : 'px-4 py-2 text-base'}
      ${className}
    `}>
      <Shield className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      <span>Vertrauenswürdig</span>
    </div>
  );
}

export function VerifiedBadge({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  return (
    <div className={`
      inline-flex items-center gap-1 
      bg-gradient-to-r from-blue-500 to-indigo-500 
      text-white font-medium rounded-full 
      shadow-sm
      ${size === 'sm' ? 'px-2 py-1 text-xs' : size === 'md' ? 'px-3 py-1 text-sm' : 'px-4 py-2 text-base'}
      ${className}
    `}>
      <Shield className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      <span>Verifiziert</span>
    </div>
  );
}

export default PremiumBadge; 