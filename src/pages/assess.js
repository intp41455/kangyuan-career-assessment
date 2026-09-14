import { STORAGE_KEY } from '../lib/supabase.js';
import { allParts, scaleLabels } from '../data/questions.js';

const assessBody = document.getElementById('assessBody');
const assessFooter = document.getElementById('assessFooter');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const stepIndicators = document.getElementById('stepIndicators');
const prevPartBtn = document.getElementById('prevPartBtn');
const nextPartBtn = document.getElementById('nextPartBtn');
const partInfo = document.getElementById('partInfo');

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!saved.profile) {
      window.location.href = './';
      return null;
    }
    return {
      profile: saved.profile,
      answers: saved.answers || {},
      currentPart: saved.currentPart || 0
    };
  } catch (e) {
    window.location.href = './';
    return null;
  }
}

function saveState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  saved.answers = state.answers;
  saved.currentPart = state.currentPart;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

function renderSteps() {
  stepIndicators.innerHTML = '';
  allParts.forEach((p, i) => {
    const dot = document.createElement('div');
    dot.className = 'step-dot' + (i === state.currentPart ? ' active' : (i < state.currentPart ? ' done' : ''));
    dot.textContent = p.title.split(' · ')[0].replace('第', '').replace('部分', '');
    stepIndicators.appendChild(dot);
  });
}

function partAnsweredCount(part) {
  return part.questions.filter(q => state.answers[q.id] != null && state.answers[q.id] !== '').length;
}

function isPartComplete(part) {
  if (part.key === 'enneagram') return true; // 可跳过
  return partAnsweredCount(part) === part.questions.length;
}

function renderProgress() {
  const total = allParts.reduce((s, p) => s + p.questions.length, 0);
  const answered = allParts.reduce((s, p) => s + partAnsweredCount(p), 0);
  const pct = Math.round((answered / total) * 100);
  progressFill.style.width = pct + '%';
  progressPercent.textContent = pct + '%';
}

