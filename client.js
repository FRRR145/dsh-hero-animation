/**
 * dsh-hero-animation — animated capsule field for the DeepSeek Harness
 * new-session ("hero") screen.
 *
 * Renders on the conversation.hero.frame slot: a fixed, pointer-events:none
 * canvas at z-index -1, drawn with Canvas 2D.
 */
window.__ModuleLoader__.load({
  id: 'dsh-hero-animation',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    function DotsFrame(props) {
      const canvasRef = React.useRef(null);
      const hero = props.hero;

      React.useEffect(function () {
        if (!hero) return undefined;
        const canvas = canvasRef.current;
        if (!canvas || !canvas.getContext) return undefined;
        const context = canvas.getContext('2d');
        if (!context) return undefined;

        let raf = 0;
        let running = true;
        let width = 0;
        let height = 0;
        const PALETTE = ['#2f5cff', '#9d4bff', '#00e0b8', '#ffb020', '#ff3d7f', '#00a8ff', '#ff6a3d'];
        const COUNT = 84;
        const FIELD_RADIUS = 330;
        const FIELD_SQUASH = 0.9;
        const BASE_SIZE = 3.4;
        const INNER_RADIUS = 29;
        const MAX_WANDER = 8;
        const WAVE_SPEED = 2.0;
        const WAVE_K = 0.012;
        const WAVE_AMP = 15;
        const pointer = { x: window.innerWidth / 2, y: window.innerHeight * 0.45 };
        const target = { x: pointer.x, y: pointer.y };
        const dots = [];

        const GOLDEN = Math.PI * (3 - Math.sqrt(5));
        function makeDot(angle, radius) {
          return {
            angle: angle,
            radius: radius + (Math.random() - 0.5) * 1.5,
            spin: (Math.random() - 0.5) * 0.06,
            size: 1,
            tint: (Math.random() - 0.5) * 0.1,
            color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
            rotate: Math.random() * Math.PI,
            phase: Math.random() * Math.PI * 2,
            rate: 0.3 + Math.random() * 0.7,
            alpha: 0.45 + Math.random() * 0.45,
            wobble: 4,
            follow: 0.012 + Math.random() * 0.055,
            pulseRate: 0.35 + Math.random() * 1.1,
            pulsePhase: Math.random() * Math.PI * 2,
            flowRate: 0.08 + Math.random() * 0.5,
            flowPhase: Math.random() * Math.PI * 2,
            flowAmp: 7,
            flow2Rate: 0.3 + Math.random() * 1.4,
            flow2Phase: Math.random() * Math.PI * 2,
            flow2Amp: 4,
            tanRate: 0.06 + Math.random() * 0.6,
            tanPhase: Math.random() * Math.PI * 2,
            tanAmp: 0.002,
          };
        }


        function resize() {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          width = window.innerWidth;
          height = window.innerHeight;
          canvas.width = Math.max(1, Math.floor(width * dpr));
          canvas.height = Math.max(1, Math.floor(height * dpr));
          canvas.style.width = width + 'px';
          canvas.style.height = height + 'px';
          context.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        (function buildRings() {
          const spacing = 68;
          let ringIndex = 0;
          let radius = INNER_RADIUS + 6;
          while (radius < FIELD_RADIUS && dots.length < COUNT) {
            const circumference = 2 * Math.PI * radius * 0.86;
            const capacity = Math.max(1, Math.round(circumference / spacing));
            for (let k = 0; k < capacity && dots.length < COUNT; k++) {
              const angle = (k / capacity) * Math.PI * 2 + ringIndex * GOLDEN;
              dots.push(makeDot(angle, radius));
            }
            ringIndex++;
            radius += spacing * 0.82;
          }
        })();

        function isDark() {
          const value = getComputedStyle(document.body).backgroundColor || '';
          const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
          if (!match) return true;
          const luminance = (0.2126 * Number(match[1]) + 0.7152 * Number(match[2]) + 0.0722 * Number(match[3])) / 255;
          return luminance < 0.5;
        }

        const STOPS = [
          [0.0, 255, 48, 48],
          [0.18, 240, 40, 96],
          [0.4, 255, 150, 30],
          [0.58, 206, 84, 196],
          [0.7, 130, 110, 255],
          [1.0, 74, 132, 246]
        ];
        function rampColor(t) {
          const x = Math.min(0.9999, Math.max(0, t));
          let index = 0;
          while (index < STOPS.length - 2 && x > STOPS[index + 1][0]) index++;
          const a = STOPS[index];
          const b = STOPS[index + 1];
          const span = (b[0] - a[0]) || 1;
          const f = Math.min(1, Math.max(0, (x - a[0]) / span));
          return 'rgb(' + Math.round(a[1] + (b[1] - a[1]) * f)
            + ',' + Math.round(a[2] + (b[2] - a[2]) * f)
            + ',' + Math.round(a[3] + (b[3] - a[3]) * f) + ')';
        }

        function capsule(x, y, size, angle, color, alpha) {
          const w = size * 3.1;
          const h = size * 1.0;
          const r = h / 2;
          context.save();
          context.globalAlpha = alpha;
          context.translate(x, y);
          context.rotate(angle);
          context.fillStyle = color;
          context.beginPath();
          context.moveTo(-w / 2 + r, -h / 2);
          context.arcTo(w / 2, -h / 2, w / 2, h / 2, r);
          context.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
          context.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r);
          context.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r);
          context.closePath();
          context.fill();
          context.restore();
        }

        let last = performance.now();
        let elapsed = 0;
        function frame(now) {
          if (!running) return;
          const delta = Math.min(64, now - last) / 1000;
          last = now;
          elapsed += delta;
          pointer.x += (target.x - pointer.x) * 0.075;
          pointer.y += (target.y - pointer.y) * 0.075;
          context.clearRect(0, 0, width, height);
          const dark = isDark();
          const base = dark ? 1 : 0.95;
          const lightness = dark ? 64 : 52;
          for (const dot of dots) {
            dot.cx = pointer.x;
            dot.cy = pointer.y;
            const breathe = 1 + 0.01 * Math.sin(elapsed * 0.72);
            const wavePhase = elapsed * WAVE_SPEED - dot.radius * WAVE_K;
            const wave = Math.sin(wavePhase);
            const radius2 = Math.max(INNER_RADIUS, dot.radius * breathe + wave * WAVE_AMP);
            const spread = Math.min(1, radius2 / FIELD_RADIUS);
            const angle2 = dot.angle + elapsed * 0.045
              + Math.sin(elapsed * dot.tanRate + dot.tanPhase) * dot.tanAmp;
            const px = dot.cx + Math.cos(angle2) * radius2;
            const py = dot.cy + Math.sin(angle2) * radius2 * FIELD_SQUASH;
            const rawLive = Math.min(1, Math.hypot(px - target.x, py - target.y) / FIELD_RADIUS);
            dot.live = dot.live === undefined ? rawLive : dot.live + (rawLive - dot.live) * 0.3;
            const radialScale = 0.34 + 0.8 * Math.sin(Math.PI * dot.live);
            const baseSize = BASE_SIZE * radialScale;
            const weight = Math.min(1, baseSize / (BASE_SIZE * 1.12));
            const amp = 0.58 * (1 - 0.33 * weight);
            const ripple = 1 + amp * Math.sin(wavePhase + 0.9);
            dot.px = px;
            dot.py = py;
            dot.psize = baseSize * ripple;
            dot.palpha = dot.alpha * (0.45 + 0.55 * Math.abs(ripple)) * base * (1 - 0.45 * spread);
            dot.pradial = Math.atan2(Math.sin(angle2) * FIELD_SQUASH, Math.cos(angle2));
            dot.pspread = spread;
          }

          for (const dot of dots) {
            if (dot.palpha <= 0.012) continue;
            const x = dot.px;
            const y = dot.py;
            const spread = dot.pspread;
            const fieldA = Math.sin(x * 0.011 + elapsed * 0.95)
              + Math.sin(y * 0.0098 - elapsed * 0.78)
              + Math.sin((x + y) * 0.0082 + elapsed * 0.52)
              + Math.sin((x - y) * 0.019 + elapsed * 0.66) * 0.8;
            const mixed = 0.5 + fieldA * 0.3 + (spread - 0.5) * 0.14 + dot.tint;
            const tone = Math.min(1, Math.max(0, 0.5 + 0.5 * Math.tanh((mixed - 0.5) * 2.8)));
            capsule(x, y, dot.psize, dot.pradial, rampColor(tone), dot.palpha);
          }

          raf = requestAnimationFrame(frame);
        }
        raf = requestAnimationFrame(frame);

        function onMove(event) {
          target.x = event.clientX;
          target.y = event.clientY;
        }
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('resize', resize);
        return function () {
          running = false;
          cancelAnimationFrame(raf);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('resize', resize);
        };
      }, [hero]);

      const children = props.children === undefined ? null : props.children;
      if (!hero) return children;
      return h(React.Fragment, null,
        h('canvas', {
          ref: canvasRef,
          'aria-hidden': 'true',
          style: {
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: -1,
          },
        }),
        children);
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.hero.frame', function () {
          return ctx.slots.register({
            name: 'conversation.hero.frame',
            id: 'hero-animation',
            order: 100,
          }, DotsFrame);
        });
      },
    };
  },
});
