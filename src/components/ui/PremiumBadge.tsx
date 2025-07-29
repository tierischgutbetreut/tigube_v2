import React from 'react';
import { Crown, Star, Shield } from 'lucide-react';

interface PremiumBadgeProps {
  planType?: 'premium' | 'professional' | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PremiumBadge({ 
  planType, 
  size = 'md',
  className = ''
}: PremiumBadgeProps) {
  if (!planType) return null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  const getBadgeContent = () => {
    if (planType === 'professional') {
      return {
        icon: <Crown className={`${iconSizes[size]} text-purple-600`} />,
        text: 'Professional',
        bgColor: 'bg-gradient-to-r from-purple-50 to-purple-100',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200'
      };
    } else {
      return {
        icon: <Star className={`${iconSizes[size]} text-amber-600`} />,
        text: 'Premium',
        bgColor: 'bg-gradient-to-r from-amber-50 to-yellow-100',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200'
      };
    }
  };

  const { icon, text, bgColor, textColor, borderColor } = getBadgeContent();

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-full border
      ${sizeClasses[size]} ${bgColor} ${textColor} ${borderColor}
      font-medium shadow-sm
      ${className}
    `}>
      {icon}
      <span>{text}</span>
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