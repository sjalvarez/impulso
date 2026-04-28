import Nav from '@/components/ui/Nav';

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <Nav locale={locale} />
      <main>{children}</main>
    </>
  );
}
