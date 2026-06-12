/* ═══════════════════════════════════════════════════════════════
   CreditScore AI – App JavaScript
   ═══════════════════════════════════════════════════════════════ */

const API_URL = '/api/predict';
let currentUser = null;

// ─── Navigation ──────────────────────────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const section = document.getElementById(`section-${name}`);
  const navItem = document.getElementById(`nav-${name}`);
  if (section) section.classList.add('active');
  if (navItem) navItem.classList.add('active');
  return false;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
}

// ─── Authentication Logic ────────────────────────────────────────────────────
async function checkAuthState() {
  try {
    const resp = await fetch('/api/auth/user');
    if (!resp.ok) throw new Error('Failed to verify session');
    const data = await resp.json();
    if (data.logged_in) {
      currentUser = data.user;
      updateUserUI(data.user);
      document.getElementById('auth-overlay').classList.add('hidden');
    } else {
      currentUser = null;
      document.getElementById('auth-overlay').classList.remove('hidden');
    }
  } catch (err) {
    console.error('Session error:', err);
    currentUser = null;
    document.getElementById('auth-overlay').classList.remove('hidden');
  }
}

function updateUserUI(user) {
  const username = user.username;
  const email = user.email || `${username}@creditscore.ai`;
  const initial = username.charAt(0).toUpperCase();
  const role = user.role || 'borrower';

  // Update sidebar
  document.getElementById('sidebar-username').textContent = username;
  document.getElementById('sidebar-email').textContent = email;
  document.getElementById('sidebar-avatar').textContent = initial;

  // Role badge
  const roleBadge = document.getElementById('sidebar-role');
  if (roleBadge) {
    roleBadge.textContent = role === 'analyst' ? 'Credit Analyst' : 'Individual Borrower';
    roleBadge.className = `user-role-badge ${role}`;
    roleBadge.classList.remove('hidden');
  }

  // Update topbar
  document.getElementById('topbar-username').textContent = username;
  document.getElementById('topbar-avatar').textContent = initial;

  // Control dynamic feature visibility based on role
  const navBatch = document.getElementById('nav-batch');
  if (role === 'analyst') {
    if (navBatch) navBatch.style.display = '';
  } else {
    if (navBatch) navBatch.style.display = 'none';
    
    // Redirect borrower from batch section if they were on it
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection && activeSection.id === 'section-batch') {
      showSection('score');
    }
  }
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');

  // Clear previous error messages
  loginError.classList.add('hidden');
  registerError.classList.add('hidden');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

async function submitLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const errorDiv = document.getElementById('login-error');
  const submitBtn = document.getElementById('btn-login-submit');

  errorDiv.classList.add('hidden');
  submitBtn.disabled = true;
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="material-icons-round animate-spin">sync</span> Đang đăng nhập...';

  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: usernameInput.value,
        password: passwordInput.value
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || 'Đăng nhập không thành công');
    }
    
    // Clear inputs and reload state
    usernameInput.value = '';
    passwordInput.value = '';
    await checkAuthState();
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function submitRegister(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('register-username');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const confirmPasswordInput = document.getElementById('register-confirm-password');
  const roleInput = document.getElementById('register-role');
  const errorDiv = document.getElementById('register-error');
  const submitBtn = document.getElementById('btn-register-submit');

  errorDiv.classList.add('hidden');

  if (passwordInput.value !== confirmPasswordInput.value) {
    errorDiv.textContent = 'Mật khẩu xác nhận không khớp!';
    errorDiv.classList.remove('hidden');
    return;
  }

  submitBtn.disabled = true;
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span class="material-icons-round animate-spin">sync</span> Đang đăng ký...';

  try {
    const resp = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: usernameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        role: roleInput ? roleInput.value : 'borrower'
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || 'Đăng ký không thành công');
    }

    // Clear inputs and reload state
    usernameInput.value = '';
    emailInput.value = '';
    passwordInput.value = '';
    confirmPasswordInput.value = '';
    await checkAuthState();
  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

async function handleLogout() {
  if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
  try {
    const resp = await fetch('/api/auth/logout', { method: 'POST' });
    if (resp.ok) {
      location.reload();
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
}

function toggleUserDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('user-dropdown');
  dropdown.classList.toggle('hidden');
}

// Close user dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('user-dropdown');
  const btn = document.getElementById('topbar-user-btn');
  if (dropdown && !dropdown.classList.contains('hidden') && btn && !btn.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});


// ─── User Profile & Security Settings ───────────────────────────────────────
function formatJoinedDate(dateStr) {
  if (!dateStr) return 'Unknown';
  try {
    const normalized = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return dateStr;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

function getActiveScoreDetails() {
  const scoreEl = document.getElementById('score-display');
  const scoreVal = parseInt(scoreEl && scoreEl.textContent);
  if (scoreVal && !isNaN(scoreVal) && scoreVal >= 300 && scoreVal <= 850) {
    return scoreVal;
  }
  if (matchmakerScore && !isNaN(matchmakerScore) && matchmakerScore >= 300) {
    return matchmakerScore;
  }
  return null;
}

function renderUserProfile() {
  if (!currentUser) return;

  const displayName = currentUser.username;
  const initial = displayName.charAt(0).toUpperCase();
  const avatarLarge = document.getElementById('profile-avatar-large');
  if (avatarLarge) {
    avatarLarge.textContent = initial;
  }

  document.getElementById('profile-display-name').textContent = displayName;
  document.getElementById('profile-username').textContent = displayName;
  document.getElementById('profile-email').textContent = currentUser.email || `${displayName}@creditscore.ai`;
  document.getElementById('profile-joined-date').textContent = formatJoinedDate(currentUser.created_at);

  const roleDisplay = document.getElementById('profile-display-role');
  if (roleDisplay) {
    const isAnalyst = currentUser.role === 'analyst';
    roleDisplay.textContent = isAnalyst ? 'Credit Analyst' : 'Individual Borrower';
    roleDisplay.className = `profile-badge-role ${currentUser.role || 'borrower'}`;
  }

  const activeScore = getActiveScoreDetails();
  const scoreValEl = document.getElementById('profile-last-score');
  const scoreTierEl = document.getElementById('profile-last-tier');
  const scoreDescEl = document.getElementById('profile-last-desc');

  if (activeScore) {
    scoreValEl.textContent = activeScore;
    scoreValEl.classList.add('has-score');

    let tierLabel = 'Very Poor';
    let tierDesc = 'Very high risk of default. Please improve your credit history.';
    if (activeScore >= 750) {
      tierLabel = 'Excellent';
      tierDesc = 'Outstanding credit history. Maximum borrow capacity.';
    } else if (activeScore >= 700) {
      tierLabel = 'Good';
      tierDesc = 'Good credit standing. Favorable interest rates and higher limits.';
    } else if (activeScore >= 630) {
      tierLabel = 'Fair';
      tierDesc = 'Moderate credit standing. Consider resolving outstanding debts.';
    } else if (activeScore >= 550) {
      tierLabel = 'Poor';
      tierDesc = 'Medium-high risk. Credit limit may be heavily restricted.';
    }
    
    scoreTierEl.textContent = tierLabel;
    scoreDescEl.textContent = tierDesc;
  } else {
    scoreValEl.textContent = '--';
    scoreValEl.classList.remove('has-score');
    scoreTierEl.textContent = 'Not Assessed';
    scoreDescEl.textContent = 'Please calculate your credit score on the dashboard to update your profile.';
  }
}

async function submitChangePassword(e) {
  e.preventDefault();
  const currentPasswordInput = document.getElementById('change-current-password');
  const newPasswordInput = document.getElementById('change-new-password');
  const confirmPasswordInput = document.getElementById('change-confirm-password');
  
  const errorDiv = document.getElementById('change-password-error');
  const successDiv = document.getElementById('change-password-success');
  const submitBtn = document.getElementById('btn-change-password-submit');
  const btnText = document.getElementById('change-password-btn-text');
  const spinner = document.getElementById('change-password-spinner');

  errorDiv.classList.add('hidden');
  successDiv.classList.add('hidden');

  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword !== confirmPassword) {
    errorDiv.textContent = 'Confirm password does not match!';
    errorDiv.classList.remove('hidden');
    return;
  }

  if (newPassword.length < 6) {
    errorDiv.textContent = 'New password must be at least 6 characters long!';
    errorDiv.classList.remove('hidden');
    return;
  }

  submitBtn.disabled = true;
  btnText.textContent = 'Processing...';
  spinner.classList.remove('hidden');

  try {
    const resp = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || 'Password update failed');
    }

    successDiv.textContent = 'Password updated successfully!';
    successDiv.classList.remove('hidden');

    currentPasswordInput.value = '';
    newPasswordInput.value = '';
    confirmPasswordInput.value = '';

  } catch (err) {
    errorDiv.textContent = err.message;
    errorDiv.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Update Password';
    spinner.classList.add('hidden');
  }
}



