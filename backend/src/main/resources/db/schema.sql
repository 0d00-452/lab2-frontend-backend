-- =============================================================================
--  建表脚本（启动时自动执行）
--  和实验一保持同一张表，这样你能清楚看到「实验二变的是前后端怎么通信」
-- =============================================================================

DROP TABLE IF EXISTS sys_user;

CREATE TABLE sys_user (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(100) NOT NULL,
    email      VARCHAR(100),
    phone      VARCHAR(20),
    deleted    TINYINT      NOT NULL DEFAULT 0,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sys_user_username ON sys_user (username);
