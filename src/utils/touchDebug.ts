// 手機觸控除錯：網址加 ?debug=touch 打開（記在這台瀏覽器，?debug=off 關掉）。
// 左上角一塊小面板：畫面尺寸、方向、全螢幕狀態、搖桿的位置，和最近幾個觸控／指標事件打到哪個元素。只給排查手機問題用。
const KEY = 'focus_island_touch_debug';

function enabled(): boolean {
  const param = new URLSearchParams(window.location.search).get('debug');
  try {
    if (param === 'touch') localStorage.setItem(KEY, '1');
    if (param === 'off') localStorage.removeItem(KEY);
    return localStorage.getItem(KEY) === '1';
  } catch {
    return param === 'touch';
  }
}

function describe(el: Element | null): string {
  if (!el) return '(none)';
  const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 3).join('.') : '';
  return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`.slice(0, 48);
}

function rect(el: Element | null): string {
  if (!el) return '-';
  const r = el.getBoundingClientRect();
  return `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
}

export function installTouchDebug(): void {
  if (typeof window === 'undefined' || !enabled()) return;
  const panel = document.createElement('pre');
  panel.style.cssText =
    'position:fixed;left:4px;top:4px;z-index:2147483647;margin:0;padding:6px;max-width:92vw;background:rgba(0,0,0,.82);color:#7CFC9A;font:10px/1.35 ui-monospace,monospace;pointer-events:none;white-space:pre-wrap;border-radius:6px';
  document.body.appendChild(panel);
  const events: string[] = [];
  let lastMoveAt = 0;

  const state = () => {
    const vv = window.visualViewport;
    const rotor = document.querySelector('.scene-rotor');
    const stick = document.querySelector('.scene-box .\\!rounded-full');
    return [
      `win ${innerWidth}x${innerHeight} scr ${screen.width}x${screen.height} ${screen.orientation?.type ?? ''}`,
      `vv ${vv ? `${Math.round(vv.width)}x${Math.round(vv.height)} s${vv.scale.toFixed(2)} off${Math.round(vv.offsetLeft)},${Math.round(vv.offsetTop)}` : '-'} scrollY ${Math.round(scrollY)}`,
      `standalone ${String((navigator as Navigator & { standalone?: boolean }).standalone ?? matchMedia('(display-mode: standalone)').matches)} fsEl ${describe(document.fullscreenElement)}`,
      `rotor ${rotor ? rotor.className.replace(/scene-rotor--/g, '').replace('scene-rotor', '').trim() || 'plain' : '-'} ${rect(rotor)}`,
      `stick ${rect(stick)}`,
    ].join('\n');
  };

  const render = () => {
    panel.textContent = `${state()}\n${events.join('\n')}`;
  };

  const log = (event: Event) => {
    const now = performance.now();
    if ((event.type === 'pointermove' || event.type === 'touchmove') && now - lastMoveAt < 150) return;
    if (event.type === 'pointermove' || event.type === 'touchmove') lastMoveAt = now;
    let x = 0;
    let y = 0;
    if (event instanceof PointerEvent) {
      x = event.clientX;
      y = event.clientY;
    } else if (event instanceof TouchEvent) {
      const t = event.changedTouches[0];
      x = t?.clientX ?? 0;
      y = t?.clientY ?? 0;
    }
    const hit = document.elementFromPoint(x, y);
    const extra = event instanceof PointerEvent ? ` ${event.pointerType}#${event.pointerId}` : '';
    events.unshift(`${event.type}${extra} @${Math.round(x)},${Math.round(y)} tgt=${describe(event.target as Element)} hit=${describe(hit)}${event.defaultPrevented ? ' prevented' : ''}`);
    events.length = Math.min(events.length, 12);
    render();
  };

  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'touchcancel']) {
    window.addEventListener(type, log, { capture: true, passive: true });
  }
  window.addEventListener('resize', render);
  window.setInterval(render, 1000);
  render();
}
