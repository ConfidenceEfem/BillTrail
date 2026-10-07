import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { verifyEmail } from "../api/auth";
import { getErrorMessage } from "../lib/error";
import { AuthCard } from "../components/AuthCard";
import { StatusIcon } from "../components/StatusIcon";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const mutation = useMutation({ mutationFn: verifyEmail });

  useEffect(() => {
    if (token) mutation.mutate(token);
  }, [token]);

  return (
    <AuthCard>
      {!token && (
        <>
          <StatusIcon icon={XCircle} tone="error" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid link</h1>
          <p className="text-sm text-gray-500">No verification token found in this link.</p>
        </>
      )}

      {token && mutation.isPending && (
        <>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 bg-brand-50 text-brand-600">
            <Loader2 size={26} className="animate-spin" />
          </div>
          <p className="text-sm text-gray-500">Verifying your email...</p>
        </>
      )}

      {token && mutation.isSuccess && (
        <>
          <StatusIcon icon={CheckCircle2} tone="success" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Email verified</h1>
          <p className="text-sm text-gray-500 mb-6">You can now log in to your account.</p>
          <Link to="/login" className="text-brand-600 font-medium text-sm">
            Go to login
          </Link>
        </>
      )}

      {token && mutation.isError && (
        <>
          <StatusIcon icon={XCircle} tone="error" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verification failed</h1>
          <p className="text-sm text-gray-500">{getErrorMessage(mutation.error)}</p>
        </>
      )}
    </AuthCard>
  );
}