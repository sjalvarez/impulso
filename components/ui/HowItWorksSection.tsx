'use client';

import { useState } from 'react';
import HowItWorksLiveFeed from '@/components/ui/HowItWorksLiveFeed';

const steps = [
  {
    n: 1,
    title: 'Launch your fundraising campaign',
    desc: 'In a few clicks, upload your campaign graphics, set your fundraising goal, and go live. Your campaign must be officially registered with the Junta Central Electoral (JCE).',
  },
  {
    n: 2,
    title: 'Your donation page, live in seconds',
    desc: 'We automatically generate a branded page with your graphics and platform — including an AI chatbot that answers voters\' questions about your proposals. Share the link on WhatsApp, Instagram, or email. All major cards and tPago accepted.',
  },
  {
    n: 3,
    title: 'Real-time dashboard & JCE-ready reports',
    desc: 'Track every donation live. Export a JCE-compliant spreadsheet in one click. Donor Cédulas captured automatically.',
  },
  {
    n: 4,
    title: 'Bank-level security',
    desc: 'All data encrypted with AES-256 — the same standard used by banks worldwide.',
  },
];

const PLACEHOLDER_COLORS = ['#E8F0E8', '#F0EBE8', '#EDE8F0'];

export default function HowItWorksSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section
      id="how-it-works"
      style={{
        background: '#FAFAFA',
        borderTop: '1px solid #E8E8E5',
        borderBottom: '1px solid #E8E8E5',
      }}
    >
      <div
        className="hiw-outer-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '45% 55%',
          minHeight: '600px',
        }}
      >
        {/* Left column */}
        <div style={{ background: 'white', padding: '64px 48px 64px 40px' }}>
          {/* Heading block */}
          <p style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: '#C8102E',
            letterSpacing: '0.12em',
            margin: '0 0 8px',
          }}>
            HOW IT WORKS
          </p>
          <h2 style={{
            fontWeight: 600,
            fontSize: '28px',
            color: '#2B2F36',
            letterSpacing: '-0.03em',
            margin: '0 0 4px',
            lineHeight: 1.1,
          }}>
            From zero to funded
          </h2>
          <p style={{
            fontSize: '13px',
            color: '#767676',
            margin: '0 0 40px',
          }}>
            Everything your campaign needs — in one platform.
          </p>

          {/* Steps */}
          {steps.map((step, i) => {
            const active = activeIndex === i;
            return (
              <div
                key={step.n}
                onMouseEnter={() => setActiveIndex(i)}
                style={{
                  padding: '20px 24px',
                  borderRadius: '0 10px 10px 0',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  background: 'transparent',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                }}
              >
                {/* Number circle */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  flexShrink: 0,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.25s',
                  background: active ? '#C8102E' : 'white',
                  border: active ? '1px solid #C8102E' : '1px solid #E8E8E5',
                  color: active ? 'white' : '#767676',
                }}>
                  {step.n}
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '15px',
                    fontWeight: active ? 700 : 600,
                    margin: '0 0 4px',
                    transition: 'color 0.25s, font-weight 0.25s',
                    color: active ? '#2B2F36' : '#767676',
                  }}>
                    {step.title}
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: '#767676',
                    lineHeight: 1.7,
                    margin: 0,
                    transition: 'opacity 0.25s',
                    opacity: active ? 1 : 0.5,
                  }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column — flush, no border-radius, no margin */}
        <div
          className="hiw-right-col"
          style={{
            position: 'sticky',
            top: 0,
            height: '600px',
            overflow: 'hidden',
            background: '#F6F6F4',
            borderRadius: 0,
            margin: 0,
            padding: 0,
          }}
        >
          {/* Slot 0: HowItWorksLiveFeed */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: activeIndex === 0 ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}>
            <HowItWorksLiveFeed />
          </div>

          {/* Slots 1-4: placeholder divs */}
          {PLACEHOLDER_COLORS.map((color, i) => {
            const idx = i + 1;
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: activeIndex === idx ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                  background: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#767676' }}>
                  {steps[idx].title}
                </span>
              </div>
            );
          })}

          {/* Bottom gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)',
          }} />

          {/* Bottom-left label */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            zIndex: 3,
          }}>
            <p style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 4px',
            }}>
              Step {steps[activeIndex].n}
            </p>
            <p style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
              margin: 0,
            }}>
              {steps[activeIndex].title}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
