import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Client } from "../api/clients";

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
});
export type ClientFormValues = z.infer<typeof clientSchema>;

type ClientFormProps = {
  defaultValues?: Partial<Client>;
  onSubmit: (values: ClientFormValues) => void;
  isPending: boolean;
  submitLabel: string;
  errorMessage?: string;
};

export function ClientForm({ defaultValues, onSubmit, isPending, submitLabel, errorMessage }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          {...register("name")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
        <input
          {...register("phone")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-800 disabled:opacity-50"
      >
        {isPending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}