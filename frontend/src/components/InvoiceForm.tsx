import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Client } from "../api/clients";
import { formatKobo } from "../lib/money";
import { Trash } from "lucide-react";




const lineItemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.coerce.number().int().positive("Must be at least 1"),
  unitPriceNaira: z.coerce.number().positive("Must be greater than 0"),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  items: z.array(lineItemSchema).min(1, "Add at least one item"),
  taxRatePercent: z.coerce.number().min(0).max(100),
  discountNaira: z.coerce.number().min(0),
  dueDate: z.string().min(1, "Required"),
});
type InvoiceFormInput = z.input<typeof invoiceSchema>;
export type InvoiceFormValues = z.output<typeof invoiceSchema>;

type InvoiceFormProps = {
  clients: Client[];
  onSubmit: (values: InvoiceFormValues) => void;
  isPending: boolean;
  errorMessage?: string;
};

export function InvoiceForm({ clients, onSubmit, isPending, errorMessage }: InvoiceFormProps) {
const {
  register,
  control,
  handleSubmit,
  watch,
  formState: { errors },
} = useForm<InvoiceFormInput, unknown, InvoiceFormValues>({
  resolver: zodResolver(invoiceSchema),
  defaultValues: {
    items: [{ description: "", quantity: 1, unitPriceNaira: 0 }],
    taxRatePercent: 0,
    discountNaira: 0,
  },
});

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watched = watch();
  const subtotalNaira = watched.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPriceNaira) || 0),
    0,
  );
  const taxNaira = subtotalNaira * ((Number(watched.taxRatePercent) || 0) / 100);
  const discountNaira = Math.min(Number(watched.discountNaira) || 0, subtotalNaira + taxNaira);
  const totalNaira = subtotalNaira + taxNaira - discountNaira;

  function submit(values: InvoiceFormValues) {
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-5">
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
        <div className="flex flex-col gap-3">
      
          {fields.map((field, index) => (
  <div key={field.id} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">Item {index + 1}</span>
      <button
        type="button"
        onClick={() => remove(index)}
        disabled={fields.length === 1}
        className=" text-red-300 cursor-pointer hover:text-[red] disabled:opacity-30 text-sm"
      >
        <Trash />
      </button>
    </div>
    <input
      placeholder="Description"
      {...register(`items.${index}.description`)}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
    />
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Quantity</label>
        <input
          type="number"
          {...register(`items.${index}.quantity`)}
          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Unit price (NGN)</label>
        <input
          type="number"
          {...register(`items.${index}.unitPriceNaira`)}
          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
        />
      </div>
    </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax rate (%)</label>
          <input
            type="number"
            {...register("taxRatePercent")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount (NGN)</label>
          <input
            type="number"
            {...register("discountNaira")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
        <input
          type="date"
          {...register("dueDate")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        {errors.dueDate && <p className="text-xs text-red-600 mt-1">{errors.dueDate.message}</p>}
      </div>

      <div className="bg-brand-50 rounded-xl p-4 text-sm flex flex-col gap-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>{formatKobo(Math.round(subtotalNaira * 100))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span>{formatKobo(Math.round(taxNaira * 100))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Discount</span>
          <span>-{formatKobo(Math.round(discountNaira * 100))}</span>
        </div>
        <div className="flex justify-between font-medium text-brand-800 pt-1 border-t border-brand-100 mt-1">
          <span>Total</span>
          <span>{formatKobo(Math.round(totalNaira * 100))}</span>
        </div>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-800 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create invoice"}
      </button>
    </form>
  );
}