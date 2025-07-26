import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const LoginPage = () => {
  const { user, loading, error, signIn, clearError } = useAuth();

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-foreground">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Access the Housekeeping Shift Planner
          </p>
        </div>
        
        <div className="card-base">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-danger text-danger rounded-md text-sm">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button 
                  onClick={clearError}
                  className="text-foreground underline hover:no-underline text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <button
            onClick={signIn}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </button>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-secondary">
              Contact your administrator if you're having trouble signing in.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link to="/" className="text-sm text-foreground hover:text-secondary underline hover:no-underline transition-all duration-200">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;