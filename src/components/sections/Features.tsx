import { useTranslations } from 'next-intl';

export default function Features() {
  const t = useTranslations('features');

  const cards = [
    { no: t('card1no'), title: t('card1title'), desc: t('card1desc') },
    { no: t('card2no'), title: t('card2title'), desc: t('card2desc') },
    { no: t('card3no'), title: t('card3title'), desc: t('card3desc') },
    { no: t('card4no'), title: t('card4title'), desc: t('card4desc') },
  ];

  return (
    <section
      id="herna"
      className="relative bg-cz-black"
      style={{ padding: '120px 64px', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto">
        <div style={{ marginBottom: 64 }}>
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}
          >
            {t('eyebrow')}
          </span>
          <h2
            className="font-display text-white uppercase"
            style={{ fontSize: 60, letterSpacing: 1.5, lineHeight: 0.95 }}
          >
            {t('heading')}
          </h2>
        </div>

        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
        >
          {cards.map((card) => (
            <div
              key={card.no}
              className="group flex flex-col bg-cz-black-mid border border-cz-gray-dark rounded-cz transition-all duration-200 hover:-translate-y-1 hover:border-cz-orange"
              style={{ padding: '32px 28px', minHeight: 240 }}
            >
              <span className="font-mono text-cz-orange" style={{ fontSize: 13, letterSpacing: 2 }}>
                {card.no}
              </span>
              <h3
                className="font-display text-white uppercase"
                style={{ fontSize: 30, letterSpacing: 1, marginTop: 'auto', paddingTop: 48 }}
              >
                {card.title}
              </h3>
              <p
                className="font-body text-cz-gray-light"
                style={{ fontWeight: 300, fontSize: 15, lineHeight: 1.65, marginTop: 12 }}
              >
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
