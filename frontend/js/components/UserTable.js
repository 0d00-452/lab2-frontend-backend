/* =============================================================================
 *  UserTable 组件 —— 展示用户列表
 * =============================================================================
 *  这个组件是「纯展示 + 抛事件」的典型：它不自己调接口，也不自己保存数据，
 *  数据由父组件通过 props 传进来，用户点了删除就 emit 一个事件出去。
 *
 *  为什么要这样？因为「谁的数据谁负责」。列表数据属于 App 组件，
 *  子组件只负责把它画出来。这样组件可以复用，也更好测试。
 * ========================================================================== */
const UserTable = {
  name: 'UserTable',

  props: {
    /** 用户数组，由父组件传进来 */
    users: { type: Array, default: () => [] },
    /** 是否正在加载（父组件控制） */
    loading: { type: Boolean, default: false },
  },

  emits: ['remove'],

  template: `
    <section class="card">
      <h2>② 用户列表 <code>GET /api/users</code></h2>

      <table>
        <thead>
          <tr>
            <th style="width:70px">id</th>
            <th>用户名</th>
            <th>邮箱</th>
            <th>手机号</th>
            <th>创建时间</th>
            <th style="width:90px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.username }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.phone }}</td>
            <td class="dim">{{ formatTime(u.createdAt) }}</td>
            <td>
              <button class="danger" @click="$emit('remove', u)">删除</button>
            </td>
          </tr>
          <tr v-if="loading">
            <td colspan="6" class="empty">加载中…</td>
          </tr>
          <tr v-else-if="!users.length">
            <td colspan="6" class="empty">暂无数据</td>
          </tr>
        </tbody>
      </table>
    </section>
  `,

  methods: {
    // 后端返回的是 2026-10-14T21:05:44.123456，只取到「秒」好看一点
    formatTime(t) {
      if (!t) return '';
      return String(t).replace('T', ' ').slice(0, 19);
    },
  },
};
