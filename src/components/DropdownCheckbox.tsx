import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface DropdownCheckboxProps {
  id?: string;
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  className?: string;
}

const DropdownCheckBox = ({
  id = "dropdown-checkbox",
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  className = "",
}: DropdownCheckboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleCheckboxChange = (value: string) => {
    const updatedValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(updatedValues);
  };

  const displayText =
    selectedValues.length > 0
      ? `${selectedValues.length} selected`
      : placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </label>

      <button
        id={`${id}-button`}
        onClick={handleToggle}
        className="text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center justify-between w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-700"
        type="button"
      >
        <span>{displayText}</span>
        <svg
          className={`w-2.5 h-2.5 ms-3 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 10 6"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 4 4 4-4"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          id={`${id}-dropdown`}
          className="absolute z-10 w-full mt-1 bg-white divide-y divide-gray-100 rounded-lg border border-gray-200 dark:bg-gray-700 dark:divide-gray-600 dark:border-gray-600"
        >
          <ul
            className="p-3 space-y-3 text-sm text-gray-700 dark:text-gray-200 max-h-48 overflow-y-auto"
            aria-labelledby={`${id}-button`}
          >
            {options.map((option) => (
              <li key={option.value}>
                <div className="flex items-center">
                  <input
                    id={`${id}-${option.value}`}
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleCheckboxChange(option.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                  />
                  <label
                    htmlFor={`${id}-${option.value}`}
                    className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DropdownCheckBox;
