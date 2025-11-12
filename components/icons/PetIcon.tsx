import React from 'react';

export const PetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4 14.5a8 8 0 1116 0" />
    <path d="M10 16c.5-1 1.5-1.5 2-1.5s1.5.5 2 1.5" />
    <path d="M8.5 12.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    <path d="M15.5 12.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    <path d="M5.5 11L4 9" />
    <path d="M18.5 11L20 9" />
  </svg>
);
