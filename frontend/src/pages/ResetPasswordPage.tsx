import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { getErrorMessage } from "../lib/error";

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-sm text-red-600">No reset token found in this link.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-xl font-medium text-brand-800 mb-6">Set a new password</h1>

        {mutation.isSuccess ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Your password has been reset. Any other devices you were logged in on have been signed out.
            </p>
            <Link to="/login" className="text-brand-600 font-medium text-sm">
              Go to login
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4">
            <div>
              <input
                type="password"
                placeholder="New password"
                {...register("newPassword")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
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
              className="bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-800 disabled:opacity-50"
            >
              {mutation.isPending ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}