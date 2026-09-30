export type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number; 
};

export type CalculatedTotals = {
  items: Array<LineItemInput & { lineTotal: number }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
};

export function calculateInvoiceTotals(
  lineItems: LineItemInput[],
  taxRateBps: number,
  discountAmount: number,
): CalculatedTotals {
  const items = lineItems.map((item) => ({
    ...item,
    lineTotal: item.quantity * item.unitPrice,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);


  const taxAmount = Math.round((subtotal * taxRateBps) / 10_000);

  const cappedDiscount = Math.min(discountAmount, subtotal + taxAmount);

  const total = subtotal + taxAmount - cappedDiscount;

  return { items, subtotal, taxAmount, discountAmount: cappedDiscount, total };
}