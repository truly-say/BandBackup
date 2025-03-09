// /js/urlCompressor.js - URL 압축 및 데이터 처리 유틸리티

/**
 * URL 압축 및 문자열 압축을 위한 유틸리티
 */
const UrlCompressor = {
    /**
     * 문자열 압축 함수 (간소화된 버전)
     * @param {string} input - 압축할 문자열 (예: 긴 Base64 텍스트)
     * @returns {string} 압축된 문자열
     */
    compress: function(input) {
        if (!input) return '';
        
        try {
            // Base64 데이터에서 반복되는 패턴 찾기
            // 단순한 반복 구간 압축 방식 사용
            const result = [];
            let i = 0;
            
            while (i < input.length) {
                // 현재 위치에서 반복 탐색 (최소 4글자 이상부터 의미있음)
                let found = false;
                
                // 이미 처리한 부분에서 반복 패턴 찾기
                if (i > 4) {
                    // 최대 12글자까지 패턴 검색 (너무 긴 패턴은 효율성 떨어짐)
                    for (let len = 4; len <= 12 && i + len <= input.length; len++) {
                        const pattern = input.substring(i, i + len);
                        const prevIndex = input.substring(0, i).lastIndexOf(pattern);
                        
                        if (prevIndex >= 0) {
                            // 반복 패턴 발견: (거리, 길이) 쌍으로 저장
                            const distance = i - prevIndex;
                            // 최대 127까지만 저장 (2진으로 인코딩)
                            if (distance < 127 && len < 127) {
                                result.push('⟨' + String.fromCharCode(distance) + 
                                           String.fromCharCode(len) + '⟩');
                                i += len;
                                found = true;
                                break;
                            }
                        }
                    }
                }
                
                if (!found) {
                    // 반복 패턴 없으면 문자 그대로 추가
                    result.push(input[i]);
                    i++;
                }
            }
            
            return result.join('');
        } catch (error) {
            console.error('압축 중 오류 발생:', error);
            return input; // 압축 실패 시 원본 반환
        }
    },
    
    /**
     * 압축 해제 함수
     * @param {string} compressed - 압축된 문자열
     * @returns {string} 원본 문자열
     */
    decompress: function(compressed) {
        if (!compressed) return '';
        
        try {
            // 반복 패턴 복원
            let result = '';
            let i = 0;
            
            while (i < compressed.length) {
                if (compressed[i] === '⟨' && i + 3 < compressed.length && compressed[i + 3] === '⟩') {
                    // 압축 패턴 발견: (거리, 길이) 복원
                    const distance = compressed.charCodeAt(i + 1);
                    const length = compressed.charCodeAt(i + 2);
                    
                    // 이전에 나온 패턴 복사
                    const start = result.length - distance;
                    for (let j = 0; j < length; j++) {
                        result += result[start + j];
                    }
                    
                    i += 4; // 패턴 건너뛰기
                } else {
                    // 일반 문자는 그대로 추가
                    result += compressed[i];
                    i++;
                }
            }
            
            return result;
        } catch (error) {
            console.error('압축 해제 중 오류 발생:', error);
            return compressed; // 압축 해제 실패 시 원본 반환
        }
    },
    
    /**
     * 정규식에서 사용되는 특수 문자 이스케이프 처리
     * @param {string} str - 이스케이프할 문자열
     * @returns {string} 이스케이프된 문자열
     */
    escapeRegExp: function(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $&는 일치한 문자열 전체를 의미
    },
    
    /**
     * 효율적인 단축 데이터 URL 생성 (내부적인 최적화)
     * @param {string} base64Image - Base64 인코딩된 이미지 데이터
     * @returns {string} 최적화된 Data URL
     */
    createOptimizedUrl: function(base64Image) {
        if (!base64Image) return '';
        
        try {
            // Base64 다이어트: 불필요한 부분 제거 및 효율적인 인코딩
            // 1. 중복되는 패턴 점수 계산
            const patternScores = {};
            for (let i = 0; i < base64Image.length - 8; i++) {
                const pattern = base64Image.substr(i, 8);
                if (!patternScores[pattern]) {
                    // 패턴이 얼마나 자주 등장하는지 계산
                    const regex = new RegExp(this.escapeRegExp(pattern), 'g');
                    const matches = base64Image.match(regex);
                    if (matches && matches.length > 1) {
                        patternScores[pattern] = matches.length * pattern.length;
                    }
                }
            }
            
            // 2. 점수가 높은 패턴부터 특수 문자로 대체
            let optimizedData = base64Image;
            const replacements = {};
            let specialCharCode = 128; // ASCII 범위 밖의 문자 사용
            
            Object.entries(patternScores)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 30) // 최대 30개만 처리
                .forEach(([pattern, score]) => {
                    const specialChar = String.fromCharCode(specialCharCode++);
                    // 정규식 특수 문자 이스케이프 처리
                    const escapedPattern = this.escapeRegExp(pattern);
                    optimizedData = optimizedData.replace(new RegExp(escapedPattern, 'g'), specialChar);
                    replacements[specialChar] = pattern;
                });
            
            // 3. 교체 정보 + 최적화된 데이터 형태로 저장
            const replacementStr = Object.entries(replacements)
                .map(([char, pattern]) => char + pattern)
                .join('');
            
            return "📦" + replacementStr + "📦" + optimizedData;
        } catch (error) {
            console.error('최적화된 URL 생성 실패:', error);
            return base64Image; // 실패 시 원본 반환
        }
    },
    
    /**
     * 최적화된 데이터 URL 복원
     * @param {string} optimizedUrl - 최적화된 데이터 URL
     * @returns {string} 원본 데이터 URL
     */
    restoreOptimizedUrl: function(optimizedUrl) {
        if (!optimizedUrl || !optimizedUrl.startsWith('📦')) {
            return optimizedUrl; // 최적화되지 않은 URL은 그대로 반환
        }
        
        try {
            // 1. 교체 정보와 데이터 분리
            const parts = optimizedUrl.split('📦');
            if (parts.length < 3) {
                return optimizedUrl; // 잘못된 형식이면 원본 반환
            }
            
            const replacementStr = parts[1];
            let restoredData = parts[2];
            
            // 2. 교체 정보 파싱
            const replacements = {};
            let i = 0;
            while (i < replacementStr.length) {
                if (i + 8 < replacementStr.length) {
                    // 특수 문자 + 8자 패턴
                    const specialChar = replacementStr[i];
                    const pattern = replacementStr.substr(i + 1, 8);
                    replacements[specialChar] = pattern;
                    i += 9;
                } else {
                    break;
                }
            }
            
            // 3. 특수 문자를 원래 패턴으로 복원
            Object.entries(replacements).forEach(([specialChar, pattern]) => {
                // 정규식 특수 문자가 있는 경우 이스케이프 처리
                const escapedChar = this.escapeRegExp(specialChar);
                restoredData = restoredData.replace(new RegExp(escapedChar, 'g'), pattern);
            });
            
            return restoredData;
        } catch (error) {
            console.error('최적화된 URL 복원 실패:', error);
            return optimizedUrl; // 실패 시 원본 반환
        }
    },
    
    /**
     * Base64 문자열을 URL 안전한 형식으로 변환
     * @param {string} base64Str - 표준 Base64 문자열
     * @returns {string} URL 안전한 Base64 문자열
     */
    base64ToBase64Url: function(base64Str) {
        if (!base64Str) return '';
        return base64Str
            .replace(/\+/g, '-')  // '+' → '-'
            .replace(/\//g, '_')  // '/' → '_'
            .replace(/=+$/, '');  // 끝의 '=' 패딩 제거
    },
    
    /**
     * URL 안전한 Base64에서 표준 Base64로 변환
     * @param {string} base64Url - URL 안전한 Base64 문자열
     * @returns {string} 표준 Base64 문자열
     */
    base64UrlToBase64: function(base64Url) {
        if (!base64Url) return '';
        
        // 필요한 패딩 추가
        let base64 = base64Url
            .replace(/-/g, '+')  // '-' → '+'
            .replace(/_/g, '/'); // '_' → '/'
            
        // 패딩 추가
        while (base64.length % 4) {
            base64 += '=';
        }
        
        return base64;
    },
    
    /**
     * 이미지 URL 압축 (Base64 이미지 최적화)
     * @param {string} imageDataUrl - 이미지 Data URL
     * @returns {string} 압축된 URL
     */
    compressImageUrl: function(imageDataUrl) {
        // Data URL 형식인지 확인
        if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
            return imageDataUrl; // 압축 불가능한 형식이면 원본 반환
        }

        try {
            // 헤더와 데이터 부분 분리
            const [header, base64Data] = imageDataUrl.split(',');
            
            if (!base64Data) {
                console.warn('유효하지 않은 이미지 데이터 URL');
                return imageDataUrl;
            }
            
            // 효율적인 단축 URL 생성
            const optimizedData = this.createOptimizedUrl(base64Data);
            
            // 최적화 식별자와 함께 압축된 데이터 반환
            return `${header},OPTIMIZE:${optimizedData}`;
        } catch (error) {
            console.error('이미지 URL 압축 중 오류 발생:', error);
            return imageDataUrl; // 압축 실패 시 원본 반환
        }
    },
    
    /**
     * 압축된 이미지 URL 복원
     * @param {string} compressedImageUrl - 압축된 이미지 URL
     * @returns {string} 원본 이미지 Data URL
     */
    decompressImageUrl: function(compressedImageUrl) {
        // 압축된 URL인지 확인
        if (!compressedImageUrl) {
            return compressedImageUrl;
        }
        
        try {
            // OPTIMIZE 형식 처리
            if (compressedImageUrl.includes('OPTIMIZE:')) {
                // 헤더와 압축된 데이터 부분 분리
                const [header, compressedData] = compressedImageUrl.split(',');
                
                // 압축 식별자 제거
                const cleanCompressedData = compressedData.replace('OPTIMIZE:', '');
                
                // 최적화된 데이터 복원
                const originalBase64 = this.restoreOptimizedUrl(cleanCompressedData);
                
                // 원본 Data URL 반환
                return `${header},${originalBase64}`;
            }
            
            // NOCOMPRESS 형식 처리
            if (compressedImageUrl.includes('NOCOMPRESS:')) {
                return compressedImageUrl.replace('NOCOMPRESS:', '');
            }
            
            // LZPROF 형식 처리 (이전 버전 호환성)
            if (compressedImageUrl.includes('LZPROF:')) {
                // 헤더와 압축된 데이터 부분 분리
                const [header, compressedData] = compressedImageUrl.split(',');
                
                // 압축 식별자 제거
                const cleanCompressedData = compressedData.replace('LZPROF:', '');
                
                // URL 안전한 Base64에서 일반 Base64로 변환
                const base64CompressedData = this.base64UrlToBase64(cleanCompressedData);
                
                // 압축 해제
                const originalBase64 = this.decompress(base64CompressedData);
                
                // 원본 Data URL 반환
                return `${header},${originalBase64}`;
            }
            
            // 압축되지 않은 경우 원본 반환
            return compressedImageUrl;
        } catch (error) {
            console.error('이미지 URL 복원 중 오류 발생:', error);
            return compressedImageUrl; // 복원 실패 시 원본 반환
        }
    },
    
    /**
     * 모든 이미지 압축해제 (내보내기용)
     * @param {string} html - 압축된 이미지가 포함된 HTML
     * @returns {string} 압축 해제된 이미지가 포함된 HTML
     */
    decompressAllImages: function(html) {
        if (!html) return html;
        
        try {
            // OPTIMIZE 형식 처리
            html = html.replace(/data:[^,]+,OPTIMIZE:([^"']+)/g, (match, p1) => {
                try {
                    const originalBase64 = this.restoreOptimizedUrl(p1);
                    return `data:image/jpeg;base64,${originalBase64}`;
                } catch (error) {
                    return match; // 오류 시 원본 유지
                }
            });
            
            // NOCOMPRESS 형식 처리
            html = html.replace(/data:[^,]+,NOCOMPRESS:([^"']+)/g, (match, p1) => {
                return `data:image/jpeg;base64,${p1}`;
            });
            
            // LZPROF 압축된 이미지 URL 패턴 찾기
            html = html.replace(/(data:[^,]+,LZPROF:[^"']+)/g, (match) => {
                try {
                    return this.decompressImageUrl(match);
                } catch (error) {
                    return match; // 실패 시 원본 유지
                }
            });
            
            return html;
        } catch (error) {
            console.error('HTML 내 이미지 압축 해제 중 오류:', error);
            return html; // 실패 시 원본 HTML 반환
        }
    }
};

// 전역 변수로 노출
window.UrlCompressor = UrlCompressor;

console.log('UrlCompressor 모듈이 성공적으로 로드되었습니다.');