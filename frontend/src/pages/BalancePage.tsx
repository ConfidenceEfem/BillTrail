import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wallet, Trash2 } from "lucide-react";
import {
  getBalance,
  listBankAccounts,
  deleteBankAccount,
  requestWithdrawal,
  listWithdrawals,
} from "../api/withdrawals";
import { Modal } from "../components/Modal";
import { AddBankAccountForm } from "../components/AddBankAccountForm";
import { formatKobo } from "../lib/money";
import { usePrivacyStore } from "../store/privacyStore";
import { getErrorMessage } from "../lib/error";

const withdrawSchema = z.object({
  bankAccountId: z.string().min(1, "Select a bank account"),
  amountNaira: z.coerce.number().positive("Enter an amount"),
});
type WithdrawFormInput = z.input<typeof withdrawSchema>;
type WithdrawForm = z.output<typeof withdrawSchema>;

const statusStyles: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  PROCESSING: "bg-amber-100 text-amber-800",
  SUCCESS: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-700",
};

export function BalancePage() {
  const queryClient = useQueryClient();
  const amountsHidden = usePrivacyStore((state) => state.amountsHidden);
  const [showAddBank, setShowAddBank] = useState(false);

  const { data: balance } = useQuery({ queryKey: ["balance"], queryFn: getBalance });
  const { data: bankAccounts } = useQuery({ queryKey: ["bank-accounts"], queryFn: listBankAccounts });
  const { data: withdrawals } = useQuery({ queryKey: ["withdrawals"], queryFn: listWithdrawals });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } =  useForm<WithdrawFormInput, unknown, WithdrawForm>({ resolver: zodResolver(withdrawSchema) });

  const withdrawMutation = useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      toast.success("Withdrawal requested");
      reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBankAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Bank account removed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-medium text-gray-900 mb-6">Balance &amp; withdrawals</h1>

      <div className="bg-gradient-to-br from-accent-blue to-brand-800 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-2 mb-2 text-white/70 text-sm">
          <Wallet size={16} />
          Available balance
        </div>
        <p className="text-3xl font-semibold">
          {amountsHidden ? "••••••" : formatKobo(balance?.availableBalance ?? 0)}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Withdraw to bank</h2>

        {(!bankAccounts || bankAccounts.length === 0) && (
          <p className="text-sm text-gray-500 mb-3">Add a bank account before you can withdraw.</p>
        )}

        {bankAccounts && bankAccounts.length > 0 && (
          <form
            onSubmit={handleSubmit((values) => withdrawMutation.mutate(values))}
            className="flex flex-col gap-3 mb-2"
          >
            <select
              {...register("bankAccountId")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select account</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} &middot; {acc.accountNumber} ({acc.accountName})
                </option>
              ))}
            </select>
            {errors.bankAccountId && (
              <p className="text-xs text-red-600">{errors.bankAccountId.message}</p>
            )}

            <input
              type="number"
              placeholder="Amount (NGN)"
              {...register("amountNaira")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {errors.amountNaira && <p className="text-xs text-red-600">{errors.amountNaira.message}</p>}

            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="gradient-button text-white rounded-lg py-2 text-sm font-medium"
            >
              {withdrawMutation.isPending ? "Requesting..." : "Request withdrawal"}
            </button>
          </form>
        )}

        <button
          onClick={() => setShowAddBank(true)}
          className="text-sm text-brand-600 font-medium mt-2"
        >
          + Add a bank account
        </button>

        {bankAccounts && bankAccounts.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600"
              >
                <span>
                  {acc.bankName} &middot; {acc.accountNumber}
                </span>
                <button onClick={() => deleteMutation.mutate(acc.id)}   className="inline-block bg-brand-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-800">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-sm font-medium text-gray-900 mb-3">Withdrawal history</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {(!withdrawals || withdrawals.length === 0) && (
          <p className="text-sm text-gray-500 p-4">No withdrawals yet.</p>
        )}
        {withdrawals?.map((w) => (
          <div
            key={w.id}
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{formatKobo(w.amount)}</p>
              <p className="text-xs text-gray-500">{w.bankAccount.bankName}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[w.status]}`}>
              {w.status}
            </span>
          </div>
        ))}
      </div>

      {showAddBank && (
        <Modal title="Add bank account" onClose={() => setShowAddBank(false)}>
          <AddBankAccountForm
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
              setShowAddBank(false);
              toast.success("Bank account added");
            }}
          />
        </Modal>
      )}
    </div>
  );
}