// Sends plain-text email through Brevo's HTTPS API (free tier, no SMTP port
// needed). Without BREVO_API_KEY and MAIL_FROM_EMAIL nothing is sent.
async function sendMail({ to, subject, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.MAIL_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    console.warn('[mail] BREVO_API_KEY or MAIL_FROM_EMAIL is not set, so no email was sent');
    return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: process.env.MAIL_FROM_NAME || 'Campus Parking', email: fromEmail },
        to: [{ email: to }],
        subject,
        textContent: text,
      }),
    });
    if (!response.ok) {
      console.error(`[mail] Brevo rejected the email (status ${response.status})`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[mail] could not reach Brevo: ${err.message}`);
    return false;
  }
}

module.exports = { sendMail };
