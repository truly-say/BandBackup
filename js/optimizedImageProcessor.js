// /js/optimizedImageProcessor.js - 통합 이미지 최적화 프로세서

/**
 * 최적화된 이미지 처리기 - 여러 최적화 모듈을 통합
 */
const OptimizedImageProcessor = {
    // 기본 설정
    settings: {
        size: 500,             // 프로필 이미지 크기 (500x500px)
        quality: 0.9,         // 이미지 품질 (90%)
        forceSquare: true,    // 정사각형 강제 적용
        useWebP: true,        // WebP 형식 사용 (지원 시)
        antialias: true       // 안티앨리어싱 적용
    },

    /**
     * 설정 업데이트
     * @param {Object} newSettings - 새 설정 객체
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        console.log('이미지 최적화 설정 업데이트:', this.settings);
    },

    /**
     * 모든 사용자 이미지 최적화
     * @param {Object} state - 애플리케이션 상태 (사용자 이미지 포함)
     * @returns {Promise<void>} 완료 Promise
     */
    async optimizeAllUserImages(state) {
        if (!state || !state.userProfileImages) return;

        const promises = [];
        const userCount = Object.keys(state.userProfileImages).length;

        console.log(`총 ${userCount}명의 사용자 이미지 최적화 시작...`);

        for (const [username, imageUrl] of Object.entries(state.userProfileImages)) {
            if (!imageUrl) continue; // 빈 이미지 스킵

            // 내 메시지 사용자 여부 확인
            const isMyMessage = state.selectedUsers && state.selectedUsers.has(username);

            // 이미지 최적화 작업 추가
            const promise = this.optimizeImage(imageUrl, isMyMessage)
                .then(optimizedUrl => {
                    state.userProfileImages[username] = optimizedUrl;
                    return { username, success: true };
                })
                .catch(error => {
                    console.error(`${username} 이미지 최적화 실패:`, error);
                    return { username, success: false, error };
                });

            promises.push(promise);
        }

        // 모든 이미지 최적화 완료 대기
        try {
            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;
            console.log(`이미지 최적화 완료: ${successCount}/${results.length} 성공`);
        } catch (error) {
            console.error('이미지 일괄 최적화 중 오류 발생:', error);
        }
    },

    /**
 * 이미지 최적화 처리 (크기 최소화 중심)
 * @param {string} imageDataUrl - 원본 이미지 Data URL
 * @param {boolean} isImportant - 중요 이미지 여부
 * @returns {Promise<string>} 최적화된 이미지 URL
 */
    async optimizeImage(imageDataUrl, isImportant = false) {
        if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
            return imageDataUrl; // 유효하지 않은 이미지는 그대로 반환
        }

        // 이미 압축된 이미지는 다시 압축하지 않음
        if (imageDataUrl.includes('LZSTR:') ||
            imageDataUrl.includes('OPTIMIZE:') ||
            imageDataUrl.includes('LZPROF:')) {
            return imageDataUrl;
        }

        try {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    // 임시 설정 - 중요 이미지는 약간 더 높은 품질
                    const quality = isImportant ? 0.85 : this.settings.quality;
                    const size = this.settings.size;

                    // 캔버스 생성
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;

                    // 정사각형 크롭 적용 (중앙에서)
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = this.settings.antialias;
                    ctx.imageSmoothingQuality = 'high';

                    // 원본 이미지 비율 계산
                    const aspectRatio = img.width / img.height;
                    let sourceX, sourceY, sourceWidth, sourceHeight;

                    if (aspectRatio > 1) {
                        // 가로가 더 긴 이미지
                        sourceHeight = img.height;
                        sourceWidth = sourceHeight;
                        sourceX = (img.width - sourceWidth) / 2;
                        sourceY = 0;
                    } else {
                        // 세로가 더 긴 이미지
                        sourceWidth = img.width;
                        sourceHeight = sourceWidth;
                        sourceX = 0;
                        sourceY = (img.height - sourceHeight) / 2;
                    }

                    // 이미지 그리기 (정사각형 중앙 부분만)
                    ctx.drawImage(
                        img,
                        sourceX, sourceY, sourceWidth, sourceHeight,
                        0, 0, size, size
                    );

                    // 최적의 포맷 선택 (WebP 우선)
                    let optimizedUrl;
                    if (this.settings.useWebP && canvas.toDataURL('image/webp').startsWith('data:image/webp')) {
                        optimizedUrl = canvas.toDataURL('image/webp', quality);
                    } else {
                        // WebP 지원 안 되면 JPEG 사용
                        optimizedUrl = canvas.toDataURL('image/jpeg', quality);
                    }

                    // 원본과 압축 후 크기 비교
                    const originalSize = (imageDataUrl.length / 1024).toFixed(1);
                    const optimizedSize = (optimizedUrl.length / 1024).toFixed(1);

                    // 실제로 압축이 되었는지 확인
                    if (parseFloat(optimizedSize) < parseFloat(originalSize)) {
                        console.log(`이미지 최적화: ${originalSize}KB → ${optimizedSize}KB (${Math.round((1 - optimizedSize / originalSize) * 100)}% 감소) [${size}x${size}px]`);

                        // 압축 성공 시 반환
                        if (typeof ImageCompressor !== 'undefined' && ImageCompressor) {
                            const compressedUrl = ImageCompressor.compressImageUrl(optimizedUrl);
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

                img.onerror = () => {
                    console.error('이미지 로드 실패');
                    resolve(imageDataUrl); // 로드 실패 시 원본 반환
                };

                img.src = imageDataUrl;
            });
        } catch (error) {
            console.error('이미지 최적화 중 오류:', error);
            return imageDataUrl; // 오류 시 원본 반환
        }
    }
};

// 전역 변수로 노출
window.OptimizedImageProcessor = OptimizedImageProcessor;

console.log('통합 이미지 최적화 프로세서가 로드되었습니다.');