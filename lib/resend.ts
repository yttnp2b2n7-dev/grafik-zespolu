import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    client = new Resend(apiKey);
  }
  return client;
}

// Falls back to Resend's own shared test domain so sending still works
// before a custom domain is verified.
export function getReportFromAddress(): string {
  return process.env.REPORT_FROM_EMAIL ?? "Grafik ImpactVision <onboarding@resend.dev>";
}
