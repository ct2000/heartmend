/* HeartMend PWA v2 - private local coping companion */
const STORE_KEY = 'heartmend.state.v2';
const LEGACY_KEY = 'heartmend.state.v1';
const todayISO = () => new Date().toISOString().slice(0, 10);
const nowISO = () => new Date().toISOString();

const MANTRAS = [
  'A wave is not a command.',
  'No contact is not punishment. It is protection.',
  'I can feel regret without becoming shame.',
  'Let them have their choices. Let me choose my next step.',
  'I only need to do the next kind thing.',
  'Heartbroken and functional is enough today.',
  'Missing them is not an instruction to message them.',
  'The calmer version of me gets to decide.'
];

const ANCHORS = [
  { id: 'water', label: 'Drink water', hint: 'One glass counts.' },
  { id: 'food', label: 'Eat something real', hint: 'Toast, yoghurt, soup, fruit, anything gentle.' },
  { id: 'wash', label: 'Wash face or shower', hint: 'A body reset, not a glow-up requirement.' },
  { id: 'outside', label: 'Step outside or open a window', hint: 'Three minutes is valid.' },
  { id: 'nocontact', label: 'Protect no contact', hint: 'No message, no social checking, no rereading.' },
  { id: 'connection', label: 'One safe human contact', hint: 'Friend, colleague, family, therapist, support line.' },
  { id: 'sleep', label: 'Prepare for sleep gently', hint: 'Phone away, water, low stimulation.' }
];

const PROMPTS = [
  'What am I feeling right now, without judging it?',
  'What am I trying to control that is not mine to control?',
  'What am I proud of myself for not doing today?',
  'What did I need today that I did not know how to ask for?',
  'What is one thing I regret, and what would the healthier version of me do next time?',
  'The story my shame is telling me is… A kinder, truer story is…',
  'What am I missing: the person, the routine, the hope, or the relief?',
  'Three things that make me me are…',
  'What would I tell a close friend who felt this?',
  'Tonight, a soft landing would look like…'
];

const PATH_DAYS = [
  ['Survive the day', 'Eat something, drink water, no contact, sleep as best you can.'],
  ['Make the boundary visible', 'Write your no-contact reason and put it somewhere easy to see.'],
  ['Build your urge plan', 'Choose three things you will do before any message: delay, move, contact safe person.'],
  ['Name the real emotion', 'Separate sadness, shame, anger, jealousy, loneliness, and fear.'],
  ['Create your reality list', 'Record what hurt, what was unsafe, or what cannot continue.'],
  ['Make mornings less brutal', 'Create a 15-minute morning routine that belongs to you.'],
  ['First milestone review', 'Notice one way the intensity shifted, even slightly.'],
  ['Shame versus accountability', 'Write what you own without calling yourself names.'],
  ['Social media guard', 'Decide your rules around checking, muting, blocking, or deleting shortcuts.'],
  ['Body repair day', 'Walk, stretch, shower, eat, hydrate. Physical basics are emotional care.'],
  ['Loneliness plan', 'Make a safer connection list for evenings and weekends.'],
  ['Thought challenge', 'Pick one painful belief and test it against evidence.'],
  ['Identity snapshot', 'List five things that are yours outside the relationship.'],
  ['Two-week checkpoint', 'What has helped? What keeps reopening the wound? Adjust the plan.'],
  ['Trigger map', 'Log the places, songs, times, and situations that spike you.'],
  ['Work focus reset', 'Create a minimum viable workday plan for hard mornings.'],
  ['Repair without chasing', 'Write an apology you do not send, focused on future behaviour.'],
  ['Standards, not stories', 'Define what love must feel like in your body: safe, kind, steady, mutual.'],
  ['Clean one small corner', 'Make one part of your space feel less haunted.'],
  ['Ask for support', 'Tell one trusted person what kind of help actually helps.'],
  ['Three-week checkpoint', 'Compare today with day one. Do not demand perfection.'],
  ['Values day', 'Choose three values you want to live by during heartbreak.'],
  ['Anger as information', 'Let anger point to a boundary or unmet need, not revenge.'],
  ['Grief permission', 'Give yourself a timed grief window without acting from it.'],
  ['Future self note', 'Write from the version of you who got through this.'],
  ['Rebuild pleasure gently', 'Do one small thing that is not about the relationship.'],
  ['Relapse prevention', 'Plan what you will do if contact happens or you see something painful.'],
  ['Compassionate accountability', 'Review one trigger and design a better response.'],
  ['Prepare the next month', 'Choose routines, boundaries, and support for the next 30 days.'],
  ['Month-one ceremony', 'Mark that you kept going. Quietly counts.']
];

const DEFAULT_STATE = {
  profile: {
    name: 'Lee',
    noContactStart: '',
    personalReason: 'I am protecting both of us and becoming someone I am proud of.',
    thinkingWindow: '19:00',
    noContactRule: 'No messages, no checking socials, no rereading old conversations when I am activated.'
  },
  anchors: { date: todayISO(), checked: {} },
  moodLogs: [],
  urges: [],
  journals: [],
  tasks: { date: todayISO(), must: [], extra: [], wait: [] },
  supportContacts: [],
  calmHistory: [],
  voidMessages: [],
  realityItems: [],
  accountability: [],
  contactSlips: [],
  pathCompleted: {},
  installDismissed: false
};

let state = loadState();
let activeRoute = 'today';
let deferredInstallPrompt = null;
let activeTimer = null;
let activeBreath = null;

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (!raw) return clone(DEFAULT_STATE);
    return mergeDeep(clone(DEFAULT_STATE), JSON.parse(raw));
  } catch (err) {
    console.warn('Could not load state', err);
    return clone(DEFAULT_STATE);
  }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function mergeDeep(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) target[key] = mergeDeep(target[key] || {}, value);
    else target[key] = value;
  }
  return target;
}
function $(selector, root = document) { return root.querySelector(selector); }
function $all(selector, root = document) { return [...root.querySelectorAll(selector)]; }
function escapeHTML(value = '') { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char])); }
function uid(prefix = 'id') { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function byNewest(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }
function formatDateTime(iso) { return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)); }
function formatDate(iso) { return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso)); }
function daysSince(dateStr) {
  if (!dateStr) return 0;
  const start = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  return Math.max(0, Math.floor((now - start) / 86400000) + 1);
}
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  $('#toastRegion').appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}
function stopTimers() {
  if (activeTimer) clearInterval(activeTimer);
  if (activeBreath) clearInterval(activeBreath);
  activeTimer = null;
  activeBreath = null;
}
function resetDailyIfNeeded() {
  const today = todayISO();
  if (state.anchors.date !== today) state.anchors = { date: today, checked: {} };
  if (state.tasks.date !== today) state.tasks = { date: today, must: [], extra: [], wait: [] };
  saveState();
}
function anchorProgress() {
  const done = ANCHORS.filter(item => state.anchors.checked[item.id]).length;
  return { done, total: ANCHORS.length, pct: Math.round((done / ANCHORS.length) * 100) };
}
function latestMood() { return [...state.moodLogs].sort(byNewest)[0]; }
function latestUrge() { return [...state.urges].sort(byNewest)[0]; }
function pathProgress() {
  const done = Object.values(state.pathCompleted || {}).filter(Boolean).length;
  return { done, total: PATH_DAYS.length, pct: Math.round((done / PATH_DAYS.length) * 100) };
}

