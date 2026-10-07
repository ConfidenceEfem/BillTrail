import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getBanks, previewBankAccount, saveBankAccount, type ResolvedAccount } from "../api/withdrawals";
import { getErrorMessage } from "../lib/error";

type Props = {
  onSaved: () => void;
};

export function AddBankAccountForm({ onSaved }: Props) {
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [resolved, setResolved] = useState<ResolvedAccount | null>(null);

  const { data: banks } = useQuery({ queryKey: ["banks"], queryFn: getBanks });

  const previewMutation = useMutation({
    mutationFn: () => previewBankAccount(accountNumber, bankCode),
    onSuccess: (data) => setResolved(data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const bankName = banks?.find((b) => b.code === bankCode)?.name ?? "";
      return saveBankAccount({ accountNumber, bankCode, bankName });
    },
    onSuccess: onSaved,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
        <select
          value={bankCode}
          onChange={(e) => {
            setBankCode(e.target.value);
            setResolved(null);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select a bank</option>
          {banks?.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Account number</label>
        <input
          value={accountNumber}
          onChange={(e) => {
            setAccountNumber(e.target.value);
            setResolved(null);
          }}
          maxLength={10}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {!resolved && (
        <button
          onClick={() => previewMutation.mutate()}
          disabled={previewMutation.isPending || !bankCode || accountNumber.length !== 10}
          // className="border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            className="inline-block bg-brand-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-800"
        >
          {previewMutation.isPending ? "Verifying..." : "Verify account"}
        </button>
      )}

      {previewMutation.isError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {getErrorMessage(previewMutation.error)}
        </p>
      )}

      {resolved && (
        <>
          <div className="bg-green-50 rounded-lg px-4 py-3 text-sm">
            <p className="text-green-800 font-medium">{resolved.account_name}</p>
            <p className="text-green-600 text-xs">Confirm this is the correct account</p>
          </div>
          {saveMutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {getErrorMessage(saveMutation.error)}
            </p>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            // className="gradient-button text-white rounded-lg py-2 text-sm font-medium"
              className="inline-block bg-brand-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-800"
          >
            {saveMutation.isPending ? "Saving..." : "Save this account"}
          </button>
        </>
      )}
    </div>
  );
}