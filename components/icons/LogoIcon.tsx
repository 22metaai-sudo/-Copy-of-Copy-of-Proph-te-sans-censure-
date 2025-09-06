import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 4C8.26 4 5.07 5.92 2.61 8.89C1.03 10.66 1.03 13.34 2.61 15.11C5.07 18.08 8.26 20 12 20C15.74 20 18.93 18.08 21.39 15.11C22.97 13.34 22.97 10.66 21.39 8.89C18.93 5.92 15.74 4 12 4Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
     <path 
      d="M12 10.5L12.2929 11.7071L13.5 12L12.2929 12.2929L12 13.5L11.7071 12.2929L10.5 12L11.7071 11.7071Z" 
      fill="currentColor" 
    />
  </svg>
);
