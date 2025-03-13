/**
 * 밴드 채팅 백업 도구 - 데이터 관리 클래스
 * 
 * 채팅 메시지 파싱 및 처리, 설정 저장 및 불러오기를 담당하는 클래스
 */

class DataManager {
  /**
   * 데이터 관리자 초기화
   * @param {ChatBackupApp} app - 메인 앱 인스턴스
   */
  constructor(app) {
    this.app = app;
    
    // 정규식 캐싱 - 성능 향상
    this._messageRegex = /^(\d{4}년\s*(?:0?[1-9]|1[0-2])월\s*(?:0?[1-9]|[12][0-9]|3[01])일\s*(?:오전|오후)\s*(?:0?[1-9]|1[0-2]):(?:[0-5][0-9])):([^:]+):(.+)$/;
    this._tagPatternsCache = null;
    
    // 기본 설정
    this.defaultSettings = {
      highlightTags: true,
      showMyProfile: true,
      imageQuality: 0.6,   
      useImageCompression: true,
      maxImageSize: 150
    };
  }
  
  /**
   * 메시지 파싱 - 성능 최적화
   * @param {string} chatData - 밴드 채팅 데이터
   * @returns {Promise<Array>} - 파싱된 메시지 배열
   */
  async parseMessages(chatData) {
    return new Promise((resolve, reject) => {
      try {
        // 입력 데이터 빈 값 체크
        if (!chatData || typeof chatData !== 'string') {
          reject(new Error('유효하지 않은 채팅 데이터입니다.'));
          return;
        }
        
        console.time('메시지 파싱');
        
        // 채팅 라인 분할
        const lines = chatData.split('\n');
        const totalLines = lines.length;
        
        // 진행 상황 업데이트 지원
        const updateProgress = (processed) => {
          if (processed % 1000 === 0 && this.app.uiManager && 
              typeof this.app.uiManager.showStatusMessage === 'function') {
            this.app.uiManager.showStatusMessage(
              `메시지 분석 중... (${processed}/${totalLines})`,
              this.app.state?.darkMode
            );
          }
        };
        
        let currentMessage = null;
        const messages = [];
        
        // 최적화된 메시지 파싱 로직
        for (let i = 0; i < lines.length; i++) {
          const trimmedLine = lines[i].trim();
          
          // 빈 줄 무시
          if (!trimmedLine) {
            continue;
          }
          
          // 정규 표현식 매칭 시도
          const match = trimmedLine.match(this._messageRegex);
          
          if (match) {
            // 이전 메시지가 있으면 저장
            if (currentMessage) {
              messages.push(currentMessage);
            }
            
            // 새 메시지 시작
            currentMessage = {
              time: match[1].trim(),
              username: match[2].trim(),
              chatMessage: match[3].trim()
            };
          } else if (currentMessage) {
            // 이전 메시지의 연속된 줄
            currentMessage.chatMessage += '\n' + trimmedLine;
          }
          
          // 대량 처리 시 진행 상황 표시
          updateProgress(i);
        }
        
        // 마지막 메시지 처리
        if (currentMessage) {
          messages.push(currentMessage);
        }
        
        console.timeEnd('메시지 파싱');
        console.log(`파싱된 메시지 수: ${messages.length}`);
        
        // 메시지 수 검증
        if (messages.length === 0) {
          reject(new Error('변형된 채팅이 없습니다. 내용을 확인해주세요.'));
          return;
        }
        
        resolve(messages);
      } catch (error) {
        console.error('메시지 파싱 중 오류:', error);
        reject(new Error('채팅 처리 중 오류가 발생했습니다: ' + error.message));
      }
    });
  }
  