// ─── Tooltip ─────────────────────────────────────────────────────────────────
const tooltipEl = document.getElementById('tooltip-popup');
document.querySelectorAll('.tooltip-btn').forEach(btn => {
  btn.addEventListener('mouseenter', (e) => {
    const tip = btn.getAttribute('data-tip');
    tooltipEl.textContent = tip;
    tooltipEl.classList.add('visible');
    const rect = btn.getBoundingClientRect();
    tooltipEl.style.left = (rect.left - 100) + 'px';
    tooltipEl.style.top  = (rect.bottom + 8) + 'px';
  });
  btn.addEventListener('mouseleave', () => {
    tooltipEl.classList.remove('visible');
  });
});

// ─── Sample Data ──────────────────────────────────────────────────────────────
const SAMPLES = {
  good: {
    MonthlyIncome: 7500,
    age: 45,
    RevolvingUtilizationOfUnsecuredLines: 0.18,
    DebtRatio: 0.25,
    NumberOfOpenCreditLinesAndLoans: 8,
    NumberRealEstateLoansOrLines: 1,
    NumberOfDependents: 1,
    'NumberOfTime30-59DaysPastDueNotWorse': 0,
    'NumberOfTime60-89DaysPastDueNotWorse': 0,
    NumberOfTimes90DaysLate: 0,
  },
  poor: {
    MonthlyIncome: 1800,
    age: 28,
    RevolvingUtilizationOfUnsecuredLines: 0.92,
    DebtRatio: 0.75,
    NumberOfOpenCreditLinesAndLoans: 14,
    NumberRealEstateLoansOrLines: 0,
    NumberOfDependents: 3,
    'NumberOfTime30-59DaysPastDueNotWorse': 3,
    'NumberOfTime60-89DaysPastDueNotWorse': 2,
    NumberOfTimes90DaysLate: 4,
  },
};

function fillSample(type) {
  const sample = SAMPLES[type];
  Object.entries(sample).forEach(([key, val]) => {
    const el = document.getElementById(key);
    if (el) el.value = val;
  });
  // Optionally auto-submit
  // submitForm(new Event('submit'));
}

// ─── Reset ───────────────────────────────────────────────────────────────────
function resetForm() {
  document.getElementById('scoring-form').reset();
  document.getElementById('results-placeholder').classList.remove('hidden');
  document.getElementById('results-content').classList.add('hidden');
}

// ─── Form Submit ──────────────────────────────────────────────────────────────
async function submitForm(e) {
  e.preventDefault();

  // Collect form data
  const form = e.target;
  const payload = {};
  const fields = [
    'MonthlyIncome', 'age',
    'RevolvingUtilizationOfUnsecuredLines', 'DebtRatio',
    'NumberOfOpenCreditLinesAndLoans', 'NumberRealEstateLoansOrLines',
    'NumberOfDependents',
    'NumberOfTime30-59DaysPastDueNotWorse',
    'NumberOfTime60-89DaysPastDueNotWorse',
    'NumberOfTimes90DaysLate',
  ];

  for (const key of fields) {
    const el = document.getElementById(key);
    if (el && el.value !== '') {
      payload[key] = parseFloat(el.value);
    }
  }

  // Loading state
  const btn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('btn-spinner');
  btn.disabled = true;
  btnText.textContent = 'Calculating...';
  spinner.classList.remove('hidden');

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
    const data = await resp.json();
    renderResults(data);
  } catch (err) {
    alert('Error: ' + err.message);
    console.error(err);
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Calculate Credit Score';
    spinner.classList.add('hidden');
  }
}

// ─── Render Results ──────────────────────────────────────────────────────────
function renderResults(data) {
  const { credit_score, probability_of_default, risk_tier,
          risk_color, risk_bg, risk_desc, factors, recommendations } = data;

  // Show results, hide placeholder
  document.getElementById('results-placeholder').classList.add('hidden');
  const content = document.getElementById('results-content');
  content.classList.remove('hidden');
  content.classList.add('animate-in');

  // ── PD ──
  document.getElementById('pd-display').textContent = probability_of_default + '%';

  // PD badge label
  const pdBadge = document.getElementById('pd-badge');
  if (probability_of_default < 1) {
    pdBadge.textContent = 'Very Low';
    pdBadge.style.background = '#dcfce7'; pdBadge.style.color = '#15803d';
  } else if (probability_of_default < 3) {
    pdBadge.textContent = 'Low';
    pdBadge.style.background = '#d1fae5'; pdBadge.style.color = '#065f46';
  } else if (probability_of_default < 7) {
    pdBadge.textContent = 'Moderate';
    pdBadge.style.background = '#fef3c7'; pdBadge.style.color = '#92400e';
  } else if (probability_of_default < 15) {
    pdBadge.textContent = 'High';
    pdBadge.style.background = '#ffedd5'; pdBadge.style.color = '#9a3412';
  } else {
    pdBadge.textContent = 'Very High';
    pdBadge.style.background = '#fee2e2'; pdBadge.style.color = '#991b1b';
  }

  // ── Score – animated counter ──
  animateCounter('score-display', credit_score, 1200);

  // ── Gauge ──
  animateGauge(credit_score);

  // ── Risk badge ──
  const badge = document.getElementById('risk-badge');
  badge.textContent = risk_tier;
  badge.style.background = risk_bg;
  badge.style.color = risk_color;

  document.getElementById('risk-desc').textContent = risk_desc;

  // ── Factors ──
  const grid = document.getElementById('factors-grid');
  grid.innerHTML = '';
  factors.forEach(f => {
    const item = document.createElement('div');
    item.className = 'factor-item';
    item.innerHTML = `
      <div class="factor-icon ${f.status}">
        <span class="material-icons-round">${f.icon}</span>
      </div>
      <div class="factor-info">
        <div class="factor-label">${f.label}</div>
        <div class="factor-assessment ${f.status}">${f.assessment}</div>
      </div>
    `;
    grid.appendChild(item);
  });

  // ── Recommendations ──
  const recoList = document.getElementById('reco-list');
  recoList.innerHTML = '';
  recommendations.forEach(r => {
    const li = document.createElement('li');
    li.textContent = r;
    recoList.appendChild(li);
  });

  // Scroll to results on mobile
  if (window.innerWidth < 1200) {
    document.getElementById('results-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ─── Gauge Animation ─────────────────────────────────────────────────────────
function animateGauge(score) {
  // Map score 300-850 to angle -90 to +90 degrees
  const minScore = 300, maxScore = 850;
  const minAngle = -90, maxAngle = 90;
  const ratio = (score - minScore) / (maxScore - minScore);
  const angle = minAngle + ratio * (maxAngle - minAngle);

  const needle = document.getElementById('gauge-needle');
  needle.style.transform = `rotate(${angle}deg)`;

  // Update gauge text with animation
  const textEl = document.getElementById('gauge-score-text');
  animateCounterElement(textEl, score, 1000);
}

// ─── Counter Animation ───────────────────────────────────────────────────────
function animateCounter(elementId, targetValue, duration = 1000) {
  const el = document.getElementById(elementId);
  animateCounterElement(el, targetValue, duration);
}

function animateCounterElement(el, targetValue, duration) {
  const start = performance.now();
  const startValue = 0;

  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startValue + eased * (targetValue - startValue));
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = targetValue;
  }
  requestAnimationFrame(update);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
  // Default section
  showSection('score');

  // Initialize What-if slider fill percentages (CSS --pct custom property)
  document.querySelectorAll('.slider').forEach(slider => {
    const min = parseFloat(slider.min || 0);
    const max = parseFloat(slider.max || 100);
    const val = parseFloat(slider.value || 0);
    const pct = Math.min(Math.max(((val - min) / (max - min)) * 100, 0), 100);
    slider.style.setProperty('--pct', pct + '%');
  });
});



// ═══ AI CHAT WIDGET ══════════════════════════════════════════════════════════
let chatOpen = false;
let chatContext = {};
const CHAT_API = '/api/chat';

const GREETING = "Hi! I'm your **Credit Score AI** assistant 🤖\n\nTell me about your financial profile in natural language and I'll predict your credit score.\n\n**Try:** \"I'm 35, earn $5k/month, 30% credit utilization, debt ratio 35%, never late on payments\"";

function toggleChat() {
  const panel = document.getElementById('chat-panel');
  const fab   = document.getElementById('chat-fab');
  const badge = document.getElementById('chat-unread');
  chatOpen = !chatOpen;
  if (chatOpen) {
    panel.classList.remove('hidden');
    fab.style.background = 'linear-gradient(135deg,#dc2626,#b91c1c)';
    badge.classList.add('hidden');
    if (document.getElementById('chat-messages').children.length === 0) {
      initChat();
    }
    setTimeout(() => document.getElementById('chat-input').focus(), 100);
  } else {
    panel.classList.add('hidden');
    fab.style.background = '';
  }
}

function initChat() {
  chatContext = {};
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML = '';
  document.getElementById('chat-chips').classList.remove('hidden');
  appendBotMessage(GREETING);
}

function resetChat() { initChat(); }

function appendUserMessage(text) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `
    <div class="msg-av">AU</div>
    <div class="msg-bubble">${escapeHtml(text)}</div>
  `;
  msgs.appendChild(div);
  scrollMsgs();
}

