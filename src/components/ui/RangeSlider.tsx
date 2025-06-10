import React from 'react';

interface RangeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

function RangeSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  description
}: RangeSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-lg font-semibold">
          {label}
        </label>
        <span className="text-sm font-semibold text-primary-600">
          {value === max ? `${max}+ ${unit}` : `${value} ${unit}`}
        </span>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      )}
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`
          }}
        />
      </div>
      
      {/* Range indicators */}
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min} {unit}</span>
        <span>{max}+ {unit}</span>
      </div>
    </div>
  );
}

export default RangeSlider; 