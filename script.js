// Bakify waitlist page behavior.
// STATE_LAWS, GUIDE_HTML, LABEL_HTML come from data.js (loaded before this file).

document.addEventListener('DOMContentLoaded', () => {
  // Populate static content panels
  document.getElementById('tab-guide').innerHTML = GUIDE_HTML;
  document.getElementById('tab-labels').innerHTML = LABEL_HTML;

  // Populate state dropdown
  const select = document.getElementById('state-select');
  const placeholder = document.createElement('option');
  placeholder.textContent = 'Choose your state…';
  placeholder.value = '';
  select.appendChild(placeholder);
  STATE_LAWS.forEach((s, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = s.state;
    select.appendChild(opt);
  });
  select.addEventListener('change', renderStateCard);

  function renderStateCard() {
    const container = document.getElementById('state-card-container');
    if (select.value === '') { container.innerHTML = ''; return; }
    const s = STATE_LAWS[Number(select.value)];
    container.innerHTML = `
      <div class="state-card">
        <h4>${s.state}</h4>
        ${s.permit ? `<div class="field"><b>Permit/registration:</b> ${s.permit}</div>` : ''}
        ${s.cap ? `<div class="field"><b>Annual sales cap:</b> ${s.cap}</div>` : ''}
        ${s.products ? `<div class="field"><b>What you can sell:</b> ${s.products}</div>` : ''}
        ${s.channels ? `<div class="field"><b>Where you can sell:</b> ${s.channels}</div>` : ''}
        ${s.label ? `<div class="field"><b>Label requirements:</b> ${s.label}</div>` : ''}
        ${s.inspectTrain ? `<div class="field"><b>Inspection/training:</b> ${s.inspectTrain}</div>` : ''}
        ${(!s.permit && !s.cap) ? `<div class="field">${s.details}</div>` : ''}
        <div class="field"><b>Sources:</b> ${s.sources}</div>
        <div class="state-note">Last verified July 2026. Laws change — confirm with your state agency before relying on this.</div>
      </div>
    `;
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Form submission
  const form = document.getElementById('waitlist-form');
  const submitBtn = document.getElementById('submit-btn');
  const errorMsg = document.getElementById('error-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value.trim();
    errorMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining…';

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      // Success: hide form, reveal resources
      form.style.display = 'none';
      document.getElementById('microcopy').style.display = 'none';
      document.getElementById('resources').style.display = 'block';
      document.getElementById('resources').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      errorMsg.textContent = err.message || 'Something went wrong. Please try again.';
      errorMsg.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Get free access';
    }
  });
});
