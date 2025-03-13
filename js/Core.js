/**
 * 밴드 채팅 백업 도구 - 핵심 앱 클래스
 * 
 * 앱의 핵심 기능과 상태 관리를 담당합니다.
 * 비동기 처리 최적화와 성능 개선을 포함합니다.
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
    this.uiManager = null;
    this.dataManager = null;
    this.mediaManager = null;
    this.exportManager = null;
    
    // 편집 상태 관리
    this.editingIndex = null;
    
    // 최대 지원 사용자 수
    this.MAX_USERS = 25;
    
    // 이벤트 리스너 트래킹
    this._eventListeners = new Map();
    
    // 앱 상태 변화 감지용 타임스탬프
    this._lastUpdateTime = Date.now();
  }
  
  async init() {
    console.log('앱 초기화 시작:', new Date().toISOString());
    
    try {
      // 관리자 클래스 인스턴스 생성 - 순서 중요
      this.dataManager = new DataManager(this);
      this.mediaManager = new MediaManager(this);
      // ExportManager는 다른 모듈에 의존하므로 나중에 초기화
      this.uiManager = new UIManager(this);
      
      // 이제 ExportManager 초기화 - 의존성이 모두 준비된 후
      this.exportManager = new ExportManager(this);
      
      // 저장된 설정 불러오기
      await this.loadSettings();
      
      // 이벤트 리스너 설정
      this.setupEventListeners();
      
      // UI 초기화
      this.uiManager.initializeTheme();
      
      // 도움말 및 설정 패널 초기화
      if (this.uiManager.initHelpSystem) {
        this.uiManager.initHelpSystem();
      }
      
      // 초기화 완료 로그
      console.log('앱 초기화 완료:', new Date().toISOString());
      console.log('앱 설정 상태:', {
        darkMode: this.state.darkMode,
        highlightTags: this.state.highlightTags,
        showMyProfile: this.state.showMyProfile,
        fontSize: this.state.fontSize
      });
      
      // 모든 관리자 클래스 초기화 확인
      this._checkAllManagers();
    } catch (error) {
      console.error('앱 초기화 중 오류 발생:', error);
      // 사용자에게 알림 (에러가 너무 심각할 경우)
      this._handleCriticalError('초기화 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.');
    }
  }
  
  _checkAllManagers() {
    const managers = {
      'DataManager': this.dataManager,
      'MediaManager': this.mediaManager,
      'UIManager': this.uiManager,
      'ExportManager': this.exportManager
    };
    
    let allInitialized = true;
    
    // 각 관리자 확인
    for (const [name, manager] of Object.entries(managers)) {
      if (!manager) {
        console.error(`${name}가 초기화되지 않았습니다.`);
        allInitialized = false;
      } else {
        console.log(`${name} 정상 초기화됨`);
        
        // 중요 함수 확인
        if (name === 'ExportManager') {
          const functions = ['copyHtmlToClipboard', 'downloadHtmlFile', 'downloadTxtFile'];
          functions.forEach(fn => {
            if (typeof manager[fn] !== 'function') {
              console.error(`${name}.${fn} 함수가 없습니다.`);
              allInitialized = false;
            } else {
              console.log(`${name}.${fn} 함수 정상 확인`);
            }
          });
        }
      }
    }
    
    if (allInitialized) {
      console.log('모든 관리자 클래스가 정상적으로 초기화되었습니다.');
    } else {
      console.warn('일부 관리자 클래스에 문제가 있습니다. 앱이 정상적으로 작동하지 않을 수 있습니다.');
    }
  }
  /**
   * 설정 불러오기
   * - 로컬 스토리지에서 모든 설정 로드
   */
  async loadSettings() {
    try {
      console.time('설정 로드');
      
      // 프로필 설정 불러오기
      const profiles = await this.dataManager.loadProfiles();
      this.state.displayNames = profiles.displayNames || {};
      this.state.userProfileImages = profiles.userProfileImages || {};
      this.state.userColors = profiles.userColors || {};
      this.state.selectedUsers = profiles.selectedUsers || new Set();
      
      // 글자 크기 설정
      if (profiles.fontSize && typeof profiles.fontSize === 'number') {
        this.state.fontSize = profiles.fontSize;
      }
      
      // 테마 설정 불러오기
      this.state.darkMode = await this.dataManager.loadThemePreference();
      
      // 태그 강조 설정 불러오기
      this.state.highlightTags = await this.dataManager.loadTagHighlightSetting();
      
      // 내 메시지 프로필 이미지 표시 설정 불러오기
      this.state.showMyProfile = await this.dataManager.loadShowMyProfileSetting();
      
      // 고급 설정 불러오기
      const advancedSettings = await this.dataManager.loadAdvancedSettings();
      if (advancedSettings) {
        // 설정에 있는 항목만 적용
        Object.entries(advancedSettings).forEach(([key, value]) => {
          if (this.state.hasOwnProperty(key)) {
            this.state[key] = value;
          }
        });
      }
      
      console.timeEnd('설정 로드');
    } catch (error) {
      console.error('설정 불러오기 중 오류 발생:', error);
      // 오류 발생 시 기본값으로 복원
      this._resetToDefaultSettings();
    }
  }
  
  /**
   * 기본 설정으로 초기화
   * - 설정 로드 중 오류 발생 시 호출
   * @private
   */
  _resetToDefaultSettings() {
    console.warn('설정 로드 실패로 기본값 적용');
    
    this.state.darkMode = false;
    this.state.highlightTags = true;
    this.state.showMyProfile = true;
    this.state.fontSize = 16;
    
    // 기존 프로필 데이터는 그대로 유지
  }
  
  /**
   * 심각한 오류 처리
   * @param {string} message - 오류 메시지
   * @private
   */
  _handleCriticalError(message) {
    try {
      // UI 매니저가 있으면 로딩 오버레이 제거
      if (this.uiManager && typeof this.uiManager.toggleLoadingOverlay === 'function') {
        this.uiManager.toggleLoadingOverlay(false);
      }
      
      // 사용자에게 알림
      alert(message);
    } catch (e) {
      // 최후의 방어선
      console.error('심각한 오류 처리 중 추가 오류 발생:', e);
    }
  }
  
  /**
   * 이벤트 리스너 설정
   * - 모든 주요 버튼 및 UI 요소에 이벤트 추가
   */
  setupEventListeners() {
    try {
      console.time('이벤트 리스너 설정');
      
      // 기본 버튼 이벤트 리스너
      const buttonHandlers = {
        'analyze-btn': this.handleAnalyze.bind(this),
        'convert-btn': this.handleConvert.bind(this),
        'copy-btn': this.handleCopy.bind(this),
        'clear-btn': this.handleClear.bind(this)
      };
      
      // 이벤트 리스너 등록 및 트래킹
      Object.entries(buttonHandlers).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
          // 이전 리스너 제거 (중복 방지)
          const oldListener = this._eventListeners.get(id);
          if (oldListener) {
            element.removeEventListener('click', oldListener);
          }
          
          // 새 리스너 등록
          element.addEventListener('click', handler);
          this._eventListeners.set(id, handler);
        } else {
          console.warn(`버튼 요소를 찾을 수 없음: ${id}`);
        }
      });
      
      // 다운로드 버튼 생성 및 이벤트 설정
      this.createDownloadButton();
      
      // 다운로드 드롭다운 이벤트 설정
      this.setupDropdownEvents();
      
      // 입력창 드래그 앤 드롭 이벤트 설정
      this.setupDragAndDropInput();
      
      // ESC 키로 모달/드롭다운 닫기
      const escKeyHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeAllDropdowns();
          if (this.editingIndex !== null) {
            this.cancelEdit();
          }
        }
      };
      
      // 이전 리스너 제거 후 등록
      document.removeEventListener('keydown', this._eventListeners.get('escKey'));
      document.addEventListener('keydown', escKeyHandler);
      this._eventListeners.set('escKey', escKeyHandler);
      
      // 문서 클릭 시 드롭다운 닫기
      const documentClickHandler = (e) => {
        const downloadBtn = document.getElementById('download-btn');
        const downloadOptions = document.getElementById('download-options');
        
        if (downloadOptions && 
            downloadOptions.classList.contains('show') && 
            downloadBtn && 
            !downloadBtn.contains(e.target) && 
            !downloadOptions.contains(e.target)) {
          this.closeAllDropdowns();
        }
      };
      
      // 이전 리스너 제거 후 등록
      document.removeEventListener('click', this._eventListeners.get('documentClick'));
      document.addEventListener('click', documentClickHandler);
      this._eventListeners.set('documentClick', documentClickHandler);
      
      console.timeEnd('이벤트 리스너 설정');
    } catch (error) {
      console.error('이벤트 리스너 설정 중 오류:', error);
    }
  }
  
  /**
   * 다운로드 드롭다운 이벤트 설정
   * - HTML 및 TXT 다운로드 옵션 이벤트 처리
   */
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
      // 이전 리스너 제거
      const oldListener = this._eventListeners.get('downloadHtml');
      if (oldListener) {
        downloadHtml.removeEventListener('click', oldListener);
      }
      
      // 새 리스너 등록
      const htmlDownloadHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDownloadOptions();
        this.handleHtmlDownload();
      };
      
      downloadHtml.addEventListener('click', htmlDownloadHandler);
      this._eventListeners.set('downloadHtml', htmlDownloadHandler);
    }
    
    if (downloadTxt) {
      // 이전 리스너 제거
      const oldListener = this._eventListeners.get('downloadTxt');
      if (oldListener) {
        downloadTxt.removeEventListener('click', oldListener);
      }
      
      // 새 리스너 등록
      const txtDownloadHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDownloadOptions();
        this.handleTxtDownload();
      };
      
      downloadTxt.addEventListener('click', txtDownloadHandler);
      this._eventListeners.set('downloadTxt', txtDownloadHandler);
    }
  }
  
  /**
   * 다운로드 버튼 생성
   * - 다운로드 버튼 및 드롭다운 메뉴 동적 생성
   */
  createDownloadButton() {
    // 이미 존재하는지 확인
    const existingBtn = document.getElementById('download-btn');
    if (existingBtn) {
      // 이전 이벤트 리스너 업데이트
      const oldListener = this._eventListeners.get('downloadBtn');
      if (oldListener) {
        existingBtn.removeEventListener('click', oldListener);
      }
      
      const downloadBtnHandler = this.toggleDownloadOptions.bind(this);
      existingBtn.addEventListener('click', downloadBtnHandler);
      this._eventListeners.set('downloadBtn', downloadBtnHandler);
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
  downloadOptions.style.position = 'fixed';
  downloadOptions.style.backgroundColor = '#fff';
  downloadOptions.style.boxShadow = '0 8px 16px 0 rgba(0,0,0,0.2)';
  downloadOptions.style.zIndex = '1000';
  downloadOptions.style.minWidth = '160px';
  downloadOptions.style.borderRadius = '4px';
  downloadOptions.style.padding = '5px 0';
  
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
    const styleId = 'dropdown-styles';
    if (!document.getElementById(styleId)) {
      const hoverEffect = document.createElement('style');
      hoverEffect.id = styleId;
      hoverEffect.textContent = `
        .dropdown-item:hover {
          background-color: #f5f5f5;
        }
        .dropdown-menu.show {
          display: block !important;
        }
        body.dark .dropdown-menu {
          background-color: #1e293b;
          box-shadow: 0 8px 16px 0 rgba(0,0,0,0.4);
        }
        body.dark .dropdown-item {
          color: #e2e8f0;
        }
        body.dark .dropdown-item:hover {
          background-color: #2d3748;
        }
      `;
      document.head.appendChild(hoverEffect);
    }
  
    // 요소 구성
    downloadOptions.appendChild(downloadHtml);
    downloadOptions.appendChild(downloadTxt);
    
    // 다운로드 버튼 이벤트 리스너
    const downloadBtnHandler = this.toggleDownloadOptions.bind(this);
    downloadBtn.addEventListener('click', downloadBtnHandler);
    this._eventListeners.set('downloadBtn', downloadBtnHandler);
    
    // 버튼을 컨테이너에 추가
    buttonContainer.appendChild(downloadBtn);
    document.body.appendChild(downloadOptions);
    
    // HTML 및 TXT 다운로드 이벤트 연결
    this.setupDropdownEvents();
  }
  
  toggleDownloadOptions(e) {
    if (e) e.stopPropagation();
    
    const downloadOptions = document.getElementById('download-options');
    const downloadBtn = document.getElementById('download-btn');
    
    if (!downloadOptions || !downloadBtn) {
      console.error('다운로드 옵션 또는 버튼을 찾을 수 없습니다.');
      return;
    }
    
    // 버튼 위치 기준으로 드롭다운 위치 계산
    const buttonRect = downloadBtn.getBoundingClientRect();
    
    downloadOptions.style.position = 'fixed';
    downloadOptions.style.top = `${buttonRect.bottom + 5}px`; // 버튼 아래 5px 간격
    downloadOptions.style.left = `${buttonRect.left}px`; // 버튼 왼쪽 정렬
    
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
  
  /**
   * 모든 드롭다운 메뉴 닫기
   */
  closeAllDropdowns() {
    try {
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
    } catch (error) {
      console.error('드롭다운 닫기 중 오류:', error);
    }
  }
  
  /**
   * 입력창 드래그 앤 드롭 설정
   * - 텍스트 파일 드래그 앤 드롭 처리
   */
  setupDragAndDropInput() {
    const inputText = document.getElementById('input-text');
    if (!inputText) return;
    
    // 이전 이벤트 리스너 제거
    ['dragover', 'dragleave', 'drop'].forEach(eventName => {
      const oldListener = this._eventListeners.get(`inputText_${eventName}`);
      if (oldListener) {
        inputText.removeEventListener(eventName, oldListener);
      }
    });
    
    // 드래그 오버 이벤트 - 드래그 중인 파일이 영역 위에 있을 때
    const dragoverHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      inputText.classList.add('drag-over');
    };
    
    // 드래그 떠남 이벤트 - 드래그 중인 파일이 영역을 벗어날 때
    const dragleaveHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      inputText.classList.remove('drag-over');
    };
    
    // 드롭 이벤트 - 파일을 영역에 놓았을 때
    const dropHandler = (e) => {
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
    };
    
    // 이벤트 리스너 등록 및 트래킹
    inputText.addEventListener('dragover', dragoverHandler);
    inputText.addEventListener('dragleave', dragleaveHandler);
    inputText.addEventListener('drop', dropHandler);
    
    this._eventListeners.set('inputText_dragover', dragoverHandler);
    this._eventListeners.set('inputText_dragleave', dragleaveHandler);
    this._eventListeners.set('inputText_drop', dropHandler);
  }
  
  /**
   * 텍스트 파일 처리
   * @param {File} file - 파일 객체
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
   * @param {File} file - 파일 객체
   * @returns {Promise<string>} - 파일 내용
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
   * - UI 매니저를 통해 메시지 렌더링
   */
  renderMessages() {
    if (this.uiManager && typeof this.uiManager.renderMessages === 'function') {
      this.uiManager.renderMessages();
    } else {
      console.error('UI 매니저가 초기화되지 않았거나 renderMessages 함수가 없습니다.');
    }
  }
  
  /**
   * 채팅 분석 핸들러
   * - 입력된 채팅 데이터 분석 및 처리
   */
  async handleAnalyze() {
    console.log('채팅 분석 시작...');
    
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
    
    // 이미 처리 중인 경우 추가 요청 무시
    if (this.state.isProcessing) {
      console.log('이미 처리 중입니다. 요청 무시.');
      this.uiManager.showStatusMessage('이미 처리 중입니다. 잠시만 기다려주세요.', this.state.darkMode);
      return;
    }
    
    // 처리 상태 설정
    this.state.isProcessing = true;
    
    // 로딩 표시
    this.uiManager.toggleLoadingOverlay(true, '채팅 분석 중...');
    
    try {
      console.time('채팅 분석');
      
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
        
        // 처리 상태 해제
        this.state.isProcessing = false;
        
        // 로딩 표시 숨김
        this.uiManager.toggleLoadingOverlay(false);
        return;
      }
      
      // 프로필 설정 UI 생성
      this.uiManager.createProfileSettings();
      
      // 메시지 렌더링
      this.renderMessages();
      
      console.timeEnd('채팅 분석');
      
      // 상태 메시지 표시
      this.uiManager.toggleLoadingOverlay(false);
      this.uiManager.showStatusMessage('채팅 분석 완료!', this.state.darkMode);
    } catch (error) {
      console.error('채팅 분석 중 오류 발생:', error);
      alert('채팅 분석 중 오류가 발생했습니다: ' + error.message);
      
      // 로딩 표시 숨김
      this.uiManager.toggleLoadingOverlay(false);
    } finally {
      // 처리 상태 해제
      this.state.isProcessing = false;
    }
  }
  
  /**
   * 변환 핸들러
   * - 분석된 채팅을 HTML 형식으로 변환
   */
  async handleConvert() {
    console.log('채팅 변환 시작...');
    
    // 이미 처리 중인 경우 추가 요청 무시
    if (this.state.isProcessing) {
      console.log('이미 처리 중입니다. 요청 무시.');
      this.uiManager.showStatusMessage('이미 처리 중입니다. 잠시만 기다려주세요.', this.state.darkMode);
      return;
    }
    
    // 처리 상태 설정
    this.state.isProcessing = true;
    
    try {
      // 메시지가 없는 경우 먼저 분석 실행
      if (this.state.messages.length === 0) {
        const inputText = document.getElementById('input-text');
        if (!inputText) {
          console.error('input-text 요소를 찾을 수 없습니다');
          
          // 처리 상태 해제
          this.state.isProcessing = false;
          return;
        }
        
        const chatData = inputText.value.trim();
        if (!chatData) {
          alert('채팅 데이터를 입력해주세요!');
          
          // 처리 상태 해제
          this.state.isProcessing = false;
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
          
          // 처리 상태 해제
          this.state.isProcessing = false;
          return;
        }
      }
      
      // 로딩 표시
      this.uiManager.toggleLoadingOverlay(true, '채팅 변환 중...');
      
      console.time('채팅 변환');
      
      // 참여자 수 검증
      const uniqueUsers = new Set(this.state.messages.map(msg => msg.username));
      if (uniqueUsers.size > this.MAX_USERS) {
        alert(`대화 참여자가 ${uniqueUsers.size}명입니다. 최대 ${this.MAX_USERS}명까지만 지원됩니다.`);
        
        // 로딩 표시 숨김
        this.uiManager.toggleLoadingOverlay(false);
        
        // 처리 상태 해제
        this.state.isProcessing = false;
        return;
      }
      
      // 이미지 최적화 (비동기 작업)
      if (this.mediaManager && typeof this.mediaManager.optimizeAllUserImages === 'function') {
        try {
          this.uiManager.showStatusMessage('이미지 최적화 중...', this.state.darkMode);
          await this.mediaManager.optimizeAllUserImages();
        } catch (error) {
          console.error('이미지 최적화 중 오류:', error);
          // 오류가 발생해도 계속 진행 (영속성 보장)
        }
      }
      
      // 메시지 렌더링
      this.renderMessages();
      
      // 프로필 설정 영역 숨기기
      const userProfiles = document.getElementById('user-profiles');
      if (userProfiles) {
        userProfiles.style.opacity = '0';
        userProfiles.style.display = 'none';
      }
      
      console.timeEnd('채팅 변환');
      
      // 로딩 표시 숨김
      this.uiManager.toggleLoadingOverlay(false);
      this.uiManager.showStatusMessage('채팅 변환 완료! 이제 HTML을 복사할 수 있습니다.', this.state.darkMode);
    } catch (error) {
      console.error('채팅 변환 중 오류 발생:', error);
      alert('채팅 변환 중 오류가 발생했습니다: ' + error.message);
      
      // 로딩 표시 숨김
      this.uiManager.toggleLoadingOverlay(false);
    } finally {
      // 처리 상태 해제
      this.state.isProcessing = false;
    }
  }
  
  /**
   * HTML 복사 핸들러
   * - 변환된 채팅을 클립보드에 복사
   */
  async handleCopy() {
    console.log('HTML 복사 시작...');
    
    // 이미 처리 중인 경우 추가 요청 무시
    if (this.state.isProcessing) {
      console.log('이미 처리 중입니다. 요청 무시.');
      this.uiManager.showStatusMessage('이미 처리 중입니다. 잠시만 기다려주세요.', this.state.darkMode);
      return;
    }
    
    try {
      // ExportManager가 있는지 확인
      if (!this.exportManager || typeof this.exportManager.copyHtmlToClipboard !== 'function') {
        throw new Error('ExportManager가 초기화되지 않았거나 copyHtmlToClipboard 함수가 없습니다.');
      }
      
      // 채팅 HTML 복사
      await this.exportManager.copyHtmlToClipboard();
    } catch (error) {
      console.error('HTML 복사 중 오류 발생:', error);
      alert('HTML 복사 중 오류가 발생했습니다: ' + error.message);
    }
  }
  
  /**
   * HTML 다운로드 핸들러
   * - 변환된 채팅을 HTML 파일로 다운로드
   */
  async handleHtmlDownload() {
    console.log('HTML 다운로드 시작...');
    
    // 이미 처리 중인 경우 추가 요청 무시
    if (this.state.isProcessing) {
      console.log('이미 처리 중입니다. 요청 무시.');
      this.uiManager.showStatusMessage('이미 처리 중입니다. 잠시만 기다려주세요.', this.state.darkMode);
      return;
    }
    
    try {
      // ExportManager가 있는지 확인
      if (!this.exportManager || typeof this.exportManager.downloadHtmlFile !== 'function') {
        throw new Error('ExportManager가 초기화되지 않았거나 downloadHtmlFile 함수가 없습니다.');
      }
      
      // HTML 파일 다운로드
      await this.exportManager.downloadHtmlFile();
    } catch (error) {
      console.error('HTML 다운로드 중 오류 발생:', error);
      alert('HTML 다운로드 중 오류가 발생했습니다: ' + error.message);
    }
  }
  
  /**
   * TXT 다운로드 핸들러
   * - 변환된 채팅을 TXT 파일로 다운로드
   */
  async handleTxtDownload() {
    console.log('TXT 다운로드 시작...');
    
    // 이미 처리 중인 경우 추가 요청 무시
    if (this.state.isProcessing) {
      console.log('이미 처리 중입니다. 요청 무시.');
      this.uiManager.showStatusMessage('이미 처리 중입니다. 잠시만 기다려주세요.', this.state.darkMode);
      return;
    }
    
    try {
      // ExportManager가 있는지 확인
      if (!this.exportManager || typeof this.exportManager.downloadTxtFile !== 'function') {
        throw new Error('ExportManager가 초기화되지 않았거나 downloadTxtFile 함수가 없습니다.');
      }
      
      // TXT 파일 다운로드
      await this.exportManager.downloadTxtFile();
    } catch (error) {
      console.error('TXT 다운로드 중 오류 발생:', error);
      alert('TXT 다운로드 중 오류가 발생했습니다: ' + error.message);
    }
  }
  
  /**
   * 초기화 핸들러
   * - 모든 입력 및 상태 초기화
   */
  handleClear() {
    console.log('초기화 시작...');
    
    try {
      // 확인 메시지
      if (confirm('채팅 데이터와 입력을 지우시겠습니까?')) {
        const inputText = document.getElementById('input-text');
        const userProfiles = document.getElementById('user-profiles');
        const chatContainer = document.getElementById('chat-container');
        
        if (inputText) inputText.value = '';
        if (userProfiles) userProfiles.style.display = 'none';
        if (chatContainer) chatContainer.innerHTML = '';
        
        // 애플리케이션 상태 초기화
        this.state.messages = [];
        this.state.isFirstLoad = true;
        
        // 완료 메시지
        this.uiManager.showStatusMessage('모든 데이터가 초기화되었습니다.', this.state.darkMode);
        console.log('초기화 완료');
      } else {
        console.log('초기화 취소됨');
      }
    } catch (error) {
      console.error('초기화 중 오류 발생:', error);
      alert('초기화 중 오류가 발생했습니다: ' + error.message);
    }
  }
  
  /**
   * 편집 시작
   * @param {number} index - 메시지 인덱스
   */
  startEdit(index) {
    try {
      // 유효한 인덱스 범위 확인
      if (index < 0 || index >= this.state.messages.length) {
        console.error(`유효하지 않은 메시지 인덱스: ${index}`);
        return;
      }
      
      // 다른 메시지가 이미 편집 중인 경우 처리
      if (this.editingIndex !== null && this.editingIndex !== index) {
        console.log('다른 메시지가 편집 중입니다. 현재 편집을 취소합니다.');
        this.cancelEdit();
      }
      
      // 편집할 메시지 요소 찾기
      const messageDiv = document.querySelector(`[data-index="${index}"] .message-content`);
      if (!messageDiv) {
        console.error(`인덱스 ${index}의 메시지 요소를 찾을 수 없습니다.`);
        return;
      }
      
      // 이미 편집 중인지 확인
      if (messageDiv.querySelector('.edit-buttons')) {
        console.log('이미 편집 모드입니다.');
        return;
      }
      
      // 현재 메시지 내용 가져오기
      const currentText = this.state.messages[index].chatMessage;
      
      // 편집 UI 생성 및 이벤트 설정
      this.editingIndex = index;
      
      // UI 매니저가 있는지 확인
      if (this.uiManager && typeof this.uiManager.createEditInterface === 'function') {
        this.uiManager.createEditInterface(messageDiv, currentText, index);
      } else {
        console.error('UI 매니저가 초기화되지 않았거나 createEditInterface 함수가 없습니다.');
        this.editingIndex = null;
        return;
      }
      
      console.log(`메시지 편집 시작: 인덱스 ${index}`);
    } catch (error) {
      console.error('편집 시작 중 오류 발생:', error);
      this.editingIndex = null;
    }
  }
  
  /**
   * 편집 저장
   * @param {number} index - 메시지 인덱스
   * @param {string} newText - 새 메시지 내용
   */
  saveEdit(index, newText) {
    try {
      // 유효한 인덱스 범위 확인
      if (index < 0 || index >= this.state.messages.length) {
        console.error(`유효하지 않은 메시지 인덱스: ${index}`);
        return;
      }
      
      // 내용이 비어있지 않으면 저장
      if (newText) {
        this.state.messages[index].chatMessage = newText;
        console.log(`메시지 편집 저장: 인덱스 ${index}`);
      } else {
        console.warn('빈 메시지는 저장되지 않습니다.');
      }
      
      // 편집 모드 종료
      this.editingIndex = null;
      
      // 메시지 다시 렌더링
      this.renderMessages();
    } catch (error) {
      console.error('편집 저장 중 오류 발생:', error);
      this.editingIndex = null;
      this.renderMessages();
    }
  }
  
  /**
   * 편집 취소
   */
  cancelEdit() {
    try {
      console.log('편집 취소');
      this.editingIndex = null;
      this.renderMessages();
    } catch (error) {
      console.error('편집 취소 중 오류 발생:', error);
      this.editingIndex = null;
      this.renderMessages();
    }
  }
  
  /**
   * 메시지 삭제
   * @param {number} index - 메시지 인덱스
   */
  deleteMessage(index) {
    try {
      // 유효한 인덱스 범위 확인
      if (index < 0 || index >= this.state.messages.length) {
        console.error(`유효하지 않은 메시지 인덱스: ${index}`);
        return;
      }
      
      // 삭제 확인
      if (confirm('정말로 이 메시지를 삭제하시겠습니까?')) {
        // 메시지 배열에서 제거
        this.state.messages.splice(index, 1);
        console.log(`메시지 삭제: 인덱스 ${index}`);
        
        // 편집 모드 종료
        this.editingIndex = null;
        
        // 메시지 다시 렌더링
        this.renderMessages();
      }
    } catch (error) {
      console.error('메시지 삭제 중 오류 발생:', error);
      this.editingIndex = null;
      this.renderMessages();
    }
  }
}

// 문서 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', async () => {
  try {
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
      toggleTheme: () => window.chatApp.uiManager.toggleTheme.call(window.chatApp.uiManager),
      initializeTheme: () => window.chatApp.uiManager.initializeTheme.call(window.chatApp.uiManager)
    };
    
    console.log('앱 초기화 및 호환성 레이어 설정 완료');
  } catch (error) {
    console.error('앱 초기화 중 심각한 오류 발생:', error);
    alert('앱 초기화 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.');
  }
});