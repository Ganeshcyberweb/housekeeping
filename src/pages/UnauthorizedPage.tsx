import { Link } from "react-router-dom";
import { ShieldX, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { ROLE_LABELS } from "../types/user";

export default function UnauthorizedPage() {
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Access Denied
        </h1>
        
        <p className="text-gray-600 mb-2">
          You don't have permission to access this page.
        </p>
        
        {userProfile && (
          <p className="text-sm text-gray-500 mb-8">
            Your current role: <span className="font-medium">{ROLE_LABELS[userProfile.role]}</span>
          </p>
        )}
        
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <p className="text-sm text-gray-500">
            Contact your administrator if you need additional permissions.
          </p>
        </div>
      </div>
    </div>
  );
}