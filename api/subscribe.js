// Vercel serverless function: POST /api/subscribe
// Kit API v4 integration for the Bakify waitlist.
//
// Required Vercel environment variables:
//   KIT_API_KEY = a current Kit API v4 key
//   KIT_FORM_ID = either the numeric Kit form ID OR the form UID
//                 (for example: 811434f4a7)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KIT_API_BASE = 'https://api.kit.com/v4';

async function readJsonSafe(response) {
  return response.json().catch(() => ({}));
}

function kitHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'X-Kit-Api-Key': apiKey,
  };
}

async function resolveFormId(apiKey, configuredFormId) {
  const value = String(configuredFormId || '').trim();

  // Kit's API requires a numeric form ID. If Vercel already has one, use it.
  if (/^\d+$/.test(value)) {
    return value;
  }

  // Kit's editor/embed screens often expose the UID instead of the numeric ID.
  // Look up the user's forms and translate that UID to the required numeric ID.
  const response = await fetch(`${KIT_API_BASE}/forms?status=active&per_page=500`, {
    method: 'GET',
    headers: { 'X-Kit-Api-Key': apiKey },
  });
  const data = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error(`Could not list Kit forms (${response.status}): ${JSON.stringify(data)}`);
  }

  const forms = Array.isArray(data.forms) ? data.forms : [];
  const match = forms.find((form) => form.uid === value);

  if (!match || !match.id) {
    throw new Error(`No active Kit form was found with UID "${value}".`);
  }

  return String(match.id);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const email = String((body && body.email) || '').trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const apiKey = process.env.KIT_API_KEY;
  const configuredFormId = process.env.KIT_FORM_ID;

  if (!apiKey || !configuredFormId) {
    console.error('Missing KIT_API_KEY or KIT_FORM_ID environment variables.');
    res.status(500).json({
      error: 'Waitlist signup is not configured yet.',
    });
    return;
  }

  try {
    const formId = await resolveFormId(apiKey, configuredFormId);

    // Kit v4 requires the subscriber to exist before adding them to a form.
    // This endpoint is an upsert, so it also works for an existing subscriber.
    const createResponse = await fetch(`${KIT_API_BASE}/subscribers`, {
      method: 'POST',
      headers: kitHeaders(apiKey),
      body: JSON.stringify({
        email_address: email,
        state: 'active',
      }),
    });
    const createData = await readJsonSafe(createResponse);

    if (!createResponse.ok || !createData.subscriber?.id) {
      throw new Error(
        `Could not create/update Kit subscriber (${createResponse.status}): ${JSON.stringify(createData)}`,
      );
    }

    const subscriberId = createData.subscriber.id;
    const referrerHeader = req.headers.referer || req.headers.referrer;
    const referrer =
      typeof referrerHeader === 'string' && referrerHeader.trim()
        ? referrerHeader.trim().slice(0, 2048)
        : 'https://bakify-waitlist.vercel.app';

    const addResponse = await fetch(
      `${KIT_API_BASE}/forms/${formId}/subscribers/${subscriberId}`,
      {
        method: 'POST',
        headers: kitHeaders(apiKey),
        body: JSON.stringify({ referrer }),
      },
    );
    const addData = await readJsonSafe(addResponse);

    if (!addResponse.ok) {
      throw new Error(
        `Could not add subscriber to Kit form (${addResponse.status}): ${JSON.stringify(addData)}`,
      );
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Kit subscribe error:', error);
    res.status(502).json({
      error: 'Could not add you to the waitlist right now. Please try again shortly.',
    });
  }
};
