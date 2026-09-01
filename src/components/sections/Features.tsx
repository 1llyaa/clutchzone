import { useTranslations } from 'next-intl';
import Reveal from '@/components/ui/Reveal';

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
      className="relative bg-cz-black px-6 py-14 md:px-16 md:py-[104px]"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto">
        <Reveal className="mb-8 md:mb-[40px]">
          <h2
            className="font-display text-white uppercase"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', letterSpacing: 1.5, lineHeight: 0.98 }}
          >
            {t('heading')}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 20 }}>
          {cards.map((card, i) => (
            <Reveal key={card.no} delay={i * 70}>
              <div
                className="group flex flex-col h-full bg-cz-black-mid border border-cz-gray-dark rounded-cz cz-card-lift hover:border-cz-orange"
                style={{ padding: 32 }}
              >
                <span className="font-mono text-cz-orange" style={{ fontSize: 16, letterSpacing: 2 }}>
                  {card.no}
                </span>
                <h3
                  className="font-display text-white uppercase"
                  style={{ fontSize: 28, letterSpacing: 1, marginTop: 22 }}
                >
                  {card.title}
                </h3>
                <p
                  className="font-body text-cz-gray-light mt-3"
                  style={{ fontSize: 'clamp(16px, 1.8vw, 17px)', lineHeight: 1.65 }}
                >
                  {card.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
