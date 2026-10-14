package com.example.lab2;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * 实验二 后端启动类。
 *
 * <p>和实验一的启动类几乎一样，只有一个区别值得注意：
 * 这个工程**只提供 JSON 接口，不提供页面**（没有 static/index.html）。
 * 页面在另一个工程里（../frontend），由 Node 起一个静态服务器单独跑。
 * 这就是「前后端分离」四个字的字面意思。
 */
@SpringBootApplication
@MapperScan("com.example.lab2.mapper")
public class Lab2Application {

    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(Lab2Application.class, args);
        String port = context.getEnvironment().getProperty("server.port", "8081");
        System.out.println("""

                ============================================================
                  后端已启动（只提供接口，没有页面）
                    接口地址 : http://localhost:%s/api/users
                    健康检查 : http://localhost:%s/api/health
                    H2 控制台: http://localhost:%s/h2-console
                  前端页面在另一个进程：http://localhost:5173
                ============================================================
                """.formatted(port, port, port));
    }
}