  /**
   * 메시지 텍스트 포맷팅 - 태그 강조 처리
   * @param {string} text - 포맷팅할 텍스트
   * @returns {string} - 포맷팅된 HTML
   */
  formatMessageText(text) {
    // 입력 검사
    if (!text) return '';
    
    // 태그 강조 설정 확인
    const highlightTags = this.app.state.highlightTags !== false;
    
    // 태그 강조 기능이 꺼져 있으면 줄바꿈만 처리하고 반환
    if (!highlightTags) {
      return text.replace(/\n/g, '<br>');
    }
    
    try {
      // 채팅 참여자 목록 구성
      let participants = new Set();
      if (this.app.state.messages) {
        this.app.state.messages.forEach(msg => {
          if (msg.username) {
            participants.add(msg.username);
          }
        });
      }
      
      // 태그 패턴 캐싱 (한 번만 생성)
      if (!this._tagPatternsCache) {
        this._tagPatternsCache = [
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
      }
      
      // 태그 강조 처리
      let processedText = text;
      
      // 태그 매칭 전처리 - 모든 패턴 적용
      this._tagPatternsCache.forEach(pattern => {
        processedText = processedText.replace(pattern, (match) => {
          // '@'를 포함한 전체 태그를 파란색으로 처리
          return `<span style="color:#0d5bd1;font-weight:bold;">${match}</span>`;
        });
      });
      
      // 참여자 목록 기반 태그 추가 처리
      if (participants.size > 0) {
        // 이미 강조된 태그를 건너뛰기 위한 처리
        let lastIndex = 0;
        let result = '';
        const tagRegex = /<span[^>]*>@[^<]+<\/span>|@([^@<>\n\s:.,!?;()\[\]{}"']+)/g;
        let match;
        
        // HTML 태그를 건너뛰며 실제 태그만 처리
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
            result += processedText.substring(lastIndex, match.index);
            
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
            
            // 태그 강조 (참여자든 아니든 모두 동일한 스타일 적용)
            result += `<span style="color:#0d5bd1;font-weight:bold;">@${tagUsername}</span>`;
            lastIndex = match.index + match[0].length;
          }
        }
        
        // 남은 텍스트 추가
        if (lastIndex < processedText.length) {
          result += processedText.substring(lastIndex);
        }
        
        // 결과가 있으면 사용, 없으면 이전 처리 결과 유지
        processedText = result || processedText;
      }
      
      // 줄바꿈 처리
      return processedText.replace(/\n/g, '<br>');
    } catch (error) {
      console.error('메시지 포맷팅 중 오류:', error);
      // 오류 시 기본 줄바꿈 처리만 적용 (영속성 보장)
      return text.replace(/\n/g, '<br>');
    }
  }
  
  /**
   * 시간 형식이 같은지 확인
   * @param {string} time1 - 첫 번째 시간 문자열
   * @param {string} time2 - 두 번째 시간 문자열
   * @returns {boolean} - 같은 시간대인지 여부
   */
  isSameTimeFrame(time1, time2) {
    if (!time1 || !time2) return false;
    
    try {
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
    } catch (error) {
      console.error('시간 비교 중 오류:', error);
      return false;
    }
  }
  
  /**
   * 안전한 ID 생성 - HTML/CSS에서 사용 가능한 ID로 변환
   * @param {string} text - 원본 텍스트
   * @returns {string} - 안전한 ID
   */
  safeId(text) {
    if (!text) return '_empty_';
    
    try {
      // 영문자, 숫자, 하이픈, 언더스코어만 허용
      return text.replace(/[^a-z0-9\-_]/gi, '_')
        // 시작 문자가 숫자인 경우 앞에 '_' 추가
        .replace(/^(\d)/, '_$1')
        // 빈 문자열인 경우 '_empty_' 반환
        || '_empty_';
    } catch (error) {
      console.error('ID 생성 중 오류:', error);
      return '_error_' + Date.now();
    }
  }
  
  /**
   * 프로필 저장
   * @param {Object} displayNames - 표시 이름 객체
   * @param {Object} userProfileImages - 사용자 프로필 이미지 객체
   * @param {Object} userColors - 사용자 색상 객체
   * @param {Set} selectedUsers - 선택된 사용자 집합
   * @param {Object} extraData - 추가 데이터 (옵션)
   */
  saveProfiles(displayNames, userProfileImages, userColors, selectedUsers, extraData = {}) {
    try {
      // 기본 프로필 데이터
      const profileData = {
        displayNames: displayNames || {},
        userProfileImages: userProfileImages || {},
        userColors: userColors || {},
        // 추가 데이터 병합 (글자 크기 등)
        ...extraData
      };
      
      // 로컬 스토리지에 저장
      localStorage.setItem('chatProfiles', JSON.stringify(profileData));
      
      // 선택된 사용자 ID 배열로 변환하여 저장
      if (selectedUsers && selectedUsers instanceof Set) {
        localStorage.setItem('selectedUsers', JSON.stringify(Array.from(selectedUsers)));
      }
      
      console.log('프로필 저장 완료');
    } catch (error) {
      console.error('프로필 저장 중 오류 발생:', error);
      
      // 오류 발생 시 용량 문제일 가능성이 있으므로 용량 정보 출력
      try {
        const profilesJSON = JSON.stringify({
          displayNames: displayNames || {},
          userProfileImages: userProfileImages || {},
          userColors: userColors || {}
        });
        
        console.warn(`프로필 데이터 크기: ${(profilesJSON.length / 1024).toFixed(2)}KB`);
        
        // 로컬 스토리지 용량 확인
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          totalSize += (key.length + value.length) * 2; // UTF-16 인코딩 (2바이트)
        }
        
        console.warn(`현재 로컬 스토리지 사용량: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      } catch (e) {
        console.error('용량 정보 확인 중 오류:', e);
      }
    }
  }
  
  /**
   * 프로필 불러오기 - 오류 처리 강화
   * @returns {Object} - 프로필 정보
   */
  loadProfiles() {
    // 기본 반환 객체
    const result = {
      displayNames: {},
      userProfileImages: {},
      userColors: {},
      selectedUsers: new Set(),
      fontSize: 16 // 기본 폰트 크기
    };
    
    try {
      // 프로필 정보 불러오기
      const savedProfiles = localStorage.getItem('chatProfiles');
      if (savedProfiles) {
        const profiles = JSON.parse(savedProfiles);
        
        // 각 속성 검증 후 할당
        if (profiles.displayNames && typeof profiles.displayNames === 'object') {
          result.displayNames = profiles.displayNames;
        }
        
        if (profiles.userProfileImages && typeof profiles.userProfileImages === 'object') {
          result.userProfileImages = profiles.userProfileImages;
        }
        
        if (profiles.userColors && typeof profiles.userColors === 'object') {
          result.userColors = profiles.userColors;
        }
        
        // 추가 정보 불러오기 (폰트 크기 등)
        if (profiles.fontSize && typeof profiles.fontSize === 'number') {
          result.fontSize = profiles.fontSize;
        }
      }
      
      // 선택된 사용자 불러오기
      const savedSelectedUsers = localStorage.getItem('selectedUsers');
      if (savedSelectedUsers) {
        const userArray = JSON.parse(savedSelectedUsers);
        
        // 배열 타입 확인 후 Set으로 변환
        if (Array.isArray(userArray)) {
          result.selectedUsers = new Set(userArray);
        }
      }
      
      console.log('프로필 불러오기 완료');
    } catch (error) {
      console.error('프로필 불러오기 중 오류 발생:', error);
      
      // 로컬 스토리지 오류 시 데이터 초기화 시도
      try {
        // 손상된 데이터일 가능성이 있으므로 기본 설정으로 재설정
        this.resetLocalStorage();
      } catch (resetError) {
        console.error('로컬 스토리지 초기화 실패:', resetError);
      }
    }
    
    return result;
  }
  
  /**
   * 로컬 스토리지 초기화
   * - 손상된 데이터 복구를 위한 함수
   */
  resetLocalStorage() {
    try {
      // 채팅 관련 항목만 초기화
      localStorage.removeItem('chatProfiles');
      localStorage.removeItem('selectedUsers');
      localStorage.removeItem('highlightTags');
      localStorage.removeItem('showMyProfile');
      localStorage.removeItem('advancedSettings');
      
      console.log('로컬 스토리지 초기화 완료');
    } catch (error) {
      console.error('로컬 스토리지 초기화 중 오류:', error);
    }
  }
  
  /**
   * 테마 설정 저장
   * @param {boolean} isDarkMode - 다크 모드 여부
   */
  saveThemePreference(isDarkMode) {
    try {
      localStorage.setItem('theme-preference', isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('테마 설정 저장 중 오류:', error);
    }
  }
  
  /**
   * 테마 설정 불러오기
   * @returns {boolean} - 다크 모드 여부
   */
  loadThemePreference() {
    try {
      return localStorage.getItem('theme-preference') === 'dark';
    } catch (error) {
      console.error('테마 설정 불러오기 중 오류:', error);
      return false; // 오류 시 기본값 반환
    }
  }
  
  /**
   * 태그 강조 설정 저장
   * @param {boolean} highlightTags - 태그 강조 여부
   */
  saveTagHighlightSetting(highlightTags) {
    try {
      localStorage.setItem('highlightTags', highlightTags ? 'true' : 'false');
    } catch (error) {
      console.error('태그 강조 설정 저장 중 오류:', error);
    }
  }
  
  /**
   * 태그 강조 설정 불러오기
   * @returns {boolean} - 태그 강조 여부
   */
  loadTagHighlightSetting() {
    try {
      // 이전에 설정한 값이 없으면 기본값으로 true 반환
      const savedSetting = localStorage.getItem('highlightTags');
      return savedSetting === null ? true : savedSetting === 'true';
    } catch (error) {
      console.error('태그 강조 설정 불러오기 중 오류:', error);
      return true; // 오류 시 기본값 반환
    }
  }
  
  /**
   * 내 메시지 프로필 이미지 표시 설정 저장
   * @param {boolean} showMyProfile - 내 메시지 프로필 이미지 표시 여부
   */
  saveShowMyProfileSetting(showMyProfile) {
    try {
      localStorage.setItem('showMyProfile', showMyProfile ? 'true' : 'false');
    } catch (error) {
      console.error('프로필 이미지 표시 설정 저장 중 오류:', error);
    }
  }
  
  /**
   * 내 메시지 프로필 이미지 표시 설정 불러오기
   * @returns {boolean} - 내 메시지 프로필 이미지 표시 여부
   */
  loadShowMyProfileSetting() {
    try {
      // 이전에 설정한 값이 없으면 기본값으로 true 반환
      const savedSetting = localStorage.getItem('showMyProfile');
      return savedSetting === null ? true : savedSetting === 'true';
    } catch (error) {
      console.error('프로필 이미지 표시 설정 불러오기 중 오류:', error);
      return true; // 오류 시 기본값 반환
    }
  }
  
  /**
   * 고급 설정 저장
   * @param {Object} settings - 고급 설정 객체
   */
  saveAdvancedSettings(settings) {
    try {
      // 유효성 검사
      if (!settings || typeof settings !== 'object') {
        console.warn('저장할 설정이 유효하지 않습니다');
        return;
      }
      
      // 기본 설정과 병합
      const mergedSettings = { ...this.defaultSettings, ...settings };
      
      // 로컬 스토리지에 저장
      localStorage.setItem('advancedSettings', JSON.stringify(mergedSettings));
    } catch (error) {
      console.error('고급 설정 저장 중 오류 발생:', error);
    }
  }
  
  /**
   * 고급 설정 불러오기
   * @returns {Object} - 고급 설정 객체
   */
  loadAdvancedSettings() {
    try {
      const savedSettings = localStorage.getItem('advancedSettings');
      
      // 저장된 설정이 있으면 파싱
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // 기본 설정과 병합
        return { ...this.defaultSettings, ...parsedSettings };
      }
      
      // 저장된 설정이 없으면 기본 설정 반환
      return { ...this.defaultSettings };
    } catch (error) {
      console.error('고급 설정 불러오기 실패:', error);
      
      // 오류 시 기본 설정 반환
      return { ...this.defaultSettings };
    }
  }
  
  /**
   * 채팅 데이터 내보내기
   * - 백업용 전체 데이터 내보내기
   * @returns {Object} - 내보내기 데이터
   */
  exportAllData() {
    try {
      // 내보낼 데이터 구성
      const exportData = {
        version: '1.1.0',
        timestamp: Date.now(),
        messages: this.app.state.messages || [],
        profiles: {
          displayNames: this.app.state.displayNames || {},
          userColors: this.app.state.userColors || {},
          selectedUsers: Array.from(this.app.state.selectedUsers || [])
        },
        settings: {
          highlightTags: this.app.state.highlightTags,
          showMyProfile: this.app.state.showMyProfile,
          fontSize: this.app.state.fontSize || 16,
          darkMode: this.app.state.darkMode
        }
      };
      
      // 이미지 데이터는 양이 많아서 별도 처리 (선택적)
      if (this.app.state.userProfileImages) {
        exportData.profiles.userProfileImages = this.app.state.userProfileImages;
      }
      
      return exportData;
    } catch (error) {
      console.error('데이터 내보내기 중 오류:', error);
      return null;
    }
  }
  
  /**
   * 채팅 데이터 가져오기
   * - 백업된 데이터 복원
   * @param {Object} importData - 가져올 데이터
   * @returns {boolean} - 성공 여부
   */
  importAllData(importData) {
    try {
      // 데이터 유효성 검사
      if (!importData || typeof importData !== 'object' || !importData.version) {
        console.error('유효하지 않은 가져오기 데이터');
        return false;
      }
      
      // 버전 호환성 확인
      if (importData.version !== '1.1.0') {
        console.warn(`다른 버전(${importData.version})의 데이터, 일부 기능이 제한될 수 있습니다`);
      }
      
      // 메시지 데이터 가져오기
      if (Array.isArray(importData.messages)) {
        this.app.state.messages = importData.messages;
      }
      
      // 프로필 데이터 가져오기
      if (importData.profiles) {
        if (importData.profiles.displayNames) {
          this.app.state.displayNames = importData.profiles.displayNames;
        }
        
        if (importData.profiles.userColors) {
          this.app.state.userColors = importData.profiles.userColors;
        }
        
        if (importData.profiles.userProfileImages) {
          this.app.state.userProfileImages = importData.profiles.userProfileImages;
        }
        
        if (Array.isArray(importData.profiles.selectedUsers)) {
          this.app.state.selectedUsers = new Set(importData.profiles.selectedUsers);
        }
      }
      
      // 설정 데이터 가져오기
      if (importData.settings) {
        if (importData.settings.hasOwnProperty('highlightTags')) {
          this.app.state.highlightTags = importData.settings.highlightTags;
        }
        
        if (importData.settings.hasOwnProperty('showMyProfile')) {
          this.app.state.showMyProfile = importData.settings.showMyProfile;
        }
        
        if (importData.settings.hasOwnProperty('fontSize')) {
          this.app.state.fontSize = importData.settings.fontSize;
        }
        
        if (importData.settings.hasOwnProperty('darkMode')) {
          this.app.state.darkMode = importData.settings.darkMode;
        }
      }
      
      // 설정 저장
      this.saveProfiles(
        this.app.state.displayNames,
        this.app.state.userProfileImages,
        this.app.state.userColors,
        this.app.state.selectedUsers,
        { fontSize: this.app.state.fontSize }
      );
      
      this.saveTagHighlightSetting(this.app.state.highlightTags);
      this.saveShowMyProfileSetting(this.app.state.showMyProfile);
      this.saveThemePreference(this.app.state.darkMode);
      
      return true;
    } catch (error) {
      console.error('데이터 가져오기 중 오류:', error);
      return false;
    }
  }
}