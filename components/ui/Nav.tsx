'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, Link } from '@/lib/i18n/navigation';
import Logo from '@/components/ui/Logo';
import UserMenu from '@/components/ui/UserMenu';

interface Props {
  locale: string;
}

export default function Nav({ locale }: Props) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleLocale() {
    const next = locale === 'en' ? 'es' : 'en';
    router.replace(pathname, { locale: next });
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'white', borderBottom: '1px solid #E8E8E5',
      height: '56px', display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: '1152px', margin: '0 auto', padding: '0 24px',
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" aria-label="Impulso home" style={{ display: 'flex', alignItems: 'center' }}>
          <Logo height={28} variant="dark" />
        </Link>

        {/* Right side: links + lang + CTA/Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {/* Nav links — hidden on mobile */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <a href="#how-it-works" style={linkStyle}>{t('howItWorks')}</a>
            <Link href="/about" style={linkStyle}>{t('about')}</Link>
          </div>

          {/* UserMenu handles CTA or avatar depending on auth state */}
          <UserMenu locale={locale} />
        </div>
      </div>
    </nav>
  );
}

const linkStyle: React.CSSProperties = {
  fontSize: '13px', color: '#2B2F36', textDecoration: 'none', fontWeight: 500,
};
