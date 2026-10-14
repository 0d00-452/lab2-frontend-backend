/* =============================================================================
 *  UserForm 组件 —— 新增用户
 * =============================================================================
 *  这是一个「Vue 组件」：有自己的模板（template）、自己的状态（setup 里的 ref/reactive）、
 *  自己的行为（submit），对外只通过 emit 抛事件，不直接去改别人的数据。
 *
 *  注意我们用 `setup()` 的「组合式 API」写法（Vue 3 的推荐方式），
 *  它和「选项式 API」（data/methods 那种）做的是同一件事，只是组织方式不同。
 * ========================================================================== */
const UserForm = {
  name: 'UserForm',

  // 模板：可以用 v-model 双向绑定、v-if 条件渲染、@click 绑事件
  template: `
    <section class="card">
      <h2>① 新增用户 <code>POST /api/users</code></h2>

      <div class="row">
        <input v-model.trim="form.username" placeholder="用户名（必填）" @keyup.enter="submit">
        <input v-model="form.password" placeholder="密码（必填）">
        <input v-model.trim="form.email" placeholder="邮箱" @keyup.enter="submit">
        <input v-model.trim="form.phone" placeholder="手机号" @keyup.enter="submit">
        <button :disabled="loading" @click="submit">
          {{ loading ? '提交中…' : '新增' }}
        </button>
      </div>

      <!-- 错误边界：把后端返回的 message 显示给用户 -->
      <p v-if="error" class="msg err">✗ {{ error }}</p>
      <p v-if="okMsg" class="msg ok">✓ {{ okMsg }}</p>

      <p class="tip">
        试试用重复的用户名（比如 <code>zhangsan</code>）提交一次 ——
        后端会返回 <b>409 Conflict</b>，这里就会显示「用户名已存在」。
      </p>
    </section>
  `,

  // 声明这个组件会往外抛什么事件（Vue 3 的规范写法，不写也能跑）
  emits: ['created'],

  setup(props, { emit }) {
    const form = Vue.reactive({ username: '', password: '123456', email: '', phone: '' });
    const loading = Vue.ref(false);
    const error = Vue.ref('');
    const okMsg = Vue.ref('');

    async function submit() {
      error.value = '';
      okMsg.value = '';

      // 前端先挡一道「明显不合法」的输入，能省一次网络往返
      // 但记住：前端校验永远只是体验优化，真正的校验必须在后端（前端能被绕过）
      if (!form.username) {
        error.value = '用户名不能为空';
        return;
      }
      if (!form.password) {
        error.value = '密码不能为空';
        return;
      }

      loading.value = true;
      try {
        const res = await UserApi.create({
          username: form.username,
          password: form.password,
          email: form.email,
          phone: form.phone,
        });
        okMsg.value = '新增成功，id = ' + res.data.id;
        form.username = '';
        form.email = '';
        form.phone = '';
        emit('created', res.data);   // 通知父组件（App）刷新列表
      } catch (e) {
        // 走到这里说明后端返回了 400 / 409，或者网络不通
        // e.message 已经被响应拦截器翻译成了后端给的那句话
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    }

    return { form, loading, error, okMsg, submit };
  },
};
