import { Resend } from 'resend';

/**
 * Lazily-instantiated Resend client for transactional email. Throws a clear
 * error when RESEND_API_KEY is missing so the app boots without email configured.
 */
let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      'Email is not configured. Set RESEND_API_KEY in your environment to send email.',
    );
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const FROM = process.env.EMAIL_FROM ?? 'Fashion Brand Builder <onboarding@resend.dev>';

/** Notify a designer that a tracked trend is accelerating. */
export async function sendTrendAlert(
  to: string,
  keyword: string,
  trendScore: number,
): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `📈 "${keyword}" is trending (score ${trendScore})`,
    html: `
      <h2>A trend you follow is heating up</h2>
      <p>The keyword <strong>${keyword}</strong> now has a trend score of
      <strong>${trendScore}/100</strong>.</p>
      <p>Consider creating or publishing a design around this trend while it climbs.</p>
    `,
  });
}

/** Send a basic order confirmation to a customer. */
export async function sendOrderConfirmation(
  to: string,
  orderId: string,
  totalAmount: number,
): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your order ${orderId} is confirmed`,
    html: `
      <h2>Thanks for your order!</h2>
      <p>Order <strong>${orderId}</strong> has been received.</p>
      <p>Total: <strong>€${totalAmount.toFixed(2)}</strong></p>
      <p>We'll email you again when it ships.</p>
    `,
  });
}