function renderPart() {
  const part = allParts[state.currentPart];
  const answered = partAnsweredCount(part);
  const total = part.questions.length;

  assessBody.innerHTML = `
    <h2 class="part-title">${part.title}</h2>
    <p class="part-subtitle">${part.subtitle} · 已答 ${answered}/${total}</p>
    <div class="question-list" id="questionList"></div>
  `;
  const list = document.getElementById('questionList');

  part.questions.forEach((q, idx) => {
    const item = document.createElement('div');
    item.className = 'question-item' + (state.answers[q.id] != null && state.answers[q.id] !== '' ? ' answered' : '');
    item.dataset.qid = q.id;

    if (part.type === 'binary') {
      item.innerHTML = `
        <div class="question-text"><span class="q-num">${idx + 1}.</span>${q.text}</div>
        <div class="question-options">
          <button class="option-btn ${state.answers[q.id] === q.a.value ? 'selected' : ''}" data-value="${q.a.value}">
            <span class="opt-mark">A</span><span>${q.a.text}</span>
          </button>
          <button class="option-btn ${state.answers[q.id] === q.b.value ? 'selected' : ''}" data-value="${q.b.value}">
            <span class="opt-mark">B</span><span>${q.b.text}</span>
          </button>
        </div>`;
      item.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.answers[q.id] = btn.dataset.value;
          item.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          item.classList.add('answered');
          item.classList.remove('unanswered-warn');
          saveState();
          renderProgress();
          updatePartInfo();
        });
      });
    } else if (part.type === 'scale') {
      const opts = scaleLabels.map((label, i) => {
        const val = i + 1;
        return `<button class="option-btn ${state.answers[q.id] === val ? 'selected' : ''}" data-value="${val}">
          <span class="opt-mark">${val}</span><span>${label}</span>
        </button>`;
      }).join('');
      item.innerHTML = `
        <div class="question-text"><span class="q-num">${idx + 1}.</span>${q.text}</div>
        <div class="question-options scale-options">${opts}</div>`;
      item.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.answers[q.id] = Number(btn.dataset.value);
          item.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          item.classList.add('answered');
          item.classList.remove('unanswered-warn');
          saveState();
          renderProgress();
          updatePartInfo();
        });
      });
    } else if (part.type === 'disc') {
      const opts = q.options.map(opt => `
        <button class="option-btn ${state.answers[q.id] === opt.value ? 'selected' : ''}" data-value="${opt.value}">
          <span class="opt-mark">${opt.value}</span><span>${opt.text}</span>
        </button>`).join('');
      item.innerHTML = `
        <div class="question-text"><span class="q-num">${idx + 1}.</span>${q.text}</div>
        <div class="question-options">${opts}</div>`;
      item.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.answers[q.id] = btn.dataset.value;
          item.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          item.classList.add('answered');
          item.classList.remove('unanswered-warn');
          saveState();
          renderProgress();
          updatePartInfo();
        });
      });
    } else if (part.type === 'enneagram') {
      const checked = state.answers[q.id] === true;
      item.innerHTML = `
        <div class="question-text"><span class="q-num">${idx + 1}.</span>${q.text}</div>
        <div class="question-options">
          <button class="option-btn ${checked ? 'selected' : ''}" data-value="true">
            <span class="opt-mark">✓</span><span>符合</span>
          </button>
          <button class="option-btn ${state.answers[q.id] === false ? 'selected' : ''}" data-value="false">
            <span class="opt-mark">✕</span><span>不符合（跳过）</span>
          </button>
        </div>`;
      item.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.answers[q.id] = btn.dataset.value === 'true';
          item.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          item.classList.add('answered');
          saveState();
          renderProgress();
          updatePartInfo();
        });
      });
    }
    list.appendChild(item);
  });

  assessFooter.style.display = 'flex';
  prevPartBtn.disabled = state.currentPart === 0;
  nextPartBtn.textContent = state.currentPart === allParts.length - 1 ? '提交测评' : '下一部分';
  renderSteps();
  renderProgress();
  updatePartInfo();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePartInfo() {
  const part = allParts[state.currentPart];
  const answered = partAnsweredCount(part);
  const total = part.questions.length;
  partInfo.textContent = `${part.title.split(' · ')[0]} · ${answered}/${total}${part.key === 'enneagram' ? '（可跳过）' : ''}`;
}

function highlightUnanswered(part) {
  let firstUnanswered = null;
  part.questions.forEach(q => {
    const item = assessBody.querySelector(`[data-qid="${q.id}"]`);
    if (item && (state.answers[q.id] == null || state.answers[q.id] === '')) {
      item.classList.add('unanswered-warn');
      if (!firstUnanswered) firstUnanswered = item;
    }
  });
  if (firstUnanswered) {
    firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

nextPartBtn.addEventListener('click', () => {
  const part = allParts[state.currentPart];
  if (!isPartComplete(part)) {
    highlightUnanswered(part);
    showToast(part.key === 'enneagram' ? '本部分可跳过，但建议尽量作答' : '请完成本部分所有题目后再继续');
    return;
  }
  if (state.currentPart < allParts.length - 1) {
    state.currentPart++;
    saveState();
    renderPart();
  } else {
    // 最后部分，提交
    if (confirm('确认提交测评？提交后将生成你的专属报告，且无法再修改答案。')) {
      submitAssessment();
    }
  }
});

prevPartBtn.addEventListener('click', () => {
  if (state.currentPart > 0) {
    state.currentPart--;
    saveState();
    renderPart();
  }
});

async function submitAssessment() {
  assessBody.innerHTML = '<div class="loading-state">正在计算你的测评结果…</div>';
  assessFooter.style.display = 'none';
  saveState();
  // 跳转到结果页，结果页负责计算、保存与渲染
  window.location.href = './result.html';
}

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast error';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

if (state) {
  renderPart();
}
