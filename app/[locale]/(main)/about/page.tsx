import { getTranslations } from 'next-intl/server';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return (
    <div style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#2B2F36' }}>{t('title')}</h1>
      <p style={{ color: '#767676', marginTop: '16px' }}>Coming soon.</p>
    </div>
  );
}
