import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../lib/error";
import { AuthSidePanel } from "../components/AuthSidePanel";
import { PasswordInput } from "../components/PasswordInput";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      navigate("/dashboard");
    },
  });

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-6 gradient-bg">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-sm text-brand-800 font-medium mb-10 inline-block">
            BillTrail
          </Link>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Log in to your BillTrail account</p>

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-600 font-medium">
                  Forgot password?
                </Link>
              </div>
             <PasswordInput
  {...register("password")}
  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
/>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            {mutation.isError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {getErrorMessage(mutation.error)}
              </p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-block bg-brand-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-800 cursor-pointer"
            >
              {mutation.isPending ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-8 text-center">
            No account?{" "}
            <Link to="/register" className="text-brand-600 font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>

      <AuthSidePanel />
    </div>
  );
}