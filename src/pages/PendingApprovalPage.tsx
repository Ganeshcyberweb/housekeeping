import { useAuth } from "../context/useAuth";
import { useStaffStore } from "../store/staffStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Clock } from "lucide-react";
import Button from "../components/ui/Button";

export default function PendingApprovalPage() {
  const { user, userProfile, signOut, refreshUserProfile } = useAuth();
  const { fetchStaff } = useStaffStore();
  const navigate = useNavigate();

  // Auto-redirect if user becomes approved
  useEffect(() => {
    if (userProfile?.approved || !user) {
      navigate("/");
    }
  }, [userProfile?.approved, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-stone-100 mb-4">
              <Clock className="h-8 w-8 text-stone-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Pending Approval
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your account is waiting for admin approval
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Account Details:
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Name: {userProfile?.displayName || user?.displayName}</div>
                <div>Email: {userProfile?.email || user?.email}</div>
                <div>Role: {userProfile?.role || "Staff"}</div>
                <div>
                  Status:{" "}
                  <span className="text-stone-600 font-medium">
                    Pending Approval
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                onClick={async () => {
                  await fetchStaff(); // Refresh staff data first
                  await refreshUserProfile(); // Then refresh user profile

                  // Check if user is now approved and redirect
                  setTimeout(() => {
                    const updatedProfile = userProfile;
                    if (updatedProfile?.approved) {
                      navigate("/");
                    }
                  }, 1000); // Give time for state to update
                }}
                variant="primary"
                className="w-full"
              >
                Check Approval Status
              </Button>

              <Button
                onClick={handleSignOut}
                variant="secondary"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
