import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { registerBusiness } from "../api/auth";
import { getErrorMessage } from "../lib/error";
import { AuthSidePanel } from "../components/AuthSidePanel";
import { PasswordInput } from "../components/PasswordInput";

const registerSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const mutation = useMutation({ mutationFn: registerBusiness });

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-6 gradient-bg">
        <div className="w-full max-w-sm">
          <Link to="/" className="text-sm text-brand-800 font-medium mb-10 inline-block">
             <img className="w-[130px] h-[80px] object-cover"   src="/logo.png"/>
          </Link>

          {mutation.isSuccess ? (
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Check your email</h1>
              <p className="text-sm text-gray-600">
                We sent a verification link to your email address. Click it to activate your account.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create your account</h1>
              <p className="text-sm text-gray-500 mb-8">Start invoicing in minutes</p>

              <form
                onSubmit={handleSubmit((data) => mutation.mutate(data))}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
                  <input
                    {...register("businessName")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                  />
                  {errors.businessName && (
                    <p className="text-xs text-red-600 mt-1">{errors.businessName.message}</p>
                  )}
                </div>

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                 <PasswordInput
  {...register("password")}
  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
/>
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
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
                  className="inline-block bg-brand-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-800 cursor-pointer"
                >
                  {mutation.isPending ? "Creating account..." : "Create account"}
                </button>
              </form>

              <p className="text-sm text-gray-500 mt-8 text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-brand-600 font-medium">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <AuthSidePanel />
    </div>
  );
}