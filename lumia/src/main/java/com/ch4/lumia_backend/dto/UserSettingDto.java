// src/main/java/com/ch4/lumia_backend/dto/UserSettingDto.java
package com.ch4.lumia_backend.dto;

import com.ch4.lumia_backend.entity.UserSetting;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
public class UserSettingDto {

    // "notificationInterval" 필드를 삭제했습니다.

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime notificationTime;

    private Boolean inAppNotificationEnabled;
    private Boolean pushNotificationEnabled;

    // Entity -> DTO 변환 메서드
    public static UserSettingDto fromEntity(UserSetting entity) {
        UserSettingDto dto = new UserSettingDto();
        // "notificationInterval" 관련 로직을 삭제했습니다.
        dto.setNotificationTime(entity.getNotificationTime());
        dto.setInAppNotificationEnabled(entity.isInAppNotificationEnabled());
        dto.setPushNotificationEnabled(entity.isPushNotificationEnabled());
        return dto;
    }
}