import { getTranslations } from 'next-intl/server';

export default async function MaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { from, error } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'maintenance' });

  return (
    <main className="min-h-screen bg-cz-black flex items-center justify-center px-6 py-24 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm">
        <p className="font-mono uppercase text-cz-orange text-label tracking-[0.15em] mb-4 text-center">
          {t('eyebrow')}
        </p>
        <h1 className="font-display uppercase text-white text-display-subsection text-center mb-4">
          {t('title')}
        </h1>
        <p className="font-body text-cz-white-soft text-secondary text-center mb-10 leading-relaxed">
          {t('body')}
        </p>

        <form
          action="/api/maintenance-login"
          method="POST"
          className="flex flex-col gap-4 bg-cz-black-mid border border-cz-gray-dark rounded-cz p-6"
        >
          <input type="hidden" name="locale" value={locale} />
          {from && <input type="hidden" name="from" value={from} />}

          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="font-mono uppercase text-cz-gray-light text-[11px] tracking-[0.1em]">
              {t('username')}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="bg-cz-black border border-cz-gray-dark rounded-control px-3 py-2.5 text-white font-body focus:outline-none focus:border-cz-orange"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-mono uppercase text-cz-gray-light text-[11px] tracking-[0.1em]">
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="bg-cz-black border border-cz-gray-dark rounded-control px-3 py-2.5 text-white font-body focus:outline-none focus:border-cz-orange"
            />
          </div>

          {error && (
            <p className="font-mono text-cz-danger text-[12px] uppercase tracking-wide">{t('error')}</p>
          )}

          <button
            type="submit"
            className="mt-2 font-display uppercase bg-cz-orange text-white border-[1.5px] border-cz-orange rounded-control py-3 tracking-[1.5px] text-[18px] transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:bg-cz-orange-dark hover:border-cz-orange-dark hover:shadow-cta-glow cursor-pointer"
          >
            {t('submit')}
          </button>
        </form>
      </div>
    </main>
  );
}
