package com.eurobank.auth.service;

import com.eurobank.auth.dto.UpdateProfileRequest;
import com.eurobank.auth.dto.UserResponse;
import com.eurobank.auth.entity.User;

import java.util.List;

public interface UserService {

    UserResponse getUserProfile(String username);

    UserResponse updateUserProfile(String username, UpdateProfileRequest request);

    User getUserByUsername(String username);

    User getUserById(Long id);

    List<UserResponse> getAllUsers();

    void deleteUser(Long id);
}
