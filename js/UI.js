/**
 * 밴드 채팅 백업 도구 - UI 관리 클래스
 * 
 * 이 파일은 uiManager.js, settingsPanel.js, helpTooltip.js의 기능을 통합합니다.
 */

class UIManager {
    /**
     * UI 관리자 초기화
     * @param {ChatBackupApp} app - 메인 앱 인스턴스
     */
    constructor(app) {
      this.app = app;
      
      // 설정 패널 상태
      this.isSettingsPanelOpen = false;
      
      // 도움말 시스템 초기화 상태
      this.isHelpSystemInitialized = false;
    }
    
    /**
     * 테마 초기화
     */
    initializeTheme() {
      const body = document.body;
      const statusMessage = document.getElementById('statusMessage');
      
      if (!body) return;
      
      // 테마 적용
      if (this.app.state.darkMode) {
        body.classList.add('dark');
        
        if (statusMessage) {
          statusMessage.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
          statusMessage.style.color = '#e2e8f0';
        }
      } else {
        body.classList.remove('dark');
        
        if (statusMessage) {
          statusMessage.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          statusMessage.style.color = '#333';
        }
      }
      
      // 설정 패널 초기화
      this.initSettingsPanel();
      
      // 도움말 시스템 초기화
      this.initHelpSystem();
      
      // 테마 변경 이벤트 발생
      this._dispatchThemeChangeEvent(this.app.state.darkMode);
    }
    
    /**
     * 테마 변경
     */
    toggleTheme() {
      const body = document.body;
      
      // 다크모드 상태 토글
      this.app.state.darkMode = !this.app.state.darkMode;
      
      // DOM 업데이트
      body.classList.toggle('dark');
      
      // 설정 저장
      this.app.dataManager.saveThemePreference(this.app.state.darkMode);
      
      // 상태 메시지 설정
      const statusMessage = document.getElementById('statusMessage');
      if (statusMessage) {
        statusMessage.textContent = this.app.state.darkMode ? '다크 모드로 전환되었습니다' : '라이트 모드로 전환되었습니다';
        
        // 상태 메시지 스타일 업데이트
        statusMessage.style.backgroundColor = this.app.state.darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        statusMessage.style.color = this.app.state.darkMode ? '#e2e8f0' : '#333';
      }
      
      // 메시지 다시 렌더링
      if (this.app.state.messages && this.app.state.messages.length > 0) {
        this.app.renderMessages();
      }
      
      // 상태 메시지 표시
      this.showStatusMessage(null, this.app.state.darkMode);
      
      // 설정 패널 업데이트
      this.updateSettingsPanel();
      
      // 테마 변경 이벤트 발생
      this._dispatchThemeChangeEvent(this.app.state.darkMode);
    }
    
    /**
     * 상태 메시지 표시
     */
    showStatusMessage(message, isDarkMode) {
      const statusMessage = document.getElementById('statusMessage');
      if (!statusMessage) return;
      
      // 메시지 내용 설정
      statusMessage.textContent = message || (isDarkMode ? '다크 모드로 전환되었습니다' : '라이트 모드로 전환되었습니다');
      
      // 메시지 보여주기
      statusMessage.style.display = 'block';
      
      // 애니메이션 시작 (위에서 내려옴)
      setTimeout(() => {
        statusMessage.style.opacity = '1';
        statusMessage.style.top = '10px'; // 위에서 내려온 위치
      }, 10);
      
      // 2초 후 메시지를 위로 올려서 숨기기
      setTimeout(() => {
        statusMessage.style.opacity = '0';
        statusMessage.style.top = '-50px';
        
        // 애니메이션 종료 후 숨기기
        setTimeout(() => {
          statusMessage.style.display = 'none';
        }, 500);
      }, 2000);
    }
    
    /**
     * 로딩 오버레이 표시/숨김
     */
    toggleLoadingOverlay(show, message = '처리 중...') {
      // 기존 오버레이 찾기
      let overlay = document.getElementById('loading-overlay');
      
      // 표시 요청이면서 오버레이가 없으면 생성
      if (show && !overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        const messageEl = document.createElement('div');
        messageEl.className = 'loading-message';
        messageEl.textContent = message;
        messageEl.style.color = '#fff';
        messageEl.style.marginTop = '15px';
        messageEl.style.fontSize = '16px';
        
        const content = document.createElement('div');
        content.className = 'loading-content';
        content.style.display = 'flex';
        content.style.flexDirection = 'column';
        content.style.alignItems = 'center';
        
        content.appendChild(spinner);
        content.appendChild(messageEl);
        overlay.appendChild(content);
        
        document.body.appendChild(overlay);
        
        // 애니메이션을 위한 지연 효과
        setTimeout(() => {
          overlay.style.opacity = '1';
        }, 10);
      }
      // 숨김 요청이면서 오버레이가 있으면 제거
      else if (!show && overlay) {
        overlay.style.opacity = '0';
        
        // 트랜지션 효과 후 제거
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }
    }
    
    /**
     * 메시지 렌더링
     */
    renderMessages() {
      console.log('메시지 렌더링 시작');
      
      if (!this.app.state.messages || this.app.state.messages.length === 0) {
        console.log('렌더링할 메시지가 없습니다');
        return;
      }
      
      const chatContainer = document.getElementById('chat-container');
      if (!chatContainer) {
        console.error('chat-container 요소를 찾을 수 없습니다');
        return;
      }
      
      // 글자 크기 설정
      chatContainer.style.fontSize = (this.app.state.fontSize || 16) + 'px';
      
      // 이전 스크롤 위치 저장
      const previousScrollTop = chatContainer.scrollTop;
      const previousScrollHeight = chatContainer.scrollHeight;
      
      // 메시지 그룹화 및 HTML 생성
      const messageHTML = this.generateMessagesHTML();
      
      // HTML 저장하고 화면에 출력
      chatContainer.innerHTML = messageHTML.join('');
      
      // 스크롤 위치 조정
      if (this.app.state.isFirstLoad) {
        chatContainer.scrollTop = 0;
        this.app.state.isFirstLoad = false;
      } else {
        chatContainer.scrollTop = previousScrollTop + (chatContainer.scrollHeight - previousScrollHeight);
      }
      
      console.log('메시지 렌더링 완료');
    }
    
