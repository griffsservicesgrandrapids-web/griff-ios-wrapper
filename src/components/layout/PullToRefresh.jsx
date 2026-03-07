import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 80; // px to pull before triggering

export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const isAtTop = () => {
    const el = containerRef.current;
    if (!el) return window.scrollY === 0;
    return el.scrollTop === 0 && window.scrollY === 0;
  };

  useEffect(() => {
    const el = window;

    const onTouchStart = (e) => {
      if (!isAtTop()) return;
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && isAtTop()) {
        setPulling(true);
        setPullY(Math.min(dy * 0.5, THRESHOLD + 20));
      }
    };

    const onTouchEnd = async () => {
      if (pulling && pullY >= THRESHOLD * 0.5) {
        setRefreshing(true);
        setPullY(THRESHOLD * 0.5);
        await onRefresh();
        setRefreshing(false);
      }
      setPulling(false);
      setPullY(0);
      startY.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [pulling, pullY, onRefresh]);

  const progress = Math.min(pullY / (THRESHOLD * 0.5), 1);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Pull indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: pullY,
          overflow: 'hidden',
          transition: pulling ? 'none' : 'height 0.3s ease',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            opacity: progress,
            transform: `scale(${0.5 + progress * 0.5}) rotate(${refreshing ? 0 : progress * 180}deg)`,
            transition: refreshing ? 'none' : 'transform 0.1s linear',
          }}
          className={`w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg ${refreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Content shifted down while pulling */}
      <div style={{ transform: `translateY(${pullY}px)`, transition: pulling ? 'none' : 'transform 0.3s ease' }}>
        {children}
      </div>
    </div>
  );
}