function init() {
  resetDailyIfNeeded();
  $('#todayDate').textContent = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  $('#sidebarMantra').textContent = MANTRAS[new Date().getDate() % MANTRAS.length];
  $('#menuButton').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  window.addEventListener('hashchange', renderRoute);
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('submit', handleFormSubmit);
  document.addEventListener('input', handleInput);
  registerServiceWorker();
  setupInstall();
  renderRoute();
}
function registerServiceWorker() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(err => console.warn('Service worker registration failed', err));
}
function setupInstall() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (!state.installDismissed) $('#installButton').hidden = false;
  });
  $('#installButton').addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $('#installButton').hidden = true;
  });
}

function renderRoute() {
  stopTimers();
  document.body.classList.remove('nav-open');
  activeRoute = (location.hash || '#today').replace('#', '') || 'today';
  const routeMap = {
    today: ['Today', renderToday],
    panic: ['Panic Room', renderPanicRoom],
    nocontact: ['No Contact', renderNoContact],
    void: ['The Void', renderVoid],
    path: ['30-Day Path', renderPath],
    reality: ['Reality List', renderReality],
    accountability: ['Accountability', renderAccountability],
    calm: ['Calm Now', renderCalm],
    work: ['Work Mode', renderWork],
    journal: ['Journal', renderJournal],
    progress: ['Progress', renderProgress],
    safety: ['Safety', renderSafety],
    settings: ['Settings', renderSettings]
  };
  const [title, renderer] = routeMap[activeRoute] || routeMap.today;
  $('#pageTitle').textContent = title;
  $all('#navList a').forEach(a => a.classList.toggle('active', a.dataset.route === activeRoute));
  $('#main').innerHTML = renderer();
  afterRender(activeRoute);
}
function afterRender(route) {
  if (route === 'today') bindMoodRange();
  if (route === 'calm' || route === 'panic') bindCalmTools();
  if (route === 'work') bindWorkTimer();
}

function quickCard(type, title, text) { return `<button class="quick-card" data-quick="${type}"><strong>${title}</strong><span>${text}</span></button>`; }
function kpi(value, label) { return `<div class="kpi"><strong>${value}</strong><span class="muted">${label}</span></div>`; }
function tag(text, tone = '') { return `<span class="pill ${tone}">${escapeHTML(text)}</span>`; }

function renderToday() {
  const progress = anchorProgress();
  const mood = latestMood();
  const streak = daysSince(state.profile.noContactStart);
  const path = pathProgress();
  return `
    <section class="hero">
      <div class="card hero-card">
        <p class="eyebrow">Welcome back${state.profile.name ? `, ${escapeHTML(state.profile.name)}` : ''}</p>
        <h2>Today is about keeping you steady, not solving the whole heartbreak.</h2>
        <p>Use HeartMend like a pocket handrail: one breath, one boundary, one small action at a time.</p>
        <div class="button-row">
          <a href="#panic" class="button">Panic button</a>
          <button class="secondary-button" data-open-urge>Urge to contact</button>
          <a href="#void" class="button secondary-button">Write, don’t send</a>
        </div>
      </div>
      <div class="card center">
        <p class="tiny-title">No-contact streak</p>
        <p class="big-number">${streak || '—'}</p>
        <p class="stat-label">${streak ? `day${streak === 1 ? '' : 's'} protected` : 'Set your start date in No Contact'}</p>
        <div class="progress-bar"><span style="width:${progress.pct}%"></span></div>
        <p class="small muted">Daily anchors: ${progress.done}/${progress.total} • Path: ${path.done}/${path.total}</p>
      </div>
    </section>

    <section class="grid two" style="margin-top:1rem">
      <div class="card">
        <div class="spread">
          <div><p class="tiny-title">Daily check-in</p><h2>How intense is it right now?</h2></div>
          ${mood ? `<span class="pill">Last: ${escapeHTML(mood.intensity)}/10</span>` : ''}
        </div>
        <form id="moodForm" class="stack" data-form="mood">
          <label><span>Emotional intensity: <strong id="moodValue">5</strong>/10</span><input type="range" name="intensity" min="1" max="10" value="5" /></label>
          <label><span>What word fits best?</span><select name="emotion"><option>Sad</option><option>Anxious</option><option>Guilty</option><option>Lonely</option><option>Angry</option><option>Numb</option><option>Jealous</option><option>Ashamed</option><option>Hopeful</option><option>Fragile</option></select></label>
          <div class="grid two compact-grid"><label><span>Sleep</span><select name="sleep"><option>Okay</option><option>Poor</option><option>Broken</option><option>None</option></select></label><label><span>Urge to contact</span><select name="urgeLevel"><option>Low</option><option>Medium</option><option>High</option><option>Severe</option></select></label></div>
          <label><span>One sentence, no polishing</span><input name="note" placeholder="e.g. I miss them and I feel ashamed." /></label>
          <button type="submit">Save check-in</button>
        </form>
      </div>
      <div class="card">
        <div class="spread"><div><p class="tiny-title">Daily anchors</p><h2>Small things that keep you from sinking</h2></div><span class="pill green">${progress.pct}%</span></div>
        <div class="checkbox-list">
          ${ANCHORS.map(anchor => `<label class="check-row ${state.anchors.checked[anchor.id] ? 'done' : ''}"><input type="checkbox" data-anchor="${anchor.id}" ${state.anchors.checked[anchor.id] ? 'checked' : ''} /><span><strong>${anchor.label}</strong><br><small class="muted">${anchor.hint}</small></span></label>`).join('')}
        </div>
      </div>
    </section>

    <section class="card" style="margin-top:1rem">
      <p class="tiny-title">What do you need?</p>
      <h2>Pick the tool that matches the wave</h2>
      <div class="grid three">
        ${quickCard('panic', 'Panic wave', 'Lower the body alarm first.')}
        ${quickCard('urge', 'I want to message', 'Delay, log, write privately.')}
        ${quickCard('shame', 'Shame spiral', 'Accountability without self-attack.')}
        ${quickCard('lonely', 'Loneliness', 'Find safer connection.')}
        ${quickCard('focus', 'Work focus', 'Minimum viable work today.')}
        ${quickCard('sleep', 'Bedtime reset', 'Let the day end gently.')}
      </div>
    </section>

    <section class="grid two" style="margin-top:1rem">
      <div class="card soft">
        <p class="tiny-title">Thinking window</p>
        <h2>“Not now. I’ll think about this at ${escapeHTML(state.profile.thinkingWindow || '19:00')}.”</h2>
        <p class="muted">You are not denying the feelings. You are containing them so they do not run your whole day.</p>
        <button class="secondary-button" data-quick-journal="Thinking window">Write the one line</button>
      </div>
      <div class="card">
        <p class="tiny-title">Latest logs</p>
        <div class="timeline">${renderTinyTimeline([mood, latestUrge()].filter(Boolean))}</div>
      </div>
    </section>`;
}
function renderTinyTimeline(items) {
  if (!items.length) return '<p class="muted">No logs yet. First one takes thirty seconds.</p>';
  return items.map(item => `<div class="timeline-item"><strong>${escapeHTML(item.type || item.emotion || 'Log')}</strong><time>${formatDateTime(item.createdAt)}</time><p class="small muted">${escapeHTML(item.note || item.trigger || '')}</p></div>`).join('');
}

