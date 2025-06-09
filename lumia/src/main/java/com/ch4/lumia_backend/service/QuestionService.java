package com.ch4.lumia_backend.service;

import com.ch4.lumia_backend.dto.NewMessageResponseDto;
import com.ch4.lumia_backend.dto.QuestionDto;
import com.ch4.lumia_backend.entity.Question;
import com.ch4.lumia_backend.entity.User;
import com.ch4.lumia_backend.entity.UserSetting;
import com.ch4.lumia_backend.repository.QuestionRepository;
import com.ch4.lumia_backend.repository.UserRepository;
import com.ch4.lumia_backend.repository.UserSettingRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private static final Logger logger = LoggerFactory.getLogger(QuestionService.class);

    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final UserSettingRepository userSettingRepository;

    @Transactional
    public NewMessageResponseDto getScheduledQuestionForUser(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        UserSetting setting = userSettingRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("사용자 설정을 찾을 수 없습니다."));

        if (!setting.isInAppNotificationEnabled()) {
            return new NewMessageResponseDto(false, null);
        }

        boolean shouldProvideMessage = false;
        LocalDateTime now = LocalDateTime.now();
        LocalTime notificationTime = setting.getNotificationTime();
        LocalDateTime lastMessageTime = setting.getLastScheduledMessageAt();

        if (notificationTime != null) {
            LocalDateTime scheduledTimeToday = now.toLocalDate().atTime(notificationTime);
            if (now.isAfter(scheduledTimeToday) && (lastMessageTime == null || lastMessageTime.isBefore(scheduledTimeToday))) {
                shouldProvideMessage = true;
            }
        }

        if (shouldProvideMessage) {
            Optional<Question> questionOpt = questionRepository.findRandomActiveQuestionByType("SCHEDULED_MESSAGE");
            if (questionOpt.isPresent()) {
                setting.setLastScheduledMessageAt(now);
                logger.info("Providing new scheduled message (ID: {}) to user {}", questionOpt.get().getId(), userId);
                return new NewMessageResponseDto(true, QuestionDto.fromEntity(questionOpt.get()));
            }
        }
        return new NewMessageResponseDto(false, null);
    }
    
    @Transactional
    public NewMessageResponseDto getDailyMoodQuestionForUser(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        UserSetting setting = userSettingRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("사용자 설정을 찾을 수 없습니다."));
        
        LocalDateTime lastDailyMoodTime = setting.getLastDailyMoodAt();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();

        if (lastDailyMoodTime != null && lastDailyMoodTime.isAfter(todayStart)) {
            logger.info("User {} already received a daily mood question today.", userId);
            return new NewMessageResponseDto(false, null);
        }

        Optional<Question> questionOpt = questionRepository.findRandomActiveQuestionByType("DAILY_MOOD");
        if (questionOpt.isPresent()) {
            setting.setLastDailyMoodAt(LocalDateTime.now());
            logger.info("Providing new daily mood question (ID: {}) to user {}", questionOpt.get().getId(), userId);
            return new NewMessageResponseDto(true, QuestionDto.fromEntity(questionOpt.get()));
        } else {
            logger.warn("No active 'DAILY_MOOD' type questions found.");
            return new NewMessageResponseDto(false, null);
        }
    }
}