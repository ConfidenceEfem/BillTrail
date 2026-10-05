import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-5xl font-medium text-brand-200 mb-2">404</p>
        <h1 className="text-lg font-medium text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="text-sm text-brand-600 font-medium">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}