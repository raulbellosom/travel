import { Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const DashboardNavbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <Menu size={24} />
            </button>
            <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900 dark:text-white">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {user?.name || "User"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavbar;