function appendBotMessage(text) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = `
    <div class="msg-av"><span class="material-icons-round">smart_toy</span></div>
    <div class="msg-bubble">${formatMd(text)}</div>
  `;
  msgs.appendChild(div);
  scrollMsgs();
}

function appendScoreCard(prediction) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  const score = prediction.credit_score;
  const pd    = prediction.probability_of_default;
  const tier  = prediction.risk_tier;
  const color = prediction.risk_color;
  const bg    = prediction.risk_bg;
  div.innerHTML = `
    <div class="msg-av"><span class="material-icons-round">smart_toy</span></div>
    <div class="chat-score-card">
      <div class="chat-score-num" id="chat-score-anim">0</div>
      <div class="chat-score-sub">Credit Score / 850</div>
      <div class="chat-tier-badge" style="background:${bg};color:${color}">${tier}</div>
      <div class="chat-pd-row">Default Probability: <strong style="color:white">${pd}%</strong></div>
    </div>
  `;
  msgs.appendChild(div);
  scrollMsgs();
  animateCounterElement(document.getElementById('chat-score-anim'), score, 1000);
}

function showTyping() {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg bot'; div.id = 'typing-msg';
  div.innerHTML = `
    <div class="msg-av"><span class="material-icons-round">smart_toy</span></div>
    <div class="typing-indicator">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>
  `;
  msgs.appendChild(div);
  scrollMsgs();
}

function removeTyping() {
  const t = document.getElementById('typing-msg');
  if (t) t.remove();
}

function scrollMsgs() {
  const msgs = document.getElementById('chat-messages');
  setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 50);
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  document.getElementById('chat-chips').classList.add('hidden');
  input.value = '';
  input.style.height = '';
  appendUserMessage(text);

  const sendBtn = document.getElementById('chat-send');
  sendBtn.disabled = true;
  showTyping();

  try {
    const resp = await fetch(CHAT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, context: chatContext }),
    });
    const data = await resp.json();
    removeTyping();
    chatContext = data.context || {};
    appendBotMessage(data.reply);
    if (data.prediction && data.done) {
      appendScoreCard(data.prediction);
    }
  } catch (err) {
    removeTyping();
    appendBotMessage("Sorry, I couldn't connect to the server. Make sure Flask is running.");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
}

function autoResizeTA(el) {
  el.style.height = '';
  el.style.height = Math.min(el.scrollHeight, 90) + 'px';
}

function useChip(btn) {
  const input = document.getElementById('chat-input');
  input.value = btn.textContent;
  document.getElementById('chat-chips').classList.add('hidden');
  sendChatMessage();
}

