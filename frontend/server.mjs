/* =============================================================================
 *  server.mjs —— 前端的静态文件服务器（零依赖，只用 Node 自带模块）
 * =============================================================================
 *  为什么前端也需要一个「服务器」？
 *     因为浏览器对 file:// 协议有很多限制（跨域策略、模块加载等），
 *     直接双击 index.html 打开会踩坑。而且「前后端分离」的本意就是
 *     前端也作为一个独立的服务部署出去（真实项目里是 Nginx 或 CDN）。
 *     所以这里用 Node 起一个最小服务器，模拟真实的「前端部署」。
 *
 *  它做什么？
 *     把本目录下的文件（html / js / css）按请求路径返回给浏览器。
 *     它**不碰数据库、不处理业务** —— 那是后端（8081）的事。
 *
 *  启动：node server.mjs       （或双击上级目录的 双击我启动.bat）
 * ========================================================================== */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);

/** 扩展名 → Content-Type。浏览器靠这个头决定怎么解析文件 */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // 1) 把 URL 变成磁盘路径，并防止 ../ 越权读取（安全基本功）
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, path.normalize(urlPath).replace(/^(\.\.[\\/])+/, ''));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 禁止访问');
    return;
  }

  // 2) 读文件并返回
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 找不到文件：' + urlPath);
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      // 学习阶段关掉缓存：改完代码刷新就能看到效果，不用清缓存
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  前端已启动：http://localhost:' + PORT);
  console.log('  （这个进程只发静态文件；接口在后端 http://localhost:8081）');
  console.log('  停止：按 Ctrl+C 或关掉这个窗口');
  console.log('');
});
