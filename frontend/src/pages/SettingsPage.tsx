import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getBusiness, updateBusiness } from "../api/business";
import { getErrorMessage } from "../lib/error";

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
});
type SettingsForm = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: business, isLoading } = useQuery({
    queryKey: ["business"],
    queryFn: getBusiness,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsForm>({ resolver: zodResolver(settingsSchema) });


  useEffect(() => {
    if (business) {
      reset({
        name: business.name,
        phone: business.phone ?? "",
        address: business.address ?? "",
      });
    }
  }, [business, reset]);

  const mutation = useMutation({
    mutationFn: updateBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Settings saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-medium text-gray-900 mb-6">Business settings</h1>

      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name</label>
          <input
            {...register("name")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            {...register("phone")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            {...register("address")}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <input
            value={business?.currency ?? "NGN"}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">Currency can't be changed after invoices exist.</p>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-800 disabled:opacity-50 self-start px-6"
        >
          {mutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}