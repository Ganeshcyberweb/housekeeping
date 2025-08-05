import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import {
  LogIn,
  AlertCircle,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle,
} from "lucide-react";
import type { User as FirebaseUser } from "firebase/auth";

const LoginPage = () => {
  const {
    user,
    loading,
    error,
    signIn,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    sendEmailVerification,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    clearError();

    if (mode === "signin") {
      await signInWithEmail(email, password);
    } else if (mode === "signup") {
      if (password !== confirmPassword) {
        return; // This should be handled by form validation
      }
      await signUpWithEmail(email, password, displayName);
      setSuccessMessage(
        "Account created successfully! Please check your email for verification."
      );
    } else if (mode === "reset") {
      try {
        await resetPassword(email);
        setSuccessMessage(
          "Password reset email sent! Please check your inbox."
        );
      } catch (err) {
        // Error is already handled in the auth context
      }
    }
  };

  const handleSendVerification = async () => {
    try {
      await sendEmailVerification();
      setSuccessMessage("Verification email sent! Please check your inbox.");
    } catch (err) {
      // Error is already handled in the auth context
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setSuccessMessage("");
    clearError();
  };

  const switchMode = (newMode: "signin" | "signup" | "reset") => {
    setMode(newMode);
    resetForm();
  };

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

  const getModeTitle = () => {
    switch (mode) {
      case "signup":
        return "Create Account";
      case "reset":
        return "Reset Password";
      default:
        return "Sign In";
    }
  };

  const getModeSubtitle = () => {
    switch (mode) {
      case "signup":
        return "Join the Housekeeping Management System";
      case "reset":
        return "Enter your email to reset your password";
      default:
        return "Access the Housekeeping Management System";
    }
  };

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
            {getModeTitle()}
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            {getModeSubtitle()}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200">
          {/* Error Message */}
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

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="flex-1">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4 sm:space-y-5">
            {/* Display Name Field (Sign Up only) */}
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field (not for reset) */}
            {mode !== "reset" && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field (Sign Up only) */}
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-sm ${
                      confirmPassword && password !== confirmPassword
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    Passwords do not match
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading || (mode === "signup" && password !== confirmPassword)
              }
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>
                    {mode === "signin"
                      ? "Signing in..."
                      : mode === "signup"
                      ? "Creating account..."
                      : "Sending email..."}
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>
                    {mode === "signin"
                      ? "Sign In"
                      : mode === "signup"
                      ? "Create Account"
                      : "Send Reset Email"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="px-3 text-xs text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-medium py-2.5 sm:py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 sm:gap-3 shadow-sm text-sm sm:text-base"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Mode Switching Links */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-2">
            {mode === "signin" && (
              <>
                <p className="text-xs sm:text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Sign up
                  </button>
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Forgot your password?{" "}
                  <button
                    onClick={() => switchMode("reset")}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Reset it
                  </button>
                </p>
              </>
            )}

            {mode === "signup" && (
              <p className="text-xs sm:text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}

            {mode === "reset" && (
              <p className="text-xs sm:text-sm text-gray-600">
                Remember your password?{" "}
                <button
                  onClick={() => switchMode("signin")}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            )}

            {/* Email Verification */}
            {user && !(user as FirebaseUser).emailVerified && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-xs text-yellow-800 mb-2">
                  Please verify your email address to access all features.
                </p>
                <button
                  onClick={handleSendVerification}
                  className="text-xs text-yellow-600 hover:text-yellow-700 font-medium underline"
                >
                  Resend verification email
                </button>
              </div>
            )}
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
