import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { LockKeyhole, CheckCircle2, XCircle } from "lucide-react";
import { resetPassword } from "../api/auth";
import { getErrorMessage } from "../lib/error";
import { AuthCard } from "../components/AuthCard";
import { StatusIcon } from "../components/StatusIcon";
import { PasswordInput } from "../components/PasswordInput";

const schema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
type Form = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: Form) => resetPassword({ token: token!, newPassword: data.newPassword }),
  });

  if (!token) {
    return (
      <AuthCard>
        <StatusIcon icon={XCircle} tone="error" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid link</h1>
        <p className="text-sm text-gray-500">No reset token found in this link.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      {mutation.isSuccess ? (
        <>
          <StatusIcon icon={CheckCircle2} tone="success" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Password reset</h1>
          <p className="text-sm text-gray-500 mb-6">
            Other devices you were logged in on have been signed out.
          </p>
          <Link to="/login" className="text-brand-600 font-medium text-sm">
            Go to login
          </Link>
        </>
      ) : (
        <>
          <StatusIcon icon={LockKeyhole} tone="info" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Set a new password</h1>
          <p className="text-sm text-gray-500 mb-6">Choose something you haven't used before.</p>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4 text-left">
            <div>
              <PasswordInput
  {...register("newPassword")}
  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
/>
              {errors.newPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>
              )}
            </div>
            {mutation.isError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {getErrorMessage(mutation.error)}
              </p>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
                className="inline-block bg-brand-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-800"
            >
              {mutation.isPending ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </>
      )}
    </AuthCard>
  );
}