import React from 'react';

interface MagnitudeDisplayProps {
  value: string;
  magnitude: string;
  context: 'volume' | 'competition';
}

const getMagnitudeClasses = (magnitude: string, context: 'volume' | 'competition'): string => {
  const lowerMagnitude = magnitude?.toLowerCase();
  
  if (context === 'volume') {
      switch (lowerMagnitude) {
          case 'cao': return 'bg-green-100 text-green-800 border-green-200';
          case 'trung bình': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'thấp': return 'bg-red-100 text-red-800 border-red-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
  } else { // context === 'competition'
      switch (lowerMagnitude) {
          case 'cao': return 'bg-red-100 text-red-800 border-red-200';
          case 'trung bình': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
          case 'thấp': return 'bg-green-100 text-green-800 border-green-200';
          default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
  }
};

const MagnitudeDisplay: React.FC<MagnitudeDisplayProps> = ({ value, magnitude, context }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      <span className="font-semibold text-gray-700 whitespace-nowrap">{value}</span>
      {magnitude && (
        <span
          className={`px-1.5 py-0.5 text-[10px] font-semibold leading-none rounded-full border ${getMagnitudeClasses(magnitude, context)}`}
          title={`Mức độ: ${magnitude}`}
        >
          {magnitude}
        </span>
      )}
    </div>
  );
};

export default MagnitudeDisplay;

