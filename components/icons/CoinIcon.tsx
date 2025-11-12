import React from 'react';

export const CoinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <circle cx="12" cy="12" r="8" />
    <path d="M12 18V6" />
    <path d="M15 9.5s-1.5-2-3-2-3 2-3 2" />
    <path d="M9 14.5s1.5 2 3 2 3-2 3-2" />
  </svg>
);
