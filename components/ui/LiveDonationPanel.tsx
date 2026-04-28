'use client';

import { useEffect, useRef, useState } from 'react';

const donors = [
  { initials: 'CM', name: 'Carlos M.', amount: '+RD$500', time: '2m ago' },
  { initials: 'AL', name: 'Ana L.', amount: '+RD$1,200', time: '5m ago' },
  { initials: 'RD', name: 'Ramón D.', amount: '+RD$750', time: '12m ago' },
];

export default function LiveDonationPanel() {
  const [rowOpacity, setRowOpacity] = useState([1, 0, 0]);
  const [rowTranslate, setRowTranslate] = useState([0, 8, 8]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function runCycle() {
      // Reset: only row 0 visible
      setRowOpacity([1, 0, 0]);
      setRowTranslate([0, 8, 8]);

      timerRef.current = setTimeout(() => {
        // Row 1 fades in
        setRowOpacity([1, 1, 0]);
        setRowTranslate([0, 0, 8]);

        timerRef.current = setTimeout(() => {
          // Row 2 fades in
          setRowOpacity([1, 1, 1]);
          setRowTranslate([0, 0, 0]);

          timerRef.current = setTimeout(() => {
            // Fade all out
            setRowOpacity([0, 0, 0]);
            setRowTranslate([0, 0, 0]);

            timerRef.current = setTimeout(() => {
              runCycle();
            }, 600);
          }, 1800); // 4200 - 2400
        }, 1200); // 2400 - 1200
      }, 1200);
    }

    runCycle();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div style={{
      background: 'rgba(35,10,10,0.82)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      padding: '20px 24px',
      minWidth: '320px',
      maxWidth: '340px',
      width: '100%',
    }}>
      {/* Sample pill */}
      <div style={{ marginBottom: '10px' }}>
        <span style={{
          fontSize: '9px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.4)',
          background: 'rgba(255,255,255,0.08)',
          border: '0.5px solid rgba(255,255,255,0.12)',
          padding: '2px 8px',
          borderRadius: '20px',
          display: 'inline-flex',
        }}>
          ✦ Sample data
        </span>
      </div>

      {/* Live label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '10px',
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#16A34A',
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          LIVE DONATIONS
        </span>
      </div>

      {/* Donor rows */}
      {donors.map((donor, i) => (
        <div
          key={donor.initials}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 0',
            borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none',
            opacity: rowOpacity[i],
            transform: `translateY(${rowTranslate[i]}px)`,
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 600,
            color: 'white',
            flexShrink: 0,
          }}>
            {donor.initials}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'white', flex: 1 }}>
            {donor.name}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#4ADE80', marginLeft: 'auto' }}>
            {donor.amount}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginLeft: '6px' }}>
            {donor.time}
          </span>
        </div>
      ))}

      {/* Stat row */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: '10px',
        marginTop: '8px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
      }}>
        {[
          { value: '2,847', label: 'donors' },
          { value: '21 days', label: 'remaining' },
          { value: 'Mayor campaign', label: 'race type' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {stat.value}
            </span>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
