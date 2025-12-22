import React from 'react';

interface InfoTooltipProps {
  text: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text }) => {
  return (
    <div className="relative group flex items-center ml-1.5">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 cursor-pointer">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 p-3 text-sm text-gray-700 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 text-left normal-case font-normal pointer-events-none">
        {text}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-gray-300"></div>
      </div>
    </div>
  );
};

export default InfoTooltip;

