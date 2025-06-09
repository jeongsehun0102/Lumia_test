package com.ch4.lumia_backend.service;

import com.ch4.lumia_backend.dto.EmailUpdateRequestDto;
import com.ch4.lumia_backend.dto.PasswordUpdateRequestDto;
import com.ch4.lumia_backend.dto.SignupRequestDto;
import com.ch4.lumia_backend.dto.UserProfileResponseDto;
import com.ch4.lumia_backend.dto.UserProfileUpdateRequestDto;
import com.ch4.lumia_backend.entity.User;
import com.ch4.lumia_backend.entity.UserSetting;
import com.ch4.lumia_backend.repository.UserRepository;
import com.ch4.lumia_backend.repository.UserSettingRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSettingRepository userSettingRepository;

    @Transactional(readOnly = true)
    public boolean login(String userId, String rawPassword) {
        Optional<User> optionalUser = userRepository.findByUserId(userId);
        if (optionalUser.isPresent()) {
            User foundUser = optionalUser.get();
            return passwordEncoder.matches(rawPassword, foundUser.getPassword());
        }
        return false;
    }
    
    @Transactional(readOnly = true)
    public User findByUserId(String userId) {
        return userRepository.findByUserId(userId)
                .orElseThrow(() -> {
                    logger.warn("User not found with userId: {}", userId);
                    return new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId);
                });
    }

    @Transactional(readOnly = true)
    public String findUserIdByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 이메일로 가입된 사용자를 찾을 수 없습니다."));
        return user.getUserId();
    }

    @Transactional
    public User signup(SignupRequestDto signupRequestDto) {
        if (userRepository.findByUserId(signupRequestDto.getUserId()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        if (userRepository.findByEmail(signupRequestDto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        String encodedPassword = passwordEncoder.encode(signupRequestDto.getPassword());

        User newUser = User.builder()
                .userId(signupRequestDto.getUserId())
                .password(encodedPassword)
                .username(signupRequestDto.getUsername())
                .email(signupRequestDto.getEmail())
                .role("ROLE_USER")
                .build();

        try {
            User savedUser = userRepository.save(newUser);
            logger.info("User {} signed up successfully.", savedUser.getUserId());

            UserSetting defaultSettings = UserSetting.builder()
                    .user(savedUser)
                    .inAppNotificationEnabled(true)
                    .pushNotificationEnabled(true)
                    .build();
            userSettingRepository.save(defaultSettings);
            logger.info("Default settings created for user {}.", savedUser.getUserId());

            return savedUser;
        } catch (DataIntegrityViolationException e) {
            logger.error("Data integrity violation during signup for userId {}: {}", signupRequestDto.getUserId(), e.getMessage());
            throw new IllegalArgumentException("아이디 또는 이메일이 이미 사용 중일 수 있습니다. 다시 시도해주세요.");
        }
    }

    @Transactional(readOnly = true)
    public UserProfileResponseDto getUserProfile(String userLoginId) {
        User user = userRepository.findByUserId(userLoginId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userLoginId));
        return UserProfileResponseDto.fromEntity(user);
    }

    @Transactional
    public UserProfileResponseDto updateUserProfile(String userLoginId, UserProfileUpdateRequestDto profileDto) {
        User user = userRepository.findByUserId(userLoginId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userLoginId));

        boolean isProfileUpdated = false;

        // 닉네임(username) 업데이트
        if (profileDto.getUsername() != null) {
            if (StringUtils.hasText(profileDto.getUsername())) {
                if (!profileDto.getUsername().equals(user.getUsername())) {
                    user.setUsername(profileDto.getUsername());
                    isProfileUpdated = true;
                }
            }
        }

        // 성별 업데이트 (빈 값으로 보낼 시 null로 만들어 삭제 가능)
        if (profileDto.getGender() != null) {
            String newGender = profileDto.getGender().isEmpty() ? null : profileDto.getGender();
            if (user.getGender() == null ? (newGender != null) : !user.getGender().equals(newGender)) {
                user.setGender(newGender);
                isProfileUpdated = true;
            }
        }

        // 혈액형 업데이트 (빈 값으로 보낼 시 null로 만들어 삭제 가능)
        if (profileDto.getBloodType() != null) {
            String newBloodType = profileDto.getBloodType().isEmpty() ? null : profileDto.getBloodType();
            if (user.getBloodType() == null ? (newBloodType != null) : !user.getBloodType().equals(newBloodType)) {
                user.setBloodType(newBloodType);
                isProfileUpdated = true;
            }
        }

        // MBTI 업데이트 (빈 값으로 보낼 시 null로 만들어 삭제 가능)
        if (profileDto.getMbti() != null) {
            String newMbti = profileDto.getMbti().isEmpty() ? null : profileDto.getMbti();
            if (user.getMbti() == null ? (newMbti != null) : !user.getMbti().equals(newMbti)) {
                user.setMbti(newMbti);
                isProfileUpdated = true;
            }
        }

        if (isProfileUpdated) {
            User updatedUser = userRepository.save(user);
            return UserProfileResponseDto.fromEntity(updatedUser);
        } else {
            return UserProfileResponseDto.fromEntity(user);
        }
    }

    @Transactional
    public void updateUserEmail(String userLoginId, EmailUpdateRequestDto emailDto) {
        User user = userRepository.findByUserId(userLoginId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userLoginId));

        String newEmail = emailDto.getNewEmail();
        if (!StringUtils.hasText(newEmail)) {
            throw new IllegalArgumentException("새로운 이메일을 입력해주세요.");
        }

        if (!newEmail.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.findByEmail(newEmail).isPresent()) {
                throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
            }
            user.setEmail(newEmail);
            userRepository.save(user);
        }
    }

    @Transactional
    public void updateUserPassword(String userLoginId, PasswordUpdateRequestDto passwordDto) {
        User user = userRepository.findByUserId(userLoginId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userLoginId));

        if (!passwordEncoder.matches(passwordDto.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        
        if (!StringUtils.hasText(passwordDto.getNewPassword())) {
             throw new IllegalArgumentException("새 비밀번호를 입력해주세요.");
        }
        if (passwordDto.getNewPassword().equals(passwordDto.getCurrentPassword())) {
            throw new IllegalArgumentException("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }

        user.setPassword(passwordEncoder.encode(passwordDto.getNewPassword()));
        userRepository.save(user);
    }
}