import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Shield,
  LogOut,
  ChevronDown,
  User
} from 'lucide-react';
import { useState } from 'react';
import { useAdmin } from '../../lib/admin/useAdmin';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { adminUser, isAdmin, loading } = useAdmin();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin || !adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h1>
          <p className="text-gray-600 mb-6">
            Sie haben keine Berechtigung, auf das Admin Dashboard zuzugreifen.
          </p>
          <a 
            href="/"
            className="btn btn-primary"
          >
            Zurück zur Homepage
          </a>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    // Redirect to main site
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img src="/Image/Logos/tigube_logo.png" alt="Tigube Logo" className="h-10 w-auto" />
              <div className="ml-4 text-xl font-semibold text-gray-900">
                Admin Dashboard
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg px-3 py-2"
              >
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {adminUser.first_name?.[0] || adminUser.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="font-medium">
                      {adminUser.first_name} {adminUser.last_name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {adminUser.admin_role?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-900 border-b border-gray-100">
                      <div className="font-medium">
                        {adminUser.first_name} {adminUser.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {adminUser.email}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Zur Hauptseite
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Click outside to close user menu */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout; 