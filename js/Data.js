/**
 * 밴드 채팅 백업 도구 - 데이터 관리 클래스
 * 
 * 이 파일은 messageParser.js, storageManager.js의 기능을 통합합니다.
 */

class DataManager {
    /**
     * 데이터 관리자 초기화
     * @param {ChatBackupApp} app - 메인 앱 인스턴스
     */
    constructor(app) {
      this.app = app;
    }
    
    /**
     * 메시지 파싱
     * @param {string} chatData - 밴드 채팅 데이터
     * @returns {Array} - 파싱된 메시지 배열
     */
    async parseMessages(chatData) {
      return new Promise((resolve, reject) => {
        try {
          // 밴드 채팅 형식 정규식
          const messageRegex = /^(\d{4}년\s*(?:0?[1-9]|1[0-2])월\s*(?:0?[1-9]|[12][0-9]|3[01])일\s*(?:오전|오후)\s*(?:0?[1-9]|1[0-2]):(?:[0-5][0-9])):([^:]+):(.+)$/;
          
          const lines = chatData.split('\n');
          let currentMessage = null;
          const messages = [];
          
          lines.forEach(line => {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) {
              return; // 빈 줄 무시
            }
            
            const match = trimmedLine.match(messageRegex);
            
            if (match) {
              if (currentMessage) {
                messages.push(currentMessage);
              }
              
              currentMessage = {
                time: match[1].trim(),
                username: match[2].trim(),
                chatMessage: match[3].trim()
              };
            } else if (currentMessage) {
              // 이전 메시지의 연속된 줄인 경우
              currentMessage.chatMessage += '\n' + trimmedLine;
            }
          });
          
          // 마지막 메시지 처리
          if (currentMessage) {
            messages.push(currentMessage);
          }
          
          resolve(messages);
        } catch (error) {
          reject(error);
        }
      });
    }
    
    /**
     * 메시지 텍스트 포맷팅
     * @param {string} text - 포맷팅할 텍스트
     * @returns {string} - 포맷팅된 HTML
     */
    formatMessageText(text) {
      if (!text) return '';
      
      // 태그 강조 설정 확인
      const highlightTags = this.app.state.highlightTags !== false;
      
      // 태그 강조 기능이 꺼져 있으면 줄바꿈만 처리하고 반환
      if (!highlightTags) {
        return text.replace(/\n/g, '<br>');
      }
      
      // 채팅 참여자 목록 가져오기
      let participants = new Set();
      if (this.app.state.messages) {
        this.app.state.messages.forEach(msg => {
          if (msg.username) {
            participants.add(msg.username);
          }
        });
      }
      
      // 개선된 태그 패턴 매칭
      // 1. 대괄호 내 문자열 패턴 (@[사망]강담윤, @[사망/NPC] 은이연)
      // 2. 파이프(|) 구분자 패턴 (@34 | 15 | 범유라)
      // 3. 대괄호 내 파이프/슬래시 구분자 패턴 (@[31|23]강담윤, @[30/48] 한채희)
      const patterns = [
        // 기본 패턴: @로 시작하는 일반 태그
        /@([^\s:.,!?;()\[\]{}<>"']+)/g,
        
        // 대괄호 내 텍스트 패턴 - @[사망]강담윤, @[사망/NPC] 은이연
        /@\[([^\]]+)\](\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
        
        // 대괄호 내 숫자와 구분자 패턴 - @[31|23]강담윤, @[30/48] 한채희
        /@\[(\d+[\|\/]\d+)\](\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
        
        // 파이프(|) 구분자 패턴 - @34 | 15 | 범유라
        /@(\d+\s*\|\s*\d+\s*\|\s*[^\s:.,!?;()\[\]{}<>"']+)/g,
        
        // 숫자 슬래시 패턴 - @34/15 범유라
        /@(\d+\/\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
        
        // 숫자 띄어쓰기 구분자 패턴 - @34 15 범유라
        /@(\d+\s+\d+\s+[^\s:.,!?;()\[\]{}<>"']+)/g,
        
        // 시스템 및 특수 태그
        /@(SYSTEM|BOT|ADMIN|Manager|총괄|부계|공지|관리자|매니저)/g
      ];
      
      // 태그 강조 처리
      let processedText = text;
      
      // 태그 매칭 전처리 - 숫자와 특수문자 사이 태그
      patterns.forEach(pattern => {
        processedText = processedText.replace(pattern, (match) => {
          // '@'를 포함한 전체 태그를 파란색으로 처리
          return `<span style="color:#0d5bd1;font-weight:bold;">${match}</span>`;
        });
      });
      
      // 참여자 목록 기반 태그 처리 (더 정교한 처리)
      if (participants.size > 0) {
        // 이미 태그 처리된 부분은 건너뛰도록 정규식 분석
        let lastIndex = 0;
        let result = '';
        const tagRegex = /<span[^>]*>@[^<]+<\/span>|@([^@<>\n\s:.,!?;()\[\]{}"']+)/g;
        let match;
        
        while ((match = tagRegex.exec(processedText)) !== null) {
          // 이미 태그 처리된 부분은 그대로 유지
          if (match[0].startsWith('<span')) {
            result += processedText.substring(lastIndex, match.index) + match[0];
            lastIndex = match.index + match[0].length;
            continue;
          }
          
          // 새로운 태그 발견
          const tagUsername = match[1];
          if (tagUsername) {
            // 참여자 목록 확인
            let isParticipant = false;
            
            // 정확히 일치하는지 확인
            if (participants.has(tagUsername)) {
              isParticipant = true;
            } else {
              // 부분 일치 확인 (사용자 이름에 공백이 있는 경우)
              for (const participant of participants) {
                if (participant.includes(' ') && tagUsername.includes(participant)) {
                  isParticipant = true;
                  break;
                }
              }
            }
            
            // 태그 강조 처리
            if (isParticipant) {
              result += processedText.substring(lastIndex, match.index);
              result += `<span style="color:#0d5bd1;font-weight:bold;">@${tagUsername}</span>`;
            } else {
              result += processedText.substring(lastIndex, match.index);
              result += `<span style="color:#0d5bd1;font-weight:bold;">@${tagUsername}</span>`;
            }
            
            lastIndex = match.index + match[0].length;
          }
        }
        
        // 남은 텍스트 추가
        if (lastIndex < processedText.length) {
          result += processedText.substring(lastIndex);
        }
        
        processedText = result || processedText;
      }
      
      // 줄바꿈 처리
      return processedText.replace(/\n/g, '<br>');
    }
    
    /**
     * 시간 형식이 같은지 확인
     * @param {string} time1 - 첫 번째 시간 문자열
     * @param {string} time2 - 두 번째 시간 문자열
     * @returns {boolean} - 같은 시간대인지 여부
     */
    isSameTimeFrame(time1, time2) {
      if (!time1 || !time2) return false;
      
      // 시간 형식: "2023년 3월 15일 오전 12:25"
      // 분 단위까지 추출하여 비교
      const timeRegex = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2})/;
      
      const match1 = time1.match(timeRegex);
      const match2 = time2.match(timeRegex);
      
      if (!match1 || !match2) return false;
      
      // 년, 월, 일 비교
      if (match1[1] !== match2[1] || match1[2] !== match2[2] || match1[3] !== match2[3]) {
        return false;
      }
      
      // 오전/오후 비교
      if (match1[4] !== match2[4]) {
        return false;
      }
      
      // 시간, 분 비교 - 분까지 정확히 일치해야 함
      if (match1[5] !== match2[5] || match1[6] !== match2[6]) {
        return false;
      }
      
      return true;
    }
    
    /**
     * 안전한 ID 생성
     * @param {string} text - 원본 텍스트
     * @returns {string} - 안전한 ID
     */
    safeId(text) {
      return text.replace(/[^a-z0-9]/gi, '_');
    }
    
    /**
     * 프로필 저장
     * @param {Object} displayNames - 표시 이름 객체
     * @param {Object} userProfileImages - 사용자 프로필 이미지 객체
     * @param {Object} userColors - 사용자 색상 객체
     * @param {Set} selectedUsers - 선택된 사용자 집합
     */
    saveProfiles(displayNames, userProfileImages, userColors, selectedUsers) {
      try {
        localStorage.setItem('chatProfiles', JSON.stringify({
          displayNames: displayNames,
          userProfileImages: userProfileImages,
          userColors: userColors
        }));
        
        localStorage.setItem('selectedUsers', JSON.stringify(Array.from(selectedUsers)));
      } catch (error) {
        console.error('프로필 저장 중 오류 발생:', error);
      }
    }
    
    /**
     * 프로필 불러오기
     * @returns {Object} - 프로필 정보
     */
    loadProfiles() {
      const result = {
        displayNames: {},
        userProfileImages: {},
        userColors: {},
        selectedUsers: new Set()
      };
      
      try {
        const savedProfiles = localStorage.getItem('chatProfiles');
        if (savedProfiles) {
          const profiles = JSON.parse(savedProfiles);
          result.displayNames = profiles.displayNames || {};
          result.userProfileImages = profiles.userProfileImages || {};
          result.userColors = profiles.userColors || {};
        }
        
        const savedSelectedUsers = localStorage.getItem('selectedUsers');
        if (savedSelectedUsers) {
          result.selectedUsers = new Set(JSON.parse(savedSelectedUsers));
        }
      } catch (error) {
        console.error('프로필 불러오기 중 오류 발생:', error);
      }
      
      return result;
    }
    
    /**
     * 테마 설정 저장
     * @param {boolean} isDarkMode - 다크 모드 여부
     */
    saveThemePreference(isDarkMode) {
      localStorage.setItem('theme-preference', isDarkMode ? 'dark' : 'light');
    }
    
    /**
     * 테마 설정 불러오기
     * @returns {boolean} - 다크 모드 여부
     */
    loadThemePreference() {
      return localStorage.getItem('theme-preference') === 'dark';
    }
    
    /**
     * 태그 강조 설정 저장
     * @param {boolean} highlightTags - 태그 강조 여부
     */
    saveTagHighlightSetting(highlightTags) {
      localStorage.setItem('highlightTags', highlightTags ? 'true' : 'false');
    }
    
    /**
     * 태그 강조 설정 불러오기
     * @returns {boolean} - 태그 강조 여부
     */
    loadTagHighlightSetting() {
      // 이전에 설정한 값이 없으면 기본값으로 true 반환
      const savedSetting = localStorage.getItem('highlightTags');
      return savedSetting === null ? true : savedSetting === 'true';
    }
    
    /**
     * 내 메시지 프로필 이미지 표시 설정 저장
     * @param {boolean} showMyProfile - 내 메시지 프로필 이미지 표시 여부
     */
    saveShowMyProfileSetting(showMyProfile) {
      localStorage.setItem('showMyProfile', showMyProfile ? 'true' : 'false');
    }
    
    /**
     * 내 메시지 프로필 이미지 표시 설정 불러오기
     * @returns {boolean} - 내 메시지 프로필 이미지 표시 여부
     */
    loadShowMyProfileSetting() {
      // 이전에 설정한 값이 없으면 기본값으로 true 반환
      const savedSetting = localStorage.getItem('showMyProfile');
      return savedSetting === null ? true : savedSetting === 'true';
    }
    
    /**
     * 고급 설정 저장
     * @param {Object} settings - 고급 설정 객체
     */
    saveAdvancedSettings(settings) {
      try {
        localStorage.setItem('advancedSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('고급 설정 저장 중 오류 발생:', error);
      }
    }
    
    /**
     * 고급 설정 불러오기
     * @returns {Object} - 고급 설정 객체
     */
    loadAdvancedSettings() {
      const defaultSettings = {
        highlightTags: true,
        showMyProfile: true,
        imageQuality: 0.6,   
        useImageCompression: true,
        maxImageSize: 150     
      };
      
      try {
        const savedSettings = localStorage.getItem('advancedSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // 기본값과 병합하여 누락된 설정이 있으면 기본값 사용
          return { ...defaultSettings, ...parsedSettings };
        }
      } catch (error) {
        console.error('고급 설정 불러오기 실패:', error);
      }
      
      return defaultSettings;
    }
  }