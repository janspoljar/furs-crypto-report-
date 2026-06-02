import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendProWelcomeEmail(params: {
  to: string;
  validUntil: string; // ISO string
}): Promise<void> {
  const formattedDate = new Date(params.validUntil).toLocaleDateString("sl-SI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (!resend) {
    console.log("[email] RESEND_API_KEY not set — skipping email. Would send Pro welcome to:", params.to, "valid until:", formattedDate);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://davkinadelnicah.si";

  const html = `<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DavkiNaDelnicah Pro je aktiviran</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:-apple-system,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td style="background:#0F1A19;border-radius:10px 10px 0 0;padding:20px 32px;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                Davki<span style="color:#01696F;">NaDelnicah</span>.si
              </span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px 32px;border-radius:0 0 10px 10px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F1A19;">Hvala za zaupanje!</h1>
              <p style="margin:0 0 20px;font-size:15px;color:#4B5563;line-height:1.6;">
                Vaš Pro račun je aktiviran in vam omogoča:
              </p>
              <ul style="margin:0 0 24px;padding:0;list-style:none;">
                <li style="padding:6px 0;font-size:14.5px;color:#1F2937;line-height:1.5;">
                  <span style="color:#01696F;font-weight:700;margin-right:8px;">✓</span>Neomejene transakcije in uvozi
                </li>
                <li style="padding:6px 0;font-size:14.5px;color:#1F2937;line-height:1.5;">
                  <span style="color:#01696F;font-weight:700;margin-right:8px;">✓</span>DOH-KDVP XML izvoz za eDavki
                </li>
                <li style="padding:6px 0;font-size:14.5px;color:#1F2937;line-height:1.5;">
                  <span style="color:#01696F;font-weight:700;margin-right:8px;">✓</span>DOH-DIV poročilo za dividende
                </li>
                <li style="padding:6px 0;font-size:14.5px;color:#1F2937;line-height:1.5;">
                  <span style="color:#01696F;font-weight:700;margin-right:8px;">✓</span>Multi-leto FIFO analiza
                </li>
                <li style="padding:6px 0;font-size:14.5px;color:#1F2937;line-height:1.5;">
                  <span style="color:#01696F;font-weight:700;margin-right:8px;">✓</span>XML semantična validacija pred oddajo
                </li>
              </ul>
              <p style="margin:0 0 28px;font-size:14.5px;color:#4B5563;">
                Naročnina velja do: <strong style="color:#0F1A19;">${formattedDate}</strong>
              </p>
              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#01696F;border-radius:8px;">
                    <a href="${appUrl}/reports"
                       style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                      Odpri poročila →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Footer -->
              <p style="margin:0 0 6px;font-size:12.5px;color:#9CA3AF;border-top:1px solid #F3F4F6;padding-top:20px;">
                DavkiNaDelnicah.si | <a href="mailto:podpora@davkinadelnicah.si" style="color:#9CA3AF;">podpora@davkinadelnicah.si</a>
              </p>
              <p style="margin:0;font-size:11.5px;color:#D1D5DB;">
                To sporočilo ste prejeli, ker ste aktivirali Pro naročnino.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: "DavkiNaDelnicah.si <noreply@davkinadelnicah.si>",
    to: params.to,
    subject: "DavkiNaDelnicah Pro je aktiviran ✓",
    html,
  });
}
