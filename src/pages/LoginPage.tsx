import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { LogIn, AlertCircle, ArrowLeft } from "lucide-react";

const LoginPage = () => {
  const { user, loading, error, signIn, clearError } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 sm:py-12 px-4">
      <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="bg-purple-500 p-2 sm:p-3 rounded-full flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 sm:w-8 sm:h-8"
            >
              <path d="M12 2l9 4.9v9.8L12 22l-9-5.3V6.9L12 2z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            Shift Planner
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            Access the Housekeeping Management System
          </p>
        </div>
        
        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
                <button 
                  onClick={clearError}
                  className="text-red-600 hover:text-red-700 text-xs font-medium ml-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 sm:gap-3 shadow-sm text-sm sm:text-base"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 h-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Signing in...</span>
                <span className="sm:hidden">Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Sign in with Google</span>
                <span className="sm:hidden">Sign in with Google</span>
              </>
            )}
          </button>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Contact your administrator if you're having trouble signing in.
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;