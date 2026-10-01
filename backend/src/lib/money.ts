
export function formatKobo(amountKobo: number, currency = "NGN"): string {
  const naira = amountKobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(naira);
}