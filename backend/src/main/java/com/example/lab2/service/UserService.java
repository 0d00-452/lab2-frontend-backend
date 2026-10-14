package com.example.lab2.service;

import com.example.lab2.common.BizException;
import com.example.lab2.entity.User;
import com.example.lab2.mapper.UserMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户业务层 —— 和实验一相比，唯一的变化是抛异常时区分了「是哪一种错」：
 * <pre>
 *   参数不合法   → BizException.badRequest(..)  → HTTP 400
 *   用户不存在   → BizException.notFound(..)    → HTTP 404
 *   用户名重复   → BizException.conflict(..)    → HTTP 409
 * </pre>
 * 这样前端就能针对不同状态码做不同的提示，而不是一律弹「操作失败」。
 */
@Service
public class UserService {

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Transactional
    public User create(User user) {
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            throw BizException.badRequest("用户名不能为空");
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw BizException.badRequest("密码不能为空");
        }
        if (userMapper.countByUsername(user.getUsername()) > 0) {
            throw BizException.conflict("用户名已存在：" + user.getUsername());
        }
        userMapper.insert(user);
        return userMapper.findById(user.getId());
    }

    public User getById(Long id) {
        User user = userMapper.findById(id);
        if (user == null) {
            throw BizException.notFound("用户不存在：id=" + id);
        }
        return user;
    }

    public List<User> list(String keyword) {
        return userMapper.findAll(keyword);
    }

    public int count() {
        return userMapper.countAll();
    }

    @Transactional
    public User update(Long id, User form) {
        User old = getById(id);
        old.setEmail(form.getEmail());
        old.setPhone(form.getPhone());
        userMapper.update(old);
        return userMapper.findById(id);
    }

    @Transactional
    public void delete(Long id) {
        getById(id);
        userMapper.softDelete(id);
    }
}
