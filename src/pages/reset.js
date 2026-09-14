// 密码重置落地页：点击邮件中的重置链接（带 ?code=）后打开。
// 流程：校验 code → 建立会话 → 让用户输入新密码 → updateUser 保存。
// 注意：code 只能由"本浏览器内触发的重置请求"对应的 PKCE verifier 校验通过，
// 因此重置邮件务必通过后台登录页的"忘记密码"按钮发起，链接在本机点击才有效。
import { supabase } from '../lib/supabase.js';

const page = document.getElementById('resetPage');

function renderError(msg) {
  page.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-logo">康</div>
        <h2 class="login-title">重置密码</h2>
        <p class="login-sub">${msg}</p>
        <a href="./admin.html" class="btn btn-primary btn-block" style="text-align:center;text-decoration:none;display:block;">返回后台登录</a>
      </div>
    </div>`;
}

function renderForm() {
  page.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="login-logo">康</div>
        <h2 class="login-title">设置新密码</h2>
        <p class="login-sub">请输入新的管理员密码（至少 6 位）</p>
        <form class="login-form" id="resetForm">
          <label class="form-field">
            <span class="field-label">新密码</span>
            <input type="password" id="newPwd" autocomplete="new-password" placeholder="请输入新密码" required minlength="6" />
          </label>
          <label class="form-field">
            <span class="field-label">确认新密码</span>
            <input type="password" id="newPwd2" autocomplete="new-password" placeholder="再次输入新密码" required minlength="6" />
          </label>
          <button type="submit" class="btn btn-primary btn-block" id="resetBtn">保存新密码</button>
          <div class="login-status" id="resetMsg"></div>
        </form>
      </div>
    </div>`;
  document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('newPwd').value;
    const p2 = document.getElementById('newPwd2').value;
    const msg = document.getElementById('resetMsg');
    const btn = document.getElementById('resetBtn');
    if (p1 !== p2) { msg.textContent = '两次输入的密码不一致'; return; }
    btn.disabled = true; btn.textContent = '保存中…';
    const { error } = await supabase.auth.updateUser({ password: p1 });
    if (error) {
      msg.textContent = '保存失败：' + error.message;
      btn.disabled = false; btn.textContent = '保存新密码';
      return;
    }
    msg.textContent = '✅ 密码已更新，正在跳转登录…';
    setTimeout(() => { location.href = './admin.html'; }, 1300);
  });
}

async function init() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  if (!code) {
    renderError('链接无效或已过期（缺少验证码）。请回到后台登录页，点击"忘记密码"重新获取重置邮件。');
    return;
  }
  // 兼容不同版本 supabase-js 的 code 交换接口
  let res;
  try {
    if (typeof supabase.auth.exchangeCodeForSession === 'function') {
      res = await supabase.auth.exchangeCodeForSession(code);
    } else if (typeof supabase.auth.getSessionFromUrl === 'function') {
      res = await supabase.auth.getSessionFromUrl();
    } else {
      res = { error: { message: '当前 auth 客户端不支持重置流程' } };
    }
  } catch (e) {
    res = { error: { message: e.message || '验证失败' } };
  }
  if (res.error) {
    renderError('重置链接验证失败：' + res.error.message + '。请回到后台登录页，点击"忘记密码"重新获取重置邮件。');
    return;
  }
  renderForm();
}

init();
