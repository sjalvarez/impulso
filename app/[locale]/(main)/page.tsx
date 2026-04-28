import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n/navigation';
import Image from 'next/image';
import HowItWorksSection from '@/components/ui/HowItWorksSection';
import DashboardMockupSection from '@/components/ui/DashboardMockupSection';
import ImpactSection from '@/components/ui/ImpactSection';
import Footer from '@/components/ui/Footer';

function CheckCircleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="#767676" strokeWidth="1" />
      <polyline points="4,6.8 5.8,8.6 9,4.8" stroke="#767676" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });
  const tCta = await getTranslations({ locale, namespace: 'cta' });
  const tFooter = await getTranslations({ locale, namespace: 'footer' });

  return (
    <div style={{ background: 'white' }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', height: '480px', overflow: 'hidden' }}>
        {/* Background image */}
        <Image
          src="/images/banner.jpg"
          alt="Dominican Republic community"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.15) 100%)',
          zIndex: 1,
        }} />

        {/* Content — left-aligned over the photo */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          padding: '48px 64px',
        }}>
          {/* Left: text */}
          <div style={{ maxWidth: '55%' }}>
            {/* Eyebrow with red line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '16px', height: '2px', background: '#C8102E', flexShrink: 0 }} />
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.11em',
              }}>
                {t('eyebrow')}
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: '38px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
              margin: '0 0 14px',
            }}>
              {t('headline')}
            </h1>

            {/* Subtext */}
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.72,
              margin: '0 0 24px',
              maxWidth: '440px',
            }}>
              {t('body')}
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                href="/auth/signup"
                style={{
                  background: '#C8102E',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '11px 22px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  border: 'none',
                }}
              >
                {t('ctaPrimary')}
              </Link>
              <a
                href="#how-it-works"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '11px 18px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                {t('ctaSecondary')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ─────────────────────────────────────────── */}
      <div style={{
        background: '#F6F6F4',
        borderTop: '1px solid #E8E8E5',
        borderBottom: '1px solid #E8E8E5',
        padding: '12px 24px',
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          gap: '28px',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {(['trust1', 'trust2', 'trust3', 'trust4'] as const).map((key) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircleIcon />
              <span style={{ fontSize: '11px', color: '#767676', fontWeight: 500 }}>{t(key)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ──────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ── Dashboard Mockup ──────────────────────────────────── */}
      <DashboardMockupSection />

      {/* ── Impact ────────────────────────────────────────────── */}
      <ImpactSection />

      {/* ── CTA section ───────────────────────────────────────── */}
      <section style={{
        background: '#FAFAFA',
        borderTop: '1px solid #E8E8E5',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#C8102E',
          fontWeight: 600,
          margin: '0 0 14px',
        }}>
          {tCta('eyebrow')}
        </p>
        <h2 style={{
          fontSize: '34px',
          fontWeight: 600,
          color: '#2B2F36',
          letterSpacing: '-0.03em',
          margin: '0 0 12px',
          lineHeight: 1.1,
        }}>
          {tCta('headline')}
        </h2>
        <p style={{
          fontSize: '14px',
          color: '#767676',
          lineHeight: 1.7,
          margin: '0 0 30px',
        }}>
          {tCta('subtext')}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/auth/signup"
            style={{
              background: '#C8102E',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              padding: '13px 28px',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            {tCta('primary')}
          </Link>
          <a
            href="mailto:hello@impulso.do"
            style={{
              background: 'white',
              color: '#2B2F36',
              fontWeight: 600,
              fontSize: '14px',
              padding: '13px 28px',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block',
              border: '1px solid #E8E8E5',
            }}
          >
            {tCta('secondary')}
          </a>
        </div>
        <p style={{ fontSize: '11px', color: '#767676', marginTop: '18px' }}>{tCta('trust')}</p>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <Footer
        brand={tFooter('brand')} madeIn={tFooter('madeIn')}
        colPlatform={tFooter('colPlatform')} colLegal={tFooter('colLegal')} colContact={tFooter('colContact')}
        howItWorks={tFooter('howItWorks')} launchCampaign={tFooter('launchCampaign')}
        donateToCampaign={tFooter('donateToCampaign')} about={tFooter('about')}
        privacy={tFooter('privacy')} terms={tFooter('terms')}
        jceCompliance={tFooter('jceCompliance')} dataSecurity={tFooter('dataSecurity')}
        email={tFooter('email')} city={tFooter('city')} whatsapp={tFooter('whatsapp')}
        copyright={tFooter('copyright')} tagline={tFooter('tagline')}
      />
    </div>
  );
}
