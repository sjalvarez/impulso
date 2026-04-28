import Logo from '@/components/ui/Logo';

interface FooterProps {
  brand: string;
  madeIn: string;
  colPlatform: string;
  colLegal: string;
  colContact: string;
  howItWorks: string;
  launchCampaign: string;
  donateToCampaign: string;
  about: string;
  privacy: string;
  terms: string;
  jceCompliance: string;
  dataSecurity: string;
  email: string;
  city: string;
  whatsapp: string;
  copyright: string;
  tagline: string;
}

export default function Footer(p: FooterProps) {
  return (
    <footer style={{ background: '#2B2F36', padding: '56px 24px 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Grid */}
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
            gap: '32px',
            marginBottom: '40px',
          }}
        >
          {/* Column 1: Brand */}
          <div>
            <div style={{ marginBottom: '12px' }}>
              <Logo height={28} variant="light" />
            </div>
            <p style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.6,
              margin: '0 0 16px',
            }}>
              {p.brand}
            </p>
            <span style={{
              display: 'inline-flex',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.45)',
            }}>
              {p.madeIn}
            </span>
          </div>

          {/* Column 2: Platform */}
          <div>
            <p style={{
              fontSize: '9px',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.12em',
              margin: '0 0 14px',
            }}>
              {p.colPlatform}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[p.howItWorks, p.launchCampaign, p.donateToCampaign, p.about].map((link) => (
                <a key={link} href="#" style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.55)',
                  textDecoration: 'none',
                }}>
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3: Legal */}
          <div>
            <p style={{
              fontSize: '9px',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.12em',
              margin: '0 0 14px',
            }}>
              {p.colLegal}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[p.privacy, p.terms, p.jceCompliance, p.dataSecurity].map((link) => (
                <a key={link} href="#" style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.55)',
                  textDecoration: 'none',
                }}>
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Column 4: Contact */}
          <div>
            <p style={{
              fontSize: '9px',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.12em',
              margin: '0 0 14px',
            }}>
              {p.colContact}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[p.email, p.city, p.whatsapp].map((item) => (
                <span key={item} style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.55)',
                }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '16px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)' }}>
            {p.copyright}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
            {p.tagline}
          </span>
        </div>
      </div>
    </footer>
  );
}
