import React from "react";

interface FilterInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  variant?: "light" | "dark";
}

const FilterInput: React.FC<FilterInputProps> = ({
  icon,
  variant = "light",
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    light:
      "bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 focus:ring-gray-300 focus:bg-white",
    dark: "bg-[#1C2333] text-white focus:ring-gray-300",
  };

  const sizeClasses = "px-3 py-2 text-sm";

  const inputClasses = `
    ${baseClasses}
    ${sizeClasses}
    ${variantClasses[variant]}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  if (icon) {
    return (
      <div className="flex items-center gap-2">
        <span
          className={variant === "dark" ? "text-gray-400" : "text-gray-500"}
        >
          {icon}
        </span>
        <input className={inputClasses} {...props} />
      </div>
    );
  }

  return <input className={inputClasses} {...props} />;
};

export default FilterInput;
