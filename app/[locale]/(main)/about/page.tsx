import { getTranslations } from 'next-intl/server';

const DIFFERENTIATORS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C8102E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" />
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
      </svg>
    ),
    iconBg: '#FEF0F2',
    title: 'JCE compliance built in',
    body: "Donor Cédulas are captured automatically at checkout. Export a JCE-ready spreadsheet in one click — no manual data entry, no compliance headaches.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    iconBg: '#EEEDFE',
    title: 'AI-powered voter engagement',
    body: "Every campaign page includes an AI chatbot trained on the candidate's platform. Voters can ask questions about proposals any time — and get real, specific answers.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    iconBg: '#E6F1FB',
    title: 'Built for the DR',
    body: "Accepts tPago and all major credit and debit cards. Shareable via WhatsApp and Instagram. Designed from day one for Dominican voters, Dominican regulations, and Dominican campaigns.",
  },
];

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .about-diff-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ background: 'white', minHeight: '100vh' }}>

        {/* ── Hero ── */}
        <div style={{
          borderBottom: '1px solid #E8E8E5',
          background: '#FAFAFA',
          padding: '72px 24px 64px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            {/* Wordmark / badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', background: '#C8102E',
              }} />
              <span style={{
                fontSize: '11px', fontWeight: 600, color: '#C8102E',
                textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>
                About Impulso
              </span>
            </div>
            <h1 style={{
              fontSize: '36px', fontWeight: 700, color: '#2B2F36',
              letterSpacing: '-0.04em', lineHeight: 1.15, margin: '0 0 20px',
            }}>
              {t('title')}
            </h1>
            <p style={{
              fontSize: '16px', color: '#4B5260', lineHeight: 1.75, margin: 0,
            }}>
              Impulso is a fundraising and campaign management platform built specifically for Dominican political campaigns.
              We help candidates raise money transparently, stay compliant with JCE regulations, and connect with voters
              through modern digital tools — all in one place.
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '64px 24px 80px' }}>

          {/* Why we built this */}
          <section style={{ marginBottom: '64px' }}>
            <p style={{
              fontSize: '10px', fontWeight: 600, color: '#C8102E',
              textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px',
            }}>
              Why we built this
            </p>
            <h2 style={{
              fontSize: '22px', fontWeight: 600, color: '#2B2F36',
              letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.2,
            }}>
              Dominican campaigns deserve better infrastructure
            </h2>
            <p style={{ fontSize: '15px', color: '#4B5260', lineHeight: 1.8, margin: 0 }}>
              Dominican campaigns have historically relied on informal cash donations — with no digital infrastructure,
              no compliance trail, and no way to reach voters at scale. Candidates had no reliable way to document
              who donated, prove they followed the rules, or build a relationship with supporters beyond election day.
              Impulso exists to change that: to bring the fundraising tools that campaigns in other countries take for
              granted to the Dominican Republic, built around local regulations and local payment methods from the ground up.
            </p>
          </section>

          {/* Divider */}
          <div style={{ height: '1px', background: '#E8E8E5', marginBottom: '64px' }} />

          {/* What makes us different */}
          <section style={{ marginBottom: '64px' }}>
            <p style={{
              fontSize: '10px', fontWeight: 600, color: '#C8102E',
              textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 10px',
            }}>
              What makes us different
            </p>
            <h2 style={{
              fontSize: '22px', fontWeight: 600, color: '#2B2F36',
              letterSpacing: '-0.03em', margin: '0 0 32px', lineHeight: 1.2,
            }}>
              Three things no other platform offers
            </h2>

            <div
              className="about-diff-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
              }}
            >
              {DIFFERENTIATORS.map((d) => (
                <div
                  key={d.title}
                  style={{
                    border: '0.5px solid #E8E8E5',
                    borderRadius: '12px',
                    padding: '24px 20px',
                    background: 'white',
                  }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: d.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    {d.icon}
                  </div>
                  <p style={{
                    fontSize: '13px', fontWeight: 600, color: '#2B2F36',
                    margin: '0 0 8px', lineHeight: 1.3,
                  }}>
                    {d.title}
                  </p>
                  <p style={{
                    fontSize: '12px', color: '#767676', lineHeight: 1.7, margin: 0,
                  }}>
                    {d.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Divider */}
          <div style={{ height: '1px', background: '#E8E8E5', marginBottom: '64px' }} />

          {/* CTA */}
          <section style={{ textAlign: 'center' }}>
            <p style={{
              fontSize: '20px', fontWeight: 600, color: '#2B2F36',
              letterSpacing: '-0.03em', margin: '0 0 8px',
            }}>
              Ready to launch your campaign?
            </p>
            <p style={{ fontSize: '13px', color: '#767676', margin: '0 0 24px' }}>
              Get online in minutes. No technical knowledge required.
            </p>
            <a
              href="/auth/signup"
              style={{
                display: 'inline-block',
                background: '#C8102E',
                color: 'white',
                padding: '10px 24px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Start your campaign →
            </a>
          </section>
        </div>

        {/* ── Disclaimer ── */}
        <div style={{
          borderTop: '1px solid #E8E8E5',
          padding: '20px 24px',
          textAlign: 'center',
          background: '#FAFAFA',
        }}>
          <p style={{
            fontSize: '11px', color: '#A0A0A0', margin: 0, lineHeight: 1.6,
          }}>
            This is an MVP. All campaigns, data, and information shown on this platform are for demonstration purposes only.
          </p>
        </div>

      </div>
    </>
  );
}
