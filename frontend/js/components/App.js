/* =============================================================================
 *  App 组件 —— 根组件（把其他组件拼起来，并持有列表数据）
 * =============================================================================
 *  它是唯一「持有数据」的组件：users 列表、搜索关键字、后端连接状态。
 *  子组件通过 props 拿到数据、通过 emit 把用户操作报上来，形成单向数据流：
 *
 *      App  ──props──▶  UserTable        （数据往下走）
 *      App  ◀──emit──   UserTable        （事件往上报）
 *
 *  这样数据只有一个来源，出问题时不用到处找「谁把 users 改了」。
 * ========================================================================== */
const App = {
  name: 'App',

  components: { UserForm, UserTable, ApiLog },

  template: `
    <div class="wrap">
      <header class="head">
        <h1>实验二 · 前后端分离与 RESTful API</h1>
        <p class="sub">
          前端（Vue 3）：<code>http://localhost:5173</code>
          ⟶
          后端（Spring Boot）：<code>http://localhost:8081</code>
        </p>
        <p class="sub">
          后端状态：
          <span class="badge" :class="statusOk ? 'badge-ok' : 'badge-bad'">{{ statusText }}</span>
          <button class="link" @click="checkHealth">重新检测</button>
        </p>
      </header>

      <!-- 跨域说明：这是实验二最需要理解的东西，直接写在页面上 -->
      <section class="card note">
        <h2>③ 你现在看到的，就是「跨域」被解决的过程</h2>
        <p>
          这个页面的地址是 <code>localhost:<b>5173</b></code>，而接口的地址是
          <code>localhost:<b>8081</b></code>。<b>端口不同 = 不同的源</b>，
          浏览器的「同源策略」默认不允许页面读取别的源的响应。
        </p>
        <p>
          能正常工作是<b>因为后端主动表态允许了</b> —— 见
          <code>backend/src/main/java/com/example/lab2/config/WebConfig.java</code>
          里的 <code>addCorsMappings</code>。它会让响应带上
          <code>Access-Control-Allow-Origin: http://localhost:5173</code>，
          浏览器看到这个头才把数据交给页面。
        </p>
        <p class="tip">
          验证方法：按 <b>F12</b> → <b>Network</b> → 点一次「新增」，
          你会看到两条记录：一条 <code>OPTIONS</code>（浏览器的预检请求）和一条
          <code>POST</code>（真正的请求）。点开 POST 那条，看
          <b>Response Headers</b> 里的 <code>access-control-allow-origin</code>。
        </p>
      </section>

      <UserForm @created="onCreated" />

      <section class="card">
        <h2>搜索 <code>GET /api/users?keyword=</code></h2>
        <div class="row">
          <input v-model.trim="keyword" placeholder="按用户名或邮箱搜索"
                 @keyup.enter="load">
          <button :disabled="loading" @click="load">搜索</button>
          <button class="gray" @click="reset">显示全部</button>
        </div>
      </section>

      <p v-if="error" class="msg err big">✗ {{ error }}</p>

      <UserTable :users="users" :loading="loading" @remove="remove" />

      <ApiLog :items="ApiLogs.items" />

      <footer class="foot">
        <p>
          共 <b>{{ users.length }}</b> 位用户 ·
          接口文档见 <code>docs/openapi.yaml</code> ·
          学习清单见 <code>docs/需要学什么.md</code>
        </p>
      </footer>
    </div>
  `,

  setup() {
    const users = Vue.ref([]);
    const keyword = Vue.ref('');
    const loading = Vue.ref(false);
    const error = Vue.ref('');
    const statusOk = Vue.ref(false);
    const statusText = Vue.ref('检测中…');

    /** 检测后端是否活着 */
    async function checkHealth() {
      statusText.value = '检测中…';
      try {
        const res = await UserApi.health();
        statusOk.value = true;
        statusText.value = '已连接（' + res.data.service + '）';
        return true;
      } catch (e) {
        statusOk.value = false;
        statusText.value = '连不上后端';
        error.value = e.message;
        return false;
      }
    }

    /** 加载列表 */
    async function load() {
      error.value = '';
      loading.value = true;
      try {
        const res = await UserApi.list(keyword.value);
        users.value = res.data || [];
      } catch (e) {
        error.value = e.message;
        users.value = [];
      } finally {
        loading.value = false;
      }
    }

    function reset() {
      keyword.value = '';
      load();
    }

    function onCreated() {
      keyword.value = '';
      load();
    }

    async function remove(user) {
      if (!confirm('确认删除「' + user.username + '」吗？（实际是逻辑删除）')) return;
      error.value = '';
      try {
        await UserApi.remove(user.id);
        await load();
      } catch (e) {
        error.value = e.message;
      }
    }

    // 页面一加载就干活：先确认后端在，再拉数据
    Vue.onMounted(async function () {
      const alive = await checkHealth();
      if (alive) await load();
    });

    return {
      users, keyword, loading, error,
      statusOk, statusText,
      ApiLogs,
      checkHealth, load, reset, onCreated, remove,
    };
  },
};
