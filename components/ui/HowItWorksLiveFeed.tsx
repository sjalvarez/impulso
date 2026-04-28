'use client';

import { useEffect, useRef, useState } from 'react';

const donors = [
  { initials: 'CM', name: 'Carlos M.', amount: '+RD$500', time: '2m ago' },
  { initials: 'AL', name: 'Ana L.', amount: '+RD$1,200', time: '5m ago' },
  { initials: 'RD', name: 'Ramón D.', amount: '+RD$750', time: '12m ago' },
];

export default function HowItWorksLiveFeed() {
  const [rowOpacity, setRowOpacity] = useState([1, 0, 0]);
  const [rowTranslate, setRowTranslate] = useState([0, 8, 8]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function runCycle() {
      setRowOpacity([1, 0, 0]);
      setRowTranslate([0, 8, 8]);

      timerRef.current = setTimeout(() => {
        setRowOpacity([1, 1, 0]);
        setRowTranslate([0, 0, 8]);

        timerRef.current = setTimeout(() => {
          setRowOpacity([1, 1, 1]);
          setRowTranslate([0, 0, 0]);

          timerRef.current = setTimeout(() => {
            setRowOpacity([0, 0, 0]);
            setRowTranslate([0, 0, 0]);

            timerRef.current = setTimeout(() => {
              runCycle();
            }, 600);
          }, 1800);
        }, 1200);
      }, 1200);
    }

    runCycle();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(35,10,10,0.88)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '36px 40px',
    }}>
      {/* Top label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#16A34A',
          boxShadow: '0 0 6px #16A34A',
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.55)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
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
            gap: '12px',
            padding: '12px 0',
            borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            opacity: rowOpacity[i],
            transform: `translateY(${rowTranslate[i]}px)`,
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: 'white',
            flexShrink: 0,
          }}>
            {donor.initials}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'white', flex: 1 }}>
            {donor.name}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#4ADE80', marginLeft: 'auto' }}>
            {donor.amount}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>
            {donor.time}
          </span>
        </div>
      ))}

      {/* Stat row */}
      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        {[
          { value: '2,847', label: 'donors' },
          { value: '21 days', label: 'remaining' },
          { value: 'Mayor', label: 'race type' },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
