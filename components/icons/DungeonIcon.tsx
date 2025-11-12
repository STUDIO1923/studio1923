import React from 'react';

export const DungeonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M7 2h10" />
    <path d="M7 22h10" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <path d="M5 2v4" />
    <path d="M19 2v4" />
    <path d="M5 18v4" />
    <path d="M19 18v4" />
    <path d="M2 5h4" />
    <path d="M18 5h4" />
    <path d="M2 19h4" />
    <path d="M18 19h4" />
  </svg>
);
