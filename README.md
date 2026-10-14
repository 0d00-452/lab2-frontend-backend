# 实验二：前后端分离与 RESTful API

> **完全新手？请先看 `新手必读.md`** —— 那份是从「双击哪个文件」开始讲的。
> 本文是技术参考：项目结构、接口清单、CORS 详解、常见报错、已知偏差。
>
> 课程要求：`@RestController` 暴露接口 → Vue 组件 + Axios → Spring 配置 CORS →
> **分别构建部署并联调** → （AI 增强）用 AI 生成 Vue 组件与 OpenAPI 文档，人工核对字段与错误边界。

---

## 一、项目结构：两个独立工程

```
实验二-前后端分离/
├─ 双击我启动.bat                ← ★ 新手只用双击这个
├─ 启动全部.ps1                  ←   它做的事：起后端 + 起前端 + 打开浏览器
├─ 新手必读.md                   ←   完全新手版说明
├─ README.md                     ←   本文件
│
├─ backend/                      ← 【后端工程】Spring Boot，端口 8081
│  ├─ pom.xml
│  ├─ run.ps1                    ←   单独启动后端
│  └─ src/main/
│     ├─ java/com/example/lab2/
│     │  ├─ Lab2Application.java
│     │  ├─ config/WebConfig.java            ★ 本实验核心：CORS 配置
│     │  ├─ controller/UserController.java   ★ @RestController + RESTful 状态码
│     │  ├─ service/UserService.java
│     │  ├─ mapper/UserMapper.java
│     │  ├─ entity/User.java
│     │  └─ common/  ApiResponse / BizException / GlobalExceptionHandler
│     └─ resources/
│        ├─ application.yml  db/schema.sql  db/data.sql  mapper/UserMapper.xml
│
├─ frontend/                     ← 【前端工程】Vue 3，端口 5173
│  ├─ index.html
│  ├─ serve.ps1                  ←   单独启动前端
│  ├─ server.mjs                 ←   零依赖静态服务器（模拟前端独立部署）
│  ├─ css/app.css
│  ├─ lib/
│  │  ├─ vue.global.prod.js      ←   Vue 3.4.27 完整构建版（见第七节说明来源）
│  │  └─ axios-lite.js           ←   Axios 兼容层（离线替代，见第七节）
│  └─ js/
│     ├─ api.js                  ←   ★ 接口封装 + 拦截器（前端唯一知道后端地址的地方）
│     ├─ main.js                 ←   创建应用并挂载
│     └─ components/
│        ├─ App.js               ←   根组件（持有数据）
│        ├─ UserForm.js          ←   新增表单
│        ├─ UserTable.js         ←   列表
│        └─ ApiLog.js            ←   请求日志（把拦截器的行为可视化）
│
└─ docs/
   ├─ 需要学什么.md              ←   学习清单（含 5 天计划与抽测问题）
   ├─ openapi.yaml               ←   接口文档（OpenAPI 3.0）
   └─ AI生成内容核对记录.md       ←   课程"AI 增强"要求的核对证据
```

**关键点**：`backend/` 和 `frontend/` 里**没有互相引用**，各自有各的启动脚本。
它们之间唯一的联系就是 HTTP 接口 —— 这才叫「分离」。

---

## 二、三种启动方式

### 方式 A：一键起两个（推荐）

双击 `双击我启动.bat` → 弹出**两个**黑窗口 → 30 秒后浏览器自动打开 <http://localhost:5173>。

### 方式 B：分开起（理解"分离"的最好方式）

开两个 PowerShell 窗口：

```powershell
# 窗口 1：后端
cd backend
.\run.ps1                 # → http://localhost:8081

# 窗口 2：前端
cd frontend
.\serve.ps1               # → http://localhost:5173
```

### 方式 C：分别"构建部署"（课程要求的那句话）

```powershell
# 后端：打成自带 Tomcat 的 jar，拷到哪儿都能跑
cd backend
mvn -o clean package
java -jar target/lab2-backend-1.0.0.jar

# 前端：本质就是一堆静态文件，真实项目里交给 Nginx / CDN
# 本实验用 Node 起一个最小静态服务器代替
cd frontend
node server.mjs
```

> 你可以试着把 `frontend/` 整个目录拷到另一个位置再起，页面照样能跑 ——
> 因为它只认 `http://localhost:8081` 这个接口地址，不关心后端文件在哪。

---

## 三、接口清单

统一响应体：`{ "code": 0, "message": "success", "data": {...} }`

| 方法 | 路径 | 说明 | 成功状态码 |
|---|---|---|---|
| GET | `/api/health` | 健康检查 | 200 |
| GET | `/api/users?keyword=` | 查询列表（可模糊搜索） | 200 |
| GET | `/api/users/{id}` | 查询单个 | 200 |
| POST | `/api/users` | 新增（响应头带 `Location`） | **201** |
| PUT | `/api/users/{id}` | 修改邮箱/手机号 | 200 |
| DELETE | `/api/users/{id}` | 逻辑删除 | 200 |