function renderPanicRoom() {
  return `
    <section class="card hero-card">
      <p class="eyebrow">One-tap emergency support</p>
      <h2>Do not negotiate with panic. Regulate first, decide later.</h2>
      <p>Use this room when you feel desperate, ashamed, jealous, lonely, or close to contacting them.</p>
      <div class="button-row"><button data-open-urge>I might message them</button><a href="#safety" class="button secondary-button">I feel unsafe</a></div>
    </section>
    <section class="grid three" style="margin-top:1rem">
      <div class="card"><p class="tiny-title">Step 1</p><h2>Name the wave</h2><p>Say out loud: “This is grief. This is shame. This is loneliness. It is painful, but it is not an instruction.”</p><button data-log-calm="Named the wave">Done</button></div>
      <div class="card"><p class="tiny-title">Step 2</p><h2>Cool the body</h2><p>Cold water on hands or face for 30 seconds. It gives the alarm system something physical to respond to.</p><button data-log-calm="Cold water reset">Done</button></div>
      <div class="card"><p class="tiny-title">Step 3</p><h2>Move location</h2><p>Stand up, change room, step outside, or walk to the kitchen. Do not stay frozen with the phone.</p><button data-log-calm="Changed location">Done</button></div>
    </section>
    <section class="grid two" style="margin-top:1rem">
      <div class="card">${breathingBlock()}</div>
      <div class="card soft">
        <p class="tiny-title">The 20-minute rule</p>
        <h2>Delay before any contact</h2>
        <p>Most urges rise, peak, and fall. Give your calmer self a chance to come back online.</p>
        <div class="card flat center"><p class="timer-display" id="urgeTimer">20:00</p><div class="button-row center"><button type="button" id="startUrgeDelay">Start delay</button><button type="button" class="secondary-button" id="resetUrgeDelay">Reset</button></div></div>
      </div>
    </section>`;
}

function renderNoContact() {
  const streak = daysSince(state.profile.noContactStart);
  const urges = [...state.urges].sort(byNewest).slice(0, 10);
  const achieved = [1,3,7,14,21,30,60,90].filter(n => streak >= n);
  return `
    <section class="hero">
      <div class="card hero-card">
        <p class="eyebrow">Boundary, not punishment</p>
        <h2>No contact protects you from the version of you that acts from panic.</h2>
        <p>Craving contact is expected. It is not a sign you should act. Log the urge, wait it out, and choose the next respectful step.</p>
        <div class="button-row"><button data-open-urge>I have an urge now</button><a href="#void" class="button secondary-button">Write unsent message</a></div>
      </div>
      <div class="card center"><p class="tiny-title">Protected streak</p><p class="big-number">${streak || '—'}</p><p class="stat-label">${streak ? `day${streak === 1 ? '' : 's'}` : 'Set your start date below'}</p></div>
    </section>
    <section class="grid two" style="margin-top:1rem">
      <div class="card">
        <p class="tiny-title">Your contract</p><h2>What you do when the urge hits</h2>
        <form data-form="nocontact-settings" class="stack">
          <label><span>No-contact start date</span><input type="date" name="noContactStart" value="${escapeHTML(state.profile.noContactStart)}" /></label>
          <label><span>My reason for staying no contact today</span><textarea name="personalReason">${escapeHTML(state.profile.personalReason)}</textarea></label>
          <label><span>My no-contact rule</span><textarea name="noContactRule">${escapeHTML(state.profile.noContactRule)}</textarea></label>
          <button type="submit">Save contract</button>
        </form>
      </div>
      <div class="card soft">
        <p class="tiny-title">Milestones</p><h2>Gentle proof you are doing it</h2>
        <div class="milestone-grid">${[1,3,7,14,21,30,60,90].map(n => `<div class="milestone ${streak >= n ? 'hit' : ''}"><strong>${n}</strong><span>days</span></div>`).join('')}</div>
        <p class="small muted">Hit so far: ${achieved.length ? achieved.join(', ') : 'none yet'}. Every protected hour counts too.</p>
      </div>
    </section>
    <section class="grid two" style="margin-top:1rem">
      <div class="card">
        <div class="spread"><div><p class="tiny-title">Urge log</p><h2>Recent urges</h2></div><span class="pill amber">${state.urges.length} total</span></div>
        <div class="timeline">${urges.length ? urges.map(urge => `<div class="timeline-item"><strong>${escapeHTML(urge.intensity)}/10 urge</strong><time>${formatDateTime(urge.createdAt)}</time><p class="small muted">Trigger: ${escapeHTML(urge.trigger || 'Not recorded')}</p><p class="small muted">Safer action: ${escapeHTML(urge.safeAction || 'Not recorded')}</p></div>`).join('') : '<p class="muted">No urges logged yet. Logging one often takes the power out of it.</p>'}</div>
      </div>
      <div class="card">
        <p class="tiny-title">If contact happens</p><h2>No shame spiral. Learn and reset.</h2>
        <form data-form="contact-slip" class="stack">
          <label><span>What happened?</span><input name="what" placeholder="e.g. I checked socials / sent a text / reread messages" /></label>
          <label><span>What triggered it?</span><input name="trigger" placeholder="loneliness, alcohol, jealousy, guilt, boredom…" /></label>
          <label><span>What will I do differently next time?</span><input name="next" placeholder="phone away at night, text friend, open Panic Room…" /></label>
          <button type="submit">Log and reset start date to today</button>
        </form>
      </div>
    </section>
    <section class="card" style="margin-top:1rem">
      <p class="tiny-title">Do instead list</p><h2>Choose before the urge chooses for you</h2>
      <div class="grid three">${['Drink water','Cold water on hands','Ten-minute walk','Voice note to yourself','Text a friend','Write in the Void','Change bedding','Watch safe TV','Make tea','Tidy one corner','Open a window','Go to Safety page'].map(x => `<button class="quick-card" data-log-calm="${x}"><strong>${x}</strong><span>Mark as done</span></button>`).join('')}</div>
    </section>`;
}

function renderVoid() {
  const messages = [...state.voidMessages].sort(byNewest).slice(0, 30);
  return `
    <section class="card hero-card"><p class="eyebrow">Write it here, not to them</p><h2>The Void catches the message without reopening the wound.</h2><p>You can save it for your private record or release it immediately. Either way, you did not send it.</p></section>
    <section class="grid two" style="margin-top:1rem">
      <div class="card">
        <p class="tiny-title">Unsent message</p><h2>Say the honest thing safely</h2>
        <form data-form="void" class="stack">
          <label><span>What do you want to send?</span><textarea name="body" placeholder="Type the message here. Do not polish it. Do not send it."></textarea></label>
          <label><span>What am I hoping this message would give me?</span><input name="hope" placeholder="relief, comfort, apology, reassurance, control…" /></label>
          <label><span>What I choose instead</span><input name="safeAction" placeholder="sleep, walk, call friend, journal, therapy note…" /></label>
          <div class="button-row"><button type="submit" name="action" value="save">Save privately</button><button type="submit" name="action" value="release" class="secondary-button">Release without saving</button></div>
        </form>
      </div>
      <div class="card soft">
        <p class="tiny-title">Before you write</p><h2>The question that changes the outcome</h2>
        <p><strong>Am I trying to communicate, or am I trying to regulate?</strong></p>
        <p class="muted">If it is regulation, HeartMend is the right place. Your ex does not need to become your nervous system.</p>
      </div>
    </section>
    <section class="card" style="margin-top:1rem">
      <div class="spread"><div><p class="tiny-title">Saved void messages</p><h2>Private, not sent</h2></div><span class="pill">${messages.length}</span></div>
      <div class="stack">${messages.length ? messages.map(m => `<article class="entry-card"><div class="spread"><div><h3>${escapeHTML(m.hope || 'Unsent message')}</h3><time>${formatDateTime(m.createdAt)}</time></div><button class="ghost-button" data-delete-void="${m.id}">Delete</button></div><p>${escapeHTML(m.body)}</p><p class="small muted">Chose instead: ${escapeHTML(m.safeAction || 'Not recorded')}</p></article>`).join('') : '<p class="muted">No saved void messages. That is also a win.</p>'}</div>
    </section>`;
}