function formatMd(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

// Show badge after 2s to invite user
setTimeout(() => {
  if (!chatOpen) {
    const badge = document.getElementById('chat-unread');
    if (badge) {
      badge.textContent = '1';
      badge.classList.remove('hidden');
    }
  }
}, 2000);

// ─── Batch Scoring Feature ───────────────────────────────────────────
let selectedBatchFile = null;
let lastScoredBatchFile = null;

function triggerFileInput() {
  document.getElementById('batch-file-input').click();
}

function handleFileSelect(e) {
  const file = e.target.files ? e.target.files[0] : e.dataTransfer.files[0];
  if (!file) return;

  const name = file.name;
  const ext = name.split('.').pop().toLowerCase();
  if (['csv', 'xlsx', 'xls'].indexOf(ext) === -1) {
    alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
    return;
  }

  selectedBatchFile = file;
  
  // Show file info container
  document.getElementById('selected-file-name').textContent = file.name;
  
  // Format file size
  let sizeText = '';
  if (file.size > 1024 * 1024) {
    sizeText = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    sizeText = (file.size / 1024).toFixed(1) + ' KB';
  }
  document.getElementById('selected-file-size').textContent = sizeText;
  
  document.getElementById('file-info-container').classList.remove('hidden');
  document.getElementById('dropzone').classList.add('hidden');
}

function clearSelectedFile() {
  selectedBatchFile = null;
  document.getElementById('batch-file-input').value = '';
  document.getElementById('file-info-container').classList.add('hidden');
  document.getElementById('dropzone').classList.remove('hidden');
  document.getElementById('batch-results').classList.add('hidden');
}

function uploadBatchFile() {
  if (!selectedBatchFile) return;

  const formData = new FormData();
  formData.append('file', selectedBatchFile);

  const uploadCard = document.getElementById('upload-card');
  const loadingCard = document.getElementById('batch-loading');
  const resultsContainer = document.getElementById('batch-results');

  uploadCard.classList.add('hidden');
  loadingCard.classList.remove('hidden');
  resultsContainer.classList.add('hidden');

  fetch('/api/batch-predict', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    loadingCard.classList.add('hidden');
    uploadCard.classList.remove('hidden');

    if (data.error) {
      alert('Error: ' + data.error);
      clearSelectedFile();
      return;
    }

    // Populate summary stats
    document.getElementById('batch-total-records').textContent = data.total_records.toLocaleString();
    document.getElementById('batch-avg-score').textContent = data.average_score;
    
    // Save reference for stress testing
    lastScoredBatchFile = data.download_url;
    
    // Reset stress test dashboard
    const stressDash = document.getElementById('stress-results-dashboard');
    if (stressDash) stressDash.classList.add('hidden');
    
    // Setup download button
    const downloadBtn = document.getElementById('batch-download-btn');
    downloadBtn.href = data.download_url;
    downloadBtn.setAttribute('download', 'scored_' + selectedBatchFile.name);

    // Render Risk Tier Distribution
    const tierBarsContainer = document.getElementById('batch-tier-bars');
    tierBarsContainer.innerHTML = '';
    
    const tiers = [
      { name: 'Excellent', key: 'Excellent', color: '#22c55e' },
      { name: 'Good', key: 'Good', color: '#16a34a' },
      { name: 'Fair', key: 'Fair', color: '#eab308' },
      { name: 'Poor', key: 'Poor', color: '#ea580c' },
      { name: 'Very Poor', key: 'Very Poor', color: '#dc2626' }
    ];

    tiers.forEach(t => {
      const pct = data.tier_distribution[t.key] || 0;
      const row = document.createElement('div');
      row.className = 'tier-bar-row';
      row.innerHTML = `
        <div class="tier-bar-label">${t.name}</div>
        <div class="tier-bar-container">
          <div class="tier-bar-fill" style="width: ${pct}%; background-color: ${t.color};"></div>
        </div>
        <div class="tier-bar-pct">${pct}%</div>
      `;
      tierBarsContainer.appendChild(row);
    });

    // Populate preview table
    const tableBody = document.getElementById('batch-table-body');
    tableBody.innerHTML = '';

    data.preview.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${row.index}</strong></td>
        <td>${row.age}</td>
        <td>$${row.income.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
        <td>${(row.utilization * 100).toFixed(1)}%</td>
        <td>${(row.debt_ratio * 100).toFixed(1)}%</td>
        <td><strong style="color: ${row.color}; font-size: 14px;">${row.score}</strong></td>
        <td>${row.pd}%</td>
        <td><span class="tier-pill" style="background-color: ${row.color}15; color: ${row.color}; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${row.tier}</span></td>
      `;
      tableBody.appendChild(tr);
    });

    // Show results
    resultsContainer.classList.remove('hidden');
  })
  .catch(err => {
    loadingCard.classList.add('hidden');
    uploadCard.classList.remove('hidden');
    alert('Failed to process file: ' + err.message);
    clearSelectedFile();
  });
}

// Drag & Drop event bindings
const dropzone = document.getElementById('dropzone');
if (dropzone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleFileSelect(e);
    }
  }, false);
}


// ─── Macroeconomic Stress Testing Simulator ──────────────────────────
function updateStressValue(type, val) {
  const displayId = `stress-${type}-val`;
  const el = document.getElementById(displayId);
  if (el) el.textContent = val + '%';
}

async function runStressSimulation() {
  if (!lastScoredBatchFile) {
    alert('Please upload and run Batch Scoring before performing a stress test.');
    return;
  }

  const incomeDrop = parseFloat(document.getElementById('stress-income-drop').value);
  const debtIncrease = parseFloat(document.getElementById('stress-debt-increase').value);
  const utilIncrease = parseFloat(document.getElementById('stress-util-increase').value);

  const runBtn = document.getElementById('stress-run-btn');
  const spinner = document.getElementById('stress-spinner');
  const btnText = document.getElementById('stress-btn-text');
  const dashboard = document.getElementById('stress-results-dashboard');

  runBtn.disabled = true;
  spinner.classList.remove('hidden');
  btnText.textContent = 'Running simulation...';
  dashboard.classList.add('hidden');

  try {
    const resp = await fetch('/api/batch-stress-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_path: lastScoredBatchFile,
        income_drop_pct: incomeDrop,
        debt_ratio_increase_pct: debtIncrease,
        utilization_increase_pct: utilIncrease
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || 'Failed to execute stress test');
    }

    // 1. Populate deltas
    const scoreDiff = data.avg_score_after - data.avg_score_before;
    const scoreDeltaEl = document.getElementById('stress-avg-score-delta');
    scoreDeltaEl.textContent = `${scoreDiff >= 0 ? '+' : ''}${scoreDiff} pts`;
    scoreDeltaEl.style.color = scoreDiff < 0 ? '#b91c1c' : '#15803d';
    document.getElementById('stress-avg-score-compare').textContent = `${data.avg_score_before} ➔ ${data.avg_score_after}`;

    const pdDiff = (data.avg_pd_after - data.avg_pd_before).toFixed(2);
    const pdDeltaEl = document.getElementById('stress-avg-pd-delta');
    pdDeltaEl.textContent = `${pdDiff >= 0 ? '+' : ''}${pdDiff}%`;
    pdDeltaEl.style.color = pdDiff > 0 ? '#b91c1c' : '#15803d';
    document.getElementById('stress-avg-pd-compare').textContent = `${data.avg_pd_before.toFixed(2)}% ➔ ${data.avg_pd_after.toFixed(2)}%`;

    document.getElementById('stress-degraded-pct').textContent = `${data.degraded_pct}%`;
    document.getElementById('stress-degraded-count').textContent = `${data.degraded_count} / ${data.total_records} profiles`;

    // 2. Setup download button
    const dlBtn = document.getElementById('stress-download-btn');
    if (dlBtn) {
      dlBtn.href = data.download_url;
    }

    // 3. Render Risk Tier shifts (Double bars comparison)
    const container = document.getElementById('stress-comparison-bars');
    container.innerHTML = '';

    const tiers = [
      { name: 'Excellent', key: 'Excellent', color: '#22c55e' },
      { name: 'Good', key: 'Good', color: '#16a34a' },
      { name: 'Fair', key: 'Fair', color: '#eab308' },
      { name: 'Poor', key: 'Poor', color: '#ea580c' },
      { name: 'Very Poor', key: 'Very Poor', color: '#dc2626' }
    ];

    tiers.forEach(t => {
      const pctBefore = data.tier_distribution_before[t.key] || 0;
      const pctAfter = data.tier_distribution_after[t.key] || 0;
      const diff = (pctAfter - pctBefore).toFixed(1);
      const diffText = diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '0%';
      const diffColor = diff > 0 ? (t.key === 'Poor' || t.key === 'Very Poor' ? '#b91c1c' : '#15803d') : (diff < 0 ? (t.key === 'Poor' || t.key === 'Very Poor' ? '#15803d' : '#b91c1c') : 'var(--slate-500)');

      const barRow = document.createElement('div');
      barRow.className = 'stress-comp-bar-row';
      barRow.innerHTML = `
        <div class="stress-comp-label-row">
          <span class="tier-name">
            <span class="tier-dot" style="background-color: ${t.color}"></span>
            ${t.name}
          </span>
          <span class="pct-change" style="color: ${diffColor}">${pctBefore}% ➔ ${pctAfter}% (${diffText})</span>
        </div>
        <div class="stress-progress-pair">
          <!-- Baseline -->
          <div class="stress-progress-bar-wrapper">
            <div class="stress-progress-bar" style="width: ${pctBefore}%; background-color: ${t.color};" title="Baseline: ${pctBefore}%"></div>
          </div>
          <!-- Stressed -->
          <div class="stress-progress-bar-wrapper stressed">
            <div class="stress-progress-bar" style="width: ${pctAfter}%; background-color: ${t.color};" title="Stressed: ${pctAfter}%"></div>
          </div>
        </div>
      `;
      container.appendChild(barRow);
    });

    dashboard.classList.remove('hidden');
  } catch (err) {
    alert('Simulation error: ' + err.message);
  } finally {
    runBtn.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = 'Run Stress Simulation';
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// PHASE 6: What-if Simulator + Score Improvement Roadmap + Compare Profiles
// ═══════════════════════════════════════════════════════════════════════════

// ─── Shared constants ────────────────────────────────────────────────────────
const ALL_FIELDS = [
  'MonthlyIncome', 'age',
  'RevolvingUtilizationOfUnsecuredLines', 'DebtRatio',
  'NumberOfOpenCreditLinesAndLoans', 'NumberRealEstateLoansOrLines',
  'NumberOfDependents',
  'NumberOfTime30-59DaysPastDueNotWorse',
  'NumberOfTime60-89DaysPastDueNotWorse',
  'NumberOfTimes90DaysLate',
];

// ─── What-if Simulator ────────────────────────────────────────────────────────
let wiState = {
  MonthlyIncome: 5000, age: 35,
  RevolvingUtilizationOfUnsecuredLines: 0.35, DebtRatio: 0.35,
  NumberOfOpenCreditLinesAndLoans: 6, NumberRealEstateLoansOrLines: 1,
  NumberOfDependents: 1,
  'NumberOfTime30-59DaysPastDueNotWorse': 0,
  'NumberOfTime60-89DaysPastDueNotWorse': 0,
  NumberOfTimes90DaysLate: 0,
};
let wiBaseline = null;
let wiDebounceTimer = null;
let wiLastScore = null;

function onSlider(field, rawVal, displayId, fmt) {
  const val = parseFloat(rawVal);
  wiState[field] = val;

  // Update display label
  const el = document.getElementById(displayId);
  if (el) {
    if (fmt === 'pct') el.textContent = Math.round(val * 100) + '%';
    else if (fmt === 'income') el.textContent = '$' + Number(val).toLocaleString();
    else el.textContent = val;
  }

  // Update slider fill color via CSS custom property
  const slider = document.querySelector(`#wi-${CSS.escape(field)}`);
  if (slider) {
    const min = parseFloat(slider.min), max = parseFloat(slider.max);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--pct', pct + '%');
  }

  // Debounce API call (300ms)
  clearTimeout(wiDebounceTimer);
  wiDebounceTimer = setTimeout(fetchWhatif, 300);
}

async function fetchWhatif() {
  try {
    const resp = await fetch('/api/whatif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wiState),
    });
    const data = await resp.json();
    if (data.error) return;

    const score = data.credit_score;
    wiLastScore = score;

    // Update score card
    document.getElementById('wi-score').textContent = score;
    document.getElementById('wi-pd').textContent = 'PD: ' + data.probability_of_default + '%';

    const badge = document.getElementById('wi-risk-badge');
    badge.textContent = data.risk_tier;
    badge.style.background = data.risk_bg;
    badge.style.color = data.risk_color;

    // Update gauge
    const wiNeedle = document.getElementById('wi-gauge-needle');
    const wiText = document.getElementById('wi-gauge-text');
    if (wiNeedle) {
      const ratio = (score - 300) / (850 - 300);
      const angle = -90 + ratio * 180;
      wiNeedle.style.transform = `rotate(${angle}deg)`;
    }
    if (wiText) wiText.textContent = score;

    // Update delta vs baseline
    updateWiDelta(score);
  } catch (_) {}
}

function updateWiDelta(score) {
  const deltaVal = document.getElementById('wi-delta');
  const deltaLabel = document.getElementById('wi-delta-label');
  if (!deltaVal || !deltaLabel) return;

  if (wiBaseline === null) {
    deltaVal.textContent = '–';
    deltaVal.className = 'whatif-delta-value delta-neutral';
    deltaLabel.textContent = 'Set a baseline first';
    return;
  }

  const diff = score - wiBaseline;
  deltaVal.textContent = (diff >= 0 ? '+' : '') + diff + ' pts';
  deltaVal.className = 'whatif-delta-value ' + (diff > 0 ? 'delta-positive' : diff < 0 ? 'delta-negative' : 'delta-neutral');
  deltaLabel.textContent = diff > 0
    ? `${diff} points better than baseline`
    : diff < 0
    ? `${Math.abs(diff)} points worse than baseline`
    : 'Same as baseline';
}

function setWhatifBaseline() {
  if (wiLastScore === null) { alert('Wait for a score to appear first.'); return; }
  wiBaseline = wiLastScore;
  updateWiDelta(wiLastScore);
}

function importToWhatif() {
  // Copy values from the main Credit Scoring form
  const fieldMap = {
    MonthlyIncome: 'MonthlyIncome', age: 'age',
    RevolvingUtilizationOfUnsecuredLines: 'RevolvingUtilizationOfUnsecuredLines',
    DebtRatio: 'DebtRatio',
    NumberOfOpenCreditLinesAndLoans: 'NumberOfOpenCreditLinesAndLoans',
    NumberRealEstateLoansOrLines: 'NumberRealEstateLoansOrLines',
    NumberOfDependents: 'NumberOfDependents',
    'NumberOfTime30-59DaysPastDueNotWorse': 'NumberOfTime30-59DaysPastDueNotWorse',
    'NumberOfTime60-89DaysPastDueNotWorse': 'NumberOfTime60-89DaysPastDueNotWorse',
    NumberOfTimes90DaysLate: 'NumberOfTimes90DaysLate',
  };
  const valDisplayMap = {
    MonthlyIncome: ['wi-val-income', 'income'],
    age: ['wi-val-age', 'age'],
    RevolvingUtilizationOfUnsecuredLines: ['wi-val-util', 'pct'],
    DebtRatio: ['wi-val-dti', 'pct'],
    NumberOfOpenCreditLinesAndLoans: ['wi-val-lines', 'num'],
    NumberRealEstateLoansOrLines: ['wi-val-re', 'num'],
    NumberOfDependents: ['wi-val-dep', 'num'],
    'NumberOfTime30-59DaysPastDueNotWorse': ['wi-val-l30', 'num'],
    'NumberOfTime60-89DaysPastDueNotWorse': ['wi-val-l60', 'num'],
    NumberOfTimes90DaysLate: ['wi-val-l90', 'num'],
  };
  const sliderIdMap = {
    MonthlyIncome: 'wi-MonthlyIncome', age: 'wi-age',
    RevolvingUtilizationOfUnsecuredLines: 'wi-RevolvingUtilizationOfUnsecuredLines',
    DebtRatio: 'wi-DebtRatio',
    NumberOfOpenCreditLinesAndLoans: 'wi-NumberOfOpenCreditLinesAndLoans',
    NumberRealEstateLoansOrLines: 'wi-NumberRealEstateLoansOrLines',
    NumberOfDependents: 'wi-NumberOfDependents',
    'NumberOfTime30-59DaysPastDueNotWorse': 'wi-NumberOfTime30-59DaysPastDueNotWorse',
    'NumberOfTime60-89DaysPastDueNotWorse': 'wi-NumberOfTime60-89DaysPastDueNotWorse',
    NumberOfTimes90DaysLate: 'wi-NumberOfTimes90DaysLate',
  };

  let imported = false;
  for (const [field, srcId] of Object.entries(fieldMap)) {
    const srcEl = document.getElementById(srcId);
    if (srcEl && srcEl.value !== '') {
      const val = parseFloat(srcEl.value);
      wiState[field] = val;
      const slider = document.getElementById(sliderIdMap[field]);
      if (slider) {
        slider.value = val;
        const min = parseFloat(slider.min), max = parseFloat(slider.max);
        const pct = Math.min(Math.max(((val - min) / (max - min)) * 100, 0), 100);
        slider.style.setProperty('--pct', pct + '%');
      }
      const [dispId, fmt] = valDisplayMap[field];
      const dispEl = document.getElementById(dispId);
      if (dispEl) {
        if (fmt === 'pct') dispEl.textContent = Math.round(val * 100) + '%';
        else if (fmt === 'income') dispEl.textContent = '$' + Number(val).toLocaleString();
        else dispEl.textContent = val;
      }
      imported = true;
    }
  }
  if (imported) fetchWhatif();
  else alert('Fill in the Credit Scoring form first, then import.');
}

// Trigger initial What-if load when switching to that section
const _origShowSection = showSection;
showSection = function(name) {
  const result = _origShowSection(name);
  if (name === 'whatif' && wiLastScore === null) fetchWhatif();
  return result;
};



// ─── Score Improvement Roadmap ────────────────────────────────────────────────
const RM_FIELDS = [
  'MonthlyIncome', 'age',
  'RevolvingUtilizationOfUnsecuredLines', 'DebtRatio',
  'NumberOfOpenCreditLinesAndLoans', 'NumberRealEstateLoansOrLines',
  'NumberOfDependents',
  'NumberOfTime30-59DaysPastDueNotWorse',
  'NumberOfTime60-89DaysPastDueNotWorse',
  'NumberOfTimes90DaysLate',
];

function fillRoadmapSample() {
  const poor = {
    MonthlyIncome: 2500, age: 28,
    RevolvingUtilizationOfUnsecuredLines: 0.82, DebtRatio: 0.68,
    NumberOfOpenCreditLinesAndLoans: 14, NumberRealEstateLoansOrLines: 0,
    NumberOfDependents: 3,
    'NumberOfTime30-59DaysPastDueNotWorse': 3,
    'NumberOfTime60-89DaysPastDueNotWorse': 2,
    NumberOfTimes90DaysLate: 1,
  };
  for (const [k, v] of Object.entries(poor)) {
    const el = document.getElementById('rm-' + k);
    if (el) el.value = v;
  }
}

function importToRoadmap() {
  let imported = false;
  for (const f of RM_FIELDS) {
    const src = document.getElementById(f);
    const dst = document.getElementById('rm-' + f);
    if (src && dst && src.value !== '') { dst.value = src.value; imported = true; }
  }
  if (!imported) alert('Fill in the Credit Scoring form first, then import.');
}

async function submitRoadmap(e) {
  e.preventDefault();
  const payload = {};
  for (const f of RM_FIELDS) {
    const el = document.getElementById('rm-' + f);
    if (el && el.value !== '') payload[f] = parseFloat(el.value);
  }

  const btn = document.getElementById('roadmap-submit-btn');
  const txt = document.getElementById('roadmap-btn-text');
  const spn = document.getElementById('roadmap-spinner');
  btn.disabled = true; txt.textContent = 'Analyzing...'; spn.classList.remove('hidden');

  try {
    // Get base score
    const baseResp = await fetch('/api/whatif', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const baseData = await baseResp.json();
    const baseScore = baseData.credit_score;

    // Define improvement scenarios
    const improvements = [
      {
        label: 'Reduce Credit Utilization',
        icon: 'credit_card', iconBg: '#2563eb',
        field: 'RevolvingUtilizationOfUnsecuredLines',
        target: 0.1, fmt: 'pct', timeline: '3–6 months',
        description: 'Pay down revolving balances to below 10%',
        steps: [
          'Pay down card balances before the monthly statement closing date.',
          'Request a credit limit increase from your bank (but keep spending low).',
          'Spread large purchases across multiple credit cards instead of just one.',
          'Set up balance alerts at 30% of your credit limit to avoid over-utilization.'
        ]
      },
      {
        label: 'Lower Debt-to-Income',
        icon: 'account_balance', iconBg: '#7c3aed',
        field: 'DebtRatio',
        target: 0.25, fmt: 'pct', timeline: '6–12 months',
        description: 'Reduce total monthly debt obligations',
        steps: [
          'Pay off smaller high-interest debts first to free up monthly cash flow (Debt Snowball).',
          'Refinance or consolidate loans to secure lower monthly payments.',
          'Postpone any new financing, buy-now-pay-later, or retail store credit applications.',
          'Avoid co-signing loans for others, as it counts fully against your DTI ratio.'
        ]
      },
      {
        label: 'Increase Monthly Income',
        icon: 'payments', iconBg: '#059669',
        field: 'MonthlyIncome',
        target: Math.max((payload.MonthlyIncome || 3000) * 1.5, 6000), fmt: 'income', timeline: '12–18 months',
        description: 'Grow income through career or side income',
        steps: [
          'Explore side income opportunities (freelance, consulting, or online sales).',
          'Negotiate a salary increase or seek certifications to qualify for higher-paying roles.',
          'Invest in high-demand technical or financial skills to transition to higher earning paths.',
          'Monetize underutilized assets (renting out a spare room, vehicle, etc.).'
        ]
      },
      {
        label: 'Clear Late 30-59 Day Payments',
        icon: 'schedule', iconBg: '#ea580c',
        field: 'NumberOfTime30-59DaysPastDueNotWorse',
        target: 0, fmt: 'num', timeline: '24 months (aging)',
        description: 'Late payment records fade after 2 years',
        steps: [
          'Set up Automatic Payments (Autopay) for at least the minimum amount due on all cards.',
          'Enable SMS/Email payment reminders at least 5 days before the due date.',
          'Contact your lender to request a one-time goodwill deletion of the late record.',
          'Maintain a buffer of at least 1 month\'s worth of debt payments in your checking account.'
        ]
      },
      {
        label: 'Clear Late 60-89 Day Payments',
        icon: 'report_problem', iconBg: '#dc2626',
        field: 'NumberOfTime60-89DaysPastDueNotWorse',
        target: 0, fmt: 'num', timeline: '24 months (aging)',
        description: 'Maintain perfect payment history going forward',
        steps: [
          'Pay the overdue balance immediately to prevent the debt from rolling into serious delinquency.',
          'Establish an emergency budget to cut non-essential spending and prioritize debt payment.',
          'Work directly with the bank\'s hardship department to request a temporary payment plan.',
          'Never ignore bank communications; active engagement helps prevent collection agency transfers.'
        ]
      },
      {
        label: 'Clear 90+ Day Late Payments',
        icon: 'error', iconBg: '#991b1b',
        field: 'NumberOfTimes90DaysLate',
        target: 0, fmt: 'num', timeline: '24 months (aging)',
        description: 'Major impact: eliminating serious delinquencies',
        steps: [
          'Contact the collection department to negotiate a settlement (often 40-60% of original debt).',
          'Request a \'Pay for Delete\' agreement in writing to remove the negative mark upon payment.',
          'Obtain an official written release of liability letter once the account is settled.',
          'Monitor your official credit reports to ensure the status is updated to \'Paid\' or \'Settled\'.'
        ]
      },
    ];

    // Score each improvement individually
    let bestPotential = baseScore;
    const cardData = [];

    for (const imp of improvements) {
      const currentVal = payload[imp.field] ?? 0;
      if (currentVal <= imp.target && imp.fmt !== 'income') continue; // No improvement needed
      if (imp.fmt === 'income' && (payload[imp.field] ?? 0) >= imp.target) continue;

      const scenario = { ...payload, [imp.field]: imp.target };
      const resp = await fetch('/api/whatif', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario),
      });
      const d = await resp.json();
      const gain = d.credit_score - baseScore;
      if (gain <= 0) continue;

      if (d.credit_score > bestPotential) bestPotential = d.credit_score;
      cardData.push({ ...imp, currentVal, improvedScore: d.credit_score, gain });
    }

    // Sort by gain descending
    cardData.sort((a, b) => b.gain - a.gain);

    renderRoadmap(baseScore, bestPotential, cardData, baseData.risk_tier, baseData.risk_color, baseData.risk_bg);
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btn.disabled = false; txt.textContent = 'Generate Roadmap'; spn.classList.add('hidden');
  }
}

function toggleRoadmapSteps(el) {
  const header = el;
  const content = header.nextElementSibling;
  const icon = header.querySelector('.toggle-icon');
  
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    icon.textContent = 'expand_less';
    header.classList.add('active');
  } else {
    content.classList.add('hidden');
    icon.textContent = 'expand_more';
    header.classList.remove('active');
  }
}

