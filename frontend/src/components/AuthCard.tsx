import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-sm text-brand-800 font-medium mb-6 inline-block">
          <img className="w-[130px] h-[80px] object-cover" src="/logo.png"/>
        </Link>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}