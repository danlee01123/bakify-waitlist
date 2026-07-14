const ACCESS_KEY = 'bakify_resource_access';

function requireResourceAccess() {
  const params = new URLSearchParams(window.location.search);

  // Set Kit's confirmation-email redirect to:
  // https://bakify-waitlist.vercel.app/resources?verified=1
  if (params.get('verified') === '1') {
    localStorage.setItem(ACCESS_KEY, 'granted');
    history.replaceState({}, '', window.location.pathname);
    return true;
  }

  if (localStorage.getItem(ACCESS_KEY) !== 'granted') {
    window.location.replace('/');
    return false;
  }

  return true;
}

function renderArticle(html) {
  const container = document.getElementById('article-content');
  if (container) container.innerHTML = html;
}

function setupLibrary() {
  const banner = document.getElementById('welcome-banner');
  const isWelcome = new URLSearchParams(window.location.search).get('welcome') === '1';

  if (!isWelcome && banner) banner.style.display = 'none';

  const dismiss = document.getElementById('dismiss-welcome');
  if (dismiss && banner) {
    dismiss.addEventListener('click', () => {
      banner.style.display = 'none';
      history.replaceState({}, '', '/resources');
    });
  }
}

function setupLaws() {
  const select = document.getElementById('state-select');
  const container = document.getElementById('state-card-container');
  if (!select || !container || !Array.isArray(STATE_LAWS)) return;

  STATE_LAWS.forEach((state, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = state.state;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    if (select.value === '') {
      container.innerHTML = '';
      return;
    }

    const state = STATE_LAWS[Number(select.value)];
    container.innerHTML = `
      <section class="state-result">
        <div class="state-result-header">
          <div>
            <div class="eyebrow">Your state</div>
            <h2>${state.state}</h2>
          </div>
          <span class="verified-pill">Verified July 2026</span>
        </div>
        <div class="law-grid">
          ${state.permit ? `<div class="law-field"><span>Permit or registration</span><p>${state.permit}</p></div>` : ''}
          ${state.cap ? `<div class="law-field"><span>Annual sales cap</span><p>${state.cap}</p></div>` : ''}
          ${state.products ? `<div class="law-field"><span>What you can sell</span><p>${state.products}</p></div>` : ''}
          ${state.channels ? `<div class="law-field"><span>Where you can sell</span><p>${state.channels}</p></div>` : ''}
          ${state.label ? `<div class="law-field"><span>Label requirements</span><p>${state.label}</p></div>` : ''}
          ${state.inspectTrain ? `<div class="law-field"><span>Inspection or training</span><p>${state.inspectTrain}</p></div>` : ''}
        </div>
        <div class="source-block"><strong>Sources:</strong> ${state.sources}</div>
        <p class="state-note">Laws change. Confirm financially or legally important details directly with your state agency before relying on them.</p>
      </section>
    `;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireResourceAccess()) return;

  const page = document.body.dataset.resourcePage;

  if (page === 'library') setupLibrary();
  if (page === 'guide') renderArticle(GUIDE_HTML);
  if (page === 'labeling') renderArticle(LABEL_HTML);
  if (page === 'laws') setupLaws();
});
