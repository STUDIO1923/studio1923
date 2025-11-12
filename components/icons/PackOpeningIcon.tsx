import React from 'react';

export const PackOpeningIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
    <path d="M5 2 L6 5 L9 6 L6 7 L5 10 L4 7 L1 6 L4 5 Z" />
    <path d="M19 2 L18 5 L15 6 L18 7 L19 10 L20 7 L23 6 L20 5 Z" />
  </svg>
);
