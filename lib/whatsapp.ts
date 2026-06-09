type WhatsAppSendInput = {
  to: string;
  body: string;
};

function getWhatsappConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.WHATSAPP_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }

  return {
    accountSid,
    authToken,
    fromNumber: ensureWhatsappPrefix(fromNumber)
  };
}

export function hasWhatsappTransport() {
  return Boolean(getWhatsappConfig());
}

export async function sendWhatsappMessage({ to, body }: WhatsAppSendInput) {
  const config = getWhatsappConfig();
  if (!config) {
    return { sent: false as const, reason: "WhatsApp transport is not configured." };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      From: config.fromNumber,
      To: ensureWhatsappPrefix(to),
      Body: body
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${text}`);
  }

  const data = await response.json() as { sid?: string };
  return { sent: true as const, sid: data.sid ?? "" };
}

function ensureWhatsappPrefix(value: string) {
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}
