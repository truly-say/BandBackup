// js/parsers/Roll20Parser.js
// Roll20 textchatcontainer HTML 파서
// 사용법: F12 → #textchat div 우클릭 → Copy outerHTML → 붙여넣기

class Roll20Parser {
  constructor() {
    this.name  = 'roll20';
    this.label = '롤20';
  }

  canParse(text) {
    if (!text || typeof text !== 'string') return false;
    return (
      text.includes('textchatcontainer') ||
      text.includes('class="message general') ||
      text.includes('class="message desc') ||
      (text.includes('class="message') && text.includes('tstamp'))
    );
  }

  parse(chatData) {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(chatData, 'text/html');
    const msgs   = doc.querySelectorAll('.message');

    const messages  = [];
    let lastSpeaker = null;
    let lastTime    = null;
    let lastAvatar  = null;

    for (const div of msgs) {
      if (div.classList.contains('hidden-message')) continue;

      // ── GM 지문 (desc) ──────────────────────────────────────
      if (div.classList.contains('desc')) {
        const html = this._extractDescHtml(div);
        if (!html) continue;
        // chatMessage는 순수 텍스트로 (편집 시 기본 표시용)
        const descText = div.textContent.replace(/\s+/g, ' ').trim();
        messages.push({
          time:        lastTime || '',
          username:    'GM',
          chatMessage: descText || html,
          rawHtml:     html,
          isDesc:      true,
          msgType:     'desc',
        });
        continue;
      }

      // ── 일반 발언 (general) ─────────────────────────────────
      if (div.classList.contains('general')) {
        const byEl  = div.querySelector('.by');
        const tsEl  = div.querySelector('.tstamp');
        const imgEl = div.querySelector('.avatar img');

        const speaker = byEl  ? byEl.textContent.replace(/:$/, '').trim() : lastSpeaker;
        const time    = tsEl  ? tsEl.textContent.trim()                   : lastTime;
        const avatar  = imgEl ? imgEl.getAttribute('src')                 : lastAvatar;

        if (speaker) { lastSpeaker = speaker; lastTime = time; lastAvatar = avatar; }

        // CoC 공격 템플릿 (기준치/굴림/판정/피해)
        const cocAttackTable = div.querySelector('.sheet-rolltemplate-coc-attack-1');
        if (cocAttackTable) {
          const rollHtml = this._extractCocAttackHtml(cocAttackTable);
          if (rollHtml) {
            messages.push({
              time, username: speaker || '', avatarUrl: avatar || null,
              chatMessage: rollHtml, rawHtml: rollHtml,
              isDesc: false, msgType: 'roll',
            });
          }
          const extra = this._extractPlainText(div);
          if (extra) {
            messages.push({
              time, username: speaker || '', avatarUrl: avatar || null,
              chatMessage: extra, rawHtml: null,
              isDesc: false, msgType: 'text',
            });
          }
          continue;
        }

        // 알려진 CoC 주사위 템플릿
        const cocTable = div.querySelector('.sheet-rolltemplate-coc-1');
        if (cocTable) {
          const rollHtml = this._extractCocRollHtml(cocTable);
          if (rollHtml) {
            messages.push({
              time, username: speaker || '', avatarUrl: avatar || null,
              chatMessage: rollHtml, rawHtml: rollHtml,
              isDesc: false, msgType: 'roll',
            });
          }
          // 롤 외 텍스트
          const extra = this._extractPlainText(div);
          if (extra) {
            messages.push({
              time, username: speaker || '', avatarUrl: avatar || null,
              chatMessage: extra, rawHtml: null,
              isDesc: false, msgType: 'text',
            });
          }
          continue;
        }

        // 미지원 커스텀 주사위 템플릿 — 원본 테이블 HTML 보존
        const anyTemplate = div.querySelector('[class*="sheet-rolltemplate-"]');
        if (anyTemplate) {
          const safeHtml = this._extractUnknownRollHtml(anyTemplate);
          messages.push({
            time, username: speaker || '', avatarUrl: avatar || null,
            chatMessage: safeHtml, rawHtml: safeHtml,
            isDesc: false, msgType: 'roll-unknown',
          });
          const extra = this._extractPlainText(div);
          if (extra) {
            messages.push({
              time, username: speaker || '', avatarUrl: avatar || null,
              chatMessage: extra, rawHtml: null,
              isDesc: false, msgType: 'text',
            });
          }
          continue;
        }

        // 인라인 롤 (단독)
        const inlineRoll = div.querySelector('.inlinerollresult');
        if (inlineRoll) {
          const rollVal   = inlineRoll.textContent.trim();
          const extraText = this._extractPlainText(div);
          const combined  = extraText
            ? `${this._esc(extraText)} <span class="r20-inline-roll">${this._esc(rollVal)}</span>`
            : `<span class="r20-inline-roll">${this._esc(rollVal)}</span>`;
          messages.push({
            time, username: speaker || '', avatarUrl: avatar || null,
            chatMessage: combined, rawHtml: combined,
            isDesc: false, msgType: 'inline-roll',
          });
          continue;
        }

        // 일반 텍스트: chatMessage는 순수 텍스트, rawHtml은 HTML
        const html = this._extractGeneralHtml(div);
        if (!html) continue;
        const plainText = this._extractPlainText(div) || html;
        messages.push({
          time, username: speaker || '', avatarUrl: avatar || null,
          chatMessage: plainText, rawHtml: html,
          isDesc: false, msgType: 'text',
        });
      }
    }

    return messages;
  }

