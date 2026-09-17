const API_URL = "https://api2.serwersms.pl/messages/send_sms.json";

export type SendSmsResult = {
  success: boolean;
  queued: number;
  unsent: number;
};

export async function sendBulkSms(
  phones: string[],
  text: string
): Promise<SendSmsResult> {
  const token = process.env.SERWERSMS_API_TOKEN;
  if (!token) {
    throw new Error("SERWERSMS_API_TOKEN is not set");
  }

  const params = new URLSearchParams();
  for (const phone of phones) params.append("phone[]", phone);
  params.set("text", text);
  params.set("utf", "true");
  params.set("details", "true");
  // A predefined, pre-authorized sender name - without one, messages default
  // to SMS ECO, which this account isn't permitted to send.
  params.set("sender", process.env.SERWERSMS_SENDER ?? "PRZYPOMINAM");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok || data.success === false || data.error) {
    const message =
      typeof data.error === "object" ? data.error?.message : data.error;
    throw new Error(message ?? `SerwerSMS.pl error (HTTP ${res.status})`);
  }
  return { success: data.success, queued: data.queued, unsent: data.unsent };
}
