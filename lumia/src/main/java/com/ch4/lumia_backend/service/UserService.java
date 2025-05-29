// src/main/java/com/ch4/lumia_backend/service/UserService.java
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
import org.springframework.util.StringUtils; // StringUtils 추가

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
                // gender, bloodType, mbti는 null로 초기화 (프로필에서 설정)
                .build();

        try {
            User savedUser = userRepository.save(newUser);

            UserSetting defaultSettings = UserSetting.builder()
                    .user(savedUser)
                    .notificationInterval("WHEN_APP_OPENS")
                    .inAppNotificationEnabled(true)
                    .pushNotificationEnabled(true)
                    .build();
            userSettingRepository.save(defaultSettings);

            return savedUser;
        } catch (DataIntegrityViolationException e) {
            // Unique 제약 조건 위반 (userId, email)
            // 이미 위에서 확인했지만, 동시에 요청이 들어올 경우를 대비
            logger.error("Data integrity violation during signup: {}", e.getMessage());
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

        // 닉네임(username) 업데이트
        if (StringUtils.hasText(profileDto.getUsername())) { // null 또는 빈 문자열이 아닐 경우
            user.setUsername(profileDto.getUsername());
        }
        // 성별 업데이트 (null 또는 빈 문자열 허용하여 "입력하기" 상태로 되돌릴 수 있도록)
        user.setGender(profileDto.getGender());

        // 혈액형 업데이트
        user.setBloodType(profileDto.getBloodType());

        // MBTI 업데이트
        user.setMbti(profileDto.getMbti());

        User updatedUser = userRepository.save(user);
        return UserProfileResponseDto.fromEntity(updatedUser);
    }

    @Transactional
    public void updateUserEmail(String userLoginId, EmailUpdateRequestDto emailDto) {
        User user = userRepository.findByUserId(userLoginId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userLoginId));

        String newEmail = emailDto.getNewEmail();
        if (!StringUtils.hasText(newEmail)) {
            throw new IllegalArgumentException("새로운 이메일을 입력해주세요.");
        }

        // 새 이메일이 현재 이메일과 다른 경우에만 중복 검사 및 업데이트
        if (!newEmail.equalsIgnoreCase(user.getEmail())) {
            userRepository.findByEmail(newEmail).ifPresent(existingUser -> {
                if (!existingUser.getUserId().equals(userLoginId)) { // 다른 사용자가 이미 사용 중인 경우
                    throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
                }
            });
            user.setEmail(newEmail);
            userRepository.save(user);
        }
    }

    @Transactional
    public void updateUserPassword(String userLoginId, PasswordUpdateRequestDto passwordDto) {
        User user = userRepository.findByUserId(userLoginId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userLoginId));

        if (!StringUtils.hasText(passwordDto.getCurrentPassword()) || !StringUtils.hasText(passwordDto.getNewPassword())) {
            throw new IllegalArgumentException("현재 비밀번호와 새 비밀번호를 모두 입력해주세요.");
        }

        if (!passwordEncoder.matches(passwordDto.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        // TODO: 새 비밀번호 유효성 검사 (예: 길이, 복잡도) 추가 가능

        user.setPassword(passwordEncoder.encode(passwordDto.getNewPassword()));
        userRepository.save(user);
    }
}