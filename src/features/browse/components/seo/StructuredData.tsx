type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

type Props = {
  data: JsonLd | JsonLd[];
};

export function StructuredData({ data }: Props) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item)
              .replace(/</g, '\\u003c')
              .replace(/>/g, '\\u003e')
              .replace(/&/g, '\\u0026'),
          }}
        />
      ))}
    </>
  );
}