function renderRoadmap(baseScore, potentialScore, cards, baseTier, baseColor, baseBg) {
  // Header
  document.getElementById('rm-current-score').textContent = baseScore;
  document.getElementById('rm-current-risk').textContent = baseTier;
  document.getElementById('rm-current-risk').style.color = baseColor;
  document.getElementById('rm-potential-score').textContent = potentialScore;

  const potData = getPotentialTier(potentialScore);
  document.getElementById('rm-potential-risk').textContent = potData.tier;

  // Show results
  document.getElementById('roadmap-results').classList.remove('hidden');

  // Build cards
  const grid = document.getElementById('roadmap-cards');
  grid.innerHTML = '';

  if (cards.length === 0) {
    grid.innerHTML = '<div class="card" style="padding:32px;text-align:center;grid-column:1/-1;"><span class="material-icons-round" style="font-size:48px;color:#22c55e;">check_circle</span><h3 style="margin-top:12px;color:#15803d;">Profile looks great!</h3><p style="color:#64748b;margin-top:6px;">No major improvements identified. Keep maintaining your excellent financial habits.</p></div>';
    return;
  }

  cards.forEach((c, i) => {
    const maxVal = c.fmt === 'income' ? c.target : Math.max(c.currentVal, 1);
    const beforePct = c.fmt === 'income' ? Math.round((c.target / c.target) * 100) : Math.min(Math.round((c.currentVal / Math.max(c.currentVal * 1.5, 1)) * 100), 100);
    const afterPct  = c.fmt === 'income' ? 100 : 10;

    const fromStr = fmtVal(c.currentVal, c.fmt);
    const toStr   = fmtVal(c.target, c.fmt);

    const card = document.createElement('div');
    card.className = 'roadmap-card';
    card.style.animationDelay = (i * 0.08) + 's';
    card.innerHTML = `
      <div class="roadmap-card-header">
        <div class="roadmap-card-icon" style="background:${c.iconBg}">
          <span class="material-icons-round">${c.icon}</span>
        </div>
        <div>
          <div class="roadmap-card-title">${c.label}</div>
          <div class="roadmap-card-subtitle">${c.description}</div>
        </div>
      </div>
      <div class="roadmap-card-body">
        <div class="roadmap-before-after">
          <span class="roadmap-val from">${fromStr}</span>
          <span class="material-icons-round">arrow_forward</span>
          <span class="roadmap-val to">${toStr}</span>
        </div>
        <div class="roadmap-bar-track">
          <div class="roadmap-bar-before" style="width:${beforePct}%"></div>
        </div>
        <div class="roadmap-bar-track" style="margin-top:6px">
          <div class="roadmap-bar-after" style="width:${afterPct}%;background:${c.iconBg}"></div>
        </div>
        <div class="roadmap-gain">
          <div>
            <div class="roadmap-gain-pts">+${c.gain} pts</div>
            <div class="roadmap-gain-label">Potential gain</div>
          </div>
          <div class="roadmap-timeline">${c.timeline}</div>
        </div>
      </div>
    `;
    const stepsHtml = c.steps.map(step => `
      <li>
        <span class="material-icons-round step-check" style="font-size: 16px; color: #22c55e; margin-right: 8px; vertical-align: middle;">check_circle</span>
        <span style="vertical-align: middle;">${step}</span>
      </li>
    `).join('');

    card.innerHTML += `
      <!-- Collapsible Detailed Action Steps -->
      <div class="roadmap-steps-toggle" onclick="toggleRoadmapSteps(this)">
        <span>Detailed Action Plan</span>
        <span class="material-icons-round toggle-icon">expand_more</span>
      </div>
      <div class="roadmap-steps-content hidden">
        <ul class="roadmap-steps-list">
          ${stepsHtml}
        </ul>
      </div>
    `;

    grid.appendChild(card);
  });
}

