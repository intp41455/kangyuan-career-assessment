import { STORAGE_KEY } from '../lib/supabase.js';

const form = document.getElementById('infoForm');
const startBtn = document.getElementById('startBtn');

// 恢复已填信息
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  if (saved.profile) {
    const p = saved.profile;
    if (p.name) document.getElementById('name').value = p.name;
    if (p.gender) document.getElementById('gender').value = p.gender;
    if (p.age) document.getElementById('age').value = p.age;
    if (p.blood_type) document.getElementById('blood_type').value = p.blood_type;
    if (p.zodiac) document.getElementById('zodiac').value = p.zodiac;
  }
} catch (e) { /* ignore */ }

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fields = ['name', 'gender', 'age', 'blood_type', 'zodiac'];
  let valid = true;
  const profile = {};
  fields.forEach(f => {
    const el = document.getElementById(f);
    const val = el.value.trim();
    if (!val) {
      el.classList.add('invalid');
      valid = false;
    } else {
      el.classList.remove('invalid');
      profile[f] = val;
    }
  });

  const ageNum = Number(profile.age);
  if (profile.age && (isNaN(ageNum) || ageNum < 16 || ageNum > 70)) {
    document.getElementById('age').classList.add('invalid');
    valid = false;
  } else {
    profile.age = ageNum;
  }

  if (!valid) {
    showToast('请完整填写所有必填项');
    return;
  }

  // 保存到 localStorage
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  saved.profile = profile;
  // 保留已有答案，但若已完成测评则重置进度
  if (saved.completed) {
    saved.answers = {};
    saved.currentPart = 0;
    saved.completed = false;
  }
  if (saved.currentPart == null) saved.currentPart = 0;
  // 每次开始/重做测评都生成稳定的提交ID：用于结果页幂等写入，刷新不会重复落库
  saved.submissionId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID()
    : ('loc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

  window.location.href = './assess.html';
});

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