  // ── desc 지문: _nodeToHtml 방식으로 인라인 스타일 보존 ────────
  _extractDescHtml(div) {
    // spacer 제거
    const clone = div.cloneNode(true);
    clone.querySelectorAll('.spacer').forEach(el => el.remove());
    const html = this._nodeToHtml(clone, true).trim();
    return html || null;
  }

  // ── 일반 발언: em/strong/a + 인라인 스타일 보존 ──────────────
  _extractGeneralHtml(div) {
    const clone = div.cloneNode(true);
    for (const sel of ['.avatar', '.tstamp', '.by', '.spacer',
                       '[class*="sheet-rolltemplate-"]', '.inlinerollresult']) {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    }
    return this._nodeToHtml(clone, false).trim() || null;
  }

  // ── 텍스트만 (롤 테이블 제외) ────────────────────────────────
  _extractPlainText(div) {
    const clone = div.cloneNode(true);
    for (const sel of ['.avatar', '.tstamp', '.by', '.spacer',
                       '[class*="sheet-rolltemplate-"]', '.inlinerollresult']) {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    }
    return clone.textContent.trim() || null;
  }

  // ── CoC 공격 테이블 (기준치/굴림/판정결과/피해) ───────────────
  _extractCocAttackHtml(tbl) {
    const caption = tbl.querySelector('caption')?.textContent.trim() || '';
    const rows    = tbl.querySelectorAll('tr');
    let base = '', rolled = '', resultText = '', resultBg = '', damage = '', isCrit = false;

    for (const row of rows) {
      const label = row.querySelector('.sheet-template_label')?.getAttribute('data-i18n') || '';
      const valEl = row.querySelector('.sheet-template_value');
      if (!valEl) continue;
      const val = valEl.textContent.trim();
      const bg  = valEl.getAttribute('style') || '';

      if (label === 'value')  base       = val;
      else if (label === 'rolled') rolled = val;
      else if (label === 'result') {
        resultText = valEl.textContent.trim();
        resultBg   = this._extractBgColor(valEl);
        isCrit     = !!valEl.querySelector('[data-i18n="extreme"], [data-i18n="critical"]');
      }
      else if (label === 'dam') damage = val;
    }

    if (!rolled) return null;

    const finalBg = this._normalizeBgColor(resultBg);

    return `<div class="r20-roll">
  <div class="r20-roll-caption">${this._esc(caption)}</div>
  <div class="r20-roll-row"><span class="r20-roll-label">기준치</span><span class="r20-roll-val">${this._esc(base)}</span></div>
  <div class="r20-roll-row"><span class="r20-roll-label">굴림</span><span class="r20-roll-num${isCrit ? ' r20-crit' : ''}">${this._esc(rolled)}</span></div>
  <div class="r20-roll-result" style="background:${finalBg}">${this._esc(resultText)}</div>
  ${damage ? `<div class="r20-roll-row"><span class="r20-roll-label">피해</span><span class="r20-roll-val" style="font-weight:700;color:#fff">${this._esc(damage)}</span></div>` : ''}
</div>`;
  }

  // ── CoC 주사위 테이블 → 커스텀 HTML ──────────────────────────
  _extractCocRollHtml(tbl) {
    const caption = tbl.querySelector('caption')?.textContent.trim() || '';
    const rows    = tbl.querySelectorAll('tr');

    let base = '', rolled = '', resultText = '', resultBg = '', isCrit = false;

    for (const row of rows) {
      const label = row.querySelector('.sheet-template_label')?.textContent.trim() || '';
      const valEl = row.querySelector('.sheet-template_value');
      if (!valEl) continue;
      const val = valEl.textContent.trim();
      const bg  = valEl.getAttribute('style') || '';

      if (label.includes('기준치'))     base       = val;
      else if (label.includes('굴림'))  rolled     = val;
      else if (label.includes('판정결과')) {
        resultText = val;
        resultBg   = this._extractBgColor(valEl);
        isCrit     = !!valEl.querySelector('[data-i18n="critical"], [data-i18n="extreme"]');
      }
    }

    if (!rolled && !resultText) return null;

    const finalBg = this._normalizeBgColor(resultBg);

    return `<div class="r20-roll">
  <div class="r20-roll-caption">${this._esc(caption)}</div>
  <div class="r20-roll-row"><span class="r20-roll-label">기준치</span><span class="r20-roll-val">${this._esc(base)}</span></div>
  <div class="r20-roll-row"><span class="r20-roll-label">굴림</span><span class="r20-roll-num${isCrit ? ' r20-crit' : ''}">${this._esc(rolled)}</span></div>
  <div class="r20-roll-result" style="background:${finalBg}">${this._esc(resultText)}</div>
</div>`;
  }

