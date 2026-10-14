package com.example.lab2.controller;

import com.example.lab2.common.ApiResponse;
import com.example.lab2.entity.User;
import com.example.lab2.service.UserService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户 RESTful 接口。
 *
 * <p>{@code @RestController} 做的事：把类里所有方法的返回值自动转成 JSON 写进响应体。
 * 它等于 {@code @Controller + @ResponseBody}，是前后端分离项目里最常用的注解 ——
 * 因为它意味着「这个类不返回页面，只返回数据」。
 *
 * <p><b>RESTful 的核心思想是：URL 表示资源，HTTP 方法表示动作。</b>
 * <pre>
 *   GET    /api/users         查列表
 *   GET    /api/users/1       查某一个
 *   POST   /api/users         新增
 *   PUT    /api/users/1       修改
 *   DELETE /api/users/1       删除
 * </pre>
 * 反面教材是 {@code /api/getUserList}、{@code /api/deleteUserById?id=1}
 * —— 把动作写进了 URL，那就不叫 RESTful 了。
 *
 * <p>本实验和实验一在接口层面的区别：这里用<b>真实的 HTTP 状态码</b>表达结果
 * （201 创建成功、404 不存在、409 冲突），而不是一律 200。
 */
@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** 健康检查：前端启动时先调它，确认后端活着 */
    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        Map<String, Object> data = new HashMap<>();
        data.put("status", "UP");
        data.put("service", "lab2-backend");
        data.put("time", java.time.LocalDateTime.now().toString());
        return ApiResponse.ok(data);
    }

    /**
     * 查询列表：GET /api/users?keyword=zhang
     * <p>成功 → 200
     */
    @GetMapping("/users")
    public ApiResponse<List<User>> list(@RequestParam(required = false) String keyword) {
        List<User> users = userService.list(keyword);
        users.forEach(this::hidePassword);
        return ApiResponse.ok(users);
    }

    /**
     * 查询单个：GET /api/users/1
     * <p>成功 → 200；不存在 → 404（由 BizException + GlobalExceptionHandler 产生）
     */
    @GetMapping("/users/{id}")
    public ApiResponse<User> getById(@PathVariable Long id) {
        return ApiResponse.ok(hidePassword(userService.getById(id)));
    }

    /**
     * 新增：POST /api/users
     * <p>成功 → <b>201 Created</b>，并在 Location 响应头里给出新资源的地址。
     * 这是 RESTful 里新增资源的标准做法：前端拿到 Location 就知道去哪儿查它。
     */
    @PostMapping("/users")
    public ResponseEntity<ApiResponse<User>> create(@RequestBody User user) {
        User created = hidePassword(userService.create(user));
        return ResponseEntity
                .status(HttpStatus.CREATED)                                  // 201
                .header(HttpHeaders.LOCATION, "/api/users/" + created.getId()) // Location: /api/users/4
                .body(ApiResponse.ok(created));
    }

    /**
     * 修改：PUT /api/users/1
     * <p>成功 → 200
     */
    @PutMapping("/users/{id}")
    public ApiResponse<User> update(@PathVariable Long id, @RequestBody User user) {
        return ApiResponse.ok(hidePassword(userService.update(id, user)));
    }

    /**
     * 删除：DELETE /api/users/1
     * <p>成功 → 200 + 响应体。
     *
     * <p>严格按 HTTP 规范，删除成功且无需返回内容时应该用 <b>204 No Content</b>。
     * 这里用 200 是为了让前端统一处理（204 不能带响应体，前端要多写一个分支）。
     * 两种都可以，团队内统一即可 —— 关键是<b>别用 GET 去删数据</b>。
     */
    @DeleteMapping("/users/{id}")
    public ApiResponse<Map<String, Object>> delete(@PathVariable Long id) {
        userService.delete(id);
        Map<String, Object> data = new HashMap<>();
        data.put("deletedId", id);
        data.put("remaining", userService.count());
        return ApiResponse.ok(data);
    }

    /** 密码不返回给前端（真实项目应该用不含 password 的 VO 类型） */
    private User hidePassword(User user) {
        if (user != null) {
            user.setPassword(null);
        }
        return user;
    }
}
