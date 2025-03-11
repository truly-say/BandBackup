// /js/imageHandler.js - 통합 이미지 처리 및 최적화 모듈

/**
 * 이미지 핸들러 모듈 - 이미지 처리, 최적화, 압축 기능을 통합
 */
const ImageHandler = {
    // 기본 설정
    settings: {
        profileImageSize: 500,    // 프로필 이미지 크기
        quality: 0.75,            // 이미지 품질
        compressImages: true,     // 이미지 압축 사용 여부
        useWebP: true,            // WebP 형식 사용 (지원 시)
        forceSquare: true,        // 정사각형 강제 적용
        antialias: true           // 안티앨리어싱 적용
    },

    /**
     * 이미지 설정 업데이트
     * @param {Object} newSettings - 새 설정 객체
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('이미지 처리 설정 업데이트:', this.settings);
    },

    /**
     * 업로드된 이미지 처리
     * @param {File} file - 업로드된 이미지 파일
     * @param {HTMLElement} previewElement - 이미지 미리보기 요소
     * @param {Function} onComplete - 처리 완료 콜백 함수
     */
    processUploadedImage(file, previewElement, onComplete) {
        // 이미지 타입 확인
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }
        
        const reader = new FileReader();
        
        // 로딩 표시
        if (typeof UIManager !== 'undefined' && UIManager) {
            UIManager.toggleLoadingOverlay(true, '이미지 처리 중...');
        }
        
        reader.onload = async (e) => {
            try {
                // 이미지 데이터 URL
                const imageDataUrl = e.target.result;
                
                // 미리보기 이미지 표시
                previewElement.innerHTML = '';
                const img = document.createElement('img');
                img.src = imageDataUrl;
                previewElement.appendChild(img);
                
                // 이미지 최적화 처리
                const isImportant = true; // 업로드 시에는 기본적으로 중요하게 처리
                const optimizedImageUrl = await this.optimizeImage(imageDataUrl, isImportant);
                
                // 완료 콜백 호출
                if (typeof onComplete === 'function') {
                    onComplete(optimizedImageUrl);
                }
            } catch (error) {
                console.error('이미지 처리 중 오류 발생:', error);
                alert('이미지 처리 중 오류가 발생했습니다.');
            } finally {
                // 로딩 표시 숨김
                if (typeof UIManager !== 'undefined' && UIManager) {
                    UIManager.toggleLoadingOverlay(false);
                }
            }
        };
        
        reader.onerror = () => {
            console.error('파일 읽기 실패');
            alert('파일을 읽는 중 오류가 발생했습니다.');
            if (typeof UIManager !== 'undefined' && UIManager) {
                UIManager.toggleLoadingOverlay(false);
            }
        };
        
        // 파일 읽기 시작
        reader.readAsDataURL(file);
    },

    /**
     * 이미지 최적화 함수 (사이즈 및 품질 조정)
     * @param {string} imageDataUrl - 이미지 Data URL
     * @param {boolean} isImportant - 중요 이미지 여부
     * @returns {Promise<string>} 최적화된 이미지 URL
     */
    optimizeImage(imageDataUrl, isImportant = false) {
        // 이미 압축된 이미지는 다시 압축하지 않음
        if (!imageDataUrl || 
            imageDataUrl.includes('LZSTR:') || 
            imageDataUrl.includes('OPTIMIZE:') ||
            imageDataUrl.includes('NOCOMPRESS:')) {
            return Promise.resolve(imageDataUrl);
        }
        
        // 외부 URL 처리
        if (imageDataUrl.startsWith('http')) {
            return Promise.resolve(imageDataUrl);
        }
        
        try {
            return new Promise((resolve) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    
                    // 품질 설정 - 중요도에 따라 차이
                    const quality = isImportant ? 0.9 : this.settings.quality;
                    
                    // 이미지 크기 및 비율 계산
                    let size, width, height;
                    if (this.settings.forceSquare) {
                        // 정사각형 이미지로 변환 (중앙 크롭)
                        size = Math.min(img.width, img.height);
                        canvas.width = this.settings.profileImageSize;
                        canvas.height = this.settings.profileImageSize;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = this.settings.antialias;
                        ctx.imageSmoothingQuality = 'high';
                        
                        // 정사각형으로 중앙 부분 크롭
                        const offsetX = (img.width - size) / 2;
                        const offsetY = (img.height - size) / 2;
                        
                        ctx.drawImage(
                            img, 
                            offsetX, offsetY, size, size, 
                            0, 0, canvas.width, canvas.height
                        );
                    } else {
                        // 비율 유지 (가로/세로 중 큰 쪽이 기준)
                        if (img.width > img.height) {
                            width = Math.min(this.settings.profileImageSize, img.width);
                            height = Math.round(img.height * (width / img.width));
                        } else {
                            height = Math.min(this.settings.profileImageSize, img.height);
                            width = Math.round(img.width * (height / img.height));
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = this.settings.antialias;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                    }
                    
                    // 이미지 형식 선택 (WebP 우선)
                    let optimizedUrl;
                    if (this.settings.useWebP && canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
                        optimizedUrl = canvas.toDataURL('image/webp', quality);
                    } else {
                        optimizedUrl = canvas.toDataURL('image/jpeg', quality);
                    }
                    
                    // 압축 전/후 크기 계산
                    const originalSize = (imageDataUrl.length / 1024).toFixed(1);
                    const optimizedSize = (optimizedUrl.length / 1024).toFixed(1);
                    
                    // 실제로 최적화가 되었는지 확인
                    if (parseFloat(optimizedSize) < parseFloat(originalSize)) {
                        console.log(`이미지 최적화: ${originalSize}KB → ${optimizedSize}KB (${Math.round((1 - optimizedSize / originalSize) * 100)}% 감소)`);
                        
                        // 압축 적용
                        if (this.settings.compressImages && typeof LZString !== 'undefined') {
                            // LZ-String 압축 적용
                            const [header, base64Data] = optimizedUrl.split(',');
                            const compressedData = LZString.compressToEncodedURIComponent(base64Data);
                            const compressedUrl = `${header},LZSTR:${compressedData}`;
                            
                            const compressedSize = (compressedUrl.length / 1024).toFixed(1);
                            console.log(`추가 압축: ${optimizedSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize / optimizedSize) * 100)}% 감소)`);
                            
                            resolve(compressedUrl);
                        } else {
                            resolve(optimizedUrl);
                        }
                    } else {
                        // 최적화가 실패했다면 원본 반환
                        console.log(`이미지 최적화 실패: ${originalSize}KB → ${optimizedSize}KB (원본 유지)`);
                        resolve(imageDataUrl);
                    }
                };
                
                img.onerror = (error) => {
                    console.error('이미지 로드 실패:', error);
                    resolve(imageDataUrl); // 로드 실패 시 원본 반환
                };
                
                img.src = imageDataUrl;
            });
        } catch (error) {
            console.error('이미지 최적화 중 오류:', error);
            return Promise.resolve(imageDataUrl); // 오류 시 원본 반환
        }
    },

    /**
     * 압축된 이미지 URL 복원
     * @param {string} compressedImageUrl - 압축된 이미지 URL
     * @returns {string} 복원된 이미지 URL
     */
    decompressImageUrl(compressedImageUrl) {
        if (!compressedImageUrl) return compressedImageUrl;
        
        try {
            // LZSTR 형식 처리
            if (compressedImageUrl.includes('LZSTR:') && typeof LZString !== 'undefined') {
                // 헤더와 압축된 데이터 부분 분리
                const [header, compressedData] = compressedImageUrl.split(',');
                
                // 압축 식별자 제거
                const cleanCompressedData = compressedData.replace('LZSTR:', '');
                
                // LZ-String으로 압축 해제
                const originalBase64 = LZString.decompressFromEncodedURIComponent(cleanCompressedData);
                
                // 원본 Data URL 반환
                return `${header},${originalBase64}`;
            }
            
            // 기타 압축 형식 처리 (이전 버전 호환성)
            if (compressedImageUrl.includes('OPTIMIZE:') || 
                compressedImageUrl.includes('NOCOMPRESS:')) {
                // 간단한 압축 해제 (식별자만 제거)
                return compressedImageUrl.replace(/(?:OPTIMIZE:|NOCOMPRESS:)/, '');
            }
            
            // 압축되지 않은 경우 원본 반환
            return compressedImageUrl;
        } catch (error) {
            console.error('이미지 URL 복원 중 오류 발생:', error);
            return compressedImageUrl; // 복원 실패 시 원본 반환
        }
    },
    
    /**
     * 모든 이미지 압축해제 (HTML 내보내기용)
     * @param {string} html - 압축된 이미지가 포함된 HTML
     * @returns {string} 압축 해제된 이미지가 포함된 HTML
     */
    decompressAllImages(html) {
        if (!html) return html;
        
        try {
            // LZSTR 형식 처리
            if (typeof LZString !== 'undefined') {
                html = html.replace(/data:[^,]+,LZSTR:([^"']+)/g, (match, p1) => {
                    try {
                        const originalBase64 = LZString.decompressFromEncodedURIComponent(p1);
                        return `data:image/jpeg;base64,${originalBase64}`;
                    } catch (error) {
                        return match; // 오류 시 원본 유지
                    }
                });
            }
            
            // 기타 압축 형식 처리
            html = html.replace(/data:[^,]+,(?:OPTIMIZE:|NOCOMPRESS:)([^"']+)/g, (match, p1) => {
                return `data:image/jpeg;base64,${p1}`;
            });
            
            return html;
        } catch (error) {
            console.error('HTML 내 이미지 압축 해제 중 오류:', error);
            return html; // 실패 시 원본 HTML 반환
        }
    },

    /**
     * 모든 사용자 이미지 최적화
     * @param {Object} state - 애플리케이션 상태
     * @returns {Promise<void>}
     */
    optimizeAllUserImages: async function(state) {
        if (!state || !state.userProfileImages) return;
        
        const promises = [];
        
        // 각 사용자 이미지 처리
        for (const [username, imageUrl] of Object.entries(state.userProfileImages)) {
            if (!imageUrl) continue;
            
            // 내 메시지 사용자는 중요도 높게 처리
            const isImportant = state.selectedUsers && state.selectedUsers.has(username);
            
            // 최적화 작업 추가
            const promise = this.optimizeImage(imageUrl, isImportant)
                .then(optimizedUrl => {
                    state.userProfileImages[username] = optimizedUrl;
                })
                .catch(error => {
                    console.error(`${username} 이미지 최적화 실패:`, error);
                });
            
            promises.push(promise);
        }
        
        // 모든 처리 완료 대기
        try {
            await Promise.all(promises);
            console.log(`${promises.length}개 이미지 최적화 완료`);
        } catch (error) {
            console.error('이미지 일괄 최적화 중 오류 발생:', error);
        }
    },

    /**
     * 향상된 드래그 앤 드롭 설정
     * @param {HTMLElement} container - 드래그 대상 컨테이너
     * @param {HTMLElement} previewElement - 이미지 미리보기 요소
     * @param {Function} onComplete - 처리 완료 콜백
     */
    setupDragAndDrop(container, previewElement, onComplete) {
        // 드래그 오버 이벤트
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.classList.add('drag-over');
        });
        
        // 드래그 떠남 이벤트
        container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.classList.remove('drag-over');
        });
        
        // 드롭 이벤트 - 파일만 처리
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.classList.remove('drag-over');
            
            // 파일 확인 (로컬 파일 드래그)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                
                // 이미지 파일 확인
                if (file.type.startsWith('image/')) {
                    // 이미지 처리 로직 호출
                    this.processUploadedImage(file, previewElement, onComplete);
                    return;
                } else {
                    alert('이미지 파일만 업로드 가능합니다.');
                    return;
                }
            }
            
            alert('이미지 파일을 드롭해주세요.');
        });
    },
    
    /**
     * 이미지의 Data URL 크기 계산 (KB 단위)
     * @param {string} dataUrl - 이미지 Data URL
     * @returns {number} 크기 (KB)
     */
    getDataUrlSize(dataUrl) {
        if (!dataUrl) return 0;
        // Base64 부분만 추출
        const base64 = dataUrl.split(',')[1];
        if (!base64) return 0;
        
        // Base64 디코딩 후 바이트 수 계산
        const decodedSize = atob(base64).length;
        // KB 단위로 변환 (소수점 1자리)
        return Math.round(decodedSize / 1024 * 10) / 10;
    }
};

// 전역 변수로 노출
window.ImageHandler = ImageHandler;

// 기존 최적화 모듈과의 호환성 유지
window.OptimizedImageProcessor = ImageHandler;
window.AspectRatioOptimizer = ImageHandler;

console.log('통합 이미지 처리 모듈이 로드되었습니다.');