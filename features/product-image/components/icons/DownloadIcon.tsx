import React from 'react';

interface IconProps {
  className?: string;
}

const DownloadIcon: React.FC<IconProps> = ({ className = "h-6 w-6" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 12.75l-3.375-3.375M12 12.75l3.375-3.375M12 12.75V3" />
    </svg>
  );
};

export default DownloadIcon;