function renderPath() {
  const p = pathProgress();
  return `
    <section class="card hero-card"><p class="eyebrow">30-day recovery path</p><h2>A structure for the days when your brain wants to loop.</h2><p>Complete days in any order. This is not a perfection plan; it is a handrail.</p><div class="progress-bar light"><span style="width:${p.pct}%"></span></div><p>${p.done}/${p.total} completed</p></section>
    <section class="day-grid" style="margin-top:1rem">
      ${PATH_DAYS.map(([title, text], i) => {
        const day = i + 1;
        const done = !!state.pathCompleted[day];
        return `<article class="day-card ${done ? 'done' : ''}"><div class="spread"><span class="day-number">Day ${day}</span><input type="checkbox" data-path-toggle="${day}" ${done ? 'checked' : ''} aria-label="Complete day ${day}" /></div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(text)}</p><div class="button-row"><button class="secondary-button" data-path-journal="${day}">Journal</button>${done ? '<span class="pill green">Done</span>' : '<span class="pill">Open</span>'}</div></article>`;
      }).join('')}
    </section>`;
}

function renderReality() {
  const items = [...state.realityItems].sort(byNewest);
  const grouped = ['Reason I left', 'Red flag', 'What hurt', 'Standard I need'].map(type => [type, items.filter(i => i.type === type)]);
  return `
    <section class="card hero-card"><p class="eyebrow">For romanticising moments</p><h2>When your brain edits the pain out, come back to reality.</h2><p>This is not about demonising anyone. It is about remembering the full picture before you act from longing.</p></section>
    <section class="grid two" style="margin-top:1rem">
      <div class="card">
        <p class="tiny-title">Add to reality list</p><h2>What do I need to remember?</h2>
        <form data-form="reality" class="stack">
          <label><span>Type</span><select name="type"><option>Reason I left</option><option>Red flag</option><option>What hurt</option><option>Standard I need</option></select></label>
          <label><span>Reality note</span><textarea name="body" placeholder="e.g. I felt anxious after interactions, not calm and secure."></textarea></label>
          <button type="submit">Save reality note</button>
        </form>
      </div>
      <div class="card soft">
        <p class="tiny-title">Balanced memory</p><h2>Both can be true</h2>
        <p>I can miss the good moments and still honour the reasons this relationship is not safe or healthy for me right now.</p>
        <button data-quick-journal="Both can be true">Write both sides</button>
      </div>
    </section>
    <section class="grid two" style="margin-top:1rem">
      ${grouped.map(([type, list]) => `<div class="card"><div class="spread"><h2>${escapeHTML(type)}</h2><span class="pill">${list.length}</span></div><div class="stack">${list.length ? list.map(item => `<div class="entry-card"><div class="spread"><time>${formatDateTime(item.createdAt)}</time><button class="ghost-button" data-delete-reality="${item.id}">×</button></div><p>${escapeHTML(item.body)}</p></div>`).join('') : '<p class="muted">Nothing here yet.</p>'}</div></div>`).join('')}
    </section>`;
}

function renderAccountability() {
  const rows = [...state.accountability].sort(byNewest).slice(0, 30);
  return `
    <section class="card hero-card"><p class="eyebrow">Growth without self-hate</p><h2>Accountability says “I can do better.” Shame says “I am bad.” We choose accountability.</h2><p>This tracker is for patterns, triggers, and replacement behaviours — not beating yourself up.</p></section>
    <section class="grid two" style="margin-top:1rem">
      <div class="card">
        <p class="tiny-title">Compassionate accountability tracker</p><h2>Review one moment</h2>
        <form data-form="accountability" class="stack">
          <label><span>What triggered me?</span><input name="trigger" placeholder="criticism, jealousy, silence, fear of rejection…" /></label>
          <label><span>What did I do or want to do?</span><textarea name="behaviour" placeholder="Be factual. No name-calling yourself."></textarea></label>
          <label><span>Impact on me / them</span><textarea name="impact" placeholder="What did this create?"></textarea></label>
          <label><span>The repair or better response next time</span><textarea name="repair" placeholder="timeout, breathe, leave the room, use an I-feel sentence…"></textarea></label>
          <button type="submit">Save accountability note</button>
        </form>
      </div>
      <div class="card soft">
        <p class="tiny-title">I-feel sentence builder</p><h2>For future conflict</h2>
        <p><strong>I feel</strong> ___ <strong>when</strong> ___ <strong>because</strong> ___. <strong>I need</strong> ___, so I’m going to ___.</p>
        <p class="muted">Example: “I feel overwhelmed when the conversation gets heated because I’m scared I’ll react badly. I need ten minutes, so I’m going to step away and come back calmer.”</p>
      </div>
    </section>
    <section class="card" style="margin-top:1rem">
      <div class="spread"><div><p class="tiny-title">Saved notes</p><h2>Patterns I’m changing</h2></div><span class="pill">${rows.length}</span></div>
      <div class="stack">${rows.length ? rows.map(r => `<article class="entry-card"><div class="spread"><h3>${escapeHTML(r.trigger || 'Trigger')}</h3><button class="ghost-button" data-delete-accountability="${r.id}">Delete</button></div><time>${formatDateTime(r.createdAt)}</time><p><strong>Behaviour:</strong> ${escapeHTML(r.behaviour)}</p><p><strong>Impact:</strong> ${escapeHTML(r.impact)}</p><p><strong>Repair:</strong> ${escapeHTML(r.repair)}</p></article>`).join('') : '<p class="muted">No notes yet. One honest review is enough.</p>'}</div>
    </section>`;
}

function breathingBlock() {
  return `<p class="tiny-title">Body first</p><h2>Breathing reset</h2><p class="muted">In for 4, hold for 4, out for 8. Follow the circle for two minutes.</p><div class="breath-circle" id="breathCircle"><div class="breath-label"><strong id="breathPhase">Ready</strong><span id="breathCount">Press start</span></div></div><div class="button-row center"><button id="startBreath" type="button">Start 2-minute breathing</button><button class="secondary-button" id="stopBreath" type="button">Stop</button></div>`;
}
function renderCalm() {
  return `
    <section class="grid two"><div class="card">${breathingBlock()}</div><div class="card"><p class="tiny-title">Senses</p><h2>5-4-3-2-1 grounding</h2><p class="muted">Name what is actually around you. It tells the brain: “I am here, not inside the memory.”</p><form data-form="grounding" class="grounding-grid">${groundingStep('5', 'things you can see', 'Laptop, mug, window…')}${groundingStep('4', 'things you can feel', 'Feet on floor, chair…')}${groundingStep('3', 'things you can hear', 'Heating, traffic…')}${groundingStep('2', 'things you can smell', 'Coffee, soap…')}${groundingStep('1', 'thing you can taste', 'Mint, water…')}<button type="submit">Save grounding note</button></form></div></section>
    <section class="grid two" style="margin-top:1rem"><div class="card"><p class="tiny-title">Emergency emotional wave</p><h2>Three-minute rescue</h2><ol class="stack"><li><strong>Name it:</strong> “This is grief / shame / loneliness. It is allowed.”</li><li><strong>Cool the body:</strong> cold water on hands or face.</li><li><strong>Move:</strong> stand, stretch, or walk to another room.</li><li><strong>Choose:</strong> journal, friend, water, shower, sleep.</li></ol><button data-log-calm="3-minute rescue">I did this</button></div><div class="card soft"><p class="tiny-title">Control reset</p><h2>Let them. Let me.</h2><p>Let them have their reaction, silence, opinion, or choice.</p><p><strong>Let me</strong> protect my peace, keep my boundary, and take one grounded action.</p><button data-quick-journal="Let them / Let me">Write my Let Me action</button></div></section>`;
}
function groundingStep(count, label, placeholder) { return `<label class="grounding-step"><span class="grounding-count">${count}</span><span>${label}<input name="ground${count}" placeholder="${placeholder}" /></span></label>`; }

