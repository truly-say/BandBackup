// /js/imageHandler.js - 이미지 처리 및 최적화 모듈

/**
 * 이미지 핸들러 모듈 - 이미지 처리 및 최적화
 */
const ImageHandler = {
    // 기본 설정
    settings: {
        profileImageSize: 500,  
        quality: 0.75,         
        compressImages: true   // 이미지 압축 사용 여부
    },

    /**
     * 이미지 설정 업데이트
     * @param {Object} newSettings - 새 설정 객체
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
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
                
                // 통합 이미지 최적화 프로세서 사용 (있는 경우)
                let optimizedImageUrl;
                if (typeof OptimizedImageProcessor !== 'undefined') {
                    // 내 메시지 사용자는 더 높은 품질로 처리
                    const isImportant = true; // 업로드 시에는 기본적으로 중요하게 처리
                    optimizedImageUrl = await OptimizedImageProcessor.optimizeImage(imageDataUrl, isImportant);
                } else {
                    // 기존 최적화 사용
                    optimizedImageUrl = await this.optimizeImage(imageDataUrl);
                }
                
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
     * @returns {Promise<string>} 최적화된 이미지 URL
     */
    optimizeImage(imageDataUrl) {
        return new Promise((resolve, reject) => {
            try {
                // 이미 압축된 이미지인지 확인
                if (imageDataUrl && (
                    imageDataUrl.includes('LZSTR:') || 
                    imageDataUrl.includes('LZPROF:') || 
                    imageDataUrl.includes('OPTIMIZE:') ||
                    imageDataUrl.includes('NOCOMPRESS:')
                )) {
                    return resolve(imageDataUrl);
                }
                
                // 빈 이미지 확인
                if (!imageDataUrl || imageDataUrl === '') {
                    return resolve('');
                }
                
                // 이미지 로드
                const img = new Image();
                img.src = imageDataUrl;
                
                img.onload = () => {
                    try {
                        // 고정 크기 및 품질 사용
                        const maxSize = 500; // 500x500 고정
                        const imageQuality = 0.9; // 90% 품질 고정
                        
                        // 캔버스에 이미지 그리기 (정사각형 크롭)
                        const canvas = document.createElement('canvas');
                        canvas.width = maxSize;
                        canvas.height = maxSize;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        
                        // 정사각형으로 중앙 부분 크롭
                        const size = Math.min(img.width, img.height);
                        const offsetX = (img.width - size) / 2;
                        const offsetY = (img.height - size) / 2;
                        
                        ctx.drawImage(
                            img, 
                            offsetX, offsetY, size, size, 
                            0, 0, maxSize, maxSize
                        );
                        
                        // 이미지 형식 및 품질 설정 (WebP 우선)
                        let optimizedUrl;
                        if (canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
                            // WebP 지원 시
                            optimizedUrl = canvas.toDataURL('image/webp', imageQuality);
                        } else {
                            // WebP 미지원 시 JPEG 사용
                            optimizedUrl = canvas.toDataURL('image/jpeg', imageQuality);
                        }
                        
                        // 이미지 압축 적용
                        if (this.settings.compressImages) {
                            // LZ-String 압축 우선 사용 (사용 가능한 경우)
                            if (typeof ImageCompressor !== 'undefined' && ImageCompressor) {
                                const compressedUrl = ImageCompressor.compressImageUrl(optimizedUrl);
                                
                                // 압축률 로깅 (디버그용)
                                const originalSize = (optimizedUrl.length / 1024).toFixed(1);
                                const compressedSize = (compressedUrl.length / 1024).toFixed(1);
                                const ratio = Math.round((1 - compressedUrl.length / optimizedUrl.length) * 100);
                                console.log(`이미지 압축: ${originalSize}KB → ${compressedSize}KB (${ratio}% 감소)`);
                                
                                resolve(compressedUrl);
                            } 
                            // 기존 UrlCompressor 폴백
                            else if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
                                resolve(UrlCompressor.compressImageUrl(optimizedUrl));
                            }
                            // 압축 라이브러리 없으면 최적화만 적용
                            else {
                                resolve(optimizedUrl);
                            }
                        } else {
                            // 압축 없이 최적화된 URL 반환
                            resolve(optimizedUrl);
                        }
                    } catch (error) {
                        console.error('이미지 최적화 처리 실패:', error);
                        // 최적화 실패 시 원본 반환
                        resolve(imageDataUrl);
                    }
                };
                
                img.onerror = (error) => {
                    console.error('이미지 로드 실패:', error);
                    reject(error);
                };
            } catch (error) {
                console.error('이미지 최적화 중 예외 발생:', error);
                reject(error);
            }
        });
    },

    /**
     * 압축된 이미지 URL 복원
     * @param {string} compressedImageUrl - 압축된 이미지 URL
     * @returns {string} 복원된 이미지 URL
     */
    decompressImageUrl(compressedImageUrl) {
        // LZ-String 압축 형식 우선 확인
        if (typeof ImageCompressor !== 'undefined' && ImageCompressor && 
            compressedImageUrl && compressedImageUrl.includes('LZSTR:')) {
            return ImageCompressor.decompressImageUrl(compressedImageUrl);
        }
        
        // 기존 압축 형식 처리 (폴백)
        if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
            return UrlCompressor.decompressImageUrl(compressedImageUrl);
        }
        
        return compressedImageUrl;
    },

    /**
     * 모든 이미지 압축 해제
     * @param {string} html - 압축된 이미지가 포함된 HTML
     * @returns {string} 압축 해제된 HTML
     */
    decompressAllImages(html) {
        if (typeof ImageCompressor !== 'undefined' && ImageCompressor) {
            return ImageCompressor.decompressAllImages(html);
        }
        
        if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
            return UrlCompressor.decompressAllImages(html);
        }
        
        return html;
    },

    /**
     * 향상된 드래그 앤 드롭 설정 - 웹 이미지도 처리
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
        
        // 드롭 이벤트 - 파일과 웹 이미지 모두 처리
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.classList.remove('drag-over');
            
            // 1. 파일 확인 (로컬 파일 드래그)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                
                // 이미지 파일 확인
                if (file.type.startsWith('image/')) {
                    // 이미지 처리 로직 호출 (내부 이미지)
                    this.processUploadedImage(file, previewElement, onComplete);
                    return;
                } else {
                    alert('이미지 파일만 업로드 가능합니다.');
                    return;
                }
            }
            
            // 2. 웹 이미지 URL 확인 (웹페이지에서 드래그)
            let imageUrl = null;
            
            // HTML 이미지에서 드래그한 경우
            if (e.dataTransfer.getData('text/html')) {
                const html = e.dataTransfer.getData('text/html');
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const img = tempDiv.querySelector('img');
                
                if (img && img.src) {
                    imageUrl = img.src;
                }
            }
            
            // 이미지 URL을 직접 드래그한 경우
            if (!imageUrl && e.dataTransfer.getData('text/uri-list')) {
                imageUrl = e.dataTransfer.getData('text/uri-list');
            }
            
            // 일반 텍스트로 URL을 드래그한 경우 (fallback)
            if (!imageUrl && e.dataTransfer.getData('text/plain')) {
                const text = e.dataTransfer.getData('text/plain');
                // URL 형식 체크
                if (text.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) || 
                    text.match(/^https?:\/\/(i\.imgur\.com|i\.ibb\.co)\/.+$/i)) {
                    imageUrl = text;
                }
            }
            
            // 이미지 URL이 있으면 외부 이미지로 처리
            if (imageUrl) {
                // 미리보기 이미지 표시
                previewElement.innerHTML = '';
                const img = document.createElement('img');
                img.src = imageUrl;
                previewElement.appendChild(img);
                
                // 완료 콜백 호출 (외부 URL 그대로 사용)
                if (typeof onComplete === 'function') {
                    onComplete(imageUrl);
                }
                
                if (typeof UIManager !== 'undefined' && UIManager) {
                    UIManager.showStatusMessage('웹 이미지가 외부 링크로 적용되었습니다', false);
                }
            } else {
                alert('이미지를 찾을 수 없습니다. 다른 이미지를 시도해보세요.');
            }
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