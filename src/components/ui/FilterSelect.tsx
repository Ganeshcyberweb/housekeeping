import React from "react";

interface FilterSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
  variant?: "light" | "dark";
  children: React.ReactNode;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  icon,
  variant = "light",
  className = "",
  children,
  ...props
}) => {
  const baseClasses =
    "inline-flex  items-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    light:
      "bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 focus:ring-gray-300 focus:bg-white",
    dark: "bg-[#1C2333] text-white focus:ring-gray-300",
  };

  const sizeClasses = "px-3 py-2 text-sm";

  const selectClasses = `
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
        <select className={selectClasses} {...props}>
          {children}
        </select>
      </div>
    );
  }

  return (
    <select className={selectClasses} {...props}>
      {children}
    </select>
  );
};

export default FilterSelect;
