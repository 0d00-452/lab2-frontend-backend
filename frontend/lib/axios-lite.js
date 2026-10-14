/* =============================================================================
 *  axios-lite.js —— Axios 的 API 兼容实现（本机离线时使用）
 * =============================================================================
 *  为什么不用官方 axios？
 *     本机完全离线：npm 源和所有 CDN 都连不上（连 registry.npmmirror.com 都不通），
 *     装不了也下载不了 axios。
 *
 *  这个文件做了什么？
 *     用浏览器原生的 fetch 实现了一套「和 Axios 用法一致」的接口：
 *       axios.create({ baseURL, timeout })
 *       instance.interceptors.request.use(fn)
 *       instance.interceptors.response.use(ok, err)
 *       instance.get / post / put / delete
 *     响应对象和错误对象的形状也和 Axios 保持一致
 *     （response.data / response.status / error.response.status / error.isAxiosError）。
 *
 *  换回真 axios 要改什么？
 *     把 index.html 里的 <script src="lib/axios-lite.js"> 换成官方 axios.min.js 即可，
 *     业务代码（js/api.js、各组件）一行都不用改。
 *
 *  ⚠️ 诚实说明：这不是官方 axios，只是「同样的用法」。
 *     它没有实现 Axios 的全部能力（比如取消令牌 CancelToken、XSRF 防护、
 *     请求/响应数据转换管线、上传进度等）。课程答辩时应当如实说明这一点。
 * ========================================================================== */
(function (global) {
  'use strict';

  var DEFAULT_CONFIG = {
    baseURL: '',
    timeout: 10000,
    headers: {},
  };

  /** 把 baseURL、url、params 拼成最终地址 */
  function buildUrl(baseURL, url, params) {
    var full = /^https?:\/\//i.test(url) ? url : (baseURL || '') + url;
    if (params) {
      var parts = Object.keys(params)
        .filter(function (k) {
          var v = params[k];
          return v !== undefined && v !== null && v !== '';
        })
        .map(function (k) {
          return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
        });
      if (parts.length) {
        full += (full.indexOf('?') >= 0 ? '&' : '?') + parts.join('&');
      }
    }
    return full;
  }

  /** 造一个「像 Axios 那样」的错误对象 */
  function makeError(message, config, response) {
    var err = new Error(message);
    err.isAxiosError = true;
    err.config = config;
    err.response = response || undefined;   // 有响应时，调用方可以读 err.response.status
    return err;
  }

  function createInstance(userConfig) {
    var defaults = Object.assign({}, DEFAULT_CONFIG, userConfig || {});

    var requestInterceptors = [];   // 请求拦截器
    var responseInterceptors = [];  // 响应成功拦截器
    var errorInterceptors = [];     // 响应失败拦截器

    function request(options) {
      var config = Object.assign({}, defaults, options);
      config.headers = Object.assign({}, defaults.headers, options.headers || {});

      // ---- 1. 请求拦截器：请求发出前，可以对 config 动手脚 ----
      for (var i = 0; i < requestInterceptors.length; i++) {
        var next = requestInterceptors[i](config);
        if (next) config = next;
      }

      var hasBody = config.data !== undefined && config.data !== null;
      if (hasBody && !config.headers['Content-Type']) {
        // 这一行就是「跨域预检请求」的触发器：带 Content-Type: application/json
        // 的请求属于「非简单请求」，浏览器会先发一个 OPTIONS 去问后端允不允许。
        config.headers['Content-Type'] = 'application/json';
      }

      // ---- 2. 超时控制（fetch 自身没有 timeout，用 AbortController 实现）----
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = null;
      if (config.timeout && controller) {
        timer = setTimeout(function () { controller.abort(); }, config.timeout);
      }

      // ---- 3. 真正发请求 ----
      return fetch(buildUrl(config.baseURL, config.url, config.params), {
        method: (config.method || 'GET').toUpperCase(),
        headers: config.headers,
        body: hasBody ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : undefined,
        signal: controller ? controller.signal : undefined,
      })
        .then(function (res) {
          if (timer) clearTimeout(timer);
          return res.text().then(function (text) {
            var data = text;
            try { data = text ? JSON.parse(text) : null; } catch (e) { /* 不是 JSON 就原样返回 */ }

            var response = {
              data: data,
              status: res.status,
              statusText: res.statusText,
              headers: res.headers,
              config: config,
            };

            // HTTP 状态码不在 2xx → 当成失败（404 / 409 会走到这里）
            if (res.status >= 200 && res.status < 300) {
              return response;
            }
            throw makeError('请求失败：HTTP ' + res.status, config, response);
          });
        })
        .catch(function (e) {
          if (timer) clearTimeout(timer);
          if (e && e.isAxiosError) throw e;     // 上面刚抛的，别再包一层
          var msg = (e && e.name === 'AbortError')
            ? '请求超时（超过 ' + config.timeout + ' ms）'
            : '网络错误：连不上后端 —— 后端的黑窗口还开着吗？';
          throw makeError(msg, config, null);
        })
        .then(
          function (response) {
            // ---- 4. 响应成功的拦截器 ----
            var result = response;
            for (var j = 0; j < responseInterceptors.length; j++) {
              result = responseInterceptors[j](result);
            }
            return result;
          },
          function (error) {
            // ---- 5. 响应失败的拦截器 ----
            var chain = Promise.reject(error);
            for (var k = 0; k < errorInterceptors.length; k++) {
              chain = chain.catch(errorInterceptors[k]);
            }
            return chain;
          }
        );
    }

    return {
      defaults: defaults,
      request: request,
      get: function (url, config) { return request(Object.assign({}, config, { url: url, method: 'GET' })); },
      delete: function (url, config) { return request(Object.assign({}, config, { url: url, method: 'DELETE' })); },
      post: function (url, data, config) { return request(Object.assign({}, config, { url: url, method: 'POST', data: data })); },
      put: function (url, data, config) { return request(Object.assign({}, config, { url: url, method: 'PUT', data: data })); },
      interceptors: {
        request: {
          use: function (onFulfilled) { requestInterceptors.push(onFulfilled); },
        },
        response: {
          use: function (onFulfilled, onRejected) {
            if (onFulfilled) responseInterceptors.push(onFulfilled);
            if (onRejected) errorInterceptors.push(onRejected);
          },
        },
      },
    };
  }

  var axios = createInstance();
  axios.create = function (config) { return createInstance(config); };
  axios.isAxiosError = function (e) { return !!(e && e.isAxiosError); };

  global.axios = axios;
})(window);