    /**
     * 메시지 HTML 생성
     */
    generateMessagesHTML() {
      const messageHTML = [];
      
      // 사용자별 메시지 그룹화 처리
      const messageGroups = [];
      let currentGroup = [];
      let currentUsername = null;
      let currentTimeMinute = null;
      
      // 메시지 그룹화 - 동일 사용자 & 동일 분(minute) 단위 시간으로 그룹화
      for (let i = 0; i < this.app.state.messages.length; i++) {
        const message = this.app.state.messages[i];
        const { username, time } = message;
        
        // 시간에서 분 단위 추출 - "2024년 1월 28일 오전 1:28" 형식 가정
        const timeMatch = time.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2})/);
        const timeMinute = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}-${timeMatch[3]}-${timeMatch[4]}-${timeMatch[5]}-${timeMatch[6]}` : null;
        
        if (username !== currentUsername || timeMinute !== currentTimeMinute) {
          // 새 그룹 시작 - 이전 그룹 저장
          if (currentGroup.length > 0) {
            messageGroups.push({
              username: currentUsername,
              timeMinute: currentTimeMinute,
              messages: [...currentGroup]
            });
            currentGroup = [];
          }
          currentUsername = username;
          currentTimeMinute = timeMinute;
        }
        
        // 현재 그룹에 메시지 추가
        currentGroup.push({
          index: i,
          message: message
        });
      }
      
      // 마지막 그룹 처리
      if (currentGroup.length > 0) {
        messageGroups.push({
          username: currentUsername,
          timeMinute: currentTimeMinute,
          messages: [...currentGroup]
        });
      }
      
      // 각 그룹 렌더링
      for (const group of messageGroups) {
        const messages = group.messages;
        
        // 각 그룹의 메시지 처리
        for (let i = 0; i < messages.length; i++) {
          const { index, message } = messages[i];
          const isFirst = i === 0;
          const isLast = i === messages.length - 1;
          
          // 연속 메시지 여부 (첫 번째가 아닌 경우)
          const isContinuous = !isFirst;
          
          // HTML 생성
          const html = this.createMessageHTML(message, index, isContinuous, isLast);
          
          // 마지막 메시지에 .last 클래스 추가
          if (isLast) {
            // div class="chat-message mine" 또는 div class="chat-message other" 형태를 찾아서 last 추가
            const classPattern = /class="chat-message (mine|other)"/;
            const modifiedHtml = html.replace(classPattern, 'class="chat-message $1 last"');
            messageHTML.push(modifiedHtml);
          } else {
            messageHTML.push(html);
          }
        }
      }
      
      return messageHTML;
    }
    
    /**
     * 단일 메시지 HTML 생성
     */
    createMessageHTML(message, index, isContinuousMessage = false, isLastMessage = true) {
      const { time, username, chatMessage } = message;
      const displayName = this.app.state.displayNames[username] || username;
      const isMyMessage = this.app.state.selectedUsers.has(username);
      
      // 연속 메시지 여부 확인 (명시적으로 전달받은 값 사용)
      const isTrueContinuousMessage = isContinuousMessage;
      
      // 프로필 이미지 처리
      let profileImage = this.app.state.userProfileImages[username];
      let profileHTML = '';
      
      // 내 메시지의 프로필 이미지 표시 여부 확인
      const showMyImage = this.app.state.showMyProfile !== false;
      
      // 프로필 이미지 처리 로직
      if (profileImage) {
        try {
          profileHTML = `<img src="${profileImage}" alt="${this.escapeHtml(displayName)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">`;
        } catch (error) {
          console.error('이미지 URL 처리 중 오류:', error);
          profileHTML = ''; // 오류 시 빈 HTML
        }
      }

      
  // "모든 체크 해제" 버튼 이벤트 리스너 설정
  const uncheckAllBtn = document.getElementById('uncheck-all');
  if (uncheckAllBtn) {
    uncheckAllBtn.addEventListener('click', () => {
      console.log('모든 체크 해제 버튼 클릭됨');
      this.uncheckAllProfiles();
    });
  }
  
      
      const isDarkMode = this.app.state.darkMode;
      const userColor = isDarkMode ? '#e2e8f0' : (this.app.state.userColors[username] || '#000');
      
      // 메시지 스타일 설정
      const bubbleColor = isMyMessage
        ? (isDarkMode ? '#2d3647' : '#d8f4e7')
        : (isDarkMode ? '#4c4f56' : '#f1f1f1');
      
      const textColor = isMyMessage
        ? (isDarkMode ? '#e2e8f0' : '#333')
        : (isDarkMode ? '#e2e8f0' : '#333');
      
      // 말풍선 둥근 모서리 스타일 - 연속 메시지 여부와 위치에 따라 조정
      let bubbleRadius;
      if (isLastMessage) {
        // 마지막 메시지 (연속 또는 단일 메시지에 상관없이)
        bubbleRadius = isMyMessage
          ? '20px 4px 20px 20px'  // 오른쪽 상단 모서리를 살짝 둥글게
          : '4px 20px 20px 20px'; // 왼쪽 상단 모서리를 살짝 둥글게
      } else if (isTrueContinuousMessage) {
        // 연속된 메시지 중 중간 메시지
        bubbleRadius = isMyMessage
          ? '20px 4px 4px 20px'  // 오른쪽 상단+하단 모서리 살짝 둥글게
          : '4px 20px 20px 4px'; // 왼쪽 상단+하단 모서리 살짝 둥글게
      } else {
        // 연속 메시지의 첫 번째 메시지 (마지막이 아닌)
        bubbleRadius = isMyMessage
          ? '20px 4px 4px 20px'  // 오른쪽 상단+하단 모서리 살짝 둥글게
          : '4px 20px 20px 4px'; // 왼쪽 상단+하단 모서리 살짝 둥글게
      }
      
      // 기본 컨테이너 스타일
      const messageContainerStyle = isMyMessage
        ? 'display:flex;flex-direction:row-reverse;justify-content:flex-start;width:100%;margin-bottom:2px;align-items:flex-start;'
        : 'display:flex;flex-direction:row;justify-content:flex-start;margin-bottom:2px;align-items:flex-start;';
      
      // 마지막 메시지만 여백 추가
      const marginStyle = isLastMessage ? 'margin-bottom:10px;' : '';
      
      // 메시지 영역 스타일
      const wrapperStyle = isMyMessage
        ? 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-end;'
        : 'display:flex;flex-direction:column;max-width:calc(60% - 50px);align-items:flex-start;';
      
      // *** 중요 변경: 사용자 이름 표시 조건 ***
      // 연속 메시지일 경우 사용자 이름 숨김 (첫 번째 메시지만 이름 표시)
      const usernameStyle = `font-weight:bold;margin-bottom:5px;color:${userColor};${isTrueContinuousMessage ? 'display:none;' : ''}`;
      
      // 말풍선 스타일 - 포지션 상대값 추가로 꼬리가 잘리지 않게 함
      const bubbleStyle = `position:relative;padding:10px 16px;border-radius:${bubbleRadius};word-break:break-word;max-width:100%;cursor:pointer;background-color:${bubbleColor};color:${textColor};`;
      
      // *** 중요 변경: 시간 표시 조건 ***
      // 마지막 메시지만 시간 표시 (연속 메시지의 마지막 메시지)
      const timeStyle = `font-size:12px;color:#888;margin-top:3px;${isLastMessage ? '' : 'display:none;'}`;
      
      // 말풍선 꼬리 위치와 모양 - 첫 번째 메시지에만 꼬리 표시
      let tailStyle = 'display:none;'; // 기본적으로 숨김
      
      if (!isTrueContinuousMessage) {
        tailStyle = isMyMessage
          ? `position:absolute;width:0;height:0;top:0;right:-8px;border-style:solid;border-width:0 0 8px 8px;border-color:transparent transparent transparent ${bubbleColor};`
          : `position:absolute;width:0;height:0;top:0;left:-8px;border-style:solid;border-width:0 8px 8px 0;border-color:transparent ${bubbleColor} transparent transparent;`;
      }
      
      // @태그 처리 및 줄바꿈 처리
      const formattedMessage = this.app.dataManager.formatMessageText(this.escapeHtml(chatMessage));
      
      // 메시지 타입 클래스
      const messageType = isMyMessage ? "mine" : "other";
      
      // 메시지 HTML 구성 - 연속 메시지인지, 내 메시지인지, 이미지 표시 여부에 따라 다르게 구성
      let messageHtml;
      
      // 내 메시지이고 이미지 표시 설정이 꺼져 있는 경우
      if (isMyMessage && !showMyImage) {
        if (isTrueContinuousMessage) {
          // 연속된 내 메시지 (이미지 숨김)
          messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this.escapeHtml(username)}">
            <!-- 말풍선 꼬리 공간 유지 (30px, 화살표 위치/크기 감안) -->
            <div style="width:30px;margin:0;flex-shrink:0;visibility:hidden;"></div>
            <div style="${wrapperStyle}">
              <div class="message-content" style="${bubbleStyle}" onclick="window.chatApp.startEdit(${index})">
                <div style="${tailStyle}"></div>
                ${formattedMessage}
              </div>
              <div style="${timeStyle}">${this.escapeHtml(time)}</div>
            </div>
          </div>`;
        } else {
          // 첫 메시지 - 내 메시지 (이미지 숨김)
          messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this.escapeHtml(username)}">
            <!-- 말풍선 꼬리 공간 유지 (30px 여백) -->
            <div style="width:30px;margin:0;flex-shrink:0;visibility:hidden;"></div>
            <div style="${wrapperStyle}">
              <div style="${usernameStyle}">${this.escapeHtml(displayName)}</div>
              <div class="message-content" style="${bubbleStyle}" onclick="window.chatApp.startEdit(${index})">
                <div style="${tailStyle}"></div>
                ${formattedMessage}
              </div>
              <div style="${timeStyle}">${this.escapeHtml(time)}</div>
            </div>
          </div>`;
        }
      } else {
        // 상대방 메시지 또는 내 메시지이면서 이미지 표시 설정인 경우
        
        // 프로필 관련 HTML 구성
        let profileSection = '';
        
        // 일반적인 프로필 영역 생성
        const profileStyle = 'width:40px;height:40px;margin:0 10px;flex-shrink:0;';
        const pictureStyle = 'width:100%;height:100%;border-radius:50%;background:#ccc;overflow:hidden;position:relative;aspect-ratio:1/1;';
        
        // 연속 메시지일 경우 프로필 표시 조건 (공간은 유지, 이미지만 숨김)
        const profileVisibilityStyle = isTrueContinuousMessage ? 'visibility:hidden;' : '';
        
        profileSection = `<div style="${profileStyle}">
          <div style="${pictureStyle}${profileVisibilityStyle}">${profileHTML}</div>
        </div>`;
        
        if (isTrueContinuousMessage) {
          // 연속 메시지 (프로필 및 이름 숨김, 시간은 마지막에만 표시)
          messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this.escapeHtml(username)}">
            ${profileSection}
            <div style="${wrapperStyle}">
              <div class="message-content" style="${bubbleStyle}" onclick="window.chatApp.startEdit(${index})">
                <div style="${tailStyle}"></div>
                ${formattedMessage}
              </div>
              <div style="${timeStyle}">${this.escapeHtml(time)}</div>
            </div>
          </div>`;
        } else {
          // 첫 번째 메시지: 프로필 및 사용자 이름 표시
          messageHtml = `<div class="chat-message ${messageType}" style="${messageContainerStyle}${marginStyle}" data-index="${index}" data-username="${this.escapeHtml(username)}">
            ${profileSection}
            <div style="${wrapperStyle}">
              <div style="${usernameStyle}">${this.escapeHtml(displayName)}</div>
              <div class="message-content" style="${bubbleStyle}" onclick="window.chatApp.startEdit(${index})">
                <div style="${tailStyle}"></div>
                ${formattedMessage}
              </div>
              <div style="${timeStyle}">${this.escapeHtml(time)}</div>
            </div>
          </div>`;
        }
      }
      
      return messageHtml;
    }
    
    /**
     * 편집 인터페이스 생성
     */
    createEditInterface(messageDiv, currentText, index) {
      // 기존 메시지 영역을 비우고 textarea 추가
      const textarea = document.createElement('textarea');
      textarea.className = 'edit-textarea';
      textarea.value = currentText;
      messageDiv.innerHTML = ''; // 기존 내용을 지운 뒤 textarea만 넣음
      messageDiv.appendChild(textarea);
      
      // 버튼 생성 (저장, 취소, 삭제 버튼)
      const editButtonsContainer = document.createElement('div');
      editButtonsContainer.className = 'edit-buttons';
      
      const saveButton = document.createElement('button');
      saveButton.textContent = '저장';
      saveButton.className = 'save-button';
      editButtonsContainer.appendChild(saveButton);
      
      const cancelButton = document.createElement('button');
      cancelButton.textContent = '취소';
      cancelButton.className = 'cancel-button';
      editButtonsContainer.appendChild(cancelButton);
      
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '삭제';
      deleteButton.className = 'delete-button';
      editButtonsContainer.appendChild(deleteButton);
      
      // 버튼을 messageDiv 외부가 아닌 내부에 추가
      messageDiv.parentNode.appendChild(editButtonsContainer);
      
      // 외부 클릭 감지 핸들러
      const handleClickOutside = (e) => {
        const isClickInside = textarea.contains(e.target) || 
                              editButtonsContainer.contains(e.target);
        
        if (!isClickInside) {
          console.log('외부 클릭으로 편집 취소');
          this.app.cancelEdit();
          document.removeEventListener('click', handleClickOutside);
        }
      };
      
      // 다음 틱에서 이벤트 리스너 추가
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      
      // 저장 버튼 클릭 이벤트
      saveButton.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('저장 버튼 클릭');
        const newText = textarea.value.trim();
        this.app.saveEdit(index, newText);
        document.removeEventListener('click', handleClickOutside);
      });
      
      // 취소 버튼 클릭 이벤트
      cancelButton.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('취소 버튼 클릭');
        this.app.cancelEdit();
        document.removeEventListener('click', handleClickOutside);
      });
      
      // 삭제 버튼 클릭 이벤트
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('삭제 버튼 클릭');
        this.app.deleteMessage(index);
        document.removeEventListener('click', handleClickOutside);
      });
      
      // Enter (저장) / Escape (취소) 키 이벤트
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          console.log('Enter 키로 저장');
          const newText = textarea.value.trim();
          this.app.saveEdit(index, newText);
          document.removeEventListener('click', handleClickOutside);
        }
        if (e.key === 'Escape') {
          console.log('Escape 키로 취소');
          this.app.cancelEdit();
          document.removeEventListener('click', handleClickOutside);
        }
      });
      
      // textarea 클릭 시 이벤트 전파 방지
      textarea.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      // 편집 버튼 클릭 시 이벤트 전파 방지
      editButtonsContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      // textarea에 포커스
      textarea.focus();
    }
    
    /**
     * 프로필 설정 UI 생성
     */
    createProfileSettings() {
        console.log('UIManager.createProfileSettings 시작');
        
        const userProfiles = document.getElementById('user-profiles');
        if (!userProfiles) {
          console.error('user-profiles 요소를 찾을 수 없습니다');
          return;
        }
        
        // 기존 프로필 그리드 확인 및 초기화
        const existingGrid = userProfiles.querySelector('.profile-grid');
        if (existingGrid) {
          userProfiles.innerHTML = '';
        }
        
        // 유니크 유저네임 가져오기
        const usernames = new Set(this.app.state.messages.map(msg => msg.username));
        console.log(`고유 사용자 수: ${usernames.size}`);
        
        const MAX_USERS = this.app.MAX_USERS; // 최대 지원 사용자 수
        if (usernames.size > MAX_USERS) {
          alert(`대화 참여자가 ${usernames.size}명입니다. 최대 ${MAX_USERS}명까지만 지원됩니다.`);
          userProfiles.innerHTML = '';
          userProfiles.style.display = 'none';
          return;
        }
        
        // 프로필 입력 UI 생성
        userProfiles.innerHTML = `
          <div class="profile-header">
            <h3>채팅 참여자 프로필 설정</h3>
            <p class="profile-info">'내 메시지로 설정' 버튼을 클릭하면 사용자의 메시지가 내 메시지로 표시됩니다. (복수 선택 가능)</p>
            <div class="profile-actions">
              <button id="reset-all-profiles" class="action-button">전체 프로필 초기화</button>
              <button id="uncheck-all" class="action-button">모든 체크 해제</button>
              <button id="select-profiles" class="action-button">선택 프로필 초기화</button>
              <button id="reset-selected-profiles" class="action-button" style="display:none;">선택 초기화</button>
              <button id="cancel-selection" class="action-button" style="display:none;">선택 취소</button>
            </div>
            <p class="upload-info">※ 이미지 삽입 시 업로드 및 변환 과정에 시간이 소요될 수 있습니다.</p>
          </div>
          <div class="profile-grid"></div>
        `;
        
        const profileGrid = userProfiles.querySelector('.profile-grid');
        if (!profileGrid) {
          console.error('profile-grid 요소를 찾을 수 없습니다');
          return;
        }
        
        console.log('프로필 카드 생성 시작');
        
        // 각 사용자별 프로필 카드 생성
        Array.from(usernames).forEach(username => {
          const profileCard = this.createProfileCard(username);
          
          if (profileCard) {
            profileGrid.appendChild(profileCard);
          }
        });
        
        // 프로필 숨김 방지
        userProfiles.style.display = 'block';
        userProfiles.style.visibility = 'visible';
        userProfiles.style.opacity = '1';
        
        // 전체 프로필 초기화 버튼 이벤트
        const resetAllBtn = document.getElementById('reset-all-profiles');
        if (resetAllBtn) {
          resetAllBtn.addEventListener('click', () => {
            console.log('전체 프로필 초기화 버튼 클릭됨');
            this.resetAllProfiles();
          });
        }
        
        // 모든 체크 해제 버튼 이벤트 - 수정됨
        const uncheckAllBtn = document.getElementById('uncheck-all');
        if (uncheckAllBtn) {
          uncheckAllBtn.addEventListener('click', () => {
            console.log('모든 체크 해제 버튼 클릭됨');
            this.uncheckAllProfiles();
          });
        }
        
        // 선택 프로필 초기화 관련 버튼 이벤트
        const selectProfilesBtn = document.getElementById('select-profiles');
        const resetSelectedBtn = document.getElementById('reset-selected-profiles');
        const cancelSelectionBtn = document.getElementById('cancel-selection');
        
        if (selectProfilesBtn) {
          selectProfilesBtn.addEventListener('click', () => {
            console.log('선택 프로필 초기화 버튼 클릭됨');
            this.toggleProfileSelectionMode(true);
          });
        }
        
        if (resetSelectedBtn) {
          resetSelectedBtn.addEventListener('click', () => {
            console.log('선택 초기화 버튼 클릭됨');
            this.resetSelectedProfiles();
          });
        }
        
        if (cancelSelectionBtn) {
          cancelSelectionBtn.addEventListener('click', () => {
            console.log('선택 취소 버튼 클릭됨');
            this.toggleProfileSelectionMode(false);
          });
        }
        
        console.log('UIManager.createProfileSettings 완료');
      }
    
    /**
     * 프로필 카드 생성
     */
    createProfileCard(username) {
      if (!username) {
        console.error('사용자명이 제공되지 않았습니다');
        return null;
      }
      
      const div = document.createElement('div');
      div.className = 'user-profile-card';
      div.dataset.username = username;
      
      // 선택용 체크박스 추가 (초기에는 숨김)
      const selectCheckbox = document.createElement('input');
      selectCheckbox.type = 'checkbox';
      selectCheckbox.className = 'profile-select-checkbox';
      selectCheckbox.title = '선택하여 초기화';
      selectCheckbox.style.display = 'none'; // 초기에는 숨김
      
      // 체크박스를 카드의 왼쪽 상단에 위치시키기
      selectCheckbox.style.position = 'absolute';
      selectCheckbox.style.top = '8px';
      selectCheckbox.style.left = '8px';
      selectCheckbox.style.zIndex = '2';
      
      // 체크박스 이벤트 - 선택 시 카드 시각적 표시
      selectCheckbox.addEventListener('change', () => {
        if (selectCheckbox.checked) {
          div.classList.add('selected-for-reset');
        } else {
          div.classList.remove('selected-for-reset');
        }
      });
      
      div.appendChild(selectCheckbox);
      
      // "내 메시지" 여부 (체크박스 대신 버튼 사용)
      const isMyMessage = this.app.state.selectedUsers.has(username);
      if (isMyMessage) {
        div.classList.add('is-my-message');
      }
      
      // 프로필 사진 미리보기
      const preview = document.createElement('div');
      preview.className = 'profile-preview';
      
      // 저장된 이미지가 있다면 표시
      if (this.app.state.userProfileImages[username]) {
        // 이미지 URL 처리
        try {
          const displayUrl = this.app.mediaManager.decompressImageUrl(this.app.state.userProfileImages[username]);
          const img = document.createElement('img');
          img.src = displayUrl;
          preview.appendChild(img);
        } catch (error) {
          console.error(`이미지 URL 처리 중 오류: ${username}`, error);
        }
      }
      
      // 이름 컨테이너
      const nameContainer = document.createElement('div');
      nameContainer.className = 'name-container';
      
      // 표시 이름 입력
      const displayInput = document.createElement('input');
      displayInput.type = 'text';
      displayInput.value = this.app.state.displayNames[username] || username;
      displayInput.className = 'display-name-input';
      displayInput.placeholder = '표시 이름 입력';
      
      // 색상 선택기
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = this.app.state.userColors[username] || '#000000';
      colorInput.className = 'color-picker';
      colorInput.title = '이름 색상 선택';
      
      // 원래 이름 표시
      const originalName = document.createElement('span');
      originalName.className = 'original-name';
      originalName.textContent = `(${username})`;
      
      // 내 메시지로 설정/해제 버튼 추가
      const myUserButton = document.createElement('button');
      myUserButton.className = 'my-user-button';
      myUserButton.textContent = isMyMessage ? '내 메시지 해제' : '내 메시지로 설정';
      myUserButton.style.backgroundColor = isMyMessage ? '#f56565' : '#4a90e2';
      myUserButton.style.color = 'white';
      
      // 내 사용자 버튼 클릭 이벤트
      myUserButton.addEventListener('click', () => {
        const isCurrentlySelected = this.app.state.selectedUsers.has(username);
        
        if (isCurrentlySelected) {
          this.app.state.selectedUsers.delete(username);
          div.classList.remove('is-my-message');
          myUserButton.textContent = '내 메시지로 설정';
          myUserButton.style.backgroundColor = '#4a90e2';
        } else {
          this.app.state.selectedUsers.add(username);
          div.classList.add('is-my-message');
          myUserButton.textContent = '내 메시지 해제';
          myUserButton.style.backgroundColor = '#f56565';
        }
        
        // 선택 상태 저장
        this.app.dataManager.saveProfiles(
          this.app.state.displayNames,
          this.app.state.userProfileImages,
          this.app.state.userColors,
          this.app.state.selectedUsers
        );
        
        // 메시지 다시 렌더링
        this.app.renderMessages();
      });
      
      // 파일 입력 - 안전한 ID 사용
      const safeID = this.app.dataManager.safeId(username);
      
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/jpeg,image/jpg,image/png,image/webp';
      fileInput.id = `file-${safeID}`;
      fileInput.className = 'profile-file-input';
      
      const fileLabel = document.createElement('label');
      fileLabel.htmlFor = `file-${safeID}`;
      fileLabel.className = 'file-input-label';
      fileLabel.innerHTML = '<i class="fas fa-upload"></i> 이미지 선택';
      
      // 요소들을 이름 컨테이너에 추가
      nameContainer.append(displayInput, colorInput, originalName, myUserButton);
      
      // 이미지 컨테이너 (프로필 미리보기와 파일 입력 포함)
      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      imageContainer.append(preview, fileInput, fileLabel);
      
      // 초기화 버튼 (×)
      const resetBtn = document.createElement('button');
      resetBtn.className = 'profile-reset-btn';
      resetBtn.innerHTML = '×';
      resetBtn.title = '프로필 초기화';
      resetBtn.onclick = () => {
        console.log(`프로필 초기화 버튼 클릭: ${username}`);
        if (confirm(`${username}의 프로필을 초기화하시겠습니까?`)) {
          this.resetProfile(username);
        }
      };
      
      // 이벤트 리스너 - 파일 업로드
      fileInput.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          const file = e.target.files[0];
          
          // 이미지 처리
          try {
            const processedImageUrl = await this.app.mediaManager.processUploadedImage(file, preview);
            
            // 성공 시 이미지 데이터 저장
            this.app.state.userProfileImages[username] = processedImageUrl;
            
            // 프로필 저장
            this.app.dataManager.saveProfiles(
              this.app.state.displayNames,
              this.app.state.userProfileImages,
              this.app.state.userColors,
              this.app.state.selectedUsers
            );
            
            // 메시지 다시 렌더링
            this.app.renderMessages();
          } catch (error) {
            console.error('이미지 처리 중 오류:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
          }
        }
      });
      
      // 이벤트 리스너 - 표시 이름 변경
      displayInput.addEventListener('change', () => {
        this.app.state.displayNames[username] = displayInput.value;
        
        // 프로필 저장
        this.app.dataManager.saveProfiles(
          this.app.state.displayNames,
          this.app.state.userProfileImages,
          this.app.state.userColors,
          this.app.state.selectedUsers
        );
        
        // 메시지 다시 렌더링
        this.app.renderMessages();
      });
      
      // 이벤트 리스너 - 색상 변경
      colorInput.addEventListener('change', () => {
        this.app.state.userColors[username] = colorInput.value;
        
        // 프로필 저장
        this.app.dataManager.saveProfiles(
          this.app.state.displayNames,
          this.app.state.userProfileImages,
          this.app.state.userColors,
          this.app.state.selectedUsers
        );
        
        // 메시지 다시 렌더링
        this.app.renderMessages();
      });
      
      // 프로필 카드 조립
      div.append(imageContainer, nameContainer, resetBtn);
      
      // 드래그 앤 드롭 설정
      this.app.mediaManager.setupDragAndDrop(
        div,
        preview,
        (processedImageUrl) => {
          this.app.state.userProfileImages[username] = processedImageUrl;
          
          // 프로필 저장
          this.app.dataManager.saveProfiles(
            this.app.state.displayNames,
            this.app.state.userProfileImages,
            this.app.state.userColors,
            this.app.state.selectedUsers
          );
          
          // 메시지 다시 렌더링
          this.app.renderMessages();
        }
      );
      
      return div;
    }
    
    /**
     * 프로필 선택 모드 토글
     */
    // 선택 모드 토글 시 모든 체크 해제 버튼 표시/숨김 추가
  toggleProfileSelectionMode(enable) {
    const selectButton = document.getElementById('select-profiles');
    const resetSelectedButton = document.getElementById('reset-selected-profiles');
    const cancelSelectionButton = document.getElementById('cancel-selection');
    const uncheckAllButton = document.getElementById('uncheck-all'); // 추가된 버튼
    
    const checkboxes = document.querySelectorAll('.profile-select-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.style.display = enable ? 'block' : 'none';
      checkbox.checked = false;
    });
    
    const cards = document.querySelectorAll('.user-profile-card');
    cards.forEach(card => {
      card.classList.remove('selected-for-reset');
    });
    
    selectButton.style.display = enable ? 'none' : 'block';
    resetSelectedButton.style.display = enable ? 'block' : 'none';
    cancelSelectionButton.style.display = enable ? 'block' : 'none';
    
    // 추가: 모든 체크 해제 버튼 토글
    if (uncheckAllButton) {
      uncheckAllButton.style.display = enable ? 'none' : 'block';
    }
  }
    
    /**
     * 선택된 프로필 초기화
     */
    resetSelectedProfiles() {
      // 선택된 체크박스 찾기
      const selectedCheckboxes = document.querySelectorAll('.profile-select-checkbox:checked');
      
      if (selectedCheckboxes.length === 0) {
        this.showStatusMessage('초기화할 프로필을 선택해주세요.', this.app.state.darkMode);
        return;
      }
      
      if (confirm(`선택한 ${selectedCheckboxes.length}개의 프로필을 초기화하시겠습니까?`)) {
        let resetCount = 0;
        selectedCheckboxes.forEach(checkbox => {
          const card = checkbox.closest('.user-profile-card');
          if (card) {
            const username = card.dataset.username;
            if (username) {
              // 프로필 초기화
              delete this.app.state.userProfileImages[username];
              delete this.app.state.userColors[username];
              this.app.state.displayNames[username] = username;
              
              // 내 메시지 상태는 유지
              const isMyMessage = this.app.state.selectedUsers.has(username);
              
              // UI 업데이트
              const preview = card.querySelector('.profile-preview');
              if (preview) preview.innerHTML = '';
              
              const displayInput = card.querySelector('.display-name-input');
              if (displayInput) displayInput.value = username;
              
              const colorInput = card.querySelector('.color-picker');
              if (colorInput) colorInput.value = '#000000';
              
              // 체크박스 초기화
              checkbox.checked = false;
              
              // 내 메시지 버튼 업데이트
              const myUserButton = card.querySelector('.my-user-button');
              if (myUserButton) {
                myUserButton.textContent = isMyMessage ? '내 메시지 해제' : '내 메시지로 설정';
                myUserButton.style.backgroundColor = isMyMessage ? '#f56565' : '#4a90e2';
              }
              
              resetCount++;
            }
          }
        });
        
        // 변경사항 저장
        this.app.dataManager.saveProfiles(
          this.app.state.displayNames,
          this.app.state.userProfileImages,
          this.app.state.userColors,
          this.app.state.selectedUsers
        );
        
        // 메시지 다시 렌더링
        this.app.renderMessages();
        
        // 완료 메시지
        this.showStatusMessage(`${resetCount}개의 프로필이 초기화되었습니다.`, this.app.state.darkMode);
        
        // 선택 모드 비활성화
        this.toggleProfileSelectionMode(false);
      }
    }
    
    /**
     * 단일 프로필 초기화
     */
    resetProfile(username) {
      console.log(`프로필 초기화: ${username}`);
      
      // 프로필 이미지 초기화
      delete this.app.state.userProfileImages[username];
      delete this.app.state.userColors[username];
      this.app.state.displayNames[username] = username;
      
      // 변경사항 저장
      this.app.dataManager.saveProfiles(
        this.app.state.displayNames,
        this.app.state.userProfileImages,
        this.app.state.userColors,
        this.app.state.selectedUsers
      );
      
      // 프로필 미리보기 업데이트
      const preview = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"] .profile-preview`);
      if (preview) {
        preview.innerHTML = '';
      }
      
      // 파일 입력 초기화
      const safeID = this.app.dataManager.safeId(username);
      const fileInput = document.getElementById(`file-${safeID}`);
      if (fileInput) {
        fileInput.value = '';
      }
      
      // 카드 강조 스타일 제거
      const card = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"]`);
      if (card) {
        card.classList.remove('is-my-message');
      }
      
      // 선택된 사용자에서 제거
      this.app.state.selectedUsers.delete(username);
      
      // 디스플레이 이름 입력 필드 업데이트
      const displayInput = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"] .display-name-input`);
      if (displayInput) {
        displayInput.value = username;
      }
      
      // 색상 선택기 초기화
      const colorInput = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"] .color-picker`);
      if (colorInput) {
        colorInput.value = '#000000';
      }
      
      // 메시지 다시 렌더링
      this.app.renderMessages();
    }
    
    /**
     * 모든 프로필 초기화
     */
    resetAllProfiles() {
      console.log('모든 프로필 초기화 시도');
      
      if (confirm('모든 사용자의 프로필을 초기화하시겠습니까?\n(이름, 색상, 이미지가 모두 초기화됩니다)')) {
        console.log('모든 프로필 초기화 확인');
        
        // 고유 사용자 이름 목록 가져오기 
        const usernames = new Set(this.app.state.messages.map(msg => msg.username));
        
        // 선택된 사용자 목록 비우기
        this.app.state.selectedUsers.clear();
        
        // 각 사용자별 프로필 초기화
        usernames.forEach(username => {
          // 프로필 이미지 초기화
          delete this.app.state.userProfileImages[username];
          // 사용자 색상 초기화
          delete this.app.state.userColors[username];
          // 표시 이름을 원래 이름으로 초기화
          this.app.state.displayNames[username] = username;
          
          // UI 요소 초기화
          const card = document.querySelector(`.user-profile-card[data-username="${CSS.escape(username)}"]`);
          if (card) {
            // 미리보기 이미지 초기화
            const preview = card.querySelector('.profile-preview');
            if (preview) preview.innerHTML = '';
            
            // 체크박스 초기화
            const checkbox = card.querySelector('.profile-select-checkbox');
            if (checkbox) checkbox.checked = false;
            
            // 카드 강조 스타일 제거
            card.classList.remove('is-my-message');
            
            // 이름 입력 초기화
            const displayInput = card.querySelector('.display-name-input');
            if (displayInput) displayInput.value = username;
            
            // 색상 선택기 초기화
            const colorInput = card.querySelector('.color-picker');
            if (colorInput) colorInput.value = '#000000';
            
            // 파일 입력 초기화
            const fileInput = card.querySelector('.profile-file-input');
            if (fileInput) fileInput.value = '';
            
            // 내 메시지 버튼 업데이트
            const myUserButton = card.querySelector('.my-user-button');
            if (myUserButton) {
              myUserButton.textContent = '내 메시지로 설정';
              myUserButton.style.backgroundColor = '#4a90e2';
            }
          }
        });
        
        // 변경사항 저장
        this.app.dataManager.saveProfiles(
          this.app.state.displayNames,
          this.app.state.userProfileImages,
          this.app.state.userColors,
          this.app.state.selectedUsers
        );
        
        // 메시지 다시 렌더링
        this.app.renderMessages();
        
        // 상태 메시지 표시
        this.showStatusMessage('모든 프로필이 초기화되었습니다.', this.app.state.darkMode);
      }
    }
    
    /**
     * 설정 패널 초기화
     */
    initSettingsPanel() {
      // 설정 버튼 이벤트 리스너 설정
      const settingsButton = document.getElementById('settingsButton');
      if (settingsButton) {
        settingsButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleSettingsPanel();
        });
      }
      
      // 설정 패널 생성
      this.createSettingsPanel();
      
      // 외부 클릭 이벤트 리스너 설정
      document.addEventListener('click', (e) => {
        const settingsPanel = document.getElementById('settings-panel');
        const settingsButton = document.getElementById('settingsButton');
        
        if (this.isSettingsPanelOpen && settingsPanel && settingsButton &&
            !settingsPanel.contains(e.target) &&
            !settingsButton.contains(e.target)) {
          this.toggleSettingsPanel();
        }
      });
    }
    
    /**
     * 설정 패널 생성
     */
    createSettingsPanel() {
      // 기존 패널 제거
      const existingPanel = document.getElementById('settings-panel');
      if (existingPanel) existingPanel.remove();
      
      // 설정 패널 생성
      const settingsPanel = document.createElement('div');
      settingsPanel.id = 'settings-panel';
      settingsPanel.className = 'settings-panel';
      
      // 패널 초기 상태 설정
      settingsPanel.style.display = 'none';
      settingsPanel.style.opacity = '0';
      settingsPanel.style.transform = 'translateY(10px)';
      
      // 패널 위치 설정
      const settingsButton = document.getElementById('settingsButton');
      if (settingsButton) {
        const buttonRect = settingsButton.getBoundingClientRect();
        settingsPanel.style.position = 'fixed';
        settingsPanel.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';
        settingsPanel.style.right = (window.innerWidth - buttonRect.right + buttonRect.width / 2) + 'px';
      } else {
        settingsPanel.style.position = 'fixed';
        settingsPanel.style.bottom = '70px';
        settingsPanel.style.right = '40px';
      }
      
      // 다크 모드 옵션
      const darkModeOption = this.createSettingOption(
        'dark-mode-option',
        '<i class="fas fa-moon"></i> 다크 모드',
        this.app.state.darkMode,
        (checked) => {
          if (checked !== this.app.state.darkMode) {
            this.toggleTheme();
          }
        }
      );
      
      // 태그 강조 옵션
      const tagOption = this.createSettingOption(
        'tag-highlight-option',
        '<i class="fas fa-at"></i> 태그 강조',
        this.app.state.highlightTags !== false,
        (checked) => {
          this.app.state.highlightTags = checked;
          this.app.dataManager.saveTagHighlightSetting(checked);
          
          // 고급 설정에도 저장
          const advancedSettings = this.app.dataManager.loadAdvancedSettings() || {};
          advancedSettings.highlightTags = checked;
          this.app.dataManager.saveAdvancedSettings(advancedSettings);
          
          this.app.renderMessages();
        }
      );
      
      // 내 메시지 이미지 표시 옵션
      const showMyProfileOption = this.createSettingOption(
        'show-my-profile-option',
        '<i class="fas fa-user-circle"></i> 내 메시지의 이미지 표시하기',
        this.app.state.showMyProfile !== false,
        (checked) => {
          this.app.state.showMyProfile = checked;
          this.app.dataManager.saveShowMyProfileSetting(checked);
          
          // 고급 설정에도 저장
          const advancedSettings = this.app.dataManager.loadAdvancedSettings() || {};
          advancedSettings.showMyProfile = checked;
          this.app.dataManager.saveAdvancedSettings(advancedSettings);
          
          this.app.renderMessages();
        }
      );
      
      // 글자 크기 조절 필드
      const fontSizeSection = document.createElement('div');
      fontSizeSection.className = 'font-size-section';
      
      const fontSizeLabel = document.createElement('label');
      fontSizeLabel.className = 'font-size-label';
      fontSizeLabel.textContent = '채팅 글자 크기 (px)';
      
      const fontSizeContainer = document.createElement('div');
      fontSizeContainer.className = 'font-size-container';
      
      const fontSizeInput = document.createElement('input');
      fontSizeInput.type = 'number';
      fontSizeInput.min = '12';
      fontSizeInput.max = '24';
      fontSizeInput.value = this.app.state.fontSize || '16';
      fontSizeInput.className = 'font-size-input';
      
      const defaultButton = document.createElement('button');
      defaultButton.textContent = '기본값';
      defaultButton.className = 'font-size-default-button';
      
      // 숫자 입력 필드 이벤트 처리
      fontSizeInput.addEventListener('input', (e) => {
        const fontSize = parseInt(e.target.value, 10);
        if (fontSize >= 12 && fontSize <= 24) {
          this.app.state.fontSize = fontSize;
          this.updateChatFontSize();
        }
      });
      
      // 기본값 버튼 이벤트 처리
      defaultButton.addEventListener('click', () => {
        fontSizeInput.value = '16';
        this.app.state.fontSize = 16;
        this.updateChatFontSize();
      });
      
      fontSizeContainer.appendChild(fontSizeInput);
      fontSizeContainer.appendChild(defaultButton);
      
      // 구분선 추가
      const divider = document.createElement('div');
      divider.className = 'settings-divider';
      
      // 설정 섹션 정보
      const aboutOption = document.createElement('div');
      aboutOption.className = 'settings-about';
      aboutOption.innerHTML = `
        <div class="settings-about-info">
          <i class="fas fa-info-circle"></i> 버전 정보: v1.1.0
        </div>
        <div class="settings-about-credits">
          @C2H5OH_snow
        </div>
      `;
      
      // 패널에 옵션 추가
      settingsPanel.appendChild(darkModeOption);
      settingsPanel.appendChild(tagOption);
      settingsPanel.appendChild(showMyProfileOption);
      settingsPanel.appendChild(fontSizeLabel);
      settingsPanel.appendChild(fontSizeContainer);
      settingsPanel.appendChild(divider);
      settingsPanel.appendChild(aboutOption);
      
      // 패널을 body에 추가
      document.body.appendChild(settingsPanel);
    }
    
    /**
     * 설정 옵션 생성
     */
    createSettingOption(id, label, initialState, onChange) {
      const option = document.createElement('div');
      option.className = 'settings-option';
      
      // 토글 스위치 생성
      const toggleSwitch = document.createElement('label');
      toggleSwitch.className = 'settings-switch';
      
      // 체크박스 생성
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      checkbox.checked = initialState;
      
      // 슬라이더 생성
      const slider = document.createElement('span');
      slider.className = 'settings-slider';
      
      // 라벨 생성
      const labelText = document.createElement('span');
      labelText.className = 'settings-label';
      labelText.innerHTML = label;
      
      // 상태 변경 이벤트
      checkbox.addEventListener('change', (e) => {
        if (typeof onChange === 'function') {
          onChange(e.target.checked);
        }
      });
      
      // 요소 조립
      toggleSwitch.appendChild(checkbox);
      toggleSwitch.appendChild(slider);
      
      option.appendChild(labelText);
      option.appendChild(toggleSwitch);
      
      return option;
    }
    
    /**
     * 설정 패널 토글
     */
    toggleSettingsPanel() {
      const settingsPanel = document.getElementById('settings-panel');
      const settingsButton = document.getElementById('settingsButton');
      
      if (!settingsPanel || !settingsButton) return;
      
      // 상태 토글
      this.isSettingsPanelOpen = !this.isSettingsPanelOpen;
      
      // 패널 표시/숨김
      if (this.isSettingsPanelOpen) {
        // 패널 위치 조정 - 버튼 위치 기준으로 계산
        const buttonRect = settingsButton.getBoundingClientRect();
        settingsPanel.style.position = 'fixed';
        settingsPanel.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';
        
        // 설정 패널을 더 왼쪽에 표시하여 도움말과 겹치지 않게 함
        const panelWidth = 250; // 패널 기본 너비
        const offset = 25;     // 오프셋 증가
        
        // 화면 크기에 따라 패널 위치 조정
        if (window.innerWidth <= 480) {
          // 작은 화면에서는 패널을 더 오른쪽으로 이동
          settingsPanel.style.right = (window.innerWidth - buttonRect.right + buttonRect.width + offset) + 'px';
        } else {
          // 큰 화면에서는 패널을 더 오른쪽으로 이동
          settingsPanel.style.right = (window.innerWidth - buttonRect.right + buttonRect.width + offset) + 'px';
        }
        
        // 패널 표시 애니메이션
        settingsPanel.style.display = 'block';
        setTimeout(() => {
          settingsPanel.style.opacity = '1';
          settingsPanel.style.transform = 'translateY(0)';
        }, 10);
        
        // 현재 설정 상태 업데이트
        document.getElementById('dark-mode-option').checked = this.app.state.darkMode;
        document.getElementById('tag-highlight-option').checked = this.app.state.highlightTags !== false;
        document.getElementById('show-my-profile-option').checked = this.app.state.showMyProfile !== false;
      } else {
        // 패널 숨김 애니메이션
        settingsPanel.style.opacity = '0';
        settingsPanel.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
          settingsPanel.style.display = 'none';
        }, 300);
      }
    }
    
    /**
     * 설정 패널 업데이트
     */
    updateSettingsPanel() {
      const darkModeOption = document.getElementById('dark-mode-option');
      const tagHighlightOption = document.getElementById('tag-highlight-option');
      const showMyProfileOption = document.getElementById('show-my-profile-option');
      const fontSizeInput = document.querySelector('.font-size-input');
      
      if (darkModeOption) {
        darkModeOption.checked = this.app.state.darkMode;
      }
      
      if (tagHighlightOption) {
        tagHighlightOption.checked = this.app.state.highlightTags !== false;
      }
      
      if (showMyProfileOption) {
        showMyProfileOption.checked = this.app.state.showMyProfile !== false;
      }
      
      if (fontSizeInput) {
        fontSizeInput.value = this.app.state.fontSize || 16;
      }
    }
    
    /**
     * 채팅 글자 크기 업데이트
     */
    updateChatFontSize() {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.style.fontSize = this.app.state.fontSize + 'px';
      }
      
      // 프로필, 설정 저장
      this.app.dataManager.saveProfiles(
        this.app.state.displayNames,
        this.app.state.userProfileImages,
        this.app.state.userColors,
        this.app.state.selectedUsers,
        { fontSize: this.app.state.fontSize }
      );
      
      // 메시지 다시 렌더링
      this.app.renderMessages();
    }
    
    /**
     * 도움말 시스템 초기화
     */
    initHelpSystem() {
      if (this.isHelpSystemInitialized) {
        return;
      }
      
      // 글로벌 도움말 버튼 추가
      this.addGlobalHelpButton();
      
      // 모달 컨테이너 추가
      this.createHelpModalContainer();
      
      this.isHelpSystemInitialized = true;
      console.log('도움말 시스템이 초기화되었습니다.');
    }
    
    /**
     * 글로벌 도움말 버튼 추가
     */
    addGlobalHelpButton() {
      // 기존 버튼 확인 (중복 방지)
      const existingButton = document.getElementById('global-help-button');
      if (existingButton) {
        existingButton.remove();
      }
      
      // 글로벌 도움말 버튼 생성
      const helpButton = document.createElement('button');
      helpButton.id = 'global-help-button';
      helpButton.className = 'help-button';
      helpButton.innerHTML = '<i class="fas fa-question"></i>';
      helpButton.title = '도움말';
      
      // 버튼 위치 설정 (설정 버튼의 위치 기반)
      const settingsButton = document.getElementById('settingsButton');
      if (settingsButton) {
        helpButton.style.position = 'fixed';
        helpButton.style.bottom = window.innerWidth <= 480 ? '60px' : '80px';
        helpButton.style.right = '40px';
      } else {
        helpButton.style.position = 'fixed';
        helpButton.style.bottom = window.innerWidth <= 480 ? '70px' : '80px';
        helpButton.style.right = '40px';
      }
      
      // 클릭 이벤트 - 도움말 메뉴 표시
      helpButton.addEventListener('click', () => {
        this.showHelpMenu(helpButton);
      });
      
      // body에 추가
      document.body.appendChild(helpButton);
    }
    
    /**
     * 도움말 모달 컨테이너 생성
     */
    createHelpModalContainer() {
      // 기존 컨테이너가 있으면 제거
      const existingContainer = document.getElementById('help-modal-container');
      if (existingContainer) {
        existingContainer.remove();
      }
      
      // 모달 컨테이너 생성
      const modalContainer = document.createElement('div');
      modalContainer.id = 'help-modal-container';
      modalContainer.style.display = 'none';
      modalContainer.style.position = 'fixed';
      modalContainer.style.top = '0';
      modalContainer.style.left = '0';
      modalContainer.style.width = '100%';
      modalContainer.style.height = '100%';
      modalContainer.style.backgroundColor = this.app.state.darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)';
      modalContainer.style.zIndex = '9999';
      modalContainer.style.alignItems = 'center';
      modalContainer.style.justifyContent = 'center';
      
      // 모달 창 클릭 시 닫기 (이벤트 위임)
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
          this.hideHelpModal();
        }
      });
      
      // ESC 키로 모달 닫기
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && modalContainer.style.display === 'flex') {
          this.hideHelpModal();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      // body에 추가
      document.body.appendChild(modalContainer);
    }
    
    /**
     * 도움말 메뉴 표시
     */
    showHelpMenu(button) {
      // 기존 메뉴 제거
      const existingMenu = document.getElementById('help-menu');
      if (existingMenu) {
        existingMenu.remove();
        
        // 오버레이 제거
        const overlay = document.querySelector('.help-menu-overlay');
        if (overlay) overlay.remove();
        
        return;  // 이미 표시된 메뉴가 있으면 닫기만 함
      }
      
      // 배경 반투명 효과 추가 (메뉴 이외 영역 클릭 시 닫기)
      const overlay = document.createElement('div');
      overlay.className = 'help-menu-overlay';
      overlay.addEventListener('click', () => {
        this.hideHelpMenu();
      });
      
      // 메뉴 컨테이너 생성
      const menuContainer = document.createElement('div');
      menuContainer.id = 'help-menu';
      menuContainer.className = 'help-menu';
      
      if (this.app.state.darkMode) {
        menuContainer.style.backgroundColor = '#1e293b';
        menuContainer.style.color = '#e2e8f0';
        menuContainer.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
      } else {
        menuContainer.style.backgroundColor = '#ffffff';
        menuContainer.style.color = '#333333';
        menuContainer.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.15)';
      }
      
      // 도움말 섹션 정의
      const helpSections = [
        {
          id: 'analyze',
          title: '채팅 입력 및 분석',
          tooltip: '채팅 입력 및 분석에 관한 도움말',
          content: `
            <h3>채팅 입력 및 분석</h3>
            <p>네이버 밴드에서 내보낸 채팅 내용을 불러옵니다.</p>
            
            <h4>채팅 붙여넣기:</h4>
            <ol>
              <li>밴드 채팅방에서 우측 상단 메뉴(☰) 클릭</li>
              <li>대화 설정 선택</li>
              <li>'대화 내용 내보내기' 선택</li>
              <li>다운로드 폴더에서 내보낸 채팅 파일(.txt) 확인</li>
              <li>내보낸 텍스트 전체 선택하여 복사 (Ctrl+A, Ctrl+C)</li>
              <li>입력창에 붙여넣기 (Ctrl+V)</li>
              <li>또는 입력창에 채팅 파일(.txt) 드래그 드롭 하기</li>
            </ol>
            
            <h4>채팅 분석:</h4>
            <ul>
              <li><strong>① 채팅 분석</strong> 버튼을 클릭하면 채팅을 분석하고 프로필 설정 화면을 표시합니다</li>
              <li>분석이 완료되면 각 참여자의 프로필 이미지, 이름, 색상을 설정할 수 있습니다</li>
            </ul>
  
            <h4>변환하기:</h4>
            <ul>
              <li><strong>② 변환하기</strong> 버튼을 클릭하면 설정한 채팅을 HTML 형식으로 변환합니다</li>
              <li>변환된 결과물을 미리보기로 표시합니다</li>
            </ul>
            
            <h4>HTML 복사:</h4>
            <ul>
              <li><strong>③ HTML 복사</strong> 버튼을 클릭하면 변환된 채팅을 HTML 형식으로 클립보드에 복사합니다</li>
              <li>사용자가 변형한 스타일, 이미지, 메시지 형식이 그대로 유지됩니다</li>
            </ul>
            
            <h4>초기화:</h4>
            <ul>
              <li>초기화 버튼을 클릭하면 모든 입력 내용을 삭제하고 초기 상태로 되돌립니다</li>
            </ul>
            
            <p class="help-note">💡 지원하는 최대 참여자 수: <strong>25명</strong>. 대화하는 인원수가 25명을 넘길 시 작동하지 않습니다.</p>
            <p class="help-note">💡 채팅 분석은 단순히 분석만 하며, 내용을 외부로 전송하지 않습니다.</p>
            <p class="help-note">💡 복사 전에 반드시 먼저 <strong>변환하기</strong> 버튼을 클릭해야 합니다.</p>
          `
        },
        {
          id: 'profile',
          title: '프로필 설정',
          tooltip: '채팅 참여자의 프로필을 설정합니다',
          content: `
            <h3>프로필 설정 기능</h3>
            <p>채팅 참여자의 프로필 이미지, 표시 이름, 색상 등을 설정할 수 있습니다.</p>
            
            <h4>프로필 설정 방법:</h4>
            <ul>
              <li><strong>프로필 이미지:</strong> 각 사용자 카드에서 '이미지 선택' 버튼을 클릭하거나 이미지를 드래그하여 업로드</li>
              <li><strong>표시 이름:</strong> 원하는 표시 이름을 입력 (기본값은 기존 사용자명)</li>
              <li><strong>색상 선택:</strong> 원형의 색상 선택기를 클릭 또는 터치해 사용자 이름 색상 변경</li>
              <li><strong>내 메시지 설정:</strong> "내 메시지로 설정" 버튼을 클릭하여 해당 사용자의 메시지를 내 메시지로 표시</li>
            </ul>
            
            <h4>초기화 옵션:</h4>
            <ul>
              <li><strong>개별 초기화:</strong> 각 프로필 카드 우측 상단의 × 버튼</li>
              <li><strong>전체 프로필 초기화:</strong> 모든 프로필의 설정 초기화</li>
              <li><strong>선택 프로필 초기화:</strong> 체크한 프로필의 설정 초기화</li>
            </ul>
            
            <p class="help-note">💡 변경사항은 자동으로 저장되며, 동일 브라우저에서 다음 방문 시에도 유지됩니다.</p>
            <p class="help-note">💡 설정 패널에서 '내 메시지의 이미지 표시하기' 옵션으로 내 메시지의 프로필 이미지 표시 여부를 설정할 수 있습니다.</p>
          `
        },
        {id: 'download',
            title: '파일로 저장하기',
            tooltip: '채팅 내용을 파일로 저장합니다',
            content: `
              <h3>파일로 저장하기</h3>
              <p>변환된 채팅 내용을 다양한 형식의 파일로 저장할 수 있습니다.</p>
              
              <h4>저장 가능한 파일 형식:</h4>
              <ul>
                <li><strong>HTML 파일:</strong> 웹 브라우저에서 바로 볼 수 있는 HTML 문서로 저장합니다.</li>
                <li><strong>텍스트 파일(TXT):</strong> 원본 형식과 유사한 텍스트 파일로 저장합니다.</li>
              </ul>
              
              <h4>사용 방법:</h4>
              <ol>
                <li>화면 상단의 '<strong>다운로드</strong>' 버튼을 클릭합니다.</li>
                <li>드롭다운 메뉴에서 원하는 파일 형식을 선택합니다:
                  <ul>
                    <li>'<strong>HTML로 저장</strong>' - 설정한 스타일과 이미지가 포함된 HTML 파일로 저장합니다.</li>
                    <li>'<strong>TXT로 저장</strong>' - 밴드에서 내보낸 형식과 유사한 텍스트 파일로 저장합니다.</li>
                  </ul>
                </li>
                <li>파일 저장 대화 상자가 나타나면 원하는 위치에 파일을 저장합니다.</li>
              </ol>
              
              <p class="help-note">💡 HTML 형식으로 저장할 경우 프로필 이미지와 스타일이 그대로 유지됩니다.</p>
              <p class="help-note">💡 TXT 형식으로 저장할 경우 원본 형식의 텍스트만 저장되며 이미지는 포함되지 않습니다.</p>
            `
          },
        {
          id: 'preview',
          title: '채팅 미리보기 및 편집',
          tooltip: '변환된 채팅의 미리보기 및 편집 방법',
          content: `
            <h3>채팅 미리보기 및 편집</h3>
            <p>설정한 프로필과 함께 변환된 채팅 내용을 미리보고 편집할 수 있습니다.</p>
            
            <h4>미리보기 특징:</h4>
            <ul>
              <li><strong>메시지 스타일:</strong> 일반 메시지는 왼쪽, 내 메시지는 오른쪽에 표시</li>
              <li><strong>사용자 이미지:</strong> 각 사용자에게 설정한 이미지 표시</li>
              <li><strong>@태그:</strong> 사용자 태그는 파란색으로 강조 표시(설정에서 off 가능)</li>
            </ul>
            
            <h4>메시지 편집:</h4>
            <ul>
              <li>편집하고 싶은 메시지를 클릭하면 편집 모드가 활성화됩니다</li>
              <li>내용 수정 후 저장 버튼을 클릭하거나 엔터 키를 누르세요</li>
              <li>편집을 취소하려면 취소 버튼을 클릭하거나 ESC 키, 혹은 입력창 바깥쪽을 누르세요</li>
              <li>메시지를 삭제하려면, 메시지 편집 모드에서 삭제 버튼을 클릭하세요</li>
            </ul>
            
            <p class="help-note">💡 HTML 복사 시 편집한 미리보기를 반영하여 복사됩니다.</p>
            <p class="help-note">💡 메시지 편집 후 반드시 HTML 복사 버튼을 클릭하여 결과를 저장해야 합니다.</p>
          `
        },
        {
          id: 'settings',
          title: '설정 옵션',
          tooltip: '다크 모드, 태그 강조 등 설정을 변경합니다',
          content: `
            <h3>설정 옵션</h3>
            <p>다양한 설정을 변경할 수 있습니다</p>
            
            <h4>설정 가능한 기능:</h4>
            <ul>
              <li><strong>다크 모드:</strong> 화면 테마를 밝은 색/어두운 색으로 전환합니다</li>
              <li><strong>태그 강조:</strong> @태그 강조 표시 여부를 설정합니다</li>
              <li><strong>내 메시지의 이미지 표시하기:</strong> 내 메시지로 설정된 사용자의 프로필 이미지 표시 여부를 설정합니다</li>
            </ul>
            
            <h4>설정 사용법:</h4>
            <ol>
              <li>화면 우측 하단의 설정 버튼(⚙️)을 클릭하여 설정 패널을 엽니다</li>
              <li>원하는 설정을 클릭하여 변경합니다</li>
              <li>설정은 자동으로 저장되며 즉시 적용됩니다</li>
            </ol>
            
            <p class="help-note">💡 다크 모드는 작업 환경에 영향을 주지만 최종 내보내기 결과에는 영향을 주지 않습니다.</p>
            <p class="help-note">💡 내 메시지의 이미지 표시 옵션을 끄면 내 메시지로 설정된 사용자의 프로필 이미지가 숨겨집니다. (내보내기도 동일)</p>
          `
        },
        {
          id: 'update',
          title: '업데이트 및 버전 정보',
          tooltip: '최신 업데이트 및 버전 정보',
          content: `
            <h3>업데이트 내역 및 버전 정보</h3>
            <p>업데이트 내역과 버전 정보를 확인할 수 있습니다</p>
            
            <h4>v1.1.0 최신 업데이트(25.03.13):</h4>
            <ul>
              <li>채팅 내 이미지 삽입 방식 변경</li>
              <li>통합 도움말 시스템 구현 - 모든 도움말에 한 곳에서 접근 가능</li>
              <li>디자인 개선 및 가독성 향상</li>
              <li>다크 모드에서 채팅 색상이 변하지 않던 현상 수정</li>
              <li>태그 강조 및 '내 메시지의 이미지 표시하기' 기능 추가</li>
              <li>드래그 드롭으로 txt파일 및 이미지 업로드 기능 추가</li>
              <li>선택 프로필 초기화 기능 추가 및 단일 프로필 초기화 UI 개선</li>
            </ul>
            
            <h4>v1.0.3 이전 업데이트(25.01.15):</h4>
            <ul>
              <li>초기화 전까지 내 메세지로 표현되는 사용자 기억</li>
              <li>채팅 내에서 줄바꿈 시 내용이 누락되는 현상 해결</li>
              <li>채팅 미리보기에서 편집이 되지 않는 문제 해결</li>
            </ul>
  
            <p class="help-note">💡 새로운 버전이 출시되면 자동으로 업데이트됩니다.</p>
          `
        }
      ];
      
      // 메뉴 항목 생성
      helpSections.forEach(section => {
        const menuItem = document.createElement('div');
        menuItem.className = 'help-menu-item';
        
        if (this.app.state.darkMode) {
          menuItem.style.color = '#e2e8f0';
          menuItem.style.borderBottom = '1px solid #2d3748';
        } else {
          menuItem.style.color = '#333333';
          menuItem.style.borderBottom = '1px solid #e2e8f0';
        }
        
        menuItem.innerHTML = `<i class="fas fa-info-circle" style="color: ${this.app.state.darkMode ? '#60a5fa' : '#4a90e2'};"></i> ${section.title}`;
        
        // 클릭 이벤트 - 해당 섹션 도움말 표시
        menuItem.addEventListener('click', () => {
          this.hideHelpMenu();
          this.showHelpModal(section.title, section.content);
        });
        
        menuContainer.appendChild(menuItem);
      });
      
      // body에 추가
      document.body.appendChild(overlay);
      document.body.appendChild(menuContainer);
      
      // 메뉴 위치 조정
      const buttonRect = button.getBoundingClientRect();
      menuContainer.style.position = 'fixed';
      menuContainer.style.bottom = (window.innerHeight - buttonRect.top + 10) + 'px';
      menuContainer.style.right = (window.innerWidth - buttonRect.right + buttonRect.width/2) + 'px';
      
      // 애니메이션 효과를 위한 초기 상태
      menuContainer.style.opacity = '0';
      menuContainer.style.transform = 'translateY(10px)';
      
      // 애니메이션 효과
      setTimeout(() => {
        menuContainer.style.opacity = '1';
        menuContainer.style.transform = 'translateY(0)';
      }, 10);
    }
    
    /**
     * 도움말 메뉴 숨기기
     */
    hideHelpMenu() {
      const menuContainer = document.getElementById('help-menu');
      const overlay = document.querySelector('.help-menu-overlay');
      
      if (menuContainer) {
        menuContainer.style.opacity = '0';
        menuContainer.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
          if (menuContainer.parentNode) {
            menuContainer.parentNode.removeChild(menuContainer);
          }
        }, 300);
      }
      
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }
    }
    
    /**
     * 도움말 모달 표시
     */
    showHelpModal(title, content) {
      const modalContainer = document.getElementById('help-modal-container');
      if (!modalContainer) {
        console.error('모달 컨테이너를 찾을 수 없습니다');
        return;
      }
      
      // 기존 내용 초기화
      modalContainer.innerHTML = '';
      
      // 모달 내용 생성
      const modalContent = document.createElement('div');
      modalContent.className = 'help-modal-content';
      modalContent.style.backgroundColor = this.app.state.darkMode ? '#1e293b' : '#ffffff';
      modalContent.style.color = this.app.state.darkMode ? '#e2e8f0' : '#333333';
      modalContent.style.borderRadius = '8px';
      modalContent.style.padding = '0';
      modalContent.style.maxWidth = '600px';
      modalContent.style.width = '90%';
      modalContent.style.maxHeight = '80vh';
      modalContent.style.display = 'flex';
      modalContent.style.flexDirection = 'column';
      modalContent.style.boxShadow = this.app.state.darkMode 
        ? '0 10px 25px rgba(0, 0, 0, 0.5)' 
        : '0 10px 25px rgba(0, 0, 0, 0.2)';
      modalContent.style.overflow = 'hidden';
      modalContent.style.fontFamily = 'Pretendard, -apple-system, system-ui, sans-serif';
      
      // 모달 헤더
      const modalHeader = document.createElement('div');
      modalHeader.className = 'help-modal-header';
      modalHeader.style.display = 'flex';
      modalHeader.style.alignItems = 'center';
      modalHeader.style.justifyContent = 'space-between';
      modalHeader.style.padding = '16px 20px';
      modalHeader.style.borderBottom = this.app.state.darkMode 
        ? '1px solid #2d3748' 
        : '1px solid #e2e8f0';
      
      // 모달 제목
      const modalTitle = document.createElement('h2');
      modalTitle.textContent = title;
      modalTitle.style.margin = '0';
      modalTitle.style.fontSize = '18px';
      modalTitle.style.fontWeight = '600';
      modalTitle.style.color = this.app.state.darkMode ? '#60a5fa' : '#4a90e2';
    
      // 닫기 버튼
      const closeButton = document.createElement('button');
      closeButton.className = 'help-modal-close';
      closeButton.innerHTML = '&times;';
      closeButton.style.background = 'none';
      closeButton.style.border = 'none';
      closeButton.style.color = this.app.state.darkMode ? '#e2e8f0' : '#333333';
      closeButton.style.fontSize = '24px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.padding = '0';
      closeButton.style.lineHeight = '1';
      closeButton.style.fontWeight = 'bold';
      
      closeButton.addEventListener('click', () => {
        this.hideHelpModal();
      });
      
      // 모달 본문
      const modalBody = document.createElement('div');
      modalBody.className = 'help-modal-body';
      modalBody.style.padding = '20px';
      modalBody.style.overflowY = 'auto';
      modalBody.style.maxHeight = 'calc(80vh - 70px)';
      
      // 스타일 추가 (내용의 하위 요소에 대한 스타일)
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .help-modal-body h3 {
          color: ${this.app.state.darkMode ? '#60a5fa' : '#4a90e2'};
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }
        
        .help-modal-body h4 {
          color: ${this.app.state.darkMode ? '#90cdf4' : '#3182ce'};
          margin-top: 15px;
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .help-modal-body p {
          margin-bottom: 12px;
          line-height: 1.5;
        }
        
        .help-modal-body ul, .help-modal-body ol {
          padding-left: 20px;
          margin-bottom: 12px;
        }
        
        .help-modal-body li {
          margin-bottom: 5px;
          line-height: 1.5;
        }
        
        .help-modal-body strong {
          color: ${this.app.state.darkMode ? '#f7fafc' : '#1a202c'};
          font-weight: 600;
        }
        
        .help-modal-body .help-note {
          padding: 10px;
          border-radius: 6px;
          background-color: ${this.app.state.darkMode ? 'rgba(36, 99, 235, 0.1)' : 'rgba(236, 236, 236, 0.8)'};
          margin: 15px 0;
          font-size: 14px;
        }
      `;
      
      // 내용 설정
      modalBody.innerHTML = content;
      
      // 구성 요소 조립
      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(closeButton);
      
      modalContent.appendChild(styleElement);
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      
      modalContainer.appendChild(modalContent);
      
      // 모달 표시
      modalContainer.style.display = 'flex';
      
      // 모달 표시 애니메이션
      modalContent.animate(
        [
          { opacity: 0, transform: 'translateY(-20px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 200,
          easing: 'ease-out'
        }
      );
    }
    
    /**
     * 도움말 모달 숨기기
     */
    hideHelpModal() {
      const modalContainer = document.getElementById('help-modal-container');
      if (!modalContainer) return;
      
      const modalContent = modalContainer.querySelector('.help-modal-content');
      if (!modalContent) {
        modalContainer.style.display = 'none';
        return;
      }
      
      // 닫기 애니메이션
      const closeAnimation = modalContent.animate(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-20px)' }
        ],
        {
          duration: 150,
          easing: 'ease-in'
        }
      );
      
      closeAnimation.onfinish = () => {
        modalContainer.style.display = 'none';
      };
    }
    
    /**
     * 도움말 테마 업데이트
     */
    updateHelpTheme() {
      // 글로벌 도움말 버튼 스타일 업데이트
      const helpButton = document.getElementById('global-help-button');
      if (helpButton) {
        if (this.app.state.darkMode) {
          helpButton.style.backgroundColor = '#3182ce';
          helpButton.style.color = 'white';
        } else {
          helpButton.style.backgroundColor = '#4a90e2';
          helpButton.style.color = 'white';
        }
      }
      
      // 모달 컨테이너 테마 업데이트
      const modalContainer = document.getElementById('help-modal-container');
      if (modalContainer) {
        modalContainer.style.backgroundColor = this.app.state.darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)';
      }
      
      // 현재 열려있는 메뉴 업데이트
      const helpMenu = document.getElementById('help-menu');
      if (helpMenu) {
        if (this.app.state.darkMode) {
          helpMenu.style.backgroundColor = '#1e293b';
          helpMenu.style.color = '#e2e8f0';
          helpMenu.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.3)';
        } else {
          helpMenu.style.backgroundColor = '#ffffff';
          helpMenu.style.color = '#333333';
          helpMenu.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.15)';
        }
        
        // 메뉴 항목 업데이트
        const menuItems = helpMenu.querySelectorAll('.help-menu-item');
        menuItems.forEach(item => {
          if (this.app.state.darkMode) {
            item.style.borderBottom = '1px solid #2d3748';
            item.style.color = '#e2e8f0';
          } else {
            item.style.borderBottom = '1px solid #e2e8f0';
            item.style.color = '#333333';
          }
          
          // 아이콘 색상 업데이트
          const icon = item.querySelector('i');
          if (icon) {
            icon.style.color = this.app.state.darkMode ? '#60a5fa' : '#4a90e2';
          }
        });
      }
      
      // 열려있는 모달 업데이트
      const helpModal = document.querySelector('.help-modal-content');
      if (helpModal && helpModal.parentElement.style.display === 'flex') {
        // 모달 닫기 후 다시 열기 (스타일 새로 적용)
        const title = helpModal.querySelector('.help-modal-header h2').textContent;
        const content = helpModal.querySelector('.help-modal-body').innerHTML;
        
        this.hideHelpModal();
        
        // 약간의 지연 후 다시 열기
        setTimeout(() => {
          this.showHelpModal(title, content);
        }, 200);
      }
    }
    
    /**
     * 테마 변경 이벤트 발생
     */
    _dispatchThemeChangeEvent(isDarkMode) {
      // 테마 변경 이벤트 발생
      const event = new CustomEvent('themeChanged', {
        detail: { isDarkMode: isDarkMode }
      });
      document.dispatchEvent(event);
      
      // 도움말 테마 업데이트
      this.updateHelpTheme();
    }

    
    uncheckAllProfiles() {
        console.log('모든 체크 해제 시도');
      
        if (this.app.state.selectedUsers.size === 0) {
          console.log('선택된 사용자가 없음');
          this.showStatusMessage('선택된 사용자가 없습니다.', this.app.state.darkMode);
          return;
        }
      
        if (confirm('모든 사용자의 "내 메시지" 설정을 해제하시겠습니까?')) {
          console.log('모든 체크 해제 확인됨');
      
          this.app.state.selectedUsers.clear();
      
          // 모든 카드 스타일 업데이트
          document.querySelectorAll('.user-profile-card').forEach(card => {
            card.classList.remove('is-my-message');
            const myUserButton = card.querySelector('.my-user-button');
            if (myUserButton) {
              myUserButton.textContent = '내 메시지로 설정';
              myUserButton.style.backgroundColor = '#4a90e2';
            }
          });
      
          // 변경사항 저장
          this.app.dataManager.saveProfiles(
            this.app.state.displayNames,
            this.app.state.userProfileImages,
            this.app.state.userColors,
            this.app.state.selectedUsers
          );
      
          // 메시지 다시 렌더링
          this.app.renderMessages();
      
          // 상태 메시지 표시
          this.showStatusMessage('모든 "내 메시지" 설정이 해제되었습니다.', this.app.state.darkMode);
        }
      }
  
  // UI.js에서 프로필 생성 시 버튼 추가 코드 - 누락된 "모든 체크 해제" 버튼 추가
  // userProfiles.innerHTML 설정 시 아래와 같이 수정해야 합니다:
  
  
    
    
    /**
     * HTML 이스케이프
     */
    escapeHtml(str) {
      if (!str) return '';
      return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }
  
  // DOM 로드 완료 시 이벤트 리스너 설정
  document.addEventListener('themeChanged', (e) => {
    if (window.chatApp && window.chatApp.uiManager) {
      window.chatApp.uiManager.updateHelpTheme();
    }
  });