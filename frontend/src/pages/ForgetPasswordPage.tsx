import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { KeyRound, MailCheck } from "lucide-react";
import { forgotPassword } from "../api/auth";
import { AuthCard } from "../components/AuthCard";
import { StatusIcon } from "../components/StatusIcon";

const schema = z.object({ email: z.string().email("Enter a valid email address") });
type Form = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const mutation = useMutation({ mutationFn: (data: Form) => forgotPassword(data.email) });

  return (
    <AuthCard>
      {mutation.isSuccess ? (
        <>
          <StatusIcon icon={MailCheck} tone="info" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Check your inbox</h1>
          <p className="text-sm text-gray-500 mb-6">
            If that email has an account, a reset link is on its way.
          </p>
        </>
      ) : (
        <>
          <StatusIcon icon={KeyRound} tone="info" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Forgot your password?</h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and we'll send you a reset link.
          </p>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4 text-left">
            <div>
              <input
                type="email"
                placeholder="Email"
                {...register("email")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <button
              type="submit"
              disabled={mutation.isPending}
                className="inline-block bg-brand-600 text-white font-[10px] px-6 py-3 rounded-lg hover:bg-brand-800"
            >
              {mutation.isPending ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </>
      )}

      <p className="text-sm text-gray-500 mt-6">
        <Link to="/login" className="text-brand-600 font-medium">
          Back to login
        </Link>
      </p>
    </AuthCard>
  );
}