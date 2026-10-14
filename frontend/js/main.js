/* =============================================================================
 *  main.js —— 整个前端的入口
 * =============================================================================
 *  按顺序做四件事：
 *    1. 装一个「出错就显示在页面上」的兜底（这样永远不会只留白屏让你猜）
 *    2. 检查两个库有没有加载成功
 *    3. 找到挂载点 <div id="app">
 *    4. 创建应用并挂载
 *
 *  ⚠ 为什么还要等 DOMContentLoaded？
 *     index.html 里已经把 <script> 放到 <body> 末尾了，正常情况等到这里时
 *     页面元素已经存在。但为了保险（也为了让这个文件单独看也说得通），
 *     再加一道判断：如果文档还在解析中，就等解析完再挂载。
 *     这个坑非常常见：脚本跑得比页面元素早 → mount 找不到 #app → 白屏。
 * ========================================================================== */

(function () {
  'use strict';

  /** 把错误直接画在页面上 —— 新手不用打开 F12 也能看到问题出在哪 */
  function showFatal(title, detail) {
    var box = document.getElementById('app') || document.body;
    box.innerHTML =
      '<div style="max-width:760px;margin:48px auto;padding:22px 24px;background:#fff2f2;' +
      'border:1px solid #f3c9c9;border-radius:10px;color:#a11;' +
      'font-family:\'Microsoft YaHei\',sans-serif;line-height:1.7">' +
      '<h2 style="margin:0 0 10px;font-size:18px">' + title + '</h2>' +
      '<pre style="margin:0;white-space:pre-wrap;font-size:13px;color:#833">' + detail + '</pre>' +
      '</div>';
  }

  // 兜底：任何未捕获的 JS 错误都显示出来，而不是留一个白屏
  window.addEventListener('error', function (e) {
    showFatal('页面出错了（这是兜底提示，不是正常现象）',
      (e.message || '未知错误') + '\n' +
      (e.filename ? e.filename + ' 第 ' + (e.lineno || '?') + ' 行' : '') +
      '\n\n请按 F12 → Console 查看完整信息。');
  });

  function bootstrap() {
    // ---- 1. 检查库有没有加载成功 ----
    if (typeof Vue === 'undefined') {
      showFatal('Vue 没有加载成功',
        '请确认这个文件存在：frontend/lib/vue.global.prod.js\n' +
        '另外要注意：必须通过 http://localhost:5173 打开页面，不要直接双击 index.html。');
      return;
    }
    if (typeof axios === 'undefined') {
      showFatal('axios 兼容层没有加载成功',
        '请确认这个文件存在：frontend/lib/axios-lite.js');
      return;
    }

    // ---- 2. 找到挂载点 ----
    var root = document.getElementById('app');
    if (!root) {
      showFatal('找不到挂载点 #app',
        'index.html 里应当有 <div id="app"></div>，并且要放在 <script> 标签之前。');
      return;
    }

    // ---- 3. 打印一点信息，方便你在 F12 里确认环境 ----
    console.log('[实验二] Vue 版本  : ' + Vue.version);
    console.log('[实验二] 后端地址  : ' + API_BASE);
    console.log('[实验二] 前端地址  : ' + location.origin);
    console.log('[实验二] 这两个地址端口不同 → 属于跨域，靠后端 WebConfig 的 CORS 配置放行');

    // ---- 4. 挂载 ----
    Vue.createApp(App).mount(root);
  }

  // 文档还在解析就等一等，否则直接开始
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
