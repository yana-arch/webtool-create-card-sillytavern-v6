import React from "react";

interface TextInputProps
  extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  name: string;
  isTextArea?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  name,
  isTextArea = false,
  ...props
}) => {
  const commonClasses = `
    w-full p-3 bg-gray-700/60 border border-gray-600 rounded-lg 
    text-gray-200 placeholder-gray-500 
    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
    transition-all duration-200
  `;

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-300 mb-1"
      >
        {label}
      </label>
      {isTextArea ? (
        <textarea
          id={name}
          name={name}
          rows={3}
          className={commonClasses}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={name}
          name={name}
          type="text"
          className={commonClasses}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
    </div>
  );
};
