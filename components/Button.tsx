
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      className={`
        flex items-center justify-center gap-2 px-6 py-3
        bg-gradient-to-r from-blue-500 to-purple-600
        text-white font-bold text-lg rounded-lg
        shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300
        focus:outline-none focus:ring-4 focus:ring-purple-300
        disabled:bg-gray-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
