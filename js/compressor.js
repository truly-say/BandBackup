// /js/compressor.js - 통합 압축 및 이미지 URL 최적화 모듈

const LZString = function() {
    // 라이브러리 코드는 최소화된 버전을 사용
    function o(o, r) {
      if (!t[o]) {
        t[o] = {};
        for (var n = 0; n < o.length; n++) t[o][o.charAt(n)] = n;
      }
      return t[o][r];
    }
    var r = String.fromCharCode,
      n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
      e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$",
      t = {},
      i = {
        compressToBase64: function(o) {
          if (null == o) return "";
          var r = i._compress(o, 6, function(o) {
            return n.charAt(o);
          });
          switch (r.length % 4) {
            default:
            case 0:
              return r;
            case 1:
              return r + "===";
            case 2:
              return r + "==";
            case 3:
              return r + "=";
          }
        },
        decompressFromBase64: function(r) {
          return null == r ? "" : "" == r ? null : i._decompress(r.length, 32, function(e) {
            return o(n, r.charAt(e));
          });
        },
        compressToUTF16: function(o) {
          return null == o ? "" : i._compress(o, 15, function(o) {
            return r(o + 32);
          }) + " ";
        },
        decompressFromUTF16: function(o) {
          return null == o ? "" : "" == o ? null : i._decompress(o.length, 16384, function(r) {
            return o.charCodeAt(r) - 32;
          });
        },
        compressToUint8Array: function(o) {
          for (var r = i.compress(o), n = new Uint8Array(2 * r.length), e = 0, t = r.length; e < t; e++) {
            var s = r.charCodeAt(e);
            n[2 * e] = s >>> 8, n[2 * e + 1] = s % 256;
          }
          return n;
        },
        decompressFromUint8Array: function(o) {
          if (null == o) return i.decompress(o);
          for (var n = new Array(o.length / 2), e = 0, t = n.length; e < t; e++) n[e] = 256 * o[2 * e] + o[2 * e + 1];
          var s = [];
          return n.forEach(function(o) {
            s.push(r(o));
          }), i.decompress(s.join(""));
        },
        compressToEncodedURIComponent: function(o) {
          return null == o ? "" : i._compress(o, 6, function(o) {
            return e.charAt(o);
          });
        },
        decompressFromEncodedURIComponent: function(r) {
          return null == r ? "" : "" == r ? null : (r = r.replace(/ /g, "+"), i._decompress(r.length, 32, function(n) {
            return o(e, r.charAt(n));
          }));
        },
        compress: function(o) {
          return i._compress(o, 16, function(o) {
            return r(o);
          });
        },
        _compress: function(o, r, n) {
          if (null == o) return "";
          var e, t, i, s = {},
            p = {},
            u = "",
            c = "",
            a = "",
            l = 2,
            f = 3,
            h = 2,
            d = [],
            m = 0,
            v = 0;
          for (i = 0; i < o.length; i += 1)
            if (u = o.charAt(i), Object.prototype.hasOwnProperty.call(s, u) || (s[u] = f++, p[u] = !0), c = a + u, Object.prototype.hasOwnProperty.call(s, c)) a = c;
            else {
              if (Object.prototype.hasOwnProperty.call(p, a)) {
                if (a.charCodeAt(0) < 256) {
                  for (e = 0; e < h; e++) m = m << 1, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++;
                  for (t = a.charCodeAt(0), e = 0; e < 8; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
                } else {
                  for (t = 1, e = 0; e < h; e++) m = m << 1 | t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0;
                  for (t = a.charCodeAt(0), e = 0; e < 16; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
                }
                0 == --l && (l = Math.pow(2, h), h++), delete p[a];
              } else
                for (t = s[a], e = 0; e < h; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
              0 == --l && (l = Math.pow(2, h), h++), s[c] = f++, a = String(u);
            }
          if ("" !== a) {
            if (Object.prototype.hasOwnProperty.call(p, a)) {
              if (a.charCodeAt(0) < 256) {
                for (e = 0; e < h; e++) m = m << 1, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++;
                for (t = a.charCodeAt(0), e = 0; e < 8; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
              } else {
                for (t = 1, e = 0; e < h; e++) m = m << 1 | t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = 0;
                for (t = a.charCodeAt(0), e = 0; e < 16; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
              }
              0 == --l && (l = Math.pow(2, h), h++), delete p[a];
            } else
              for (t = s[a], e = 0; e < h; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
            0 == --l && (l = Math.pow(2, h), h++);
          }
          for (t = 2, e = 0; e < h; e++) m = m << 1 | 1 & t, v == r - 1 ? (v = 0, d.push(n(m)), m = 0) : v++, t = t >> 1;
          for (;;) {
            if (m = m << 1, v == r - 1) {
              d.push(n(m));
              break;
            }
            v++;
          }
          return d.join("");
        },
        decompress: function(o) {
          return null == o ? "" : "" == o ? null : i._decompress(o.length, 32768, function(r) {
            return o.charCodeAt(r);
          });
        },
        _decompress: function(o, n, e) {
          var t, i, s, p, u, c, a, l = [],
            f = 4,
            h = 4,
            d = 3,
            m = "",
            v = [],
            g = {
              val: e(0),
              position: n,
              index: 1
            };
          for (t = 0; t < 3; t += 1) l[t] = t;
          for (s = 0, u = Math.pow(2, 2), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
          switch (s) {
            case 0:
              for (s = 0, u = Math.pow(2, 8), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
              a = r(s);
              break;
            case 1:
              for (s = 0, u = Math.pow(2, 16), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
              a = r(s);
              break;
            case 2:
              return "";
          }
          for (l[3] = a, i = a, v.push(a);;) {
            if (g.index > o) return "";
            for (s = 0, u = Math.pow(2, d), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
            switch (a = s) {
              case 0:
                for (s = 0, u = Math.pow(2, 8), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
                l[h++] = r(s), a = h - 1, f--;
                break;
              case 1:
                for (s = 0, u = Math.pow(2, 16), c = 1; c != u;) p = g.val & g.position, g.position >>= 1, 0 == g.position && (g.position = n, g.val = e(g.index++)), s |= (p > 0 ? 1 : 0) * c, c <<= 1;
                l[h++] = r(s), a = h - 1, f--;
                break;
              case 2:
                return v.join("");
            }
            if (0 == f && (f = Math.pow(2, d), d++), l[a]) m = l[a];
            else {
              if (a !== h) return null;
              m = i + i.charAt(0);
            }
            v.push(m), l[h++] = i + m.charAt(0), i = m, 0 == --f && (f = Math.pow(2, d), d++);
          }
        }
      };
    return i;
  }();

/**
 * 통합 압축 모듈 - 이미지 URL 압축 및 데이터 최적화
 */
const Compressor = {
    /**
     * 이미지 URL 압축 (LZ-String 사용)
     * @param {string} imageDataUrl - 이미지 Data URL
     * @returns {string} 압축된 URL
     */
    compressImageUrl: function(imageDataUrl) {
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
            
            // LZ-String으로 압축 (URL 안전 버전 사용)
            const compressedData = LZString.compressToEncodedURIComponent(base64Data);
            
            // 압축 식별자와 함께 압축된 데이터 반환
            return `${header},LZSTR:${compressedData}`;
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
        if (!compressedImageUrl) {
            return compressedImageUrl;
        }
        
        try {
            // LZSTR 형식 처리
            if (compressedImageUrl.includes('LZSTR:')) {
                // 헤더와 압축된 데이터 부분 분리
                const [header, compressedData] = compressedImageUrl.split(',');
                
                // 압축 식별자 제거
                const cleanCompressedData = compressedData.replace('LZSTR:', '');
                
                // LZ-String으로 압축 해제
                const originalBase64 = LZString.decompressFromEncodedURIComponent(cleanCompressedData);
                
                // 원본 Data URL 반환
                return `${header},${originalBase64}`;
            }
            
            // 기존 형식 처리 (이전 버전 호환성)
            if (compressedImageUrl.includes('OPTIMIZE:')) {
                const [header, compressedData] = compressedImageUrl.split(',');
                const cleanCompressedData = compressedData.replace('OPTIMIZE:', '');
                return `${header},${cleanCompressedData}`;
            }
            
            if (compressedImageUrl.includes('NOCOMPRESS:')) {
                return compressedImageUrl.replace('NOCOMPRESS:', '');
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
            // LZSTR 형식 처리
            html = html.replace(/data:[^,]+,LZSTR:([^"']+)/g, (match, p1) => {
                try {
                    const originalBase64 = LZString.decompressFromEncodedURIComponent(p1);
                    return `data:image/jpeg;base64,${originalBase64}`;
                } catch (error) {
                    return match; // 오류 시 원본 유지
                }
            });
            
            // 기존 형식 처리 (이전 버전 호환성)
            html = html.replace(/data:[^,]+,OPTIMIZE:([^"']+)/g, (match, p1) => {
                return `data:image/jpeg;base64,${p1}`;
            });
            
            html = html.replace(/data:[^,]+,NOCOMPRESS:([^"']+)/g, (match, p1) => {
                return `data:image/jpeg;base64,${p1}`;
            });
            
            return html;
        } catch (error) {
            console.error('HTML 내 이미지 압축 해제 중 오류:', error);
            return html; // 실패 시 원본 HTML 반환
        }
    },
    
    /**
     * 이미지의 Data URL 크기 계산 (KB 단위)
     * @param {string} dataUrl - 이미지 Data URL
     * @returns {number} 크기 (KB)
     */
    getDataUrlSize: function(dataUrl) {
        if (!dataUrl) return 0;
        // Base64 부분만 추출
        const base64 = dataUrl.split(',')[1];
        if (!base64) return 0;
        
        // Base64 디코딩 후 바이트 수 계산
        const decodedSize = atob(base64).length;
        // KB 단위로 변환 (소수점 1자리)
        return Math.round(decodedSize / 1024 * 10) / 10;
    },
    
    /**
     * 압축률 계산
     * @param {string} originalUrl - 원본 이미지 URL
     * @param {string} compressedUrl - 압축된 이미지 URL
     * @returns {number} 압축률 (%)
     */
    getCompressionRatio: function(originalUrl, compressedUrl) {
        const originalSize = this.getDataUrlSize(originalUrl);
        const compressedSize = this.getDataUrlSize(compressedUrl);
        
        if (originalSize === 0) return 0;
        
        // 압축률 계산 (%) - 높을수록 좋음
        return Math.round((1 - compressedSize / originalSize) * 100);
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
    }
};

// 전역 변수로 노출 - 기존 호환성 유지
window.LZString = LZString;
window.UrlCompressor = Compressor;
window.ImageCompressor = Compressor;

console.log('통합 압축 모듈이 성공적으로 로드되었습니다.');