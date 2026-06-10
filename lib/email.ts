type EmailSendInput = {
  to: string;
  subject: string;
  text: string;
};

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || process.env.FALLBACK_EMAIL_FROM;
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

export function hasEmailTransport() {
  return Boolean(getEmailConfig());
}

export async function sendFallbackEmail({ to, subject, text }: EmailSendInput) {
  const config = getEmailConfig();
  if (!config) {
    return { sent: false as const, reason: "Email transport is not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: config.from,
      to: [to],
      subject,
      text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email send failed: ${response.status} ${errorText}`);
  }

  const data = await response.json() as { id?: string };
  return { sent: true as const, id: data.id ?? "" };
}
