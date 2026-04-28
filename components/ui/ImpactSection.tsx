'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const TARGET = 10365;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function ImpactSection() {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  const rightColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rightColRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const eased = easeOut(t);
            setCount(Math.round(eased * TARGET));
            if (t < 1) {
              requestAnimationFrame(tick);
            }
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="impact-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: '280px',
        overflow: 'hidden',
      }}
    >
      {/* Left column: photo */}
      <div
        className="impact-photo"
        style={{ position: 'relative', minHeight: '280px' }}
      >
        <Image
          src="/images/donor.jpg"
          alt="Donor in the Dominican Republic"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          onError={() => {/* silently ignore missing image */}}
        />
        {/* Fallback background if image missing */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: '#E8EDF5',
          zIndex: -1,
        }} />
      </div>

      {/* Right column: stats */}
      <div
        ref={rightColRef}
        style={{
          background: 'white',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <p style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          color: '#C8102E',
          letterSpacing: '0.12em',
          margin: '0 0 10px',
        }}>
          TRUSTED ACROSS THE DR
        </p>

        <p style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#2B2F36',
          letterSpacing: '-0.04em',
          margin: '0 0 8px',
          lineHeight: 1,
        }}>
          {count.toLocaleString('en-US')}
        </p>

        <p style={{
          fontSize: '13px',
          color: '#767676',
          maxWidth: '280px',
          lineHeight: 1.6,
          margin: '0 0 20px',
        }}>
          people have used Impulso to donate directly to their preferred political candidate
        </p>

        {/* Stat pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['RD$12.4M raised', '47 campaigns', 'avg. RD$435'].map((pill) => (
            <span key={pill} style={{
              background: '#F6F6F4',
              fontSize: '10px',
              fontWeight: 600,
              color: '#2B2F36',
              padding: '4px 12px',
              borderRadius: '20px',
            }}>
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
