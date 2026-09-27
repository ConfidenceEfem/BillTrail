import { registerBusiness } from "./modules/auth/auth.service";
import { registerSchema } from "./modules/auth/auth.validation";
import { prisma } from "./lib/prisma";

async function main() {
  const input = registerSchema.parse({
    businessName: "Ada Designs",
    email: `ada+${Date.now()}@example.com`, // unique each run, so you can re-run this freely
    password: "supersecret123",
  });

  const user = await registerBusiness(input);
  console.log("created:", user);

  // Try registering the SAME email again, to confirm the duplicate check works.
  try {
    await registerBusiness(input);
    console.log("ERROR: duplicate registration did not throw!");
  } catch (err) {
    console.log("duplicate correctly rejected:", (err as Error).message);
  }
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());