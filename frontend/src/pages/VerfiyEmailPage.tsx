import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { verifyEmail } from "../api/auth";
import { getErrorMessage } from "../lib/error";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const mutation = useMutation({ mutationFn: verifyEmail });

  useEffect(() => {
    if (token) mutation.mutate(token);
    // mutation is stable across renders from useMutation, but including it
    // would re-trigger on every render since it's a new object reference
    // each time — intentionally omitted, token is the only real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8 text-center">
        {!token && <p className="text-sm text-red-600">No verification token found in this link.</p>}

        {token && mutation.isPending && <p className="text-sm text-gray-600">Verifying your email...</p>}

        {token && mutation.isSuccess && (
          <>
            <h1 className="text-xl font-medium text-brand-800 mb-2">Email verified</h1>
            <p className="text-sm text-gray-600 mb-4">You can now log in to your account.</p>
            <Link to="/login" className="text-brand-600 font-medium text-sm">
              Go to login
            </Link>
          </>
        )}

        {token && mutation.isError && (
          <p className="text-sm text-red-600">{getErrorMessage(mutation.error)}</p>
        )}
      </div>
    </div>
  );
}