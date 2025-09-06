import React from 'react';

export const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.125 0 1.131.094 1.976 1.057 1.976 2.192V7.5M8.25 7.5h7.5M8.25 7.5V9a.75.75 0 01-.75.75H5.625a.75.75 0 01-.75-.75V7.5m11.25 0V9A.75.75 0 0018.375 9.75h-1.875a.75.75 0 00-.75-.75V7.5M3.75 12h16.5M3.75 12V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 0110.5 0C17.555 4.01 18.4 4.973 18.4 6.108V12m-14.652 4.5l1.06-1.06a.75.75 0 011.06 0l1.06 1.06a.75.75 0 001.06 0l1.06-1.06a.75.75 0 011.06 0l1.06 1.06a.75.75 0 001.06 0l1.06-1.06a.75.75 0 011.06 0l1.06 1.06M3.75 12h16.5"
    />
  </svg>
);