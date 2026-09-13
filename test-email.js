const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error('Missing RESEND_API_KEY environment variable.');
}

fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${resendApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'Wakaf Masjid Istiqomah Gunma <noreply@masjid.tokyo>',
    to: process.env.TEST_EMAIL_TO || 'admin@example.com',
    subject: 'Test email Node.js - New API Key',
    html: '<p>Ini adalah test API Key baru. Jika ini masuk, API key valid dan siap digunakan.</p>'
  })
}).then(res => res.json()).then(data => console.log('Response:', data)).catch(e => console.error(e));
