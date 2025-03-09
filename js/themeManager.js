// /js/themeManager.js - 테마 및 다크모드 관리 모듈

/**
 * 테마 관리자 모듈 - 라이트모드/다크모드 전환 및 관리
 */
const ThemeManager = {
    /**
     * 테마 전환 함수
     * @param {Object} state - 애플리케이션 상태 객체
     * @param {Function} renderMessages - 메시지 렌더링 함수
     */
    toggleTheme(state, renderMessages) {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        
        // 다크모드 상태 토글
        state.darkMode = !state.darkMode;

        // DOM 업데이트
        body.classList.toggle('dark');
        themeToggle.textContent = state.darkMode ? '라이트 모드로 전환' : '다크 모드로 전환';

        // 설정 저장
        StorageManager.saveThemePreference(state.darkMode);

        // 상태 메시지 설정
        const statusMessage = document.getElementById('statusMessage');
        statusMessage.textContent = state.darkMode ? '다크 모드로 전환되었습니다' : '라이트 모드로 전환되었습니다';
        
        // 상태 메시지 스타일 업데이트
        statusMessage.style.backgroundColor = state.darkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        statusMessage.style.color = state.darkMode ? '#e2e8f0' : '#333';
        
        // 메시지 다시 렌더링
        if (state.messages && state.messages.length > 0 && typeof renderMessages === 'function') {
            renderMessages();
        }
        
        // 상태 메시지 표시
        UIManager.showStatusMessage(null, state.darkMode);
    },

    /**
     * 테마 초기화 함수
     * @param {Object} state - 애플리케이션 상태 객체
     */
    initializeTheme(state) {
        const body = document.body;
        const themeToggle = document.getElementById('themeToggle');
        const statusMessage = document.getElementById('statusMessage');
        
        if (!body || !themeToggle || !statusMessage) return;
        
        if (state.darkMode) {
            body.classList.add('dark');
            themeToggle.textContent = '라이트 모드로 전환';
            statusMessage.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
            statusMessage.style.color = '#e2e8f0';
        } else {
            body.classList.remove('dark');
            themeToggle.textContent = '다크 모드로 전환';
            statusMessage.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            statusMessage.style.color = '#333';
        }
    },

    /**
     * 업데이트 로그 토글 함수
     */
    toggleUpdateLog() {
        const content = document.querySelector('.update-content');
        const icon = document.querySelector('.toggle-icon');
        
        if (!content || !icon) return;
        
        content.classList.toggle('show');
        icon.style.transform = content.classList.contains('show') ? 'rotate(-180deg)' : 'rotate(0deg)';
        
        // 토글 상태를 localStorage에 저장
        StorageManager.saveUpdateLogState(content.classList.contains('show'));
    },

    /**
     * 업데이트 로그 토글 초기화 함수
     */
    initUpdateLogToggle() {
        const content = document.querySelector('.update-content');
        const icon = document.querySelector('.toggle-icon');
        const wasOpen = StorageManager.loadUpdateLogState();
        
        if (wasOpen && content && icon) {
            content.classList.add('show');
            icon.style.transform = 'rotate(-180deg)';
        }
    }
};

// 전역 변수로 노출
window.ThemeManager = ThemeManager;

// 전역 함수로 등록 (HTML onclick에서 호출)
window.toggleUpdateLog = ThemeManager.toggleUpdateLog;