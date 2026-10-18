import React, { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import "./HeroCarousel.css";
import { lastDay } from "../../lib/eventDates";

const MAX_CARDS = 14;
const BASE_SPEED = 0.35;      // cards per second when idle
const HOVER_MIN_SPEED = 1.5;  // cards per second just outside the front card
const HOVER_MAX_SPEED = 6;    // cards per second at the edge of the stage
const SPINE_ANGLE = 45;       // degrees the side cards are turned relative to the front card
const VISIBLE_RANGE = 6;      // cards shown on each side of the front card
const DRAG_THRESHOLD = 6;     // px before a press becomes a drag instead of a tap

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Round-robin across shuffled categories so every category gets a card before any gets two
function pickEvents(events) {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const byType = new Map();
  for (const e of events) {
    if (!e.img || !e.eventName) continue;
    if (e.date && lastDay(e) < today) continue;
    const type = e.type || "Other";
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type).push(e);
  }
  const queues = shuffle([...byType.values()]).map(shuffle);
  const picked = [];
  while (picked.length < MAX_CARDS && queues.some(q => q.length)) {
    for (const q of queues) {
      if (q.length && picked.length < MAX_CARDS) picked.push(q.pop());
    }
  }
  return picked;
}

const HeroCarousel = ({ events }) => {
  const cards = useMemo(() => pickEvents(events), [events]);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const motion = useRef({
    offset: 0,
    velocity: BASE_SPEED,
    hoverX: null,
    focusIndex: null,
    drag: null,
    suppressClick: false,
  });

  useEffect(() => {
    const stage = stageRef.current;
    const n = cards.length;
    if (!stage || n === 0) return;

    const m = motion.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cardW = 200;
    let stageHalf = 400;
    let visible = true;
    let activeIndex = -1;
    let last = performance.now();
    let raf;

    const measure = () => {
      cardW = cardRefs.current[0]?.offsetWidth || cardW;
      stageHalf = stage.offsetWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(stage);

    // Signed distance from the front, wrapped to [-n/2, n/2)
    const wrap = (d) => ((((d + n / 2) % n) + n) % n) - n / 2;

    const targetVelocity = () => {
      if (m.focusIndex !== null) return 0;
      if (m.hoverX !== null) {
        const ax = Math.abs(m.hoverX);
        if (ax < cardW / 2) return 0;
        const t = Math.min((ax - cardW / 2) / Math.max(stageHalf - cardW / 2, 1), 1);
        return Math.sign(m.hoverX) * (HOVER_MIN_SPEED + t * (HOVER_MAX_SPEED - HOVER_MIN_SPEED));
      }
      return reducedMotion ? 0 : BASE_SPEED;
    };

    const render = () => {
      const frontGap = cardW * 0.85;
      const spineGap = cardW * 0.32;
      const radius = cardW * 2.4;

      for (let i = 0; i < n; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const d = wrap(i - m.offset);
        const a = Math.abs(d);
        const s = Math.sign(d);
        const near = Math.min(a, 1);

        // Lay cards out along a line, then bend that line onto a horizontal ring
        const linear = s * (near * frontGap + Math.max(a - 1, 0) * spineGap);
        const phi = linear / radius;
        const x = radius * Math.sin(phi);
        const z = radius * (Math.cos(phi) - 1) + (1 - near) * cardW * 0.3;
        const rot = -s * near * SPINE_ANGLE;

        el.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rot}deg)`;
        el.style.zIndex = String(100 - Math.round(a * 10));
        el.style.opacity = String(Math.max(0, Math.min(1, VISIBLE_RANGE + 1 - a)));
        // Darker with distance so the back of the ring reads as depth
        el.style.setProperty("--shade", Math.min(near * 0.45 + Math.max(a - 1, 0) * 0.06, 0.8).toFixed(3));
        el.style.visibility = a > VISIBLE_RANGE + 1 ? "hidden" : "visible";
      }

      const front = ((Math.round(m.offset) % n) + n) % n;
      if (front !== activeIndex) {
        cardRefs.current[activeIndex]?.classList.remove("is-front");
        cardRefs.current[front]?.classList.add("is-front");
        activeIndex = front;
      }
    };

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!m.drag?.active) {
        const target = targetVelocity();
        // Faster easing toward hover targets; slower after a drag so momentum carries
        const k = m.hoverX !== null ? 6 : 2;
        m.velocity += (target - m.velocity) * (1 - Math.exp(-dt * k));
        m.offset += m.velocity * dt;

        if (target === 0 && Math.abs(m.velocity) < 0.4) {
          let goal = Math.round(m.offset);
          if (m.focusIndex !== null) goal = m.offset + wrap(m.focusIndex - m.offset);
          m.offset += (goal - m.offset) * (1 - Math.exp(-dt * 8));
        }
      }

      if (visible) render();
      raf = requestAnimationFrame(tick);
    };

    render();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [cards]);

  const pxPerCard = () => (cardRefs.current[0]?.offsetWidth || 200) * 0.5;

  const handlePointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const m = motion.current;
    m.drag = { active: false, startX: e.clientX, startOffset: m.offset, lastX: e.clientX, lastT: performance.now(), v: 0, id: e.pointerId };
    m.suppressClick = false;
  };

  const handlePointerMove = (e) => {
    const m = motion.current;
    const drag = m.drag;

    if (drag && drag.id === e.pointerId) {
      const dx = e.clientX - drag.startX;
      if (!drag.active && Math.abs(dx) > DRAG_THRESHOLD) {
        drag.active = true;
        m.suppressClick = true;
        // Capture only once it is a real drag, so plain taps still reach the card link
        stageRef.current?.setPointerCapture(e.pointerId);
      }
      if (drag.active) {
        const now = performance.now();
        const dtMs = Math.max(now - drag.lastT, 1);
        drag.v = (-(e.clientX - drag.lastX) / pxPerCard()) / (dtMs / 1000);
        drag.lastX = e.clientX;
        drag.lastT = now;
        m.offset = drag.startOffset - dx / pxPerCard();
        return;
      }
    }

    if (e.pointerType === "mouse") {
      const rect = stageRef.current.getBoundingClientRect();
      m.hoverX = e.clientX - (rect.left + rect.width / 2);
    }
  };

  const endDrag = (e) => {
    const m = motion.current;
    if (!m.drag || m.drag.id !== e.pointerId) return;
    if (m.drag.active) {
      // A finger that stopped before lifting shouldn't fling the ring
      const stale = performance.now() - m.drag.lastT > 80;
      m.velocity = stale ? 0 : Math.max(-8, Math.min(8, m.drag.v));
    }
    m.drag = null;
  };

  const handlePointerLeave = (e) => {
    if (e.pointerType === "mouse") motion.current.hoverX = null;
  };

  const handleClickCapture = (e) => {
    if (motion.current.suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      motion.current.suppressClick = false;
    }
  };

  if (cards.length === 0) return null;

  return (
    <div
      className="hero-carousel"
      ref={stageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={handlePointerLeave}
      onClickCapture={handleClickCapture}
    >
      <div className="hero-carousel-ring">
        {cards.map((event, i) => (
          <Link
            key={event.id}
            to={`event/${event.id}`}
            className="hero-carousel-card"
            ref={el => { cardRefs.current[i] = el; }}
            draggable={false}
            // Keyboard focus only — a mouse press also focuses, and that shouldn't freeze the ring
            onFocus={e => { if (e.currentTarget.matches(":focus-visible")) motion.current.focusIndex = i; }}
            onBlur={() => { motion.current.focusIndex = null; }}
          >
            <img
              src={event.img}
              alt=""
              draggable={false}
              onError={e => { e.currentTarget.style.display = "none"; }}
            />
            <span className="hero-carousel-name">{event.eventName}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
