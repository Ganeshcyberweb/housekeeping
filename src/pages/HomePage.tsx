import { useAuth } from "../context/useAuth";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className=" dark:bg-gray-800 min-h-screen p-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400 text-sm">
              Loading...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" dark:bg-gray-800 min-h-screen">
      <Navbar />

      <div className="p-6">
        <div className="bg-white dark:bg-gray-900 p-8">
          <div className="text-center">
            <h2 className="text-4xl font-semibold text-gray-900 dark:text-white mb-6">
              Housekeeping Shift Planner
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
              Streamline your housekeeping operations with our comprehensive
              shift management system.
            </p>

            {user ? (
              <div className="space-y-8">
                <div className="flex justify-center space-x-4">
                  <Link
                    to="/admin"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/shift-form"
                    className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 font-medium"
                  >
                    Create Shift
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-8 max-w-lg mx-auto text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Get Started
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
                  Access powerful shift management tools designed for
                  housekeeping teams.
                </p>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 font-medium"
                >
                  Sign In to Continue
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
