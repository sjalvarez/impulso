'use client';

import { useState, useEffect, useRef } from 'react';

const DONORS = [
  { initials: 'CM', name: 'Carlos M.', amount: '+RD$500', time: '2m ago' },
  { initials: 'AL', name: 'Ana L.', amount: '+RD$1,200', time: '5m ago' },
  { initials: 'RD', name: 'Ramón D.', amount: '+RD$750', time: '12m ago' },
];

const AVATAR_BG = ['#7C3B3B', '#3B5A7C', '#3B7C5A'];

export default function HeroDonationsPanel() {
  const [shown, setShown] = useState([true, false, false]);
  const [exiting, setExiting] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    function cycle() {
      setExiting(false);
      setShown([true, false, false]);
      timers.current.push(setTimeout(() => setShown([true, true, false]), 1200));
      timers.current.push(setTimeout(() => setShown([true, true, true]), 2400));
      timers.current.push(setTimeout(() => {
        setExiting(true);
        setShown([false, false, false]);
        timers.current.push(setTimeout(cycle, 700));
      }, 4200));
    }
    cycle();
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
  }, []);

  const dur = exiting ? '0.35s' : '0.5s';

  return (
    <div style={{
      background: 'rgba(35,10,10,0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '24px 28px',
      width: '100%',
      maxWidth: '340px',
    }}>
      {/* Sample data badge */}
      <div style={{ marginBottom: '14px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '20px', padding: '3px 10px',
          fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.02em',
        }}>
          + Sample data
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '18px' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22C55E', flexShrink: 0, boxShadow: '0 0 6px #22C55E' }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Live Donations
        </span>
      </div>

      {/* Donor rows */}
      {DONORS.map((d, i) => (
        <div
          key={d.initials}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 0',
            borderBottom: i < DONORS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            opacity: shown[i] ? 1 : 0,
            transform: shown[i] ? 'translateY(0)' : 'translateY(6px)',
            transition: `opacity ${dur} ease-out, transform ${dur} ease-out`,
          }}
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: AVATAR_BG[i], flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)',
          }}>
            {d.initials}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', flex: 1 }}>
            {d.name}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#4ADE80' }}>
            {d.amount}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginLeft: '6px' }}>
            {d.time}
          </span>
        </div>
      ))}

      {/* Stats */}
      <div style={{
        marginTop: '18px', paddingTop: '14px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
      }}>
        {[
          { value: '2,847', label: 'donors' },
          { value: '21 days', label: 'remaining' },
          { value: 'Mayor', label: 'race type' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px 0' }}>{s.value}</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.32)', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
