import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useStaffStore } from "../store/staffStore";
import Button from "../components/ui/Button";
import Input from "../components/Input";
import {
  User,
  Mail,
  Save,
  AlertCircle,
  CheckCircle,
  Shield,
  Crown,
} from "lucide-react";
import { ROLE_LABELS } from "../types/user";

const SettingsPage = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { getStaffByUid, updateStaff, fetchStaff } = useStaffStore();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staffRecord, setStaffRecord] = useState<any>(null);

  // Load current staff data
  useEffect(() => {
    const loadStaffData = async () => {
      if (user?.uid) {
        try {
          await fetchStaff();
          const currentStaff = getStaffByUid(user.uid);
          if (currentStaff) {
            setStaffRecord(currentStaff);
            setFormData({
              name: currentStaff.name || user.displayName || "",
              phone: currentStaff.phone || "",
            });
          } else {
            // If no staff record exists, use Firebase Auth data
            setFormData({
              name: user.displayName || "",
              phone: "",
            });
          }
        } catch (error) {
          console.error("Error loading staff data:", error);
          setError("Failed to load current settings");
        }
      }
    };

    loadStaffData();
  }, [user, getStaffByUid, fetchStaff]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!staffRecord) {
      setError("No staff record found. Please contact your administrator.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateStaff(staffRecord.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || "",
      });

      // Refresh the user profile to reflect changes
      await refreshUserProfile();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    if (!userProfile) return <User className="w-5 h-5 text-gray-400" />;
    switch (userProfile.role) {
      case "admin":
        return <Crown className="w-5 h-5 text-red-400" />;
      case "manager":
        return <Shield className="w-5 h-5 text-blue-400" />;
      case "staff":
        return <User className="w-5 h-5 text-gray-400" />;
      default:
        return <User className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Update your personal information and preferences
          </p>
        </div>

        {/* Current Account Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Current Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Email:</strong> {user?.email || "Not available"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {getRoleIcon()}
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Role:</strong>{" "}
                {userProfile ? ROLE_LABELS[userProfile.role] : "Loading..."}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Email and role can only be changed by an administrator
            </div>
          </div>
        </div>

        {/* Editable Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              id="name"
              label="Full Name"
              type="text"
              value={formData.name}
              onChange={(value) => handleInputChange("name", value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <Input
              id="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(value) => handleInputChange("phone", value)}
              placeholder="Enter your phone number (optional)"
            />
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-200 text-sm">
                  Profile updated successfully!
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="text-red-800 dark:text-red-200 text-sm">
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !formData.name.trim()}
              loading={loading}
              icon={<Save className="w-4 h-4" />}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>

        {/* Additional Information */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Need help?
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            If you need to change your email address, role, or have other
            account issues, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
