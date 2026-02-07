package com.eurobank.auth.service;

import com.eurobank.auth.dto.UpdateProfileRequest;
import com.eurobank.auth.dto.UserResponse;
import com.eurobank.auth.entity.User;
import com.eurobank.auth.exception.UserAlreadyExistsException;
import com.eurobank.auth.exception.UserNotFoundException;
import com.eurobank.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserProfile(String username) {
        log.debug("Getting user profile for username: {}", username);
        User user = getUserByUsername(username);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserProfile(String username, UpdateProfileRequest request) {
        log.info("Updating user profile for username: {}", username);
        User user = getUserByUsername(username);

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new UserAlreadyExistsException("Email already in use: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }

        User updatedUser = userRepository.save(user);
        log.info("User profile updated successfully for username: {}", username);
        return mapToUserResponse(updatedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> UserNotFoundException.byUsername(username));
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> UserNotFoundException.byId(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        log.debug("Getting all users");
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        log.info("Deleting user with id: {}", id);
        User user = getUserById(id);
        userRepository.delete(user);
        log.info("User deleted successfully with id: {}", id);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles())
                .enabled(user.getEnabled())
                .twoFaEnabled(user.getTwoFaEnabled())
                .lastLoginDate(user.getLastLoginDate())
                .createdDate(user.getCreatedDate())
                .build();
    }
}
