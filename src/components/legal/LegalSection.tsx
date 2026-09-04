import { Link } from '@/navigation';
import type { LegalBlock, LegalSection as LegalSectionData } from '@/content/legal/types';

const LIST_STYLE = {
  paddingLeft: 20,
  marginTop: 8,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
};

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'p':
      return <p style={{ marginTop: 12 }}>{block.text}</p>;
    case 'ul':
      return (
        <ul style={LIST_STYLE}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol style={LIST_STYLE}>
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    case 'table':
      return (
        // The cookie table is wider than the reading column on a phone, so it
        // scrolls inside its own box rather than pushing the page sideways.
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 520, width: '100%' }}>
            <thead>
              <tr>
                {block.head.map((cell, i) => (
                  <th
                    key={i}
                    className="font-mono text-cz-orange uppercase"
                    style={{
                      fontSize: 14,
                      letterSpacing: 1,
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--color-cz-gray-dark)',
                      verticalAlign: 'top',
                    }}
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        fontSize: 17,
                        lineHeight: 1.6,
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--color-cz-gray-dark)',
                        verticalAlign: 'top',
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'link': {
      // Split on the {link} placeholder so the label renders as an anchor
      // in the middle of the sentence without dangerouslySetInnerHTML.
      const [before, after] = block.text.split('{link}');
      const anchor = block.href.startsWith('http') ? (
        <a
          href={block.href}
          className="text-cz-orange hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {block.label}
        </a>
      ) : (
        <Link href={block.href} className="text-cz-orange hover:underline">
          {block.label}
        </Link>
      );
      return (
        <p style={{ marginTop: 12 }}>
          {before}
          {anchor}
          {after}
        </p>
      );
    }
  }
}

export default function LegalSection({ section }: { section: LegalSectionData }) {
  return (
    <section id={section.id} style={{ marginTop: 40, scrollMarginTop: 100 }}>
      <h2
        className="font-display text-cz-orange uppercase"
        style={{ fontSize: 22, letterSpacing: 1, marginBottom: 14 }}
      >
        {section.title}
      </h2>
      <div className="font-body text-cz-gray-light" style={{ fontSize: 19, lineHeight: 1.8 }}>
        {section.body.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </section>
  );
}
