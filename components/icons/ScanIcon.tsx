import React from 'react';

export const ScanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
    {...props}
  >
    <circle
      cx="12"
      cy="12"
      r="8"
      strokeDasharray="1 6"
      strokeLinecap="round"
    />
  </svg>
);