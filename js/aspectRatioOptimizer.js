// /js/aspectRatioOptimizer.js - 비율 유지 이미지 최적화

/**
 * 비율 유지 이미지 최적화 모듈
 * 이미지 비율을 유지하면서 고정된 최적 설정으로 압축
 */
const AspectRatioOptimizer = {
    /**
     * 이미지 최적화 (비율 유지)
     * @param {string} imageDataUrl - 원본 이미지 URL
     * @param {boolean} isImportant - 중요 사용자 여부
     * @returns {Promise<string>} 최적화된 이미지 URL
     */
    optimizeImage: async function(imageDataUrl, isImportant = false) {
        if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
            return imageDataUrl;
        }
        
        // 기존 압축 형식 복원
        let sourceUrl = imageDataUrl;
        if (imageDataUrl.includes('LZSTR:') || imageDataUrl.includes('OPTIMIZE:') || imageDataUrl.includes('LZPROF:')) {
            if (typeof ImageCompressor !== 'undefined' && ImageCompressor) {
                sourceUrl = ImageCompressor.decompressImageUrl(imageDataUrl);
            } else if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
                sourceUrl = UrlCompressor.decompressImageUrl(imageDataUrl);
            }
        }
        
        try {
            return new Promise((resolve) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    
                    // 고정된 최대 크기 (가로/세로 중 큰 쪽이 이 값으로 제한)
                    const maxSize = 200;
                    
                    // 비율 유지 크기 계산
                    let width, height;
                    
                    if (img.width > img.height) {
                        // 가로가 더 긴 경우
                        width = Math.min(maxSize, img.width);
                        height = Math.round(img.height * (width / img.width));
                    } else {
                        // 세로가 더 길거나 같은 경우
                        height = Math.min(maxSize, img.height);
                        width = Math.round(img.width * (height / img.height));
                    }
                    
                    // 캔버스 크기 설정
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 이미지 그리기 (비율 유지)
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 고정된 최적의 품질 (중요도에 따라 차이)
                    const quality = isImportant ? 0.92 : 0.9;
                    
                    // 최적의 포맷 (WebP 우선, 지원 안되면 JPEG)
                    let optimizedUrl;
                    if (canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
                        optimizedUrl = canvas.toDataURL('image/webp', quality);
                    } else {
                        optimizedUrl = canvas.toDataURL('image/jpeg', quality);
                    }
                    
                    // LZ-String 압축 적용
                    if (typeof ImageCompressor !== 'undefined' && ImageCompressor) {
                        const originalSize = Math.round(optimizedUrl.length / 1024);
                        const compressedUrl = ImageCompressor.compressImageUrl(optimizedUrl);
                        const compressedSize = Math.round(compressedUrl.length / 1024);
                        
                        console.log(`이미지 최적화: ${originalSize}KB → ${compressedSize}KB (${Math.round((1 - compressedSize/originalSize) * 100)}% 감소) [${width}x${height}px]`);
                        
                        resolve(compressedUrl);
                    } else if (typeof UrlCompressor !== 'undefined' && UrlCompressor) {
                        resolve(UrlCompressor.compressImageUrl(optimizedUrl));
                    } else {
                        resolve(optimizedUrl);
                    }
                };
                
                img.onerror = () => {
                    console.error('이미지 로드 실패');
                    resolve(sourceUrl);
                };
                
                img.src = sourceUrl;
            });
        } catch (error) {
            console.error('이미지 최적화 실패:', error);
            return sourceUrl; // 실패 시 원본 반환
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
    }
};

// 전역 변수로 노출
window.AspectRatioOptimizer = AspectRatioOptimizer;

console.log('비율 유지 이미지 최적화 모듈이 로드되었습니다.');