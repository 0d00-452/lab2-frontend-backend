package com.example.lab2.common;

/**
 * 统一响应体：所有接口都返回这个格式。
 *
 * <pre>
 * { "code": 0, "message": "success", "data": {...} }
 * </pre>
 *
 * <p>为什么实验二要特别强调它？因为前后端分离以后，
 * 前端拿到的只有 JSON，没有任何页面提示 —— 所以「成功还是失败、
 * 失败是哪种失败」必须由后端用结构化的方式说清楚，前端才能分别处理。
 *
 * @param <T> 业务数据类型
 */
public class ApiResponse<T> {

    /** 0 = 成功；非 0 = 失败（1xxxx 参数、3xxxx 业务、5xxxx 服务端） */
    private int code;

    private String message;

    private T data;

    public ApiResponse() {
    }

    public ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(0, "success", data);
    }

    public static <T> ApiResponse<T> ok() {
        return new ApiResponse<>(0, "success", null);
    }

    public static <T> ApiResponse<T> fail(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