function renderWork() {
  return `
    <section class="card hero-card"><p class="eyebrow">Remote work survival mode</p><h2>Today’s goal is “functional enough”, not impressive.</h2><p>Keep the bar low, blocks short, and the phone away from the wound.</p><div class="button-row"><button data-copy="manager">Copy manager message</button><button class="secondary-button" data-log-calm="Started work mode">Log start</button></div></section>
    <section class="grid two" style="margin-top:1rem"><div class="card"><p class="tiny-title">Focus timer</p><h2>25 minutes. One task.</h2><p class="timer-display" id="focusDisplay">25:00</p><div class="button-row"><button id="startFocus">Start focus</button><button class="secondary-button" id="startBreak">Start 5-min break</button><button class="ghost-button" id="resetFocus">Reset</button></div></div><div class="card soft"><p class="tiny-title">Meeting shield</p><h2>Before each call</h2><ul class="stack"><li>Two slow breaths.</li><li>Feet flat. Fingers gently pressed together.</li><li>Camera off if optional.</li><li>Use simple sentences: “I’ll come back to you on that.”</li></ul></div></section>
    <section class="card" style="margin-top:1rem"><div class="spread"><div><p class="tiny-title">Daily work board</p><h2>Enough for today</h2></div><button class="secondary-button" data-clear-tasks>Clear done tasks</button></div><div class="task-board">${renderTaskColumn('must', 'Must-do', 'Urgent, visible, deadline-led')}${renderTaskColumn('extra', 'Good-enough extras', 'Useful but not essential')}${renderTaskColumn('wait', 'Can wait', 'Move here without guilt')}</div></section>
    <section class="grid two" style="margin-top:1rem"><div class="card"><p class="tiny-title">When you spiral mid-task</p><h2>Contain, don’t suppress</h2><p>Say: “Not now. I’ll think about this at ${escapeHTML(state.profile.thinkingWindow || '19:00')}.” Then write one line and return to the smallest visible next step.</p><button data-quick-journal="Work spiral containment">Write the one line</button></div><div class="card"><p class="tiny-title">Soft landing after work</p><h2>Plan the crash pad now</h2><form data-form="soft-landing" class="stack"><label><span>Body reset</span><input name="body" placeholder="e.g. 10-minute walk, shower" /></label><label><span>Soothing thing</span><input name="soothing" placeholder="e.g. comfy clothes, tea" /></label><label><span>Gentle distraction</span><input name="distraction" placeholder="e.g. safe series, game, podcast" /></label><button type="submit">Save as journal plan</button></form></div></section>`;
}
function renderTaskColumn(key, title, hint) {
  const tasks = state.tasks[key] || [];
  return `<div class="task-column"><h3>${title}</h3><p class="small muted">${hint}</p><form data-form="add-task" data-task-key="${key}" class="inline"><input name="task" placeholder="Add a task" aria-label="Add ${title} task" /><button type="submit" aria-label="Add task">+</button></form><ul class="task-list">${tasks.map(task => `<li class="${task.done ? 'done' : ''}"><input type="checkbox" data-task-done="${task.id}" data-task-key="${key}" ${task.done ? 'checked' : ''}/><span>${escapeHTML(task.text)}</span><button data-delete-task="${task.id}" data-task-key="${key}" aria-label="Delete task">×</button></li>`).join('') || '<li class="muted">Nothing here yet.</li>'}</ul></div>`;
}

function renderJournal() {
  const entries = [...state.journals].sort(byNewest).slice(0, 50);
  return `
    <section class="grid two"><div class="card"><p class="tiny-title">Journal</p><h2>Get it out safely</h2><form data-form="journal" class="stack"><label><span>Prompt</span><select name="prompt">${PROMPTS.map(p => `<option>${escapeHTML(p)}</option>`).join('')}</select></label><label><span>Entry</span><textarea name="body" placeholder="One honest sentence is enough."></textarea></label><button type="submit">Save entry</button></form></div><div class="card soft"><p class="tiny-title">Thought challenge</p><h2>True? Helpful? Kinder?</h2><form data-form="thought" class="stack"><label><span>Painful thought</span><input name="thought" placeholder="e.g. I’ll be alone forever" /></label><label><span>Is it 100% true?</span><textarea name="trueCheck" placeholder="Evidence for and against"></textarea></label><label><span>Is it helpful?</span><textarea name="helpfulCheck" placeholder="What happens when I believe this?"></textarea></label><label><span>Kinder, more useful thought</span><textarea name="reframe" placeholder="A grounded alternative"></textarea></label><button type="submit">Save thought challenge</button></form></div></section>
    <section class="card" style="margin-top:1rem"><div class="spread"><div><p class="tiny-title">Saved entries</p><h2>Your private record</h2></div><button class="secondary-button" data-export>Export data</button></div><div class="stack">${entries.length ? entries.map(entry => `<article class="entry-card"><h3>${escapeHTML(entry.title || entry.prompt || 'Journal')}</h3><time>${formatDateTime(entry.createdAt)}</time><p>${escapeHTML(entry.body)}</p></article>`).join('') : '<p class="muted">No entries yet. The first one is just one sentence.</p>'}</div></section>`;
}

function renderProgress() {
  const streak = daysSince(state.profile.noContactStart);
  const moodCount = state.moodLogs.length;
  const journalCount = state.journals.length;
  const calmCount = state.calmHistory.length;
  const voidCount = state.voidMessages.length;
  const avgMood = moodCount ? (state.moodLogs.reduce((sum, m) => sum + Number(m.intensity), 0) / moodCount).toFixed(1) : '—';
  const path = pathProgress();
  const lastFourteen = state.moodLogs.filter(m => Date.now() - new Date(m.createdAt).getTime() < 14 * 86400000).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const urgeHigh = state.urges.filter(u => Number(u.intensity) >= 7).length;
  return `
    <section class="grid four">${kpi(streak || '—', 'No-contact days')}${kpi(moodCount, 'Mood check-ins')}${kpi(journalCount + voidCount, 'Written releases')}${kpi(`${path.done}/30`, 'Path days')}</section>
    <section class="grid two" style="margin-top:1rem"><div class="card"><p class="tiny-title">Mood graph</p><h2>Average intensity: ${avgMood}</h2>${lastFourteen.length ? `<div class="mood-chart" aria-label="Mood chart">${lastFourteen.map(m => `<div class="mood-bar-wrap"><div class="mood-bar" style="height:${Math.max(8, Number(m.intensity) * 10)}%"></div><span>${Number(m.intensity)}</span></div>`).join('')}</div><div class="timeline">${lastFourteen.slice(-5).map(m => `<div class="timeline-item"><strong>${escapeHTML(m.emotion)} ${m.intensity}/10</strong><time>${formatDateTime(m.createdAt)}</time><p class="small muted">${escapeHTML(m.note || '')}</p></div>`).join('')}</div>` : '<p class="muted">Check in a few times and this becomes useful.</p>'}</div><div class="card soft"><p class="tiny-title">Healing evidence</p><h2>Progress is not linear</h2><p>Look for smaller signs: urges logged instead of acted on, shorter spirals, one meal eaten, one meeting survived, one calmer response.</p><p>${tag(`${state.urges.length} urges logged`, 'amber')} ${tag(`${urgeHigh} high-intensity`, 'red')} ${tag(`${calmCount} calm actions`, 'green')}</p><button data-quick-journal="Evidence I am moving">Record one small win</button></div></section>`;
}

