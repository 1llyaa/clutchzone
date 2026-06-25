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
      className="relative bg-cz-black px-6 py-14 md:px-16 md:py-[120px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-8 md:mb-16">
          <span
            className="font-mono text-cz-orange uppercase block"
            style={{ fontSize: 11, letterSpacing: 4, marginBottom: 10 }}
          >
            {t('eyebrow')}
          </span>
          <h2
            className="font-display text-white uppercase"
            style={{ fontSize: 'clamp(32px, 5vw, 60px)', letterSpacing: 1.5, lineHeight: 0.95 }}
          >
            {t('heading')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {cards.map((card) => (
            <div
              key={card.no}
              className="group flex flex-col bg-cz-black-mid border border-cz-gray-dark rounded-cz transition-all duration-200 hover:border-cz-orange"
              style={{ padding: 'clamp(20px, 4vw, 32px) clamp(18px, 3vw, 28px)' }}
            >
              <span className="font-mono text-cz-orange" style={{ fontSize: 13, letterSpacing: 2 }}>
                {card.no}
              </span>
              <h3
                className="font-display text-white uppercase mt-5 md:mt-8"
                style={{ fontSize: 'clamp(22px, 3vw, 30px)', letterSpacing: 1 }}
              >
                {card.title}
              </h3>
              <p
                className="font-body text-cz-gray-light mt-3"
                style={{ fontWeight: 300, fontSize: 'clamp(13px, 1.5vw, 15px)', lineHeight: 1.65 }}
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