**错误边界**（这是本实验的重点，也是 AI 核对的重点）：

| HTTP | 业务 code | 场景 | 前端的处理方式 |
|---|---|---|---|
| 400 | 10001 | 用户名为空等参数问题 | 提示在表单旁边，让用户改 |
| 404 | 30003 | 用户不存在（含已删除） | 提示 + 刷新列表 |
| 409 | 30002 | 用户名已存在 | 提示 + 建议换个用户名 |
| 500 | 50000 | 服务端异常 | 笼统提示，堆栈只进日志 |
| — | — | 网络不通 / 超时 | 提示"后端还开着吗？" |

完整定义见 `docs/openapi.yaml`（可粘到 <https://editor.swagger.io/> 看可交互版本）。

---

## 四、CORS 详解（本实验的核心）

### 4.1 问题是怎么产生的

| | 地址 | 说明 |
|---|---|---|
| 页面 | `http://localhost:5173` | 一个「源」= 协议 + 域名 + 端口 |
| 接口 | `http://localhost:8081` | 端口不同 → **不同的源** |

浏览器有「同源策略」：A 源的页面默认**不许读取** B 源的响应。
注意 —— **请求发出去了，后端也处理了，是浏览器把响应扣下不给你看**。

### 4.2 解决办法（后端配合）

`backend/.../config/WebConfig.java`：

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

| 配置项 | 作用 | 踩坑提醒 |
|---|---|---|
| `addMapping` | 对哪些路径开放 | 写 `/api/**` 而不是 `/**`，别把所有路径都放开 |
| `allowedOrigins` | 允许哪些源 | 必须写全 `协议://主机:端口`；**开了 `allowCredentials` 就不能写 `*`** |
| `allowedMethods` | 允许哪些方法 | `OPTIONS` 必须留，否则预检失败 |
| `allowedHeaders` | 允许带哪些请求头 | 写 `*` 一般够用 |
| `maxAge` | 预检结果缓存多久 | 缓存后不会每次都发 OPTIONS |

### 4.3 什么是「预检请求」

当请求属于「非简单请求」（比如 `Content-Type: application/json` 的 POST，或 PUT/DELETE），
浏览器会**先自动发一个 OPTIONS** 问后端允不允许。F12 里会看到：

```
users    OPTIONS   200    ← 浏览器自动发的预检，不是你代码写的
users    POST      201    ← 真正的请求
```

Spring 的 `addCorsMappings` 会自动应答这个 OPTIONS，不用自己写 Controller。

### 4.4 实测结果（可复现）

| 场景 | 结果 |
|---|---|
| `OPTIONS` + `Origin: http://localhost:5173` | 200，`Access-Control-Allow-Origin: http://localhost:5173`，`Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`，`Max-Age: 3600` |
| `GET` + 允许的 Origin | 200 + `Access-Control-Allow-Origin` |
| `GET` + `Origin: http://evil.example.com` | **403**，无 `Allow-Origin`（白名单生效） |

### 4.5 另一种思路（了解即可）

后端开放 CORS 不是唯一解。另一种常见做法是**让前后端同源**：
Vue 的 `devServer.proxy` 把 `/api` 转发到后端，浏览器就以为是同一个源，压根不触发跨域检查。
生产环境用 Nginx 做同样的反代也很常见。两种都行，团队内统一即可。

---

## 五、前端代码怎么读

### 5.1 一次「新增用户」的完整流转

```
用户点【新增】
   │
UserForm.js  submit()
   │  ① 前端先挡一道明显不合法的输入（纯体验优化，真正的校验在后端）
   │  ② 调 UserApi.create({...})
   ▼
api.js  http.post('/api/users', data)
   │  ③ axios 实例的 baseURL 补全地址 → http://localhost:8081/api/users
   │  ④ 请求拦截器：打一条日志（页面 ④ 那一栏就是它）
   ▼
axios-lite.js  fetch(...)
   │  ⑤ 加上 Content-Type: application/json  ← 这一步触发了「预检请求」
   │  ⑥ 浏览器先发 OPTIONS 问后端，通过后才发 POST
   ▼
—— 跨域边界（CORS）——
   ▼
后端 UserController.create() → Service → Mapper → 数据库
   ▼
返回 201 + Location: /api/users/5 + 响应体
   ▼
axios-lite.js  状态码在 2xx 区间 → 算成功（注意不是 === 200）
   │
api.js 响应拦截器
   │  ⑦ 打一条响应日志（含状态码与耗时）
   │  ⑧ 剥壳：return response.data，调用处直接拿到 {code,message,data}
   ▼
UserForm.js
   │  ⑨ 成功 → emit('created') 
   │     失败（400/409）→ 把后端 message 显示在表单旁边
   ▼
App.js  收到 created 事件 → 重新 load() 列表 → props 传给 UserTable → 表格更新
```