function renderSafety() {
  return `
    <section class="card hero-card"><p class="eyebrow">When it feels too much</p><h2>You deserve human support, not just an app.</h2><p>This tool can help you steady yourself, but it is not a crisis service or replacement for therapy. If you might hurt yourself or someone else, treat that as urgent.</p></section>
    <section class="grid two" style="margin-top:1rem"><div class="card"><p class="tiny-title">UK urgent support</p><h2>Use these when you feel unsafe</h2><div class="stack"><a class="button danger-button" href="tel:999">Call 999 if immediate danger</a><a class="button" href="tel:111">Call NHS 111 for urgent mental health help</a><a class="button secondary-button" href="tel:116123">Call Samaritans: 116 123</a><a class="button secondary-button" href="sms:85258&body=SHOUT">Text SHOUT to 85258</a></div><p class="small muted">Phone and SMS links depend on your device. If a button does not work, dial or text manually.</p></div><div class="card"><p class="tiny-title">My safe people</p><h2>People I can contact before I spiral</h2><form data-form="support-contact" class="stack"><label><span>Name</span><input name="name" placeholder="e.g. Andrew, Mum, Mark" /></label><label><span>Phone or note</span><input name="phone" placeholder="Number, WhatsApp, or reminder" /></label><button type="submit">Add safe person</button></form><div class="stack" style="margin-top:1rem">${state.supportContacts.length ? state.supportContacts.map(contact => `<div class="entry-card spread"><div><strong>${escapeHTML(contact.name)}</strong><p class="small muted">${escapeHTML(contact.phone)}</p></div><button class="ghost-button" data-delete-contact="${contact.id}">Remove</button></div>`).join('') : '<p class="muted">Add one person you can contact before contacting your ex.</p>'}</div></div></section>
    <section class="card soft" style="margin-top:1rem"><p class="tiny-title">Personal safety plan</p><h2>When the thoughts get dark</h2><ol class="stack"><li>Move away from anything you could use to hurt yourself.</li><li>Tell one safe person: “I’m not safe on my own right now.”</li><li>Call 999 if you are at immediate risk, or 111 / Samaritans / Shout if you need urgent support.</li><li>Stay around another person or in a public, safe place until the wave reduces.</li></ol></section>`;
}

function renderSettings() {
  return `
    <section class="grid two"><div class="card"><p class="tiny-title">Personalisation</p><h2>Make it yours</h2><form data-form="settings" class="stack"><label><span>Your name</span><input name="name" value="${escapeHTML(state.profile.name)}" /></label><label><span>Daily thinking window</span><input type="time" name="thinkingWindow" value="${escapeHTML(state.profile.thinkingWindow)}" /></label><label><span>Your main steadying sentence</span><textarea name="personalReason">${escapeHTML(state.profile.personalReason)}</textarea></label><label><span>No-contact rule</span><textarea name="noContactRule">${escapeHTML(state.profile.noContactRule)}</textarea></label><button type="submit">Save settings</button></form></div><div class="card soft"><p class="tiny-title">Privacy</p><h2>Your data stays on this device</h2><p>HeartMend uses browser storage. There is no server, no account, and no tracking. Clearing browser data will delete entries unless you export them first.</p><div class="button-row"><button data-export>Export JSON</button><label class="button secondary-button" style="cursor:pointer">Import JSON<input type="file" data-import accept="application/json" hidden /></label><button class="danger-button" data-reset-app>Reset app</button></div></div></section>
    <section class="card" style="margin-top:1rem"><p class="tiny-title">Install notes</p><h2>How to use as an app</h2><p>Deploy to a static host, open the site in Safari, then use Share → Add to Home Screen. The app caches itself for offline use after first load.</p></section>`;
}

function bindMoodRange() {
  const range = $('#moodForm input[name="intensity"]');
  const out = $('#moodValue');
  if (range && out) range.addEventListener('input', () => out.textContent = range.value);
}
function bindCalmTools() {
  const start = $('#startBreath');
  const stop = $('#stopBreath');
  if (start) start.addEventListener('click', startBreathing);
  if (stop) stop.addEventListener('click', () => stopBreathing());
  bindUrgeDelay();
}
function startBreathing() {
  stopBreathing();
  const circle = $('#breathCircle');
  const phase = $('#breathPhase');
  const count = $('#breathCount');
  if (!circle || !phase || !count) return;
  let elapsed = 0, step = 0;
  const sequence = [{ label: 'Inhale', seconds: 4, className: 'grow' }, { label: 'Hold', seconds: 4, className: '' }, { label: 'Exhale', seconds: 8, className: 'shrink' }];
  const runStep = () => {
    const current = sequence[step % sequence.length];
    circle.className = `breath-circle ${current.className}`;
    phase.textContent = current.label;
    let remaining = current.seconds;
    count.textContent = `${remaining}s`;
    activeBreath = setInterval(() => {
      remaining -= 1; elapsed += 1; count.textContent = `${Math.max(remaining, 0)}s`;
      if (elapsed >= 120) {
        clearInterval(activeBreath); activeBreath = null; stopBreathing('Breathing completed');
        state.calmHistory.unshift({ id: uid('calm'), type: 'Breathing reset', createdAt: nowISO() }); saveState(); showToast('Two-minute breathing completed. Tiny victory.');
      } else if (remaining <= 0) { clearInterval(activeBreath); activeBreath = null; step += 1; runStep(); }
    }, 1000);
  };
  runStep();
}
function stopBreathing(message) {
  if (activeBreath) clearInterval(activeBreath);
  activeBreath = null;
  const circle = $('#breathCircle'); if (circle) circle.className = 'breath-circle';
  const phase = $('#breathPhase'); if (phase) phase.textContent = message || 'Ready';
  const count = $('#breathCount'); if (count) count.textContent = message ? 'Logged' : 'Press start';
}
function bindWorkTimer() {
  const display = $('#focusDisplay');
  const startFocus = $('#startFocus');
  const startBreak = $('#startBreak');
  const reset = $('#resetFocus');
  if (!display) return;
  const startTimer = minutes => {
    if (activeTimer) clearInterval(activeTimer);
    let remaining = minutes * 60;
    const update = () => {
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      display.textContent = `${m}:${s}`;
      if (remaining <= 0) {
        clearInterval(activeTimer); activeTimer = null;
        state.calmHistory.unshift({ id: uid('work'), type: minutes === 25 ? 'Focus block' : 'Break block', createdAt: nowISO() }); saveState();
        showToast(minutes === 25 ? 'Focus block done. Take a gentle break.' : 'Break done. Back to one tiny task.');
      }
      remaining -= 1;
    };
    update(); activeTimer = setInterval(update, 1000);
  };
  startFocus?.addEventListener('click', () => startTimer(25));
  startBreak?.addEventListener('click', () => startTimer(5));
  reset?.addEventListener('click', () => { if (activeTimer) clearInterval(activeTimer); activeTimer = null; display.textContent = '25:00'; });
}
function bindUrgeDelay() {
  const display = $('#urgeTimer');
  const start = $('#startUrgeDelay');
  const reset = $('#resetUrgeDelay');
  if (!display || !start) return;
  const setDisplay = secs => display.textContent = `${String(Math.floor(secs / 60)).padStart(2,'0')}:${String(secs % 60).padStart(2,'0')}`;
  const startCountdown = () => {
    if (activeTimer) clearInterval(activeTimer);
    let remaining = 20 * 60;
    setDisplay(remaining);
    activeTimer = setInterval(() => {
      remaining -= 1; setDisplay(Math.max(remaining, 0));
      if (remaining <= 0) { clearInterval(activeTimer); activeTimer = null; showToast('Delay complete. Decide from calm, not panic.'); }
    }, 1000);
  };
  start.addEventListener('click', startCountdown);
  reset?.addEventListener('click', () => { if (activeTimer) clearInterval(activeTimer); activeTimer = null; setDisplay(20 * 60); });
}

