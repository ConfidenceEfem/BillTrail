export function verificationEmailHtml(verifyUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Verify your BillTrail account</h2>
      <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
      <a href="${verifyUrl}" style="display:inline-block; padding:12px 24px; background:#111; color:#fff; text-decoration:none; border-radius:6px;">
        Verify email
      </a>
      <p style="color:#666; font-size:13px; margin-top:24px;">
        If the button doesn't work, copy this link: ${verifyUrl}
      </p>
    </div>
  `;
}

export function passwordResetEmailHtml(resetUrl: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your BillTrail password</h2>
      <p>Click the button below to set a new password. This link expires in 30 minutes.</p>
      <a href="${resetUrl}" style="display:inline-block; padding:12px 24px; background:#111; color:#fff; text-decoration:none; border-radius:6px;">
        Reset password
      </a>
      <p style="color:#666; font-size:13px; margin-top:24px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

export function invoiceSentEmailHtml(params: {
  businessName: string;
  invoiceNumber: string;
  totalFormatted: string;
  dueDateFormatted: string;
  payUrl: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>New invoice from ${params.businessName}</h2>
      <p>Invoice ${params.invoiceNumber} for <strong>${params.totalFormatted}</strong> is due on ${params.dueDateFormatted}.</p>
      <a href="${params.payUrl}" style="display:inline-block; padding:12px 24px; background:#111; color:#fff; text-decoration:none; border-radius:6px;">
        View and pay invoice
      </a>
    </div>
  `;
}