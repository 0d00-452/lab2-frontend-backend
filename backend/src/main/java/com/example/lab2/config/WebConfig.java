package com.example.lab2.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * ★★★ 本实验最核心的一个类：CORS（跨域）配置 ★★★
 *
 * <p><b>先说清楚「跨域」到底是什么问题。</b>
 *
 * <p>前端的地址是 {@code http://localhost:5173}，后端的地址是 {@code http://localhost:8081}。
 * 端口不同，浏览器就认为这是「两个不同的源」。出于安全考虑，浏览器有个规矩叫
 * <b>同源策略</b>：A 源页面里的 JS 默认不许读取 B 源的响应内容。
 *
 * <p>注意关键的一点：<b>请求其实发出去了，后端也处理了，是浏览器把响应扣下不给你</b>。
 * 所以你会看到控制台报这样的错：
 * <pre>
 *   Access to fetch at 'http://localhost:8081/api/users' from origin
 *   'http://localhost:5173' has been blocked by CORS policy:
 *   No 'Access-Control-Allow-Origin' header is present on the requested resource.
 * </pre>
 *
 * <p><b>解决办法有两种</b>：
 * <ol>
 *   <li>让浏览器「不检查」—— 比如用代理把前后端变成同源（Vue 的 devServer.proxy 就是这么干的）；</li>
 *   <li>让后端明确表态「我允许 5173 来访问我」—— 也就是下面这段配置。
 *       后端在响应头里加上 {@code Access-Control-Allow-Origin}，浏览器看到就放行。</li>
 * </ol>
 * 本实验用第 2 种，因为它是课程要求，而且你在真实项目里一定会用到。
 *
 * <p><b>还有一个容易懵的点：为什么会看到两次请求？</b>
 * 当你发的是「非简单请求」（比如 {@code Content-Type: application/json} 的 POST，
 * 或者 PUT / DELETE），浏览器会先自动发一个 {@code OPTIONS} 请求去「问一下」后端允不允许，
 * 这叫<b>预检请求（preflight）</b>。预检通过了，浏览器才发真正的请求。
 * 你在浏览器 F12 的 Network 面板里会看到：
 * <pre>
 *   users       OPTIONS   204   ← 预检（浏览器自动发的，不是你代码写的）
 *   users       POST      201   ← 真正的请求
 * </pre>
 * Spring 的 {@code addCorsMappings} 会自动帮你应答这个 OPTIONS 请求，不用自己写。
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry
                // 只对 /api/ 开头的接口开放跨域（不要写 /**，那会把所有路径都放开）
                .addMapping("/api/**")
                // 允许哪些「源」来访问。必须写全 http://主机:端口，不能只写 localhost:5173
                .allowedOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                // 允许哪些 HTTP 方法。OPTIONS 必须留，否则预检请求会被拒
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                // 允许前端带哪些请求头
                .allowedHeaders("*")
                // 允许携带 Cookie（本项目没用到，但写上是常见做法）
                // 注意：allowCredentials(true) 时，allowedOrigins 不能写 "*"，必须写具体地址
                .allowCredentials(true)
                // 预检结果缓存 1 小时，避免每次请求都先发一次 OPTIONS
                .maxAge(3600);
    }
}
