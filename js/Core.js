/**
 * 밴드 채팅 백업 도구 - 핵심 앱 클래스
 * 
 * 이 파일은 app.js, storageManager.js의 기능을 통합하고 비동기 처리를 개선합니다.
 */

class ChatBackupApp {
    /**
     * 앱 초기화 및 상태 설정
     */
    constructor() {
      // 앱 상태 초기화
      this.state = {
        messages: [],                // 파싱된 메시지 배열
        userProfileImages: {},       // 사용자 프로필 이미지
        userColors: {},              // 사용자 이름 색상
        displayNames: {},            // 사용자 표시 이름
        selectedUsers: new Set(),    // 내 메시지로 표시할 사용자 집합
        darkMode: false,             // 다크 모드 상태
        isProcessing: false,         // 처리 중 상태
        isFirstLoad: true,           // 첫 로드 여부
        highlightTags: true,         // @태그 강조 상태
        showMyProfile: true,         // 내 메시지 프로필 이미지 표시 상태
        fontSize: 16                 // 채팅 글자 크기
      };
      
      // 관리자 클래스 인스턴스 생성
      this.uiManager = new UIManager(this);
      this.dataManager = new DataManager(this);
      this.mediaManager = new MediaManager(this);
      this.exportManager = new ExportManager(this);
      
      // 편집 상태 관리
      this.editingIndex = null;
      
      // 최대 지원 사용자 수
      this.MAX_USERS = 25;
    }
    
    /**
     * 앱 초기화 함수
     */
    async init() {
      console.log('앱 초기화 시작');
      
      try {
        // 저장된 설정 불러오기
        await this.loadSettings();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // UI 초기화
        this.uiManager.initializeTheme();
        
        console.log('앱 초기화 완료');
      } catch (error) {
        console.error('앱 초기화 중 오류 발생:', error);
      }
    }
    
    /**
     * 설정 불러오기
     */
    async loadSettings() {
      try {
        // 프로필 설정 불러오기
        const profiles = await this.dataManager.loadProfiles();
        this.state.displayNames = profiles.displayNames || {};
        this.state.userProfileImages = profiles.userProfileImages || {};
        this.state.userColors = profiles.userColors || {};
        this.state.selectedUsers = profiles.selectedUsers || new Set();
        
        // 테마 설정 불러오기
        this.state.darkMode = await this.dataManager.loadThemePreference();
        
        // 태그 강조 설정 불러오기
        this.state.highlightTags = await this.dataManager.loadTagHighlightSetting();
        
        // 내 메시지 프로필 이미지 표시 설정 불러오기
        this.state.showMyProfile = await this.dataManager.loadShowMyProfileSetting();
        
        // 글자 크기 설정 불러오기
        const savedFontSize = localStorage.getItem('chatFontSize');
        if (savedFontSize) {
          this.state.fontSize = parseInt(savedFontSize, 10);
        }
        
        // 고급 설정 불러오기
        const advancedSettings = await this.dataManager.loadAdvancedSettings();
        if (advancedSettings) {
          if (advancedSettings.hasOwnProperty('highlightTags')) {
            this.state.highlightTags = advancedSettings.highlightTags;
          }
          if (advancedSettings.hasOwnProperty('showMyProfile')) {
            this.state.showMyProfile = advancedSettings.showMyProfile;
          }
          if (advancedSettings.hasOwnProperty('fontSize')) {
            this.state.fontSize = advancedSettings.fontSize;
          }
        }
      } catch (error) {
        console.error('설정 불러오기 중 오류 발생:', error);
      }
    }
    
    // setupEventListeners 메서드에 다운로드 버튼 추가
setupEventListeners() {
    // 기존 버튼 이벤트 리스너 유지
    const buttonHandlers = {
      'analyze-btn': this.handleAnalyze.bind(this),
      'convert-btn': this.handleConvert.bind(this),
      'copy-btn': this.handleCopy.bind(this),
      'clear-btn': this.handleClear.bind(this)
    };
    
    // 기존 버튼 이벤트 등록
    Object.entries(buttonHandlers).forEach(([id, handler]) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('click', handler);
      } else {
        console.warn(`버튼 요소를 찾을 수 없음: ${id}`);
      }
    });
    
    // 다운로드 버튼 추가 (HTML에 없으면 생성)
    this.createDownloadButton();
    
    // 다운로드 드롭다운 설정
    this.setupDropdownEvents();
    
    // 입력창 드래그 앤 드롭 이벤트 설정
    this.setupDragAndDropInput();
    
    // ESC 키로 모달/드롭다운 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
        if (this.editingIndex !== null) {
          this.cancelEdit();
        }
      }
    });
    
    // 문서 클릭 시 드롭다운 닫기
    document.addEventListener('click', (e) => {
      // 드롭다운 버튼이나 메뉴가 아닌 곳을 클릭했을 때 드롭다운 닫기
      const downloadBtn = document.getElementById('download-btn');
      const downloadOptions = document.getElementById('download-options');
      
      if (downloadOptions && 
          downloadOptions.classList.contains('show') && 
          downloadBtn && 
          !downloadBtn.contains(e.target) && 
          !downloadOptions.contains(e.target)) {
        this.closeAllDropdowns();
      }
    });
  }
    
    // 다운로드 드롭다운 이벤트 설정 - 개선됨
