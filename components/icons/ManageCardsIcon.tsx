import React from 'react';

export const ManageCardsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M21 8c0-1.1-.9-2-2-2H5a2 2 0 00-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2"></path>
    <path d="M3 10h18"></path>
    <path d="M10 6V4c0-1.1.9-2 2-2s2 .9 2 2v2"></path>
  </svg>
);
