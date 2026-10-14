/* =============================================================================
 *  ApiLog 组件 —— 显示请求日志
 * =============================================================================
 *  这个组件存在的唯一目的是「让看不见的东西看得见」：
 *  Axios 拦截器在幕后做了什么，光看代码体会不到，把它打印到页面上就一目了然了。
 *
 *  你能在这里看到：
 *    → 请求：方法 + 地址
 *    ← 响应：HTTP 状态码 + 耗时
 *  点开任意一条还能看到原始 JSON。
 * ========================================================================== */
const ApiLog = {
  name: 'ApiLog',

  props: {
    items: { type: Array, default: () => [] },
  },

  template: `
    <section class="card">
      <h2>④ 请求日志（由拦截器自动记录）</h2>

      <p class="tip">
        这一栏是 <code>http.interceptors</code> 干的活：请求发出前、响应回来后各插一脚。
        真实项目常在这里统一加 token、做全局 loading、遇到 401 就跳登录页。
      </p>

      <ul class="logs">
        <li v-for="(l, i) in items" :key="i">
          <span class="time">{{ l.time }}</span>
          <span class="tag" :class="l.type === 'req' ? 'tag-req' : (l.ok === false ? 'tag-bad' : 'tag-ok')">
            {{ l.type === 'req' ? '→ 请求' : '← 响应' }}
          </span>
          <span class="text">{{ l.text }}</span>
          <details v-if="l.detail">
            <summary>详情</summary>
            <pre>{{ l.detail }}</pre>
          </details>
        </li>
      </ul>

      <p v-if="!items.length" class="empty">还没有请求</p>
    </section>
  `,
};