function fmtVal(v, fmt) {
  if (fmt === 'pct') return Math.round(v * 100) + '%';
  if (fmt === 'income') return '$' + Number(v).toLocaleString();
  return v;
}

function getPotentialTier(score) {
  if (score >= 750) return { tier: 'Excellent', color: '#22c55e' };
  if (score >= 700) return { tier: 'Good', color: '#16a34a' };
  if (score >= 630) return { tier: 'Fair', color: '#d97706' };
  if (score >= 550) return { tier: 'Poor', color: '#ea580c' };
  return { tier: 'Very Poor', color: '#dc2626' };
}


// ─── Compare Profiles ─────────────────────────────────────────────────────────
let compareProfileCount = 2;

function addCompareProfile() {
  if (compareProfileCount >= 3) return;
  compareProfileCount = 3;
  document.getElementById('compare-card-2').classList.remove('hidden');
  document.getElementById('compare-forms-row').classList.add('three-col');
  document.getElementById('compare-add-btn').disabled = true;
  document.getElementById('compare-add-btn').style.opacity = '.4';
}

function fillCompareSample(idx, type) {
  const samples = {
    good: {
      MonthlyIncome: 7500, age: 45,
      RevolvingUtilizationOfUnsecuredLines: 0.18, DebtRatio: 0.25,
      NumberOfOpenCreditLinesAndLoans: 8, NumberRealEstateLoansOrLines: 1,
      NumberOfDependents: 1,
      'NumberOfTime30-59DaysPastDueNotWorse': 0,
      'NumberOfTime60-89DaysPastDueNotWorse': 0,
      NumberOfTimes90DaysLate: 0,
    },
    poor: {
      MonthlyIncome: 1800, age: 28,
      RevolvingUtilizationOfUnsecuredLines: 0.92, DebtRatio: 0.75,
      NumberOfOpenCreditLinesAndLoans: 14, NumberRealEstateLoansOrLines: 0,
      NumberOfDependents: 3,
      'NumberOfTime30-59DaysPastDueNotWorse': 3,
      'NumberOfTime60-89DaysPastDueNotWorse': 2,
      NumberOfTimes90DaysLate: 4,
    },
  };
  const s = samples[type];
  for (const [k, v] of Object.entries(s)) {
    const el = document.getElementById(`cmp-${idx}-${k}`);
    if (el) el.value = v;
  }
}

async function submitCompare() {
  const btn = document.getElementById('compare-btn-text');
  const spn = document.getElementById('compare-spinner');
  btn.textContent = 'Comparing...'; spn.classList.remove('hidden');

  const profiles = [];
  for (let i = 0; i < compareProfileCount; i++) {
    const profile = { _name: document.getElementById(`cmp-name-${i}`)?.value || `Profile ${String.fromCharCode(65+i)}` };
    for (const f of ALL_FIELDS) {
      const el = document.getElementById(`cmp-${i}-${f}`);
      if (el && el.value !== '') profile[f] = parseFloat(el.value);
    }
    profiles.push(profile);
  }

  try {
    const resp = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profiles }),
    });
    const data = await resp.json();
    if (data.error) { alert('Error: ' + data.error); return; }
    renderCompareResults(data.results);
  } catch (err) {
    alert('Failed to compare: ' + err.message);
  } finally {
    btn.textContent = 'Compare Profiles'; spn.classList.add('hidden');
  }
}

