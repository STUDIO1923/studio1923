import React from 'react';

export const ScaleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M16 16.5l4-4"></path>
    <path d="M20 16.5l-4-4"></path>
    <path d="M4 21h16"></path>
    <path d="M12 4v17"></path>
    <path d="M3 7l2.5-2.5"></path>
    <path d="M5.5 4.5L3 7"></path>
    <path d="M12 21a9 9 0 00-9-9"></path>
    <path d="M21 12a9 9 0 00-9 9"></path>
  </svg>
);