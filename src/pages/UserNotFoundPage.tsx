import { useAuth } from "../context/useAuth";
import { UserX } from "lucide-react";
import Button from "../components/ui/Button";

export default function UserNotFoundPage() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <UserX className="w-10 h-10 text-gray-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Account Not Found
        </h1>

        <div className="space-y-4">
          <Button onClick={handleSignOut} variant="primary" className="w-fit">
            Return
          </Button>
        </div>
      </div>
    </div>
  );
}
