import React from 'react';

export const MedalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 21a9 9 0 1 0-9-9c0 2.4.9 4.6 2.5 6.2"></path>
    <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"></path>
    <path d="M10.5 13.5 8 22l4-3 4 3-2.5-8.5"></path>
  </svg>
);