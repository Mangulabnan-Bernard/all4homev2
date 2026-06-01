"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validators/user";
import { requireUser } from "@/lib/permissions/guard";
import { ok, fail, failFrom, type Result } from "@/lib/result";

/** User updates their own account profile (name/phone/address/image). */
export async function updateUserProfileAction(input: unknown): Promise<Result<null>> {
  try {
    const user = await requireUser();
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", "Please fix the errors below.", parsed.error.flatten().fieldErrors);
    }
    const { name, phone, address, image } = parsed.data;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(image !== undefined ? { image } : {}),
      },
    });
    revalidatePath("/customer/profile");
    revalidatePath("/provider/profile");
    return ok(null);
  } catch (e) {
    return failFrom(e);
  }
}
