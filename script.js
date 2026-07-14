document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('waitlist-form');
  const submitBtn = document.getElementById('submit-btn');
  const notice = document.getElementById('form-notice');
  const microcopy = document.getElementById('microcopy');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById('email-input');
    const email = emailInput.value.trim();

    notice.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      form.style.display = 'none';
      microcopy.style.display = 'none';

      notice.className = 'form-notice form-notice-success';
      notice.innerHTML = `
        <strong>Check your inbox.</strong>
        We sent your free Bakify resource link to <b>${escapeHtml(email)}</b>.
        Open the email and click the button to view the Starter Guide,
        cottage food law reference, and labeling checklist.
        <span class="notice-help">
          Delivery can take a minute or two. Please check Promotions or Spam if you do not see it.
        </span>
      `;
      notice.style.display = 'block';
    } catch (error) {
      notice.textContent =
        error.message || 'Something went wrong. Please try again.';
      notice.className = 'form-notice form-notice-error';
      notice.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send me the free guide';
    }
  });
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
