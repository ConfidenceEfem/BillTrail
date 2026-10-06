import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Client } from "../api/clients";

const lineItemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.coerce.number().int().positive(),
  unitPriceNaira: z.coerce.number().positive(),
});

const schema = z.object({
  clientId: z.string().min(1, "Select a client"),
  items: z.array(lineItemSchema).min(1, "Add at least one item"),
  frequency: z.enum(["WEEKLY", "MONTHLY"]),
  startDate: z.string().min(1, "Required"),
  endDate: z.string().optional(),
  autoSend: z.boolean(),
});
type FormInput = z.input<typeof schema>;
export type RecurringFormValues = z.output<typeof schema>;

type Props = {
  clients: Client[];
  onSubmit: (values: RecurringFormValues) => void;
  isPending: boolean;
  errorMessage?: string;
};

export function RecurringInvoiceForm({ clients, onSubmit, isPending, errorMessage }: Props) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput, unknown, RecurringFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      items: [{ description: "", quantity: 1, unitPriceNaira: 0 }],
      frequency: "MONTHLY",
      autoSend: false,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
        <select
          {...register("clientId")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        {errors.clientId && <p className="text-xs text-red-600 mt-1">{errors.clientId.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                placeholder="Description"
                {...register(`items.${index}.description`)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Qty"
                {...register(`items.${index}.quantity`)}
                className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Unit price"
                {...register(`items.${index}.unitPriceNaira`)}
                className="w-28 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="text-gray-400 hover:text-red-600 disabled:opacity-30 px-2"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        {errors.items && <p className="text-xs text-red-600 mt-1">{errors.items.message}</p>}
        <button
          type="button"
          onClick={() => append({ description: "", quantity: 1, unitPriceNaira: 0 })}
          className="text-sm text-brand-600 font-medium mt-2"
        >
          + Add item
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Repeats</label>
          <select
            {...register("frequency")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Starts on</label>
          <input
            type="date"
            {...register("startDate")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ends on (optional)</label>
        <input
          type="date"
          {...register("endDate")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register("autoSend")} className="rounded" />
        Send automatically (otherwise, generates as a draft for you to review)
      </label>

      {errorMessage && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-800 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create recurring invoice"}
      </button>
    </form>
  );
}