setupDropdownEvents() {
    const downloadOptions = document.getElementById('download-options');
    const downloadBtn = document.getElementById('download-btn');
    
    // 요소가 없으면 함수 종료
    if (!downloadOptions || !downloadBtn) {
      console.warn('다운로드 옵션 또는 버튼을 찾을 수 없습니다.');
      return;
    }
    
    // HTML 및 TXT 다운로드 옵션에 이벤트 리스너 추가
    const downloadHtml = document.getElementById('download-html');
    const downloadTxt = document.getElementById('download-txt');
    
    if (downloadHtml) {
      downloadHtml.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDownloadOptions();
        this.handleHtmlDownload();
      });
    } else {
      console.warn('HTML 다운로드 옵션을 찾을 수 없습니다.');
    }
    
    if (downloadTxt) {
      downloadTxt.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDownloadOptions();
        this.handleTxtDownload();
      });
    } else {
      console.warn('TXT 다운로드 옵션을 찾을 수 없습니다.');
    }
  }
    
    // 다운로드 버튼 생성 함수 추가
createDownloadButton() {
    // 이미 존재하는지 확인
    if (document.getElementById('download-btn')) {
      return;
    }
  
    // 버튼 컨테이너 가져오기
    const buttonContainer = document.querySelector('.button-container');
    if (!buttonContainer) {
      console.warn('버튼 컨테이너를 찾을 수 없습니다.');
      return;
    }
  
    // 다운로드 버튼 생성
    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'download-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> 다운로드 <i class="fas fa-caret-down" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);"></i>';
    downloadBtn.style.position = 'relative';
    
    // 다운로드 옵션 메뉴 생성
    const downloadOptions = document.createElement('div');
    downloadOptions.id = 'download-options';
    downloadOptions.className = 'dropdown-menu';
    downloadOptions.style.display = 'none';
    downloadOptions.style.position = 'absolute';
    downloadOptions.style.backgroundColor = '#fff';
    downloadOptions.style.boxShadow = '0 8px 16px 0 rgba(0,0,0,0.2)';
    downloadOptions.style.zIndex = '1';
    downloadOptions.style.minWidth = '160px';
    downloadOptions.style.borderRadius = '4px';
    downloadOptions.style.padding = '5px 0';
    downloadOptions.style.right = '0';
    downloadOptions.style.top = '100%';
    downloadOptions.style.marginTop = '5px';
  
    // HTML 다운로드 옵션
    const downloadHtml = document.createElement('a');
    downloadHtml.id = 'download-html';
    downloadHtml.className = 'dropdown-item';
    downloadHtml.innerHTML = '<i class="fas fa-file-code"></i> HTML로 저장';
    downloadHtml.style.display = 'block';
    downloadHtml.style.padding = '8px 12px';
    downloadHtml.style.cursor = 'pointer';
    downloadHtml.style.textDecoration = 'none';
    downloadHtml.style.color = '#333';
    
    // TXT 다운로드 옵션
    const downloadTxt = document.createElement('a');
    downloadTxt.id = 'download-txt';
    downloadTxt.className = 'dropdown-item';
    downloadTxt.innerHTML = '<i class="fas fa-file-alt"></i> TXT로 저장';
    downloadTxt.style.display = 'block';
    downloadTxt.style.padding = '8px 12px';
    downloadTxt.style.cursor = 'pointer';
    downloadTxt.style.textDecoration = 'none';
    downloadTxt.style.color = '#333';
  
    // 호버 효과 추가
    const hoverEffect = document.createElement('style');
    hoverEffect.textContent = `
      .dropdown-item:hover {
        background-color: #f5f5f5;
      }
      .dropdown-menu.show {
        display: block !important;
      }
    `;
    document.head.appendChild(hoverEffect);
  
    // 요소 구성
    downloadOptions.appendChild(downloadHtml);
    downloadOptions.appendChild(downloadTxt);
    
    // 버튼에 이벤트 리스너 추가
    downloadBtn.addEventListener('click', this.toggleDownloadOptions.bind(this));
    
    // 버튼을 컨테이너에 추가
    buttonContainer.appendChild(downloadBtn);
    document.body.appendChild(downloadOptions);  // 드롭다운은 body에 추가하여 z-index 문제 해결
  }
  
  
  // 다운로드 옵션 토글 함수 - 수정됨
