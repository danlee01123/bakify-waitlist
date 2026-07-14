// Vercel serverless function: POST /api/subscribe
// Adds an email to your Kit (formerly ConvertKit) form so you actually own
// and can email the waitlist. Free on Kit's free plan up to 10,000 subscribers.
//
// Setup (see README.md for full walkthrough):
//   1. Create a free account at kit.com (ConvertKit).
//   2. Create a form (e.g. "Bakify Waitlist") and note its Form ID from the
//      form's embed/settings page.
//   3. In your Kit account settings, grab your API Key (v3 API).
//   4. In your Vercel project settings, add two Environment Variables:
//        KIT_API_KEY      = your API key
//        KIT_FORM_ID      = your form's numeric ID
//   5. Redeploy. Submissions will now land in that Kit form/tag, and you can
//      set up a Kit automation there to auto-email the guide on signup.
//
// Until those env vars are set, this function returns a clear error instead
// of silently failing, so it's obvious in testing that setup isn't done yet.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const email = (body && body.email || '').trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const apiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_FORM_ID;

  if (!apiKey || !formId) {
    console.error('Missing KIT_API_KEY or KIT_FORM_ID environment variables.');
    res.status(500).json({
      error: 'Waitlist signup isn\'t configured yet — missing Kit API credentials. See README.md.',
    });
    return;
  }

  try {
    const kitRes = await fetch(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, email }),
    });

    const kitData = await kitRes.json().catch(() => ({}));

    if (!kitRes.ok) {
      console.error('Kit API error:', kitData);
      res.status(502).json({ error: 'Could not add you to the waitlist right now. Please try again shortly.' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Subscribe handler error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
