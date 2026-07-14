// Vercel serverless function: POST /api/subscribe
// Adds a visitor to the Bakify Kit form and lets Kit send the form's
// confirmation/resource email.
//
// Required Vercel environment variables:
//   KIT_API_KEY = current Kit API V4 key
//   KIT_FORM_ID = numeric Kit form ID OR the form UID, e.g. 811434f4a7

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KIT_API_BASE = 'https://api.kit.com/v4';

function normalizeEnvValue(value) {
  let result = String(value || '').trim();

  if (
    result.length >= 2 &&
    ((result.startsWith('"') && result.endsWith('"')) ||
      (result.startsWith("'") && result.endsWith("'")))
  ) {
    result = result.slice(1, -1).trim();
  }

  return result.replace(/[\r\n]/g, '');
}

function kitHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'X-Kit-Api-Key': apiKey,
  };
}

async function readJsonSafe(response) {
  return response.json().catch(() => ({}));
}

async function resolveFormId(apiKey, configuredFormId) {
  const value = normalizeEnvValue(configuredFormId);

  if (/^\d+$/.test(value)) {
    return value;
  }

  const response = await fetch(
    `${KIT_API_BASE}/forms?status=active&per_page=500`,
    {
      method: 'GET',
      headers: { 'X-Kit-Api-Key': apiKey },
    },
  );
  const data = await readJsonSafe(response);

  if (!response.ok) {
    throw new Error(
      `Could not list Kit forms (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  const forms = Array.isArray(data.forms) ? data.forms : [];
  const match = forms.find((form) => String(form.uid) === value);

  if (!match?.id) {
    throw new Error(`No active Kit form was found with UID "${value}".`);
  }

  return String(match.id);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
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

  const email = String(body?.email || '').trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }

  const apiKey = normalizeEnvValue(process.env.KIT_API_KEY);
  const configuredFormId = normalizeEnvValue(process.env.KIT_FORM_ID);

  if (!apiKey || !configuredFormId) {
    console.error('Missing KIT_API_KEY or KIT_FORM_ID.');
    res.status(500).json({ error: 'Waitlist signup is not configured yet.' });
    return;
  }

  try {
    const formId = await resolveFormId(apiKey, configuredFormId);

    // New subscribers are created as inactive first. This avoids pre-confirming
    // them in code and allows the Kit form's Confirmation Email settings to
    // control whether they are auto-confirmed or must click the email button.
    const createResponse = await fetch(`${KIT_API_BASE}/subscribers`, {
      method: 'POST',
      headers: kitHeaders(apiKey),
      body: JSON.stringify({
        email_address: email,
        state: 'inactive',
      }),
    });
    const createData = await readJsonSafe(createResponse);

    if (!createResponse.ok || !createData.subscriber?.id) {
      throw new Error(
        `Could not create Kit subscriber (${createResponse.status}): ${JSON.stringify(createData)}`,
      );
    }

    const rawReferrer = req.headers.referer || req.headers.referrer;
    const referrer =
      typeof rawReferrer === 'string' && rawReferrer.trim()
        ? rawReferrer.trim().slice(0, 2048)
        : 'https://bakify-waitlist.vercel.app';

    // Add the existing subscriber to the actual Kit form. Kit then applies the
    // form's Confirmation Email and Auto-confirm settings.
    const formResponse = await fetch(
      `${KIT_API_BASE}/forms/${formId}/subscribers`,
      {
        method: 'POST',
        headers: kitHeaders(apiKey),
        body: JSON.stringify({
          email_address: email,
          referrer,
        }),
      },
    );
    const formData = await readJsonSafe(formResponse);

    if (!formResponse.ok) {
      throw new Error(
        `Could not add subscriber to Kit form (${formResponse.status}): ${JSON.stringify(formData)}`,
      );
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Kit subscribe error:', error);
    res.status(502).json({
      error: 'Could not join the waitlist right now. Please try again shortly.',
    });
  }
};
