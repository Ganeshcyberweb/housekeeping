import React from 'react';

export type ButtonVariant = 
  | 'default'    // Gray (like Refresh button)
  | 'primary'    // Purple/Blue 
  | 'success'    // Green
  | 'warning'    // Yellow/Orange
  | 'danger'     // Red
  | 'secondary'  // Light gray
  | 'ghost';     // Transparent

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  children,
  icon,
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-3 py-2 text-sm", 
    lg: "px-4 py-3 text-base"
  };

  const variantClasses = {
    default: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-300",
    primary: "bg-purple-500 hover:bg-purple-600 text-white focus:ring-purple-300",
    success: "bg-green-500 hover:bg-green-600 text-white focus:ring-green-300",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-300",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-300",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-gray-300",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300"
  };

  const disabledClasses = "opacity-50 cursor-not-allowed hover:bg-current";
  const fullWidthClass = fullWidth ? "w-full" : "";

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabled || loading ? disabledClasses : ''}
    ${fullWidthClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {children}
        </>
      ) : (
        <>
          {icon && <span className="w-4 h-4">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;