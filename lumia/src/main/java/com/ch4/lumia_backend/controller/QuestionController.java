package com.ch4.lumia_backend.controller;

import com.ch4.lumia_backend.dto.NewMessageResponseDto;
import com.ch4.lumia_backend.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private static final Logger logger = LoggerFactory.getLogger(QuestionController.class);
    private final QuestionService questionService;
    
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return authentication.getName();
    }

    @GetMapping("/scheduled")
    public ResponseEntity<?> getScheduledQuestion() {
        String currentUserId = getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 유효하지 않습니다.");
        }
        
        logger.info("Fetching scheduled question for user: {}", currentUserId);
        NewMessageResponseDto responseDto = questionService.getScheduledQuestionForUser(currentUserId);
        return ResponseEntity.ok(responseDto);
    }
    
    @GetMapping("/daily-mood")
    public ResponseEntity<?> getDailyMoodQuestion() {
        String currentUserId = getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증 정보가 유효하지 않습니다.");
        }

        logger.info("Fetching daily mood question for user: {}", currentUserId);
        NewMessageResponseDto responseDto = questionService.getDailyMoodQuestionForUser(currentUserId);
        return ResponseEntity.ok(responseDto);
    }
}