function renderCompareResults(results) {
  document.getElementById('compare-results').classList.remove('hidden');

  // Find winner (highest score)
  const maxScore = Math.max(...results.map(r => r.credit_score));

  // Score summary cards
  const scoreRow = document.getElementById('compare-score-row');
  scoreRow.innerHTML = '';
  results.forEach(r => {
    const isWinner = r.credit_score === maxScore;
    const cell = document.createElement('div');
    cell.className = 'compare-score-cell' + (isWinner ? ' winner' : '');
    cell.innerHTML = `
      ${isWinner ? '<div class="compare-winner-badge">🏆 Best Score</div>' : ''}
      <div class="compare-cell-name">${escapeHtml(r.name)}</div>
      <div class="compare-cell-score" style="color:${r.risk_color}">${r.credit_score}</div>
      <div class="compare-cell-tier" style="background:${r.risk_bg};color:${r.risk_color}">${r.risk_tier}</div>
      <div class="compare-cell-pd">PD: ${r.probability_of_default}%</div>
    `;
    scoreRow.appendChild(cell);
  });

  // Factor comparison table
  const head = document.getElementById('compare-table-head');
  const body = document.getElementById('compare-table-body');

  const FACTOR_LABELS = {
    'RevolvingUtilizationOfUnsecuredLines': 'Credit Utilization',
    'age': 'Age',
    'NumberOfTime30-59DaysPastDueNotWorse': 'Late 30-59 days',
    'DebtRatio': 'Debt Ratio',
    'MonthlyIncome': 'Monthly Income',
    'NumberOfOpenCreditLinesAndLoans': 'Open Credit Lines',
    'NumberOfTimes90DaysLate': 'Late 90+ days',
    'NumberRealEstateLoansOrLines': 'Real Estate Loans',
    'NumberOfTime60-89DaysPastDueNotWorse': 'Late 60-89 days',
    'NumberOfDependents': 'Dependents',
  };

  // Build header
  head.innerHTML = '';
  const hr = document.createElement('tr');
  hr.innerHTML = '<th>Factor</th>' + results.map(r => `<th>${escapeHtml(r.name)}</th>`).join('');
  head.appendChild(hr);

  // Build rows — one row per factor key
  body.innerHTML = '';
  if (results.length === 0) return;
  const factorKeys = results[0].factors.map(f => f.key);

  factorKeys.forEach(key => {
    const label = FACTOR_LABELS[key] || key;
    const tr = document.createElement('tr');
    let rowHtml = `<td><strong>${label}</strong></td>`;
    results.forEach(r => {
      const f = r.factors.find(x => x.key === key);
      if (!f) { rowHtml += '<td>–</td>'; return; }
      const valDisplay = key === 'MonthlyIncome' ? '$' + Number(f.value).toLocaleString()
        : (key === 'RevolvingUtilizationOfUnsecuredLines' || key === 'DebtRatio')
          ? Math.round(f.value * 100) + '%'
          : f.value;
      rowHtml += `<td>
        <div>${valDisplay}</div>
        <span class="compare-factor-status ${f.status}">${f.assessment}</span>
      </td>`;
    });
    tr.innerHTML = rowHtml;
    body.appendChild(tr);
  });

  document.getElementById('compare-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ═══════════════════════════════════════════════════════════════════════════
// PRICING CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════

const RATE_TABLE = [
  { minScore: 800, rate:  4.5, maxLoan: 100000 },
  { minScore: 780, rate:  5.0, maxLoan:  90000 },
  { minScore: 760, rate:  5.5, maxLoan:  80000 },
  { minScore: 750, rate:  6.0, maxLoan:  75000 },
  { minScore: 730, rate:  6.5, maxLoan:  65000 },
  { minScore: 720, rate:  7.0, maxLoan:  60000 },
  { minScore: 710, rate:  7.5, maxLoan:  55000 },
  { minScore: 700, rate:  8.0, maxLoan:  50000 },
  { minScore: 680, rate:  9.0, maxLoan:  45000 },
  { minScore: 660, rate: 10.0, maxLoan:  40000 },
  { minScore: 640, rate: 11.5, maxLoan:  35000 },
  { minScore: 630, rate: 12.5, maxLoan:  30000 },
  { minScore: 610, rate: 14.0, maxLoan:  25000 },
  { minScore: 580, rate: 16.0, maxLoan:  20000 },
  { minScore: 560, rate: 18.0, maxLoan:  15000 },
  { minScore: 550, rate: 20.0, maxLoan:  12000 },
  { minScore: 520, rate: 22.0, maxLoan:  10000 },
  { minScore: 490, rate: 24.5, maxLoan:   8000 },
  { minScore: 460, rate: 27.0, maxLoan:   6000 },
  { minScore: 300, rate: 30.0, maxLoan:   5000 },
];

let pricingState = { score: 680, amount: 10000, termMonths: 12 };

function getPricingParams(score) {
  const s = Math.max(300, Math.min(850, score));
  for (const row of RATE_TABLE) {
    if (s >= row.minScore) return { rate: row.rate, maxLoan: row.maxLoan };
  }
  return { rate: 30.0, maxLoan: 5000 };
}

function getTierClass(score) {
  if (score >= 750) return 'excellent';
  if (score >= 700) return 'good';
  if (score >= 630) return 'fair';
  if (score >= 550) return 'poor';
  return 'verypoor';
}

function getTierLabel(score) {
  if (score >= 750) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 630) return 'Fair';
  if (score >= 550) return 'Poor';
  return 'Very Poor';
}

function calcEMI(principal, annualRatePct, termMonths) {
  if (annualRatePct === 0) return principal / termMonths;
  const r = annualRatePct / 100 / 12;
  return principal * r * Math.pow(1 + r, termMonths) / (Math.pow(1 + r, termMonths) - 1);
}

function buildAmortization(principal, annualRatePct, termMonths) {
  const emi = calcEMI(principal, annualRatePct, termMonths);
  const r = annualRatePct / 100 / 12;
  let balance = principal;
  const rows = [];
  for (let m = 1; m <= termMonths; m++) {
    const interest = balance * r;
    const prinPart = emi - interest;
    balance = Math.max(0, balance - prinPart);
    rows.push({ month: m, payment: emi, principal: prinPart, interest, balance });
  }
  return { emi, rows };
}

function fmt$(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderPricing() {
  const { score, termMonths } = pricingState;
  const { rate, maxLoan } = getPricingParams(score);

  // Clamp amount to maxLoan
  let amount = pricingState.amount;
  if (amount > maxLoan) { amount = maxLoan; pricingState.amount = maxLoan; }

  // Stats
  const maxLoanEl = document.getElementById('pr-max-loan-limit');
  const rateEl    = document.getElementById('pr-interest-rate');
  const tierBadge = document.getElementById('pr-tier-badge');
  if (maxLoanEl) maxLoanEl.textContent = '$' + maxLoan.toLocaleString();
  if (rateEl)    rateEl.textContent = rate.toFixed(1) + '%';
  if (tierBadge) { tierBadge.textContent = getTierLabel(score); tierBadge.className = 'p-tier-badge ' + getTierClass(score); }

  // Slider
  const slider = document.getElementById('pr-amount-slider');
  if (slider) {
    slider.max = maxLoan;
    if (parseFloat(slider.value) > maxLoan) slider.value = maxLoan;
    const min = parseFloat(slider.min), max2 = parseFloat(slider.max);
    const pct = Math.min(Math.max(((parseFloat(slider.value) - min) / (max2 - min)) * 100, 0), 100);
    slider.style.setProperty('--pct', pct + '%');
    const maxLbl = document.getElementById('pr-slider-max-lbl');
    if (maxLbl) maxLbl.textContent = '$' + maxLoan.toLocaleString();
  }

  // Amount label
  const amtLbl = document.getElementById('pr-val-amount');
  if (amtLbl) amtLbl.textContent = '$' + amount.toLocaleString();

  // EMI
  const { emi, rows } = buildAmortization(amount, rate, termMonths);
  const totalPay = emi * termMonths;
  const totalInt = totalPay - amount;
  const pctP = Math.round((amount / totalPay) * 100);
  const pctI = 100 - pctP;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('pr-emi-display', fmt$(emi));
  set('pr-tot-principal', fmt$(amount));
  set('pr-tot-interest', fmt$(totalInt));
  set('pr-tot-payment', fmt$(totalPay));
  set('pr-pct-principal', pctP + '%');
  set('pr-pct-interest',  pctI + '%');

  const barP = document.getElementById('pr-bar-principal');
  const barI = document.getElementById('pr-bar-interest');
  if (barP) barP.style.width = pctP + '%';
  if (barI) barI.style.width = pctI + '%';

  // Amortization table
  const tbody = document.getElementById('pr-amort-tbody');
  if (tbody) {
    tbody.innerHTML = '';
    rows.forEach(r => {
      const isLast = r.month === termMonths;
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td><strong>' + r.month + '</strong></td>' +
        '<td>' + fmt$(r.payment) + '</td>' +
        '<td style="color:var(--blue-600);font-weight:600">' + fmt$(r.principal) + '</td>' +
        '<td style="color:#f59e0b;font-weight:600">' + fmt$(r.interest) + '</td>' +
        '<td style="color:' + (isLast ? 'var(--green-600);font-weight:700' : 'var(--slate-600)') + '">' + fmt$(r.balance) + '</td>';
      tbody.appendChild(tr);
    });
  }
}

function onPricingScoreChange(val) {
  pricingState.score = Math.max(300, Math.min(850, parseInt(val) || 300));
  renderPricing();
}

function onPricingSlider(type, val) {
  if (type === 'amount') {
    pricingState.amount = parseInt(val);
    const slider = document.getElementById('pr-amount-slider');
    if (slider) {
      const min = parseFloat(slider.min), max2 = parseFloat(slider.max);
      const pct = Math.min(Math.max(((parseInt(val) - min) / (max2 - min)) * 100, 0), 100);
      slider.style.setProperty('--pct', pct + '%');
    }
  }
  renderPricing();
}

function selectPricingTerm(months) {
  pricingState.termMonths = months;
  document.querySelectorAll('.term-chip').forEach(c => {
    c.classList.toggle('active', parseInt(c.textContent) === months);
  });
  renderPricing();
}

function importToPricing() {
  const scoreEl = document.getElementById('score-display');
  const scoreVal = parseInt(scoreEl && scoreEl.textContent);
  if (!scoreVal || isNaN(scoreVal) || scoreVal < 300) {
    alert('Please calculate a Credit Score first, then import.');
    return;
  }
  pricingState.score = scoreVal;
  const inp = document.getElementById('pr-score-input');
  if (inp) {
    inp.value = scoreVal;
    inp.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.3)';
    setTimeout(() => { inp.style.boxShadow = ''; }, 1400);
  }
  renderPricing();
}

document.addEventListener('DOMContentLoaded', function() { setTimeout(renderPricing, 80); });


// ═══════════════════════════════════════════════════════════════════════════
// WATERFALL CHART RENDERING
// ═══════════════════════════════════════════════════════════════════════════

function renderWaterfallChart(waterfall) {
  if (!waterfall) return;
  var baseline = waterfall.baseline, final = waterfall.final;
  var contributions = waterfall.contributions, interaction = waterfall.interaction;

  var wfFinalEl = document.getElementById('wf-final-val');
  var wfBaselineEl = document.getElementById('wf-baseline-val');
  if (wfFinalEl) wfFinalEl.textContent = final;
  if (wfBaselineEl) wfBaselineEl.textContent = baseline;

  var container = document.getElementById('waterfall-bars');
  if (!container) return;
  container.innerHTML = '';

  var allAbs = contributions.map(function(c){ return Math.abs(c.value); });
  if (interaction !== 0) allAbs.push(Math.abs(interaction));
  var maxAbs = Math.max.apply(null, allAbs.concat([1]));
  var HALF = 46;

  function makeRow(label, value, isSpecial, spClass) {
    var row = document.createElement('div');
    row.className = 'wf-row' + (isSpecial ? ' special ' + (spClass || '') : '');
    var pct = Math.min((Math.abs(value) / maxAbs) * HALF, HALF);
    var sign = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
    var valStr = isSpecial ? value : (value > 0 ? '+' + value : (value === 0 ? '0' : '' + value));
    var barHtml = isSpecial
      ? '<div class="wf-bar-container"></div>'
      : '<div class="wf-bar-container"><div class="wf-centerline"></div><div class="wf-bar ' + sign + '" style="width:' + pct + '%"></div></div>';
    row.innerHTML =
      '<div class="wf-label">' + label + '</div>' +
      barHtml +
      '<div class="wf-value ' + sign + '">' + valStr + '</div>';
    return row;
  }

  container.appendChild(makeRow('📊 Baseline (avg. borrower)', baseline, true, 'baseline'));

  var sorted = contributions.slice().sort(function(a,b){ return Math.abs(b.value) - Math.abs(a.value); });
  sorted.forEach(function(c) {
    if (c.value === 0) return;
    container.appendChild(makeRow(c.label, c.value, false));
  });

  if (Math.abs(interaction) >= 1) {
    container.appendChild(makeRow('⚡ Interaction Effects', interaction, false));
  }

  container.appendChild(makeRow('🎯 Final Score', final, true, 'final'));
}

// Patch renderResults to call waterfall renderer
var _baseRR = renderResults;
renderResults = function(data) {
  _baseRR(data);
  if (data.waterfall) renderWaterfallChart(data.waterfall);
};

// Patch showSection to trigger pricing render & matchmaker loading & profile render
var _baseSSP = showSection;
showSection = function(name) {
  var result = _baseSSP(name);
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
  
  if (name === 'pricing') setTimeout(renderPricing, 40);
  if (name === 'profile') setTimeout(renderUserProfile, 40);
  if (name === 'matchmaker' && matchmakerScore === null) {
    const scoreEl = document.getElementById('score-display');
    const scoreVal = parseInt(scoreEl && scoreEl.textContent);
    if (scoreVal && !isNaN(scoreVal) && scoreVal >= 300) {
      setTimeout(() => loadMatchmakerForScore(scoreVal), 40);
    }
  }
  return result;
};

// ─── Credit Matchmaker Feature ───────────────────────────────────────
let matchmakerScore = null;
let currentProducts = [];
let activeCategory = 'all';

function importToMatchmaker() {
  const scoreEl = document.getElementById('score-display');
  const scoreVal = parseInt(scoreEl && scoreEl.textContent);
  if (!scoreVal || isNaN(scoreVal) || scoreVal < 300) {
    alert('Vui lòng tính Điểm tín dụng trước ở trang chủ để nhập.');
    return;
  }
  loadMatchmakerForScore(scoreVal);
}

function simulateMatchmakerScore(val) {
  loadMatchmakerForScore(val);
}

async function loadMatchmakerForScore(score) {
  matchmakerScore = score;
  const scoreCard = document.getElementById('matchmaker-score-card');
  const emptyCard = document.getElementById('matchmaker-empty');
  const resultsContainer = document.getElementById('matchmaker-results');
  
  if (scoreCard) scoreCard.classList.remove('hidden');
  if (emptyCard) emptyCard.classList.add('hidden');
  if (resultsContainer) resultsContainer.classList.remove('hidden');

  // Set score text
  document.getElementById('m-active-score').textContent = score;
  document.getElementById('m-score-highlight').textContent = score;
  
  // Set risk tier details
  const tierBadge = document.getElementById('m-active-risk');
  if (tierBadge) {
    let tierLabel = 'Very Poor';
    let tierClass = 'verypoor';
    if (score >= 750) { tierLabel = 'Excellent'; tierClass = 'excellent'; }
    else if (score >= 700) { tierLabel = 'Good'; tierClass = 'good'; }
    else if (score >= 630) { tierLabel = 'Fair'; tierClass = 'fair'; }
    else if (score >= 550) { tierLabel = 'Poor'; tierClass = 'poor'; }
    
    tierBadge.textContent = tierLabel;
    tierBadge.className = 'm-risk-badge ' + tierClass;
  }

  // Fetch products from API
  try {
    const resp = await fetch(`/api/credit-products?score=${score}`);
    const data = await resp.json();
    if (data.success) {
      currentProducts = data.products;
      renderMatchmakerProducts();
    } else {
      alert('Error fetching products: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Không thể kết nối đến máy chủ.');
  }
}

function filterMatchmakerProducts(category) {
  activeCategory = category;
  
  // Update active pill
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.classList.toggle('active', btn.id === `mm-pill-${category}`);
  });

  renderMatchmakerProducts();
}