toggleDownloadOptions(e) {
    if (e) e.stopPropagation();
    
    const downloadOptions = document.getElementById('download-options');
    const downloadBtn = document.getElementById('download-btn');
    
    if (!downloadOptions || !downloadBtn) {
      console.warn('다운로드 옵션 또는 버튼을 찾을 수 없습니다.');
      return;
    }
    
    // 클래스 방식으로 변경
    downloadOptions.classList.toggle('show');
    
    // 표시 스타일 변경
    if (downloadOptions.classList.contains('show')) {
      downloadOptions.style.display = 'block';
    } else {
      downloadOptions.style.display = 'none';
    }
    
    // 화살표 아이콘 회전
    const caretIcon = downloadBtn.querySelector('.fa-caret-down');
    if (caretIcon) {
      caretIcon.style.transform = downloadOptions.classList.contains('show') 
        ? 'translateY(-50%) rotate(180deg)' 
        : 'translateY(-50%)';
    }
  }
  
    
   // 모든 드롭다운 닫기 함수 - 수정됨
closeAllDropdowns() {
    const downloadOptions = document.getElementById('download-options');
    const downloadBtn = document.getElementById('download-btn');
    
    if (downloadOptions && downloadOptions.classList.contains('show')) {
      downloadOptions.classList.remove('show');
      downloadOptions.style.display = 'none';
      
      const caretIcon = downloadBtn?.querySelector('.fa-caret-down');
      if (caretIcon) {
        caretIcon.style.transform = 'translateY(-50%)';
      }
    }
  }
    
    /**
     * 입력창 드래그 앤 드롭 설정
     */
    setupDragAndDropInput() {
      const inputText = document.getElementById('input-text');
      if (!inputText) return;
      
      // 드래그 오버 이벤트 - 드래그 중인 파일이 영역 위에 있을 때
      inputText.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputText.classList.add('drag-over');
      });
      
      // 드래그 떠남 이벤트 - 드래그 중인 파일이 영역을 벗어날 때
      inputText.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputText.classList.remove('drag-over');
      });
      
      // 드롭 이벤트 - 파일을 영역에 놓았을 때
      inputText.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inputText.classList.remove('drag-over');
        
        // 파일 확인
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          
          // 텍스트 파일 확인
          if (file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain') {
            this.handleTextFile(file);
          } else {
            alert('텍스트 파일(.txt)만 지원합니다.');
          }
        }
      });
    }
    
    /**
     * 텍스트 파일 처리
     */
    async handleTextFile(file) {
      try {
        // 로딩 표시
        this.uiManager.toggleLoadingOverlay(true, '파일 내용을 읽는 중...');
        
        // 파일 내용 읽기
        const content = await this.readFileAsync(file);
        
        // 입력창에 내용 채우기
        const inputText = document.getElementById('input-text');
        if (inputText) {
          inputText.value = content;
          
          // 자동으로 채팅 분석 실행
          await this.handleAnalyze();
        }
        
        // 로딩 표시 제거 및 완료 메시지
        this.uiManager.toggleLoadingOverlay(false);
        this.uiManager.showStatusMessage(`파일 '${file.name}'을(를) 성공적으로 불러왔습니다.`, this.state.darkMode);
      } catch (error) {
        // 오류 처리
        this.uiManager.toggleLoadingOverlay(false);
        alert(`파일을 읽는 중 오류가 발생했습니다: ${error.message}`);
        console.error('파일 읽기 오류:', error);
      }
    }
    
    /**
     * 파일 읽기 프로미스 래퍼
     */
    readFileAsync(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('파일 읽기 실패'));
        
        reader.readAsText(file);
      });
    }
    
    /**
     * 메시지 렌더링
     */
    renderMessages() {
      this.uiManager.renderMessages();
    }
    
    /**
     * 채팅 분석 핸들러
     */
    async handleAnalyze() {
      console.log('handleAnalyze 함수 실행 시작');
      
      const inputText = document.getElementById('input-text');
      if (!inputText) {
        console.error('input-text 요소를 찾을 수 없습니다');
        return;
      }
      
      const userProfiles = document.getElementById('user-profiles');
      if (!userProfiles) {
        console.error('user-profiles 요소를 찾을 수 없습니다');
        return;
      }
      
      const chatData = inputText.value.trim();
      if (!chatData) {
        alert('채팅 데이터를 입력해주세요!');
        return;
      }
      
      // 로딩 표시
      this.uiManager.toggleLoadingOverlay(true, '채팅 분석 중...');
      
      try {
        // 메시지 파싱
        this.state.messages = await this.dataManager.parseMessages(chatData);
        console.log(`파싱된 메시지 개수: ${this.state.messages.length}`);
        
        // 유니크 유저네임 가져오기
        const usernames = new Set(this.state.messages.map(msg => msg.username));
        console.log(`고유 사용자 수: ${usernames.size}`);
        
        // 최대 지원 사용자 수 검증
        if (usernames.size > this.MAX_USERS) {
          alert(`대화 참여자가 ${usernames.size}명입니다. 최대 ${this.MAX_USERS}명까지만 지원됩니다.`);
          userProfiles.innerHTML = '';
          userProfiles.style.display = 'none';
          
          // 로딩 표시 숨김
          this.uiManager.toggleLoadingOverlay(false);
          return;
        }
        
        // 프로필 설정 UI 생성
        this.uiManager.createProfileSettings();
        
        // 메시지 렌더링
        this.renderMessages();
        
        // 상태 메시지 표시
        this.uiManager.toggleLoadingOverlay(false);
        this.uiManager.showStatusMessage('채팅 분석 완료!', this.state.darkMode);
      } catch (error) {
        console.error('채팅 분석 중 오류 발생:', error);
        alert('채팅 분석 중 오류가 발생했습니다: ' + error.message);
        
        // 로딩 표시 숨김
        this.uiManager.toggleLoadingOverlay(false);
      }
      
      console.log('handleAnalyze 함수 실행 완료');
    }
    
    /**
     * 변환 핸들러
     */
    async handleConvert() {
      console.log('handleConvert 함수 실행 시작');
      
      if (this.state.messages.length === 0) {
        const inputText = document.getElementById('input-text');
        if (!inputText) {
          console.error('input-text 요소를 찾을 수 없습니다');
          return;
        }
        
        const chatData = inputText.value.trim();
        if (!chatData) {
          alert('채팅 데이터를 입력해주세요!');
          return;
        }
        
        // 로딩 표시
        this.uiManager.toggleLoadingOverlay(true, '채팅 분석 중...');
        
        try {
          // 메시지 파싱
          this.state.messages = await this.dataManager.parseMessages(chatData);
        } catch (error) {
          console.error('채팅 파싱 중 오류 발생:', error);
          alert('채팅 파싱 중 오류가 발생했습니다: ' + error.message);
          
          // 로딩 표시 숨김
          this.uiManager.toggleLoadingOverlay(false);
          return;
        }
      }
      
      // 로딩 표시
      this.uiManager.toggleLoadingOverlay(true, '채팅 변환 중...');
      
      try {
        // 참여자 수 검증
        const uniqueUsers = new Set(this.state.messages.map(msg => msg.username));
        if (uniqueUsers.size > this.MAX_USERS) {
          alert(`대화 참여자가 ${uniqueUsers.size}명입니다. 최대 25명까지만 지원됩니다.`);
          
          // 로딩 표시 숨김
          this.uiManager.toggleLoadingOverlay(false);
          return;
        }
        
        // 메시지 렌더링
        this.renderMessages();
        
        // 프로필 설정 영역 숨기기
        const userProfiles = document.getElementById('user-profiles');
        if (userProfiles) {
          userProfiles.style.opacity = '0';
          userProfiles.style.display = 'none';
        }
        
        // 로딩 표시 숨김
        this.uiManager.toggleLoadingOverlay(false);
        this.uiManager.showStatusMessage('채팅 변환 완료! 이제 HTML을 복사할 수 있습니다.', this.state.darkMode);
      } catch (error) {
        console.error('채팅 변환 중 오류 발생:', error);
        alert('채팅 변환 중 오류가 발생했습니다: ' + error.message);
        
        // 로딩 표시 숨김
        this.uiManager.toggleLoadingOverlay(false);
      }
      
      console.log('handleConvert 함수 실행 완료');
    }
    
    /**
     * HTML 복사 핸들러
     */
    async handleCopy() {
      console.log('handleCopy 함수 실행 시작');
      
      await this.exportManager.copyHtmlToClipboard();
      
      console.log('handleCopy 함수 실행 완료');
    }
    
    /**
     * HTML 다운로드 핸들러
     */
    async handleHtmlDownload() {
      console.log('handleHtmlDownload 함수 실행 시작');
      
      await this.exportManager.downloadHtmlFile();
      
      console.log('handleHtmlDownload 함수 실행 완료');
    }
    
    /**
     * TXT 다운로드 핸들러
     */
    async handleTxtDownload() {
      console.log('handleTxtDownload 함수 실행 시작');
      
      await this.exportManager.downloadTxtFile();
      
      console.log('handleTxtDownload 함수 실행 완료');
    }
    
    /**
     * 초기화 핸들러
     */
    handleClear() {
      console.log('handleClear 함수 실행 시작');
      
      if (confirm('채팅 데이터와 입력을 지우시겠습니까?')) {
        const inputText = document.getElementById('input-text');
        const userProfiles = document.getElementById('user-profiles');
        const chatContainer = document.getElementById('chat-container');
        
        if (inputText) inputText.value = '';
        if (userProfiles) userProfiles.style.display = 'none';
        if (chatContainer) chatContainer.innerHTML = '';
        
        this.state.messages = [];
        this.state.isFirstLoad = true;
        
        this.uiManager.showStatusMessage('모든 데이터가 초기화되었습니다.', this.state.darkMode);
      }
      
      console.log('handleClear 함수 실행 완료');
    }
    
    /**
     * 편집 시작
     */
    startEdit(index) {
      // EditManager 로직을 통합
      if (this.editingIndex !== null && this.editingIndex !== index) {
        console.log('다른 메시지가 편집 중입니다.');
        return;
      }
      
      const messageDiv = document.querySelector(`[data-index="${index}"] .message-content`);
      if (!messageDiv) {
        console.error(`인덱스 ${index}의 메시지 요소를 찾을 수 없습니다.`);
        return;
      }
      
      if (messageDiv.querySelector('.edit-buttons')) {
        console.log('이미 편집 모드입니다.');
        return;
      }
      
      const currentText = this.state.messages[index].chatMessage;
      
      // 편집 UI 생성 및 이벤트 설정
      this.editingIndex = index;
      this.uiManager.createEditInterface(messageDiv, currentText, index);
      
      console.log(`메시지 편집 시작: 인덱스 ${index}`);
    }
    
    /**
     * 편집 저장
     */
    saveEdit(index, newText) {
      if (newText) {
        this.state.messages[index].chatMessage = newText;
      }
      this.editingIndex = null;
      this.renderMessages();
    }
    
    /**
     * 편집 취소
     */
    cancelEdit() {
      this.editingIndex = null;
      this.renderMessages();
    }
    
    /**
     * 메시지 삭제
     */
    deleteMessage(index) {
      if (confirm('정말로 이 메시지를 삭제하시겠습니까?')) {
        this.state.messages.splice(index, 1);
        this.editingIndex = null;
        this.renderMessages();
      }
    }
  }
  // 문서 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', async () => {
    window.chatApp = new ChatBackupApp();
    await window.chatApp.init();
    
    // 전역 함수 설정 (기존 코드와의 호환성 유지)
    window.renderMessages = () => window.chatApp.renderMessages();
    window.handleAnalyze = () => window.chatApp.handleAnalyze();
    window.handleConvert = () => window.chatApp.handleConvert();
    window.handleCopy = () => window.chatApp.handleCopy();
    window.handleClear = () => window.chatApp.handleClear();
    window.startEdit = (index) => window.chatApp.startEdit(index);
    
    // 호환성 레이어 추가 - 전역 객체 참조 유지
    window.ImageHandler = window.chatApp.mediaManager;
    window.MessageParser = window.chatApp.dataManager;
    window.StorageManager = window.chatApp.dataManager;
    window.ExportManager = window.chatApp.exportManager;
    window.ThemeManager = {
      toggleTheme: window.chatApp.uiManager.toggleTheme.bind(window.chatApp.uiManager),
      initializeTheme: window.chatApp.uiManager.initializeTheme.bind(window.chatApp.uiManager)
    };
    
    console.log('앱 초기화 및 호환성 레이어 설정 완료');
  });