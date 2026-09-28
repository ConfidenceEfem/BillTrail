import { login, registerBusiness, verifyEmail } from "../src/modules/auth/auth.service";

export function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}


export async function createAuthedUser(businessName = "Test Business") {
  const email = uniqueEmail();
  const password = "supersecret123";

  const { user, verificationToken } = await registerBusiness({ businessName, email, password });
  await verifyEmail(verificationToken);
  const { accessToken } = await login(email, password);

  return {
    email,
    businessId: user.business!.id,
    authHeader: `Bearer ${accessToken}`,
  };
}