### 5.2 三条必须记住的规则

1. **单向数据流**：数据往下走（props），事件往上报（emit）。
   子组件不直接改父组件的数据 —— 否则出了问题不知道该找谁。
2. **接口只在一处定义**：所有请求都走 `js/api.js` 里的 `UserApi`，组件里不直接写 `fetch`。
   这样接口一改只改一个文件。
3. **错误分层处理**：底层（拦截器）负责把错误翻译成「一句人话」，
   上层（组件）只负责把它显示给用户。

---

## 六、常见报错对照表

| 报错 | 原因 | 解决 |
|---|---|---|
| `blocked by CORS policy: No 'Access-Control-Allow-Origin' header` | 后端没配 CORS，或 `allowedOrigins` 里的端口写错 | 检查 `WebConfig.java`；确认里面是 `http://localhost:5173` |
| `Invalid CORS request`（后端返回 403） | 请求的 Origin 不在白名单里 | 把实际访问用的地址（含端口）加进 `allowedOrigins` |
| `Vue is not defined` | `lib/vue.global.prod.js` 没加载成功 | 确认文件存在；且是通过 `http://localhost:5173` 打开页面 |
| `axios is not defined` | `lib/axios-lite.js` 没加载成功 | 同上；注意 `index.html` 里 script 的顺序 |
| **页面一片空白** | `<script>` 写在 `<head>` 里 → 执行时 `<div id="app">` 尚未解析出来 → `mount('#app')` 找不到挂载点（prod 版 Vue 不打印警告，所以最难查） | 脚本必须放在 `<body>` 末尾，或给 `<script>` 加 `defer`。本项目已在 `main.js` 里再加一道 `DOMContentLoaded` 保险 |
| 页面白屏且有红框提示 | `main.js` 的兜底把 JS 错误显示出来了 | 按红框里的提示处理；也可 F12 → Console 看完整堆栈 |
| 页面显示「连不上后端」 | 后端没起或还在编译 | 看后端窗口有没有 `Started Lab2Application` |
| 新增成功了却提示失败 | 拦截器把 201 当成了失败 | 成功判断要用 `status >= 200 && status < 300` |
| `Port 8081/5173 was already in use` | 端口被占用 | 关掉旧窗口，或改端口（改端口后 CORS 白名单和 `API_BASE` 都要跟着改） |
| 改前端没生效 | 浏览器缓存 | 本项目已设 `Cache-Control: no-store`；还是不行就 Ctrl+F5 |

---

## 七、已知偏差（诚实说明，答辩可以主动讲）

本机是**完全离线**环境（npm 源与所有 CDN 均不可达），因此有两处受控替换：

| 项 | 课程/标准做法 | 本项目做法 | 迁移成本 |
|---|---|---|---|
| HTTP 客户端 | 官方 `axios` | `lib/axios-lite.js`（自研兼容层，API 形状一致） | **改一行 script 标签**。未实现取消令牌、上传进度等能力 |
| Vue 来源 | `npm install vue` 或 CDN | `lib/vue.global.prod.js` = **Vue 3.4.27 完整构建版**，取自本机 WPS Office 自带资源目录（MIT 许可） | 零。已验证 API 完整（含模板编译器） |
| 构建工具 | Vite（`.vue` 单文件组件） | 无构建步骤，用 `template` 字符串写组件 | 中。组件逻辑可平移，拆成 `.vue` 文件即可 |
| 前端部署 | Nginx | `frontend/server.mjs`（Node 零依赖静态服务器） | 零。都是"把静态文件发出去" |

**没有降级的部分**（这些才是评分关键）：
前后端真正分离成两个工程、`@RestController` 暴露 JSON 接口、
**CORS 配置与预检请求真实生效**、RESTful 状态码（201/400/404/409）、
Vue 3 组合式 API 组件化、Axios 拦截器、统一错误边界、OpenAPI 文档。

---

## 八、和实验一的关系

| | 实验一 | 实验二 |
|---|---|---|
| 后端 | 8080，同时提供页面和接口 | 8081，**只提供接口** |
| 页面 | 后端直出 `static/index.html` | 前端独立部署（5173） |
| 前端 | 原生 ES6 + fetch | **Vue 3 组件 + Axios** |
| 新知识点 | Entity/Mapper/Service/Controller 分层 | **CORS 跨域** + 组件化 + 拦截器 + RESTful 状态码 |
| 数据表 | `sys_user`（相同） | `sys_user`（相同） |

两个实验**可以同时运行**（端口不冲突），互为对照：
同样一个用户表 CRUD，实验一在一个进程里完成，实验二拆成两个进程 + 一个跨域规矩。