function handleInput(event) {
  const anchor = event.target.dataset.anchor;
  if (anchor) { state.anchors.checked[anchor] = event.target.checked; saveState(); renderRoute(); return; }
  const taskId = event.target.dataset.taskDone;
  if (taskId) { const key = event.target.dataset.taskKey; const task = state.tasks[key].find(t => t.id === taskId); if (task) task.done = event.target.checked; saveState(); renderRoute(); return; }
  const pathToggle = event.target.dataset.pathToggle;
  if (pathToggle) { state.pathCompleted[pathToggle] = event.target.checked; saveState(); renderRoute(); return; }
  if (event.target.matches('[data-import]')) {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { state = mergeDeep(clone(DEFAULT_STATE), JSON.parse(reader.result)); saveState(); showToast('Data imported.'); renderRoute(); } catch { showToast('That file could not be imported.'); } };
    reader.readAsText(file);
  }
}
function formDataObject(form) { return Object.fromEntries(new FormData(form).entries()); }
function handleFormSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  const type = form.dataset.form;
  const data = formDataObject(form);
  if (type === 'mood') {
    state.moodLogs.unshift({ id: uid('mood'), type: 'Mood check-in', intensity: Number(data.intensity || 5), emotion: data.emotion || 'Mixed', sleep: data.sleep || '', urgeLevel: data.urgeLevel || '', note: data.note || '', createdAt: nowISO() });
    saveState(); showToast('Check-in saved.'); renderRoute();
  }
  if (type === 'grounding') {
    const body = ['5 things I can see', data.ground5, '4 things I can feel', data.ground4, '3 things I can hear', data.ground3, '2 things I can smell', data.ground2, '1 thing I can taste', data.ground1].join('\n');
    state.journals.unshift({ id: uid('journal'), title: 'Grounding note', prompt: '5-4-3-2-1 grounding', body, createdAt: nowISO() });
    state.calmHistory.unshift({ id: uid('calm'), type: 'Grounding exercise', createdAt: nowISO() });
    saveState(); showToast('Grounding saved.'); renderRoute();
  }
  if (type === 'nocontact-settings') {
    state.profile.noContactStart = data.noContactStart;
    state.profile.personalReason = data.personalReason;
    state.profile.noContactRule = data.noContactRule;
    saveState(); showToast('No-contact contract saved.'); renderRoute();
  }
  if (type === 'contact-slip') {
    state.contactSlips.unshift({ id: uid('slip'), what: data.what || '', trigger: data.trigger || '', next: data.next || '', createdAt: nowISO() });
    state.journals.unshift({ id: uid('journal'), title: 'No-contact reset', prompt: 'Learn and reset', body: `What happened: ${data.what || ''}\nTrigger: ${data.trigger || ''}\nNext time: ${data.next || ''}`, createdAt: nowISO() });
    state.profile.noContactStart = todayISO();
    saveState(); showToast('Logged without shame. Streak reset to today.'); renderRoute();
  }
  if (type === 'add-task') {
    const key = form.dataset.taskKey;
    if (!data.task?.trim()) return showToast('Add a task first.');
    state.tasks[key].push({ id: uid('task'), text: data.task.trim(), done: false });
    saveState(); renderRoute();
  }
  if (type === 'soft-landing') {
    const body = `Body reset: ${data.body || ''}\nSoothing thing: ${data.soothing || ''}\nGentle distraction: ${data.distraction || ''}`;
    state.journals.unshift({ id: uid('journal'), title: 'Soft landing plan', prompt: 'After-work plan', body, createdAt: nowISO() });
    saveState(); showToast('Soft landing saved.'); renderRoute();
  }
  if (type === 'journal') {
    if (!data.body?.trim()) return showToast('Write at least one sentence.');
    state.journals.unshift({ id: uid('journal'), title: 'Journal', prompt: data.prompt, body: data.body, createdAt: nowISO() });
    saveState(); closeModal(); showToast('Journal saved.'); renderRoute();
  }
  if (type === 'thought') {
    const body = `Painful thought: ${data.thought || ''}\n\nIs it 100% true?\n${data.trueCheck || ''}\n\nIs it helpful?\n${data.helpfulCheck || ''}\n\nKinder, more useful thought:\n${data.reframe || ''}`;
    state.journals.unshift({ id: uid('journal'), title: 'Thought challenge', prompt: 'True? Helpful? Kinder?', body, createdAt: nowISO() });
    saveState(); showToast('Thought challenge saved.'); renderRoute();
  }
  if (type === 'support-contact') {
    if (!data.name?.trim()) return showToast('Add a name first.');
    state.supportContacts.push({ id: uid('contact'), name: data.name.trim(), phone: data.phone.trim() });
    saveState(); showToast('Safe person added.'); renderRoute();
  }
  if (type === 'settings') {
    state.profile.name = data.name;
    state.profile.thinkingWindow = data.thinkingWindow;
    state.profile.personalReason = data.personalReason;
    state.profile.noContactRule = data.noContactRule;
    saveState(); showToast('Settings saved.'); renderRoute();
  }
  if (type === 'urge') {
    state.urges.unshift({ id: uid('urge'), type: 'Urge to contact', intensity: Number(data.intensity || 5), trigger: data.trigger || '', hope: data.hope || '', safeAction: data.safeAction || '', createdAt: nowISO() });
    if (data.unsent?.trim()) state.voidMessages.unshift({ id: uid('void'), body: data.unsent, hope: data.hope || '', safeAction: data.safeAction || '', createdAt: nowISO() });
    saveState(); closeModal(); showToast('Urge logged. You protected the boundary.'); renderRoute();
  }
  if (type === 'void') {
    if (!data.body?.trim()) return showToast('Write the message first.');
    const action = event.submitter?.value || 'save';
    state.calmHistory.unshift({ id: uid('calm'), type: action === 'save' ? 'Saved unsent message' : 'Released unsent message', createdAt: nowISO() });
    if (action === 'save') state.voidMessages.unshift({ id: uid('void'), body: data.body, hope: data.hope || '', safeAction: data.safeAction || '', createdAt: nowISO() });
    saveState(); showToast(action === 'save' ? 'Saved privately. Not sent.' : 'Released. Not sent.'); renderRoute();
  }
  if (type === 'reality') {
    if (!data.body?.trim()) return showToast('Add the reality note first.');
    state.realityItems.unshift({ id: uid('reality'), type: data.type || 'Reality', body: data.body, createdAt: nowISO() });
    saveState(); showToast('Reality note saved.'); renderRoute();
  }
  if (type === 'accountability') {
    if (!data.behaviour?.trim() && !data.trigger?.trim()) return showToast('Add at least one detail first.');
    state.accountability.unshift({ id: uid('accountability'), trigger: data.trigger || '', behaviour: data.behaviour || '', impact: data.impact || '', repair: data.repair || '', createdAt: nowISO() });
    saveState(); showToast('Accountability note saved.'); renderRoute();
  }
}

