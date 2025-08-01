import React from "react";

interface TagProps {
  children: React.ReactNode;
  variant?: string;
  // variant?: 'default' | 'status';
  className?: string;
}

const Tag: React.FC<TagProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const baseClasses =
    "inline-flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 text-gray-700 text-sm w-fit";
  const variantClasses = {
    default: "",
    status: "font-medium",
  };

  return (
    <span
      className={`${baseClasses} ${
        variantClasses[variant as keyof typeof variantClasses]
      } ${className}`}
    >
      {children}
    </span>
  );
};

export default Tag;
