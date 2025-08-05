import React from 'react';

interface LoadingScreenProps {
  message?: string;
  showSpinner?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading...",
  showSpinner = true,
  size = 'medium',
  className = ''
}) => {
  const spinnerSizes = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="text-center">
        {showSpinner && (
          <div 
            className={`animate-spin rounded-full border-b-2 border-purple-500 mx-auto ${spinnerSizes[size]}`}
          />
        )}
        <p className={`mt-4 text-gray-600 ${textSizes[size]}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;