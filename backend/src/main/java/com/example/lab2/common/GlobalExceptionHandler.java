package com.example.lab2.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理 —— 把异常翻译成「HTTP 状态码 + 统一响应体」。
 *
 * <p>前后端分离之后，异常处理变得更重要了：
 * 前端拿不到错误页面，只能靠状态码和响应体。所以这里要保证
 * <b>任何</b>异常都返回结构一致的 JSON，而不是 Spring 默认的 HTML 错误页。
 *
 * <p>返回 {@link ResponseEntity} 而不是直接返回对象，就是为了能同时控制
 * 「响应行里的状态码」和「响应体里的内容」。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** 业务异常：用异常自己带的 HTTP 状态码（400 / 404 / 409） */
    @ExceptionHandler(BizException.class)
    public ResponseEntity<ApiResponse<Void>> handleBizException(BizException e) {
        log.warn("业务异常 [{}] {} — {}", e.getStatus().value(), e.getCode(), e.getMessage());
        return ResponseEntity.status(e.getStatus())
                .body(ApiResponse.fail(e.getCode(), e.getMessage()));
    }

    /** 其他异常：一律 500，对外只说笼统的话，堆栈只写日志 */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleOtherException(Exception e) {
        log.error("未预期异常", e);
        return ResponseEntity.status(500)
                .body(ApiResponse.fail(50000, "服务器内部错误，请联系管理员"));
    }
}
