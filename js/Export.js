// /js/Export.js - 내보내기 관리 클래스

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
    }
  
    /**
     * HTML 복사
     * @returns {Promise<void>}
     */
    async copyHtmlToClipboard() {
      const chatContainer = document.getElementById('chat-container');
      if (!chatContainer || !chatContainer.innerHTML) {
        alert('먼저 채팅을 변환해주세요!');
        return;
      }
      
      // 이미 처리 중이면 중복 실행 방지
      if (this.app.state.isProcessing) {
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
      this.app.uiManager.toggleLoadingOverlay(true, '채팅 내용을 복사 중입니다...');
      
      try {
        // 이미지 최적화 적용 (내보내기 전)
        this.app.uiManager.showStatusMessage('이미지 최적화 중...', this.app.state.darkMode);
        await this.app.mediaManager.optimizeAllUserImages();
        
        // HTML 생성
        this.app.uiManager.showStatusMessage('HTML 생성 중...', this.app.state.darkMode);
        
        // 각 사용자별 이미지 분석 및 CSS 클래스 매핑 생성
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
        
        // CSS 스타일 생성 - 사용자별 이미지 클래스
        let cssStyles = '<style>\n';
        userImageMap.forEach((classId, username) => {
          const imageUrl = this.app.state.userProfileImages[username];
          if (imageUrl) {
            cssStyles += `.${classId}{background-image:url("${imageUrl}");}\n`;
          }
        });
        cssStyles += '</style>\n';
        
        const exportMessages = [];
        
        // 메시지 그룹화와 처리
        let currentUsername = null;
        let currentTimeMinute = null;
        let messageGroup = [];
        
        // 모든 메시지 처리
        for (let i = 0; i < this.app.state.messages.length; i++) {
          const message = this.app.state.messages[i];
          const { username, time } = message;
          
          // 시간에서 분 단위 추출 - "2024년 1월 28일 오전 1:28" 형식 가정
          const timeMatch = time.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2})/);
          const timeMinute = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}-${timeMatch[3]}-${timeMatch[4]}-${timeMatch[5]}-${timeMatch[6]}` : null;
          
          if (username !== currentUsername || timeMinute !== currentTimeMinute) {
            // 새 그룹 시작 - 이전 그룹 처리
            if (messageGroup.length > 0) {
              this.processMessageGroup(messageGroup, exportMessages, userImageMap);
            }
            
            // 새 그룹 시작
            currentUsername = username;
            currentTimeMinute = timeMinute;
            messageGroup = [{ message, index: i }];
          } else {
            // 같은 그룹에 메시지 추가
            messageGroup.push({ message, index: i });
          }
          
          // 대량 메시지 처리 시 진행 상황 표시 (100개 단위)
          if (i % 100 === 0 && i > 0) {
            this.app.uiManager.showStatusMessage(`메시지 처리 중... (${i}/${this.app.state.messages.length})`, this.app.state.darkMode);
          }
        }
        
        // 마지막 그룹 처리
        if (messageGroup.length > 0) {
          this.processMessageGroup(messageGroup, exportMessages, userImageMap);
        }
        
        // 폰트 사이즈가 적용된 HTML 생성
        let fullHtml = `<div style="max-width:900px;margin:0 auto;padding:20px;font-family:Arial,sans-serif;font-size:${this.app.state.fontSize || 16}px;">${cssStyles}${exportMessages.join('')}</div>`;
        
        // 줄바꿈, 불필요한 공백 제거하여 1줄로 압축
        fullHtml = fullHtml.replace(/\s+/g, ' ')
          .replace(/> </g, '><')
          .replace(/\n/g, '')
          .trim();
        
        // 압축된 이미지 URL을 복원 (HTML 복사 시에만)
        fullHtml = this.decompressAllImages(fullHtml);
        
        // 클립보드에 복사
        await navigator.clipboard.writeText(fullHtml);
        
        // 상태 메시지 표시
        this.app.uiManager.showStatusMessage('채팅이 클립보드에 복사되었습니다!', this.app.state.darkMode);
      } catch (error) {
        console.error('복사 중 오류 발생:', error);
        alert('복사 중 오류가 발생했습니다: ' + error.message);
      } finally {
        // 처리 중 상태 해제
        this.app.uiManager.toggleLoadingOverlay(false);
        this.app.state.isProcessing = false;
      }
    }
    
    /**
     * HTML 파일 다운로드
     * @returns {Promise<void>}
     */
    async downloadHtmlFile() {
      const chatContainer = document.getElementById('chat-container');
      if (!chatContainer || !chatContainer.innerHTML) {
        alert('먼저 채팅을 변환해주세요!');
        return;
      }
      
      // 이미 처리 중이면 중복 실행 방지
      if (this.app.state.isProcessing) {
        return;
      }
      
      // 처리 중 상태 표시
      this.app.state.isProcessing = true;
      this.app.uiManager.toggleLoadingOverlay(true, 'HTML 파일로 저장 중...');
      
      try {
        // 이미지 최적화 적용 (내보내기 전)
        this.app.uiManager.showStatusMessage('이미지 최적화 중...', this.app.state.darkMode);
        await this.app.mediaManager.optimizeAllUserImages();
        
        // HTML 생성
        this.app.uiManager.showStatusMessage('HTML 파일 생성 중...', this.app.state.darkMode);
        
        // 각 사용자별 이미지 분석 및 CSS 클래스 매핑 생성
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
        
        // CSS 스타일 생성 - 사용자별 이미지 클래스
        let cssStyles = '<style>\n';
        userImageMap.forEach((classId, username) => {
          const imageUrl = this.app.state.userProfileImages[username];
          if (imageUrl) {
            cssStyles += `.${classId}{background-image:url("${imageUrl}");}\n`;
          }
        });
        cssStyles += '</style>\n';
        
        const exportMessages = [];
        
        // 메시지 그룹화와 처리
        let currentUsername = null;
        let currentTimeMinute = null;
        let messageGroup = [];
        
        // 모든 메시지 처리
        for (let i = 0; i < this.app.state.messages.length; i++) {
          const message = this.app.state.messages[i];
          const { username, time } = message;
          
          // 시간에서 분 단위 추출 - "2024년 1월 28일 오전 1:28" 형식 가정
          const timeMatch = time.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2})/);
          const timeMinute = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}-${timeMatch[3]}-${timeMatch[4]}-${timeMatch[5]}-${timeMatch[6]}` : null;
          
          if (username !== currentUsername || timeMinute !== currentTimeMinute) {
            // 새 그룹 시작 - 이전 그룹 처리
            if (messageGroup.length > 0) {
              this.processMessageGroup(messageGroup, exportMessages, userImageMap);
            }
            
            // 새 그룹 시작
            currentUsername = username;
            currentTimeMinute = timeMinute;
            messageGroup = [{ message, index: i }];
          } else {
            // 같은 그룹에 메시지 추가
            messageGroup.push({ message, index: i });
          }
          
          // 대량 메시지 처리 시 진행 상황 표시 (100개 단위)
          if (i % 100 === 0 && i > 0) {
            this.app.uiManager.showStatusMessage(`메시지 처리 중... (${i}/${this.app.state.messages.length})`, this.app.state.darkMode);
          }
        }
        
        // 마지막 그룹 처리
        if (messageGroup.length > 0) {
          this.processMessageGroup(messageGroup, exportMessages, userImageMap);
        }
        
        // HTML 머리말과 본문 구성
        let htmlHeader = `<!DOCTYPE html>
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
  ${cssStyles}`;
        
        let htmlFooter = `</div>
  </body>
  </html>`;
        
        // 폰트 사이즈가 적용된 HTML 생성
        let fullHtml = htmlHeader + exportMessages.join('') + htmlFooter;
        
        // 압축된 이미지 URL을 복원 (HTML 다운로드 시에만)
        fullHtml = this.decompressAllImages(fullHtml);
        
        // HTML 파일 생성 및 다운로드
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '밴드채팅백업_' + new Date().toISOString().slice(0, 10) + '.html';
        document.body.appendChild(a);
        a.click();
        
        // 정리
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        // 상태 메시지 표시
        this.app.uiManager.showStatusMessage('채팅 내용이 HTML 파일로 저장되었습니다!', this.app.state.darkMode);
      } catch (error) {
        console.error('HTML 파일 저장 중 오류 발생:', error);
        alert('오류가 발생했습니다: ' + error.message);
      } finally {
        // 처리 중 상태 해제
        this.app.uiManager.toggleLoadingOverlay(false);
        this.app.state.isProcessing = false;
      }
    }
    
    /**
     * TXT 파일 다운로드
     * @returns {Promise<void>}
     */
    async downloadTxtFile() {
      if (!this.app.state.messages || this.app.state.messages.length === 0) {
        alert('먼저 채팅을 분석 및 변환해주세요!');
        return;
      }
      
      // 이미 처리 중이면 중복 실행 방지
      if (this.app.state.isProcessing) {
        return;
      }
      
      // 처리 중 상태 표시
      this.app.state.isProcessing = true;
      this.app.uiManager.toggleLoadingOverlay(true, 'TXT 파일로 저장 중...');
      
      try {
        // TXT 형식으로 변환
        let txtContent = '';
        const dateNow = new Date().toISOString().slice(0, 10);
        txtContent += `# 밴드 채팅 백업 (${dateNow})\n\n`;
        
        // 메시지 텍스트 형식으로 처리
        for (let i = 0; i < this.app.state.messages.length; i++) {
          const { time, username, chatMessage } = this.app.state.messages[i];
          const displayName = this.app.state.displayNames[username] || username;
          
          // 진행 상황 표시 (100개 단위)
          if (i % 100 === 0 && i > 0) {
            this.app.uiManager.showStatusMessage(`메시지 처리 중... (${i}/${this.app.state.messages.length})`, this.app.state.darkMode);
          }
          
          // TXT 형식으로 포맷팅 (원본 밴드 형식과 유사하게)
          txtContent += `${time}: ${displayName}: ${chatMessage}\n`;
        }
        
        // TXT 파일 생성 및 다운로드
        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '밴드채팅백업_' + dateNow + '.txt';
        document.body.appendChild(a);
        a.click();
        
        // 정리
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        // 상태 메시지 표시
        this.app.uiManager.showStatusMessage('채팅 내용이 TXT 파일로 저장되었습니다!', this.app.state.darkMode);
      } catch (error) {
        console.error('TXT 파일 저장 중 오류 발생:', error);
        alert('오류가 발생했습니다: ' + error.message);
      } finally {
        // 처리 중 상태 해제
        this.app.uiManager.toggleLoadingOverlay(false);
        this.app.state.isProcessing = false;
      }
    }
    
    /**
     * 메시지 그룹 처리 - 완성된 구현
     * @param {Array} messageGroup - 메시지 그룹 배열
     * @param {Array} exportMessages - 내보내기 메시지 배열
     * @param {Map} userImageMap - 사용자 이미지 맵
     */
    processMessageGroup(messageGroup, exportMessages, userImageMap) {
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
            // CSS 클래스가 없으면 직접 이미지 URL 포함
            const imageUrl = this.app.state.userProfileImages[username];
            // 이미지 URL 압축 해제 (필요한 경우)
            const decompressedUrl = typeof this.app.mediaManager !== 'undefined' && this.app.mediaManager.decompressImageUrl ? 
                                   this.app.mediaManager.decompressImageUrl(imageUrl) : imageUrl;
            profileHTML = `<div style="width:100%;height:100%;background-image:url('${decompressedUrl}');background-size:cover;background-position:center;"></div>`;
          }
        }
        
        const isFirst = groupIndex === 0;
        const isLast = groupIndex === messageGroup.length - 1;
        const isContinuous = !isFirst;
        const userColor = this.app.state.darkMode ? '#e2e8f0' : (this.app.state.userColors[username] || '#000000');
        const bubbleColor = isMyMessage
          ? (this.app.state.darkMode ? '#2d3647' : '#d8f4e7')
          : (this.app.state.darkMode ? '#4c4f56' : '#f1f1f1');
        const textColor = isMyMessage
          ? (this.app.state.darkMode ? '#e2e8f0' : '#333')
          : (this.app.state.darkMode ? '#e2e8f0' : '#333');
        
        // 말풍선 둥근 모서리 스타일 계산
        let bubbleRadius;
        if (isLast) {
          bubbleRadius = isMyMessage ? '20px 4px 20px 20px' : '4px 20px 20px 20px';
        } else if (isContinuous) {
          bubbleRadius = isMyMessage ? '20px 4px 4px 20px' : '4px 20px 20px 4px';
        } else {
          bubbleRadius = isMyMessage ? '20px 4px 4px 20px' : '4px 20px 20px 4px';
        }
        
        // 폰트 사이즈를 포함한 기본 스타일
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
          formattedMessage = this.app.dataManager.formatMessageText(this.escapeHtml(chatMessage));
        } else {
          // 기본 HTML 이스케이프 및 줄바꿈 처리
          formattedMessage = this.escapeHtml(formattedMessage).replace(/\n/g, '<br>');
        }
        
        // 말풍선 꼬리 스타일
        let tailStyle = 'display:none;';
        if (!isContinuous) {
          tailStyle = isMyMessage
            ? `position:absolute;width:0;height:0;top:0;right:-8px;border-style:solid;border-width:0 0 8px 8px;border-color:transparent transparent transparent ${bubbleColor};`
            : `position:absolute;width:0;height:0;top:0;left:-8px;border-style:solid;border-width:0 8px 8px 0;border-color:transparent ${bubbleColor} transparent transparent;`;
        }
        
        // 내 메시지의 프로필 이미지 표시 여부
        const showMyImage = this.app.state.showMyProfile !== false;
        
        let html;
        
        if (isContinuous) {
          // 연속 메시지: 프로필 영역 결정
          if (isMyMessage && !showMyImage) {
            // 이미지 없이 메시지만 표시
            html = `<div style="${messageContainerStyle}${marginStyle}"><div style="${wrapperStyle}"><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this.escapeHtml(time)}</div></div></div>`;
          } else {
            // 일반적인 연속 메시지 (이미지 공간 보존)
            html = `<div style="${messageContainerStyle}${marginStyle}"><div style="width:40px;margin:0 10px;flex-shrink:0;"></div><div style="${wrapperStyle}"><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this.escapeHtml(time)}</div></div></div>`;
          }
        } else {
          // 첫 번째 메시지: 프로필 처리
          if (isMyMessage && !showMyImage) {
            // 내 메시지 + 이미지 숨김: 프로필 영역 없음
            html = `<div style="${messageContainerStyle}${marginStyle}"><div style="${wrapperStyle}"><div style="${usernameStyle}">${this.escapeHtml(displayName)}</div><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this.escapeHtml(time)}</div></div></div>`;
          } else {
            // 일반 메시지 또는 내 메시지 + 이미지 표시
            const profileStyle = 'width:40px;height:40px;margin:0 10px;flex-shrink:0;';
            const pictureStyle = 'width:100%;height:100%;border-radius:50%;background:#ccc;overflow:hidden;position:relative;aspect-ratio:1/1;';
            
            html = `<div style="${messageContainerStyle}${marginStyle}"><div style="${profileStyle}"><div style="${pictureStyle}">${profileHTML}</div></div><div style="${wrapperStyle}"><div style="${usernameStyle}">${this.escapeHtml(displayName)}</div><div style="${bubbleStyle}"><div style="${tailStyle}"></div>${formattedMessage}</div><div style="${timeStyle}">${this.escapeHtml(time)}</div></div></div>`;
          }
        }
        
        // 각 메시지를 별도의 줄에 추가
        exportMessages.push(html);
      });
    }
    
    /**
     * HTML 이스케이프
     * @param {string} str - 원본 문자열
     * @returns {string} - 이스케이프된 문자열
     */
    escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    /**
     * HTML 내 이미지 압축 해제 - Media.js의 decompressAllImages 대체
     * @param {string} html - 이미지가 포함된 HTML
     * @returns {string} - 이미지 압축 해제된 HTML
     */
    decompressAllImages(html) {
      if (!html) return html;
      
      try {
        // 모듈화된 MediaManager를 사용할 수 있는 경우
        if (this.app.mediaManager && typeof this.app.mediaManager.decompressAllImages === 'function') {
          return this.app.mediaManager.decompressAllImages(html);
        }
        
        // 레거시 방식 구현 (백업)
        // B85 형식 처리
        html = html.replace(/data:[^,]+,B85:([^"']+)/g, (match, p1) => {
          try {
            // 여기서는 Base85 디코딩을 직접 구현하지 않고, 원본 반환
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
            // LZString 전역 객체 참조
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
        console.error('HTML 내 이미지 압축 해제 중 오류:', error);
        return html; // 실패 시 원본 HTML 반환
      }
    }
  }