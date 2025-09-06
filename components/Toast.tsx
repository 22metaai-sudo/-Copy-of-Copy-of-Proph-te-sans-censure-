import React, { useEffect } from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

interface ToastProps {
  message: string;
  type: 'success' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-close after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex items-center gap-4 w-full max-w-sm p-4 rounded-lg shadow-lg text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-slide-fade-in"
      role="alert"
    >
      <div
        className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${
          isSuccess
            ? 'bg-green-100 dark:bg-green-800 text-green-500 dark:text-green-200'
            : 'bg-blue-100 dark:bg-blue-800 text-blue-500 dark:text-blue-200'
        }`}
      >
        {isSuccess ? <CheckIcon className="w-5 h-5" /> : <InformationCircleIcon className="w-5 h-5" />}
        <span className="sr-only">{isSuccess ? 'Success' : 'Info'} icon</span>
      </div>
      <div className="text-sm font-normal">{message}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 p-1.5 inline-flex h-8 w-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-300"
        aria-label="Close"
        onClick={onClose}
      >
        <span className="sr-only">Close</span>
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
    </div>
  );
};
