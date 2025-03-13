/**
 * 밴드 채팅 백업 도구 - 내보내기 관리 클래스
 * 
 * 채팅 내용을 HTML 또는 텍스트 형식으로 내보내는 기능을 담당합니다.
 */

class ExportManager {
  /**
   * 내보내기 관리자 초기화
   * @param {ChatBackupApp} app - 메인 앱 인스턴스
   */
  constructor(app) {
    this.app = app;
    
    // 이미지 캐싱 시스템
    this._imageCache = {};
    this.imageCacheCounter = 0;
    
    // 내보내기 옵션 기본값
    this.exportOptions = {
      minifyOutput: true,        // HTML 출력 최소화
      processBatchSize: 100,     // 한 번에 처리할 메시지 수
      includeTimestamp: true,    // 타임스탬프 포함 여부
      imageQualityPreserve: true // 이미지 품질 보존 (영속성)
    };
  }

  /**
   * HTML 복사 메서드
   * - 채팅을 HTML 형식으로 클립보드에 복사
   * @returns {Promise<void>}
   */
  async copyHtmlToClipboard() {
    try {
      const chatContainer = document.getElementById('chat-container');
      if (!chatContainer || !chatContainer.innerHTML) {
        alert('먼저 채팅을 변환해주세요!');
        return;
      }
      
      // 이미 처리 중이면 중복 실행 방지
      if (this.app.state.isProcessing) {
        console.log('이미 처리 중입니다.');
        return;
      }
      
      // 참여자 수 검증
      const MAX_USERS = this.app.MAX_USERS;
      const uniqueUsers = new Set(this.app.state.messages.map(msg => msg.username));
      if (uniqueUsers.size >= MAX_USERS + 1) {
        alert(`대화 참여자가 ${uniqueUsers.size}명입니다. 최대 ${MAX_USERS}명까지만 지원됩니다.`);
        return;
      }
      
      // 처리 중 상태 표시
      this.app.state.isProcessing = true;
      this._showLoadingStatus('채팅 내용을 복사 중입니다...');
      
      // 이미지 최적화 적용 (내보내기 전)
      this._updateStatus('이미지 최적화 중...');
      await this._optimizeImages();
      
      // HTML 생성
      this._updateStatus('HTML 생성 중...');
      const fullHtml = await this._generateExportHtml(true); // 클립보드용 압축
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(fullHtml);
      
      // 상태 메시지 표시
      this._updateStatus('채팅이 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('복사 중 오류 발생:', error);
      alert('복사 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 처리 중 상태 해제
      this._hideLoadingStatus();
      this.app.state.isProcessing = false;
    }
  }
  
  /**
   * HTML 파일 다운로드
   * - 채팅을 HTML 파일로 저장
   * @returns {Promise<void>}
   */
  async downloadHtmlFile() {
    try {
      const chatContainer = document.getElementById('chat-container');
      if (!chatContainer || !chatContainer.innerHTML) {
        alert('먼저 채팅을 변환해주세요!');
        return;
      }
      
      // 이미 처리 중이면 중복 실행 방지
      if (this.app.state.isProcessing) {
        console.log('이미 처리 중입니다.');
        return;
      }
      
      // 처리 중 상태 표시
      this.app.state.isProcessing = true;
      this._showLoadingStatus('HTML 파일로 저장 중...');
      
      // 이미지 최적화 적용 (내보내기 전)
      this._updateStatus('이미지 최적화 중...');
      await this._optimizeImages();
      
      // HTML 생성 (전체 HTML 문서)
      this._updateStatus('HTML 파일 생성 중...');
      const htmlContent = await this._generateFullHtmlDocument();
      
      // 채팅 시간 범위 추출
      const timeRange = this._getChatTimeRange();
      
      // HTML 파일 생성 및 다운로드
      this._downloadFile(
        htmlContent, 
        `채팅백업_${timeRange}.html`, 
        'text/html'
      );
      
      // 상태 메시지 표시
      this._updateStatus('채팅 내용이 HTML 파일로 저장되었습니다!');
    } catch (error) {
      console.error('HTML 파일 저장 중 오류 발생:', error);
      alert('HTML 다운로드 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 처리 중 상태 해제
      this._hideLoadingStatus();
      this.app.state.isProcessing = false;
    }
  }
  
  /**
   * TXT 파일 다운로드
   * - 클립보드 복사와 동일한 방식으로 TXT 파일로 저장
   * @returns {Promise<void>}
   */
  async downloadTxtFile() {
    try {
      const chatContainer = document.getElementById('chat-container');
      if (!chatContainer || !chatContainer.innerHTML) {
        alert('먼저 채팅을 변환해주세요!');
        return;
      }
      
      // 이미 처리 중이면 중복 실행 방지
      if (this.app.state.isProcessing) {
        console.log('이미 처리 중입니다.');
        return;
      }
      
      // 참여자 수 검증
      const MAX_USERS = this.app.MAX_USERS;
      const uniqueUsers = new Set(this.app.state.messages.map(msg => msg.username));
      if (uniqueUsers.size >= MAX_USERS + 1) {
        alert(`대화 참여자가 ${uniqueUsers.size}명입니다. 최대 ${MAX_USERS}명까지만 지원됩니다.`);
        return;
      }
      
      // 처리 중 상태 표시
      this.app.state.isProcessing = true;
      this._showLoadingStatus('TXT 파일로 저장 중...');
      
      // 이미지 최적화 적용 (내보내기 전)
      this._updateStatus('이미지 최적화 중...');
      await this._optimizeImages();
      
      // HTML 생성 - 클립보드 복사와 동일한 방식 사용
      this._updateStatus('HTML 생성 중...');
      const fullHtml = await this._generateExportHtml(true); // 압축된 HTML
      
      // 채팅 시간 범위 추출
      const timeRange = this._getChatTimeRange();
      
      // TXT 파일 생성 및 다운로드 (HTML 내용을 그대로 저장)
      this._downloadFile(
        fullHtml, 
        `채팅백업_${timeRange}.txt`, 
        'text/plain;charset=utf-8'
      );
      
      // 상태 메시지 표시
      this._updateStatus('채팅 내용이 TXT 파일로 저장되었습니다!');
    } catch (error) {
      console.error('TXT 파일 저장 중 오류 발생:', error);
      alert('TXT 다운로드 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 처리 중 상태 해제
      this._hideLoadingStatus();
      this.app.state.isProcessing = false;
    }
  }
  
  /**
   * 이미지 최적화 처리
   * - MediaManager를 통해 모든 사용자 이미지 최적화
   * @private
   */
  async _optimizeImages() {
    try {
      if (this.app.mediaManager && typeof this.app.mediaManager.optimizeAllUserImages === 'function') {
        await this.app.mediaManager.optimizeAllUserImages();
      } else {
        console.warn('MediaManager가 없거나 optimizeAllUserImages 함수를 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('이미지 최적화 중 오류:', error);
      // 오류가 발생해도 내보내기 계속 진행 (영속성 보장)
    }
  }
  
  /**
   * 채팅 시간 범위 추출
   * @returns {string} - "시작시간-종료시간" 형식의 문자열
   * @private
   */
  _getChatTimeRange() {
    try {
      if (!this.app.state.messages || this.app.state.messages.length === 0) {
        return this._getTimestamp(); // 메시지가 없으면 현재 시간만 반환
      }
      
      // 첫 번째 메시지와 마지막 메시지 가져오기
      const firstMessage = this.app.state.messages[0];
      const lastMessage = this.app.state.messages[this.app.state.messages.length - 1];
      
      // 시간 문자열에서 날짜 및 시간 추출
      const firstTime = this._extractFormattedTime(firstMessage.time);
      const lastTime = this._extractFormattedTime(lastMessage.time);
      
      return `${firstTime}-${lastTime}`;
    } catch (error) {
      console.error('채팅 시간 범위 추출 중 오류:', error);
      return this._getTimestamp(); // 오류 시 현재 시간만 반환
    }
  }
  
  /**
   * 시간 문자열에서 포맷된 시간 추출
   * @param {string} timeString - "2023년 3월 15일 오전 12:25" 형식의 시간 문자열
   * @returns {string} - "202303150025" 형식의 시간 문자열
   * @private
   */
  _extractFormattedTime(timeString) {
    try {
      // 시간 형식: "2023년 3월 15일 오전 12:25"
      const match = timeString.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2})/);
      
      if (!match) {
        return '';
      }
      
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      
      let hour = parseInt(match[5], 10);
      const isPM = match[4] === '오후' && hour !== 12;
      const isAM = match[4] === '오전' && hour === 12;
      
      if (isPM) {
        hour += 12;
      } else if (isAM) {
        hour = 0;
      }
      
      const hourStr = hour.toString().padStart(2, '0');
      const minute = match[6].padStart(2, '0');
      
      // 202303150025 형식으로 반환
      return `${year}${month}${day}${hourStr}${minute}`;
    } catch (error) {
      console.error('시간 추출 중 오류:', error);
      return '';
    }
  }
  
  /**
   * 내보내기용 HTML 생성
   * @param {boolean} minify - HTML 최소화 여부
   * @returns {Promise<string>} - 생성된 HTML
   * @private
   */
  async _generateExportHtml(minify = false) {
    // 현재 테마 모드 저장
    const originalDarkMode = this.app.state.darkMode;
    
    // 내보내기 시에는 항상 라이트 모드 색상 사용
    this.app.state.darkMode = false;
    
    try {
      // 사용자 이미지 맵 생성 (CSS 클래스 최적화)
      const userImageMap = await this._createUserImageMap();
      
      // CSS 스타일 생성
      const cssStyles = this._generateCssStyles(userImageMap);
      
      // 메시지 HTML 생성
      const exportMessages = await this._generateMessageHtml(userImageMap);
      
      // 폰트 사이즈가 적용된 HTML 생성
      let fullHtml = `<div style="max-width:900px;margin:0 auto;padding:20px;font-size:${this.app.state.fontSize || 16}px;">${cssStyles}${exportMessages.join('')}</div>`;
      
      // HTML 압축 (선택적)
      if (minify) {
        fullHtml = this._minifyHtml(fullHtml);
      }
      
      // 압축된 이미지 URL을 복원
      fullHtml = this._decompressAllImageUrls(fullHtml);
      
      return fullHtml;
    } finally {
      // 원래 테마 모드로 복원
      this.app.state.darkMode = originalDarkMode;
    }
  }
  
  /**
   * HTML 문서 전체 생성
   * @returns {Promise<string>} - 완전한 HTML 문서
   * @private
   */
  async _generateFullHtmlDocument() {
    // 내보내기 HTML 생성 (최소화하지 않음)
    const contentHtml = await this._generateExportHtml(false);
    
    // HTML 머리말과 본문 구성
    const htmlHeader = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>밴드 채팅 백업</title>
<style>
  body { 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    margin: 0;
    padding: 20px;
    background-color: #f8f9fa;
  }
  .chat-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
</style>
</head>
<body>
<div class="chat-container" style="font-size:${this.app.state.fontSize || 16}px;">
`;
    
    const htmlFooter = `
</div>
</body>
</html>`;
    
    // 합치기
    return htmlHeader + contentHtml + htmlFooter;
  }
  
  /**
   * 사용자 이미지 맵 생성
   * @returns {Promise<Map>} - 사용자 이름과 CSS 클래스 ID 매핑
   * @private
   */
  async _createUserImageMap() {
    const userImageMap = new Map(); // username -> CSS 클래스 ID
    let classIdCounter = 1;
    
    // 각 사용자별 메시지 개수 카운팅
    const userMessageCounts = new Map(); // username -> 메시지 수
    
    // 메시지 수 계산
    this.app.state.messages.forEach(msg => {
      const count = userMessageCounts.get(msg.username) || 0;
      userMessageCounts.set(msg.username, count + 1);
    });
    
    // 이미지가 있고 2개 이상 메시지가 있는 사용자만 CSS 클래스 할당
    for (const [username, count] of userMessageCounts.entries()) {
      if (count >= 2 && this.app.state.userProfileImages[username]) {
        userImageMap.set(username, `u${classIdCounter++}`);
      }
    }
    
    return userImageMap;
  }
  
  /**
   * CSS 스타일 생성
   * @param {Map} userImageMap - 사용자 이미지 맵
   * @returns {string} - CSS 스타일 태그
   * @private
   */
  _generateCssStyles(userImageMap) {
    let cssStyles = '<style>\n';
    
    // 사용자별 이미지 클래스 스타일 추가
    userImageMap.forEach((classId, username) => {
      const imageUrl = this.app.state.userProfileImages[username];
      if (imageUrl) {
        // 이미지 URL 압축 해제 (영속성 보장)
        const decompressedUrl = this._decompressImageUrl(imageUrl);
        cssStyles += `.${classId}{background-image:url("${decompressedUrl}");}\n`;
      }
    });
    
    cssStyles += '</style>\n';
    return cssStyles;
  }
  
  /**
   * 메시지 HTML 생성
   * @param {Map} userImageMap - 사용자 이미지 맵
   * @returns {Promise<string[]>} - 메시지 HTML 배열
   * @private
   */
  async _generateMessageHtml(userImageMap) {
    const exportMessages = [];
    
    // 메시지 그룹화와 처리
    let currentUsername = null;
    let currentTimeMinute = null;
    let messageGroup = [];
    
    const BATCH_SIZE = this.exportOptions.processBatchSize;
    const totalMessages = this.app.state.messages.length;
    
    // 배치 처리로 대용량 채팅 처리 최적화
    for (let batchStart = 0; batchStart < totalMessages; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, totalMessages);
      
      // 진행 상황 업데이트
      if (batchStart > 0) {
        this._updateStatus(`메시지 처리 중... (${batchStart}/${totalMessages})`);
      }
      
      // 현재 배치 처리
      for (let i = batchStart; i < batchEnd; i++) {
        const message = this.app.state.messages[i];
        const { username, time } = message;
        
        // 시간에서 분 단위 추출 - "2024년 1월 28일 오전 1:28" 형식 가정
        const timeMinute = this._extractTimeKey(time);
        
        if (username !== currentUsername || timeMinute !== currentTimeMinute) {
          // 새 그룹 시작 - 이전 그룹 처리
          if (messageGroup.length > 0) {
            this._processMessageGroup(messageGroup, exportMessages, userImageMap);
            messageGroup = [];
          }
          
          // 새 그룹 시작
          currentUsername = username;
          currentTimeMinute = timeMinute;
        }
        
        // 메시지를 현재 그룹에 추가
        messageGroup.push({ message, index: i });
      }
      
      // 비동기 작업 양보 (UI 응답성 유지)
      await this._yieldToMain();
    }
    
    // 마지막 그룹 처리
    if (messageGroup.length > 0) {
      this._processMessageGroup(messageGroup, exportMessages, userImageMap);
    }
    
    return exportMessages;
  }
  
  /**
   * 시간 문자열에서 키 추출
   * @param {string} time - 시간 문자열
   * @returns {string} - 추출된 시간 키
   * @private
   */
  _extractTimeKey(time) {
    const timeMatch = time.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2})/);
    return timeMatch ? `${timeMatch[1]}-${timeMatch[2]}-${timeMatch[3]}-${timeMatch[4]}-${timeMatch[5]}-${timeMatch[6]}` : null;
  }
  
  /**
   * 메시지 그룹 처리
   * @param {Array} messageGroup - 메시지 그룹 배열
   * @param {Array} exportMessages - 내보내기 메시지 배열
   * @param {Map} userImageMap - 사용자 이미지 맵
   * @private
   */
  _processMessageGroup(messageGroup, exportMessages, userImageMap) {
    // 각 메시지를 그룹 내 위치를 고려하여 처리
    messageGroup.forEach((groupMsg, groupIndex) => {
      const { message, index } = groupMsg;
      const { time, username, chatMessage } = message;
      const displayName = this.app.state.displayNames[username] || username;
      const isMyMessage = this.app.state.selectedUsers.has(username);
      
      // 프로필 이미지 처리 - 사용자별 CSS 클래스 참조
      let profileHTML = '';
      
      if (this.app.state.userProfileImages[username]) {
        // 사용자에게 할당된 CSS 클래스가 있는지 확인
        if (userImageMap && userImageMap.has(username)) {
          // CSS 클래스로 이미지 참조
          const classId = userImageMap.get(username);
          profileHTML = `<div class="${classId}" style="width:100%;height:100%;background-size:cover;background-position:center;"></div>`;
        } else {
          // CSS 클래스가 없으면 직접 이미지 URL 포함 (영속성 보장)
          const imageUrl = this.app.state.userProfileImages[username];
          const decompressedUrl = this._decompressImageUrl(imageUrl);
          profileHTML = `<div style="width:100%;height:100%;background-image:url('${decompressedUrl}');background-size:cover;background-position:center;"></div>`;
        }
      }
      
      // 그룹 내 메시지 위치
      const isFirst = groupIndex === 0;
      const isLast = groupIndex === messageGroup.length - 1;
      const isContinuous = !isFirst;
      
      // 항상 라이트 모드 색상 사용 (설정과 무관)
      const userColor = this.app.state.userColors[username] || '#000000';
      const bubbleColor = isMyMessage ? '#d8f4e7' : '#f1f1f1';
      const textColor = '#333';
      
      // 말풍선 둥근 모서리 스타일 계산
      let bubbleRadius;
      if (isLast) {
        bubbleRadius = isMyMessage ? '20px 4px 20px 20px' : '4px 20px 20px 20px';
      } else if (isContinuous) {
        bubbleRadius = isMyMessage ? '20px 4px 4px 20px' : '4px 20px 20px 4px';
      } else {
        bubbleRadius = isMyMessage ? '20px 4px 4px 20px' : '4px 20px 20px 4px';
      }
      
      // 기본 스타일 정의
      const messageContainerStyle = isMyMessage
        ? 'display:flex;flex-direction:row-reverse;justify-content:flex-start;width:100%;margin-bottom:2px;align-items:flex-start;'
        : 'display:flex;flex-direction:row;justify-content:flex-start;margin-bottom:2px;align-items:flex-start;';
      const marginStyle = isLast ? 'margin-bottom:10px;' : '';
      const wrapperStyle = isMyMessage
        ? 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-end;'
        : 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-start;';
      const usernameStyle = `font-weight:bold;margin-bottom:5px;color:${userColor};${isContinuous ? 'display:none;' : ''}`;
      const bubbleStyle = `position:relative;padding:10px 16px;border-radius:${bubbleRadius};word-break:break-word;max-width:100%;background-color:${bubbleColor};color:${textColor};font-size:${this.app.state.fontSize || 16}px;`;
      const timeStyle = `font-size:12px;color:#888;margin-top:3px;${isLast ? '' : 'display:none;'}`;
      
      // 메시지 포맷팅
      let formattedMessage = chatMessage;
      // 태그 강조 처리 (있을 경우)
      if (this.app.dataManager && typeof this.app.dataManager.formatMessageText === 'function') {
        formattedMessage = this.app.dataManager.formatMessageText(this._escapeHtml(chatMessage));
      } else {
        // 기본 HTML 이스케이프 및 줄바꿈 처리
        formattedMessage = this._escapeHtml(formattedMessage).replace(/\n/g, '<br>');
      }
      
      // 말풍선 꼬리 스타일
      let tailStyle = 'display:none;';
      if (!isContinuous) {
        tailStyle = isMyMessage
          ? `position:absolute;width:0;height:0;top:0;right:-12px;border-style:solid;border-width:0 0 14px 14px;border-color:transparent transparent transparent ${bubbleColor};`
          : `position:absolute;width:0;height:0;top:0;left:-12px;border-style:solid;border-width:0 14px 14px 0;border-color:transparent ${bubbleColor} transparent transparent;`;
      }
      
      // 내 메시지의 프로필 이미지 표시 여부
      const showMyImage = this.app.state.showMyProfile !== false;
      
      let html;
      
      if (isContinuous) {
        // 연속 메시지: 프로필 영역 결정
        if (isMyMessage && !showMyImage) {
          // 이미지 없이 메시지만 표시
          html = `<div style="${messageContainerStyle}${marginStyle}"><div style="${wrapperStyle}"><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this._escapeHtml(time)}</div></div></div>`;
        } else {
          // 일반적인 연속 메시지 (이미지 공간 보존)
          html = `<div style="${messageContainerStyle}${marginStyle}"><div style="width:40px;margin:0 10px;flex-shrink:0;"></div><div style="${wrapperStyle}"><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this._escapeHtml(time)}</div></div></div>`;
        }
      } else {
        // 첫 번째 메시지: 프로필 처리
        if (isMyMessage && !showMyImage) {
          // 내 메시지 + 이미지 숨김: 프로필 영역 없음
          html = `<div style="${messageContainerStyle}${marginStyle}"><div style="${wrapperStyle}"><div style="${usernameStyle}">${this._escapeHtml(displayName)}</div><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this._escapeHtml(time)}</div></div></div>`;
        } else {
          // 일반 메시지 또는 내 메시지 + 이미지 표시
          const profileStyle = 'width:40px;height:40px;margin:0 10px;flex-shrink:0;';
          const pictureStyle = 'width:100%;height:100%;border-radius:50%;background:#ccc;overflow:hidden;position:relative;aspect-ratio:1/1;';
          
          html = `<div style="${messageContainerStyle}${marginStyle}"><div style="${profileStyle}"><div style="${pictureStyle}">${profileHTML}</div></div><div style="${wrapperStyle}"><div style="${usernameStyle}">${this._escapeHtml(displayName)}</div><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this._escapeHtml(time)}</div></div></div>`;
        }
      }
      
      // 각 메시지를 별도의 줄에 추가
      exportMessages.push(html);
    });
  }
  
  /**
   * 이미지 URL 압축 해제
   * @param {string} imageUrl - 압축된 이미지 URL
   * @returns {string} - 압축 해제된 이미지 URL
   * @private
   */
  _decompressImageUrl(imageUrl) {
    try {
      // MediaManager를 통한 이미지 압축 해제
      if (this.app.mediaManager && typeof this.app.mediaManager.decompressImageUrl === 'function') {
        return this.app.mediaManager.decompressImageUrl(imageUrl);
      }
      
      // MediaManager가 없는 경우 기본 압축 해제 방법
      return this._decompressImageUrlFallback(imageUrl);
    } catch (error) {
      console.error('이미지 URL 압축 해제 실패:', error);
      return imageUrl; // 실패 시 원본 반환 (영속성 보장)
    }
  }
  
  /**
   * 이미지 URL 압축 해제 대체 메서드 (MediaManager 없을 경우)
   * @param {string} compressedImageUrl - 압축된 이미지 URL
   * @returns {string} - 압축 해제된 이미지 URL
   * @private
   */
  _decompressImageUrlFallback(compressedImageUrl) {
    if (!compressedImageUrl) return compressedImageUrl;
    
    try {
      // WebP 형식 처리
      if (compressedImageUrl.includes('WEBP:')) {
        return compressedImageUrl.replace('WEBP:', '');
      }
      
      // LZSTR 형식 처리
      if (compressedImageUrl.includes('LZSTR:')) {
        const [header, compressedData] = compressedImageUrl.split(',');
        const cleanCompressedData = compressedData.replace('LZSTR:', '');
        
        // LZString 라이브러리 사용 가능 여부 확인
        if (typeof LZString !== 'undefined') {
          const originalBase64 = LZString.decompressFromEncodedURIComponent(cleanCompressedData);
          return `${header},${originalBase64}`;
        }
      }
      
      // 기타 압축 형식 처리 (이전 버전 호환성)
      if (compressedImageUrl.includes('OPTIMIZE:') ||
          compressedImageUrl.includes('NOCOMPRESS:')) {
        return compressedImageUrl.replace(/(?:OPTIMIZE:|NOCOMPRESS:)/, '');
      }
      
      // 압축되지 않은 경우 원본 반환
      return compressedImageUrl;
    } catch (error) {
      console.error('이미지 URL 복원 중 오류 발생:', error);
      return compressedImageUrl; // 복원 실패 시 원본 반환 (영속성 보장)
    }
  }
  
  /**
   * HTML 내 모든 이미지 압축 해제
   * @param {string} html - 이미지가 포함된 HTML
   * @returns {string} - 이미지 압축 해제된 HTML
   * @private
   */
  _decompressAllImageUrls(html) {
    if (!html) return html;
    
    try {
      // 모듈화된 MediaManager를 사용할 수 있는 경우
      if (this.app.mediaManager && typeof this.app.mediaManager.decompressAllImages === 'function') {
        return this.app.mediaManager.decompressAllImages(html);
      }
      
      // MediaManager가 없는 경우 기본 압축 해제 방법
      return this._decompressAllImagesFallback(html);
    } catch (error) {
      console.error('HTML 내 이미지 압축 해제 중 오류:', error);
      return html; // 실패 시 원본 HTML 반환 (영속성 보장)
    }
  }
  
  /**
   * HTML 내 이미지 압축 해제 대체 메서드 (MediaManager 없을 경우)
   * @param {string} html - 이미지가 포함된 HTML
   * @returns {string} - 이미지 압축 해제된 HTML
   * @private
   */
  _decompressAllImagesFallback(html) {
    try {
      // B85 형식 처리
      html = html.replace(/data:[^,]+,B85:([^"']+)/g, (match, p1) => {
        try {
          // Base85 디코딩을 직접 구현하지 않고 원본 유지 (영속성 보장)
          return match;
        } catch (error) {
          console.error('Base85 이미지 데이터 압축 해제 실패:', error);
          return match; // 오류 시 원본 유지
        }
      });
      
      // WebP 형식 처리
      html = html.replace(/data:image\/webp,WEBP:([^"']+)/g, (match, p1) => {
        return `data:image/webp,${p1}`;
      });
      
      // LZSTR 형식 처리
      html = html.replace(/data:[^,]+,LZSTR:([^"']+)/g, (match, p1) => {
        try {
          if (typeof LZString !== 'undefined') {
            const originalBase64 = LZString.decompressFromEncodedURIComponent(p1);
            return `data:image/jpeg;base64,${originalBase64}`;
          }
          return match; // LZString이 없으면 원본 유지
        } catch (error) {
          console.error('LZString 이미지 데이터 압축 해제 실패:', error);
          return match; // 오류 시 원본 유지
        }
      });
      
      // 기타 압축 형식 처리 (이전 버전 호환성)
      html = html.replace(/data:[^,]+,(?:OPTIMIZE:|NOCOMPRESS:)([^"']+)/g, (match, p1) => {
        return `data:image/jpeg;base64,${p1}`;
      });
      
      return html;
    } catch (error) {
      console.error('이미지 압축 해제 대체 메서드 오류:', error);
      return html; // 오류 시 원본 HTML 반환 (영속성 보장)
    }
  }
  
  /**
   * HTML 최소화 (공백 및 줄바꿈 제거)
   * @param {string} html - 원본 HTML
   * @returns {string} - 최소화된 HTML
   * @private
   */
  _minifyHtml(html) {
    return html.replace(/\s+/g, ' ')
      .replace(/> </g, '><')
      .replace(/\n/g, '')
      .trim();
  }
  
  /**
   * HTML 이스케이프
   * @param {string} str - 원본 문자열
   * @returns {string} - 이스케이프된 문자열
   * @private
   */
  _escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * 파일 다운로드 핸들러
   * @param {string} content - 파일 내용
   * @param {string} filename - 파일 이름
   * @param {string} mimeType - MIME 타입
   * @private
   */
  _downloadFile(content, filename, mimeType) {
    try {
      // 다운로드용 Blob 생성
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      // 다운로드 링크 생성
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      
      // 클릭 이벤트 발생 및 정리
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('파일 다운로드 중 오류:', error);
      alert(`파일 다운로드 중 오류가 발생했습니다: ${error.message}`);
    }
  }
  
  /**
   * 로딩 상태 표시
   * @param {string} message - 표시할 메시지
   * @private
   */
  _showLoadingStatus(message) {
    if (this.app.uiManager && typeof this.app.uiManager.toggleLoadingOverlay === 'function') {
      this.app.uiManager.toggleLoadingOverlay(true, message);
    }
  }
  
  /**
   * 상태 메시지 업데이트
   * @param {string} message - 표시할 메시지
   * @private
   */
  _updateStatus(message) {
    if (this.app.uiManager && typeof this.app.uiManager.showStatusMessage === 'function') {
      this.app.uiManager.showStatusMessage(message, this.app.state?.darkMode);
    }
  }
  
  /**
   * 로딩 상태 숨김
   * @private
   */
  _hideLoadingStatus() {
    if (this.app.uiManager && typeof this.app.uiManager.toggleLoadingOverlay === 'function') {
      this.app.uiManager.toggleLoadingOverlay(false);
    }
  }
  
  /**
   * 메인 스레드에 제어권 양보 (비동기 작업 최적화)
   * @returns {Promise<void>}
   * @private
   */
  _yieldToMain() {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
  
  /**
   * 현재 타임스탬프 생성
   * @returns {string} - YYYY-MM-DD 형식의 날짜
   * @private
   */
  _getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minute}`;
  }
}