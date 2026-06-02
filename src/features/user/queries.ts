import { prisma } from "@/lib/prisma";

export interface MyAccount {
  name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  image: string | null;
  darkMode: boolean;
}

/** The signed-in user's own editable account fields (for the profile form). */
export async function getMyAccount(userId: string): Promise<MyAccount | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, phone: true, address: true, image: true, darkMode: true },
  });
}
