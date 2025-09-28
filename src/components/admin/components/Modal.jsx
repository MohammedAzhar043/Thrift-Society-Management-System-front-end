import React from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = "md", // sm, md, lg, xl
  showCloseButton = true,
  className = "" 
}) => {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: "w-96",
    md: "w-11/12 max-w-2xl",
    lg: "w-11/12 max-w-4xl",
    xl: "w-11/12 max-w-6xl"
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={`relative top-20 mx-auto p-5 border shadow-lg rounded-md bg-white ${sizeClasses[size]} ${className}`}>
        <div className="mt-3">
          {title && (
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
