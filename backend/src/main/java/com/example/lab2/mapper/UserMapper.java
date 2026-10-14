package com.example.lab2.mapper;

import com.example.lab2.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 用户 Mapper —— 接口没有实现类，SQL 在 resources/mapper/UserMapper.xml 里。
 * 详情见 实验一 的说明，这里不再重复。
 */
@Mapper
public interface UserMapper {

    int insert(User user);

    User findById(@Param("id") Long id);

    List<User> findAll(@Param("keyword") String keyword);

    int update(User user);

    int softDelete(@Param("id") Long id);

    int countByUsername(@Param("username") String username);

    /** 统计当前用户总数（前端首页要显示"共 N 位用户"） */
    int countAll();
}
