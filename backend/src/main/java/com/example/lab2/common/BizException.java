package com.example.lab2.common;

import org.springframework.http.HttpStatus;

/**
 * 业务异常 —— 比实验一多带了一个东西：<b>HTTP 状态码</b>。
 *
 * <p>这是实验二和实验一的一个重要区别。
 *
 * <p>实验一里，不管出错还是成功，HTTP 状态码都是 200，
 * 前端只能从响应体的 {@code code} 字段判断成功失败。
 *
 * <p>实验二要讲 RESTful，而 RESTful 的精神是：
 * <b>用 HTTP 协议本身就有的语义去表达结果</b>，而不是全都塞进 200。
 * <pre>
 *   200 OK           查询/修改成功
 *   201 Created      新增成功（并且 Location 头里给出新资源的地址）
 *   400 Bad Request  参数不对（比如用户名是空的）
 *   404 Not Found    资源不存在
 *   409 Conflict     冲突（比如用户名已存在）
 * </pre>
 *
 * <p>所以这个异常类把「业务错误码」和「HTTP 状态码」一起带上，
 * 由 GlobalExceptionHandler 分别写进响应体和响应行。
 */
public class BizException extends RuntimeException {

    /** 业务错误码（写进响应体的 code 字段） */
    private final int code;

    /** HTTP 状态码（写进响应行，比如 404 Not Found） */
    private final HttpStatus status;

    public BizException(HttpStatus status, int code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    /** 参数不合法 → 400 */
    public static BizException badRequest(String message) {
        return new BizException(HttpStatus.BAD_REQUEST, 10001, message);
    }

    /** 资源不存在 → 404 */
    public static BizException notFound(String message) {
        return new BizException(HttpStatus.NOT_FOUND, 30003, message);
    }

    /** 资源冲突（用户名重复）→ 409 */
    public static BizException conflict(String message) {
        return new BizException(HttpStatus.CONFLICT, 30002, message);
    }

    public int getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
