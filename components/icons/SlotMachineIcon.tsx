import React from 'react';

export const SlotMachineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <rect x="3" y="3" width="12" height="18" rx="2"></rect>
    <path d="M15 3h6v6"></path>
    <path d="M15 14h6"></path>
    <path d="M21 9v5"></path>
    <path d="M18 9a3 3 0 1 0 0-6"></path>
    <line x1="6" y1="8" x2="9" y2="8"></line>
    <line x1="6" y1="12" x2="9" y2="12"></line>
    <line x1="6" y1="16" x2="9" y2="16"></line>
  </svg>
);
