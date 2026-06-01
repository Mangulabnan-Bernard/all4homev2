/**
 * Email sender. No SMTP is wired in this phase — when EMAIL_SERVER is unset the
 * message is logged to the server console (the reset link is still usable in
 * dev). Swap in nodemailer/Resend here without touching call sites.
 */
export async function sendResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!process.env.EMAIL_SERVER) {
    console.info(`[mail] Password reset for ${to}\n  ${resetUrl}`);
    return;
  }
  // TODO: real transport (nodemailer) when EMAIL_SERVER is configured.
  console.info(`[mail] (transport not implemented) reset for ${to}: ${resetUrl}`);
}
