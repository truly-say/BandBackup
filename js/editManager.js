// /js/editManager.js - 메시지 편집 관리 모듈

/**
 * 메시지 편집 관리자 모듈 - 채팅 메시지 수정, 삭제 기능
 */
const EditManager = {
    // 현재 편집 중인 메시지 인덱스
    editingIndex: null,
    
    /**
     * 메시지 편집 시작 함수
     * @param {number} index - 편집할 메시지 인덱스
     * @param {Object} state - 애플리케이션 상태 객체
     * @param {Function} renderMessages - 메시지 다시 렌더링 함수
     */
    startEdit: function(index, state, renderMessages) {
        console.log(`메시지 편집 시작: 인덱스 ${index}`);
        
        // 이미 편집 중인 메시지의 인덱스와 동일한 메시지는 편집 불가
        if (this.editingIndex !== null && this.editingIndex !== index) {
            console.log('다른 메시지가 편집 중입니다.');
            return; // 다른 메시지가 편집 중이면 아무 일도 일어나지 않음
        }

        const messageDiv = document.querySelector(`[data-index="${index}"] .message-content`);
        if (!messageDiv) {
            console.error(`인덱스 ${index}의 메시지 요소를 찾을 수 없습니다.`);
            return; // 요소가 존재하지 않으면 종료
        }
        
        // 이미 편집 버튼이 추가되어 있으면 새로 추가하지 않도록 확인
        if (messageDiv.querySelector('.edit-buttons')) {
            console.log('이미 편집 모드입니다.');
            return; // 버튼이 이미 있으면 추가하지 않음
        }

        const currentText = state.messages[index].chatMessage;
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

        // 편집 중인 메시지 설정
        this.editingIndex = index;

        // 외부 클릭 감지 핸들러
        const handleClickOutside = (e) => {
            const isClickInside = textarea.contains(e.target) || 
                                editButtonsContainer.contains(e.target);
            
            if (!isClickInside) {
                console.log('외부 클릭으로 편집 취소');
                this.editingIndex = null;
                document.removeEventListener('click', handleClickOutside);
                renderMessages();
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
            if (newText) {
                state.messages[index].chatMessage = newText;
            }
            this.editingIndex = null;
            document.removeEventListener('click', handleClickOutside);
            renderMessages();
        });

        // 취소 버튼 클릭 이벤트
        cancelButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('취소 버튼 클릭');
            this.editingIndex = null;
            document.removeEventListener('click', handleClickOutside);
            renderMessages();
        });

        // 삭제 버튼 클릭 이벤트
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('삭제 버튼 클릭');
            const confirmDelete = confirm('정말로 이 메시지를 삭제하시겠습니까?');
            if (confirmDelete) {
                state.messages.splice(index, 1);
                this.editingIndex = null;
                document.removeEventListener('click', handleClickOutside);
                renderMessages();
            }
        });

        // Enter (저장) / Escape (취소) 키 이벤트
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                console.log('Enter 키로 저장');
                const newText = textarea.value.trim();
                if (newText) {
                    state.messages[index].chatMessage = newText;
                }
                this.editingIndex = null;
                document.removeEventListener('click', handleClickOutside);
                renderMessages();
            }
            if (e.key === 'Escape') {
                console.log('Escape 키로 취소');
                this.editingIndex = null;
                document.removeEventListener('click', handleClickOutside);
                renderMessages();
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
    },
    
    /**
     * 편집 취소 함수
     * @param {Function} renderMessages - 메시지 다시 렌더링 함수
     */
    cancelEdit: function(renderMessages) {
        if (this.editingIndex !== null) {
            this.editingIndex = null;
            renderMessages();
        }
    },
    
    /**
     * 현재 편집 중인 메시지 확인
     * @returns {number|null} 편집 중인 메시지 인덱스 또는 null
     */
    getEditingIndex: function() {
        return this.editingIndex;
    }
};

// 전역 변수로 노출
window.EditManager = EditManager;

// 콘솔에 로드 확인 메시지 출력
console.log('EditManager 모듈이 성공적으로 로드되었습니다.');