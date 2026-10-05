import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import z from "zod";
import { login } from "../api/auth";
import {useAuthStore} from "../store/authStore"
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage } from "../lib/error";


export function LoginPage() {

    const navigate = useNavigate()

    const setTokens = useAuthStore((state)=>state.setTokens)

    const LoginSchema = z.object({
        email: z.string().min(1, "Email is required").email("Enter a valid email address"),
        password: z.string().min(1, "password is required")
    })

    type LoginForm = z.infer<typeof LoginSchema>

    const {
        register,
        formState: {errors},
        handleSubmit, 
        
    } = useForm<LoginForm>({
        resolver: zodResolver(LoginSchema)
    })


    const mutation = useMutation({
        mutationFn: login,
        onSuccess: (data) => {
            setTokens(data.accessToken, data.refreshToken)
            navigate("/dashboard")
        }
    })

 return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-xl font-medium text-brand-800 mb-6">Log in to BillTrail</h1>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {getErrorMessage(mutation.error)}
            </p>
          )}

<Link to="/forgot-password" className="text-xs text-brand-600 self-end">
  Forgot password?
</Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-800 disabled:opacity-50"
          >
            {mutation.isPending ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          No account?{" "}
          <Link to="/register" className="text-brand-600 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}