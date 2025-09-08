import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = "primary", // primary, secondary, success, danger, warning
  size = "md", // sm, md, lg
  disabled = false,
  className = "",
  type = "button",
  icon: Icon,
  loading = false,
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
  
  const sizeClasses = {
    sm: "px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm",
    md: "px-3 sm:px-4 py-2 text-sm",
    lg: "px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base"
  };
  
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 focus:ring-gray-500 text-gray-700",
    success: "bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white",
    danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white"
  };
  
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
      )}
      {Icon && !loading && <Icon className="mr-2" />}
      {children}
    </button>
  );
};

export default Button;