  // ── 미지원 템플릿: 원본 테이블을 안전하게 보존 ───────────────
  _extractUnknownRollHtml(el) {
    // 위험 속성/스크립트 제거 후 테이블 구조 유지
    const clone = el.cloneNode(true);
    // script, on* 이벤트 제거
    clone.querySelectorAll('script').forEach(s => s.remove());
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      const attrs = [...node.attributes];
      for (const attr of attrs) {
        if (attr.name.startsWith('on')) node.removeAttribute(attr.name);
        if (attr.name === 'style') {
          node.setAttribute('style', this._sanitizeStyle(attr.value));
        }
      }
      node = walker.nextNode();
    }
    return `<div class="r20-roll-unknown">${clone.outerHTML}</div>`;
  }

  // ── 노드 → HTML (인라인 스타일 보존 옵션) ───────────────────
  _nodeToHtml(node, preserveStyle = false) {
    let out = '';
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        out += this._esc(child.textContent);
      } else if (child.nodeType === 1) {
        const tag = child.tagName.toLowerCase();
        const style = preserveStyle ? this._sanitizeStyle(child.getAttribute('style') || '') : '';
        const styleAttr = style ? ` style="${style}"` : '';

        if (tag === 'em')     out += `<em>${this._nodeToHtml(child, preserveStyle)}</em>`;
        else if (tag === 'strong') out += `<strong>${this._nodeToHtml(child, preserveStyle)}</strong>`;
        else if (tag === 'a') {
          const href = child.getAttribute('href') || '';
          const inner = this._nodeToHtml(child, preserveStyle);
          if (href && href !== '#' && /^https?:\/\//.test(href)) {
            out += `<a href="${this._esc(href)}" target="_blank" rel="noopener"${styleAttr}>${inner}</a>`;
          } else if (style) {
            out += `<span${styleAttr}>${inner}</span>`;
          } else {
            out += inner;
          }
        }
        else if (tag === 'br') out += '<br>';
        else if (tag === 'span') {
          out += style ? `<span${styleAttr}>${this._nodeToHtml(child, preserveStyle)}</span>`
                       : this._nodeToHtml(child, preserveStyle);
        }
        else {
          out += this._nodeToHtml(child, preserveStyle);
        }
      }
    }
    return out;
  }

  // ── 배경색 추출 ─────────────────────────────────────────────
  // style 속성 → 클래스명 → 자식 span 순서로 시도
  _extractBgColor(el) {
    if (!el) return '';

    // 1) style 속성에서 background 또는 background-color
    const style = el.getAttribute('style') || '';
    const fromStyle = style.match(/background(?:-color)?\s*:\s*([^;!]+)/i)?.[1]?.trim();
    if (fromStyle) return fromStyle;

    // 2) 자식 요소 중 style에 background 있는 것
    for (const child of el.querySelectorAll('[style]')) {
      const cs = child.getAttribute('style') || '';
      const m = cs.match(/background(?:-color)?\s*:\s*([^;!]+)/i)?.[1]?.trim();
      if (m) return m;
    }

    // 3) 클래스명으로 추정 (green/red/lime 등 포함하는 클래스)
    const cls = (el.className || '') + ' ' + [...el.querySelectorAll('[class]')].map(e=>e.className).join(' ');
    if (/\b(green|lime|success)\b/i.test(cls)) return 'green';
    if (/\b(red|crimson|fail|failure)\b/i.test(cls)) return 'crimson';
    if (/\b(orange|warn)\b/i.test(cls)) return 'orange';

    return '';
  }

  // CSS 색상 이름 → hex 정규화, 알 수 없으면 원본 통과
  _normalizeBgColor(color) {
    if (!color) return '#6b7280'; // 알 수 없음 → 중립 회색
    const map = {
      'lime': '#22c55e', 'lightgreen': '#4ade80',
      'darkgreen': '#15803d', 'green': '#16a34a',
      'crimson': '#dc2626', 'red': '#ef4444',
      'orange': '#f97316', 'darkorange': '#ea580c',
      'gold': '#eab308', 'yellow': '#facc15',
      '#bebebe': '#9ca3af', 'silver': '#9ca3af', 'gray': '#6b7280', 'grey': '#6b7280',
      'black': '#1a1a1a',
    };
    const key = color.toLowerCase().trim();
    return map[key] || color;
  }

  // ── 허용된 CSS 속성만 통과 ──────────────────────────────────
  _sanitizeStyle(style) {
    if (!style) return '';
    const allowed = ['color','font-size','font-weight','font-style',
                     'background','background-color','background-image',
                     'text-decoration','text-align','letter-spacing',
                     'padding','border-radius','display','border',
                     'box-shadow','line-height','margin-left'];
    return style.split(';')
      .map(s => s.trim())
      .filter(s => {
        if (!s) return false;
        const prop = s.split(':')[0].trim().toLowerCase();
        // position:absolute 같은 레이아웃 속성 차단
        if (['position','top','left','right','bottom','width','height',
             'z-index','overflow','pointer-events'].includes(prop)) return false;
        return allowed.some(a => prop.startsWith(a));
      })
      .join(';');
  }

  _esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
}