function renderMatchmakerProducts() {
  const grid = document.getElementById('matchmaker-products-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = currentProducts.filter(p => {
    if (activeCategory === 'all') return true;
    return p.type === activeCategory;
  });

  document.getElementById('mm-products-count').textContent = `Showing ${filtered.length} products`;

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const benefitsHtml = p.benefits.map(b => `
      <li>
        <span class="material-icons-round benefit-check">check_circle</span>
        <span>${b}</span>
      </li>
    `).join('');

    card.innerHTML = `
      <div class="card-visual-top ${p.card_design}">
        <div class="card-brand">
          <span class="brand-name">${p.issuer}</span>
          <span class="brand-type">${p.type === 'card' ? 'Credit Card' : 'Personal Loan'}</span>
        </div>
        <div class="card-details-row">
          <span class="card-prod-name">${p.name}</span>
          <span class="card-meta-terms">${p.type === 'card' ? `APR: ${p.apr} | Fee: ${p.annual_fee}` : `Interest Rate: ${p.apr} | Fee: ${p.annual_fee}`}</span>
        </div>
      </div>
      <div class="product-body">
        <ul class="product-benefits">
          ${benefitsHtml}
        </ul>
        <div class="nav-divider-dashed"></div>
        <div class="odds-gauge-row">
          <div class="odds-meta">
            <span class="odds-title">Approval Odds</span>
            <span class="odds-desc-text"><span style="color: ${p.odds_color}">${p.odds_label}</span> Chance</span>
          </div>
          <div class="circular-progress-wrapper">
            <svg>
              <circle class="bg-circle" cx="22" cy="22" r="16"></circle>
              <circle class="fill-circle" cx="22" cy="22" r="16" style="stroke: ${p.odds_color}; stroke-dashoffset: ${100 - p.approval_odds}"></circle>
            </svg>
            <div class="odds-text-pct">${p.approval_odds}%</div>
          </div>
        </div>
        <button class="btn btn-primary btn-full product-action-btn" onclick="applyForProduct('${p.name.replace(/'/g, "\\'")}')">
          ${p.button_text}
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function applyForProduct(productName) {
  alert(`🎉 Đang chuyển hướng hồ sơ của bạn đăng ký sản phẩm: ${productName}!\n\n(Đây là bản demo giả lập liên kết ngân hàng đối tác).`);
}