function handleGlobalClick(event) {
  const close = event.target.closest('[data-close-modal]');
  if (close || event.target.classList.contains('modal-backdrop')) closeModal();
  const quick = event.target.closest('[data-quick]'); if (quick) openQuickTool(quick.dataset.quick);
  const openUrge = event.target.closest('[data-open-urge]'); if (openUrge) openUrgeModal();
  const quickJournal = event.target.closest('[data-quick-journal]'); if (quickJournal) openJournalModal(quickJournal.dataset.quickJournal);
  const logCalm = event.target.closest('[data-log-calm]');
  if (logCalm) { state.calmHistory.unshift({ id: uid('calm'), type: logCalm.dataset.logCalm, createdAt: nowISO() }); saveState(); showToast('Logged. Small actions count.'); }
  const copy = event.target.closest('[data-copy]');
  if (copy?.dataset.copy === 'manager') { navigator.clipboard?.writeText("I'm dealing with a difficult personal situation and I'm not at 100% today, but I'll cover the essentials. Just wanted to flag in case I seem quieter or slower than usual."); showToast('Manager message copied.'); }
  const clearTasks = event.target.closest('[data-clear-tasks]');
  if (clearTasks) { ['must','extra','wait'].forEach(key => state.tasks[key] = state.tasks[key].filter(t => !t.done)); saveState(); renderRoute(); }
  const deleteTask = event.target.closest('[data-delete-task]');
  if (deleteTask) { const key = deleteTask.dataset.taskKey; state.tasks[key] = state.tasks[key].filter(t => t.id !== deleteTask.dataset.deleteTask); saveState(); renderRoute(); }
  const deleteContact = event.target.closest('[data-delete-contact]');
  if (deleteContact) { state.supportContacts = state.supportContacts.filter(c => c.id !== deleteContact.dataset.deleteContact); saveState(); renderRoute(); }
  const deleteVoid = event.target.closest('[data-delete-void]');
  if (deleteVoid) { state.voidMessages = state.voidMessages.filter(m => m.id !== deleteVoid.dataset.deleteVoid); saveState(); renderRoute(); }
  const deleteReality = event.target.closest('[data-delete-reality]');
  if (deleteReality) { state.realityItems = state.realityItems.filter(m => m.id !== deleteReality.dataset.deleteReality); saveState(); renderRoute(); }
  const deleteAccountability = event.target.closest('[data-delete-accountability]');
  if (deleteAccountability) { state.accountability = state.accountability.filter(m => m.id !== deleteAccountability.dataset.deleteAccountability); saveState(); renderRoute(); }
  const pathJournal = event.target.closest('[data-path-journal]');
  if (pathJournal) { const day = Number(pathJournal.dataset.pathJournal); const [title, text] = PATH_DAYS[day - 1]; openJournalModal(`Day ${day}: ${title}`, text); }
  const exportButton = event.target.closest('[data-export]'); if (exportButton) exportData();
  const resetButton = event.target.closest('[data-reset-app]');
  if (resetButton && confirm('Reset HeartMend and delete all local entries on this device?')) { localStorage.removeItem(STORE_KEY); localStorage.removeItem(LEGACY_KEY); state = clone(DEFAULT_STATE); saveState(); renderRoute(); showToast('App reset.'); }
}

function openQuickTool(type) {
  const content = { panic: ['Panic wave', renderPanicModal()], urge: ['Urge to contact', renderUrgeForm()], shame: ['Shame spiral', renderShameModal()], lonely: ['Loneliness', renderLonelyModal()], focus: ['Work focus', renderFocusModal()], sleep: ['Bedtime reset', renderSleepModal()] }[type];
  if (!content) return;
  openModal(content[0], content[1]);
  if (type === 'urge') bindUrgeDelay();
}
function renderPanicModal() { return `<div class="stack"><p>Right now, your body may be treating emotional pain like danger. Do this in order:</p><ol class="stack"><li>Put both feet on the floor.</li><li>Exhale slowly, longer than the inhale.</li><li>Name five things you can see.</li><li>Put cold water on your hands.</li><li>Pick one safe action after this closes.</li></ol><button data-log-calm="Panic wave tool">I did the panic wave tool</button></div>`; }
function renderShameModal() { return `<div class="stack"><p><strong>Accountability:</strong> “I did something I regret, and I need to learn from it.”</p><p><strong>Shame:</strong> “I am vile, doomed, and unlovable.”</p><p>Only accountability helps you change. Shame just keeps you desperate.</p><button data-quick-journal="Accountability not shame">Write the accountable version</button></div>`; }
function renderLonelyModal() { const contacts = state.supportContacts.length ? state.supportContacts.map(c => `<li><strong>${escapeHTML(c.name)}</strong> — ${escapeHTML(c.phone)}</li>`).join('') : '<li>Add safe people in Safety.</li>'; return `<div class="stack"><p>Loneliness often says “go back to the most familiar person.” Try safer connection first.</p><ul>${contacts}</ul><p>Message template: “I’m having a rough breakup wave. Could you talk for ten minutes or just distract me a bit?”</p><button data-quick-journal="Loneliness wave">Write what I need instead of contacting them</button></div>`; }
function renderFocusModal() { return `<div class="stack"><p>Pick one task. Make it tiny. Start a 25-minute block in Work Mode.</p><p><strong>Minimum viable work:</strong> urgent emails, key meetings, deadlines. Everything else can wait.</p><a href="#work" class="button" data-close-modal>Open Work Mode</a></div>`; }
function renderSleepModal() { return `<div class="stack"><ol class="stack"><li>Water.</li><li>Brush teeth / wash face.</li><li>Phone across the room.</li><li>Low-stimulation audio if needed.</li><li>Tell yourself: “I am allowed to rest. I can think tomorrow.”</li></ol><button data-log-calm="Bedtime reset">I did bedtime reset</button></div>`; }
function openUrgeModal() { openModal('Urge to contact', renderUrgeForm()); bindUrgeDelay(); }
function renderUrgeForm() {
  return `<form data-form="urge" class="stack"><div class="card flat center"><p class="tiny-title">20-minute delay</p><p class="timer-display" id="urgeTimer">20:00</p><div class="button-row center"><button type="button" id="startUrgeDelay">Start delay</button><button type="button" class="secondary-button" id="resetUrgeDelay">Reset</button></div></div><label><span>Urge intensity</span><input type="range" name="intensity" min="1" max="10" value="7" /></label><label><span>What triggered it?</span><input name="trigger" placeholder="e.g. I saw something, felt lonely, remembered an apology" /></label><label><span>What am I hoping contact would give me?</span><input name="hope" placeholder="comfort, validation, forgiveness, relief…" /></label><label><span>Unsent message</span><textarea name="unsent" placeholder="Write it here, not to them."></textarea></label><label><span>Safer action I choose instead</span><input name="safeAction" placeholder="walk, friend, shower, journal, sleep, helpline…" /></label><button type="submit">Log urge and keep boundary</button></form>`;
}
function openJournalModal(title, helper = '') {
  openModal(title, `<form data-form="journal" class="stack">${helper ? `<p class="muted">${escapeHTML(helper)}</p>` : ''}<label><span>Prompt</span><input name="prompt" value="${escapeHTML(title)}" /></label><label><span>Entry</span><textarea name="body" placeholder="One honest sentence is enough."></textarea></label><button type="submit">Save entry</button></form>`);
}
function openModal(title, body) { closeModal(); const template = $('#modalTemplate'); const clone = template.content.cloneNode(true); clone.querySelector('#modalTitle').textContent = title; clone.querySelector('#modalBody').innerHTML = body; document.body.appendChild(clone); }
function closeModal() { stopTimers(); $('.modal-backdrop')?.remove(); }
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `heartmend-export-${todayISO()}.json`; a.click();
  URL.revokeObjectURL(url); showToast('Export downloaded.');
}

init();
