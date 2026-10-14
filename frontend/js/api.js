/* =============================================================================
 *  api.js —— 把「接口调用」集中在一处
 * =============================================================================
 *  这个文件是前端唯一知道后端地址的地方。如果你把后端换到别的机器上，
 *  只改下面这一行的 API_BASE 就够了，组件里一个字都不用动。
 * ========================================================================== */

/** 后端地址。注意端口是 8081，而本页面跑在 5173 —— 端口不同就叫"跨域" */
const API_BASE = 'http://localhost:8081';

/* ---------------------------------------------------------------------------
 *  请求日志：纯粹是给页面上的「④ 请求日志」面板用的，方便你看清发生了什么。
 *  Vue.reactive 让这个对象变成响应式的 —— 往里 push 东西，页面会自动更新。
 * ------------------------------------------------------------------------ */
const ApiLogs = Vue.reactive({ items: [] });

function pushLog(entry) {
  ApiLogs.items.unshift(Object.assign({ time: new Date().toLocaleTimeString('zh-CN') }, entry));
  if (ApiLogs.items.length > 30) ApiLogs.items.pop();
}

/* ---------------------------------------------------------------------------
 *  创建一个 axios 实例。
 *  baseURL 写在这里，后面每个接口只写相对路径（'/api/users'），不用重复写域名。
 * ------------------------------------------------------------------------ */
const http = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

/* ------------------------------ 请求拦截器 -------------------------------
 *  每个请求「发出之前」都会先经过这里。
 *  真实项目在这里做的事：给请求头加上 token、显示全局 loading、打印日志。
 * ---------------------------------------------------------------------- */
http.interceptors.request.use(function (config) {
  config.metadata = { start: Date.now() };
  pushLog({
    type: 'req',
    text: config.method.toUpperCase() + ' ' + config.url,
    detail: config.data ? JSON.stringify(config.data) : '',
  });
  return config;   // 一定要 return，否则请求就断了
});

/* ------------------------------ 响应拦截器 -------------------------------
 *  第一个函数：HTTP 2xx（成功）时执行
 *  第二个函数：HTTP 非 2xx（404 / 409 / 500…）或网络错误时执行
 * ---------------------------------------------------------------------- */
http.interceptors.response.use(
  function (response) {
    const ms = Date.now() - (response.config.metadata ? response.config.metadata.start : Date.now());
    pushLog({
      type: 'res',
      ok: true,
      text: `${response.status} ${response.config.method.toUpperCase()} ${response.config.url}  (${ms}ms)`,
      detail: JSON.stringify(response.data),
    });
    // 剥壳：调用处直接拿到后端统一响应体 {code, message, data}
    return response.data;
  },
  function (error) {
    const cfg = error.config || {};
    const status = error.response ? error.response.status : '—';
    pushLog({
      type: 'res',
      ok: false,
      text: `${status} ${(cfg.method || '').toUpperCase()} ${cfg.url || ''}`,
      detail: error.message + (error.response && error.response.data
        ? '\n' + JSON.stringify(error.response.data) : ''),
    });
    // 把错误统一转成「一句人话」再抛给组件，组件只需要 catch(e) 然后显示 e.message
    const serverMessage = error.response && error.response.data && error.response.data.message;
    return Promise.reject(new Error(serverMessage || error.message));
  }
);

/* ---------------------------------------------------------------------------
 *  接口清单 —— 和 docs/openapi.yaml 里的定义一一对应。
 *  所有组件都只通过 UserApi 调后端，不自己写 fetch/axios ——
 *  这样接口一变，只改这一个文件。
 * ------------------------------------------------------------------------ */
const UserApi = {
  /** 健康检查：确认后端活着 */
  health: () => http.get('/api/health'),

  /** 查询列表（keyword 可为空） */
  list: (keyword) => http.get('/api/users', { params: { keyword: keyword } }),

  /** 查询单个 */
  get: (id) => http.get('/api/users/' + id),

  /** 新增 → 成功时后端返回 201 */
  create: (user) => http.post('/api/users', user),

  /** 修改 */
  update: (id, user) => http.put('/api/users/' + id, user),

  /** 删除 */
  remove: (id) => http.delete('/api/users/' + id),
};
