import React from 'react';

export const CollectionIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <rect x="3" y="6" width="16" height="12" rx="2" ry="2"></rect>
    <path d="M7 4h12a2 2 0 0 1 2 2v12"></path>
  </svg>
);
