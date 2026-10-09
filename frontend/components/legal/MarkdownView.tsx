import { parseMarkdown, type MdBlock, type MdSpan } from "@/lib/legal/markdown";

type Variant = "inline" | "document" | "document-note";

type VariantStyle = {
  text: string;
  link: string;
  heading3: string;
  heading4: string;
  marker: string;
  quote: string;
  rule: string;
  listMarkerNumeric: string;
};

/** One style table per rendering context, so `Block`/`Span` stay a plain
 *  switch over block kind with no per-variant branching scattered through
 *  them. */
const STYLES: Record<Variant, VariantStyle> = {
  inline: {
    text: "text-sm leading-relaxed text-dash-ink",
    link: "font-semibold text-brand-purple hover:underline",
    heading3: "text-base font-bold text-ink",
    heading4: "text-sm font-bold text-ink",
    marker: "bg-gradient-to-r from-brand-purple to-brand-blue",
    quote: "border-l-2 border-brand-purple/40 pl-3 text-sm italic text-muted",
    rule: "border-border",
    listMarkerNumeric: "text-brand-purple",
  },
  document: {
    text: "text-[14.5px] leading-[1.62] text-[#333336]",
    link: "text-[#0066cc] hover:underline",
    heading3: "text-lg font-semibold text-[#1d1d1f]",
    heading4: "text-base font-semibold text-[#1d1d1f]",
    marker: "bg-[#333336]",
    quote: "border-l-2 border-[#d2d2d7] pl-3 text-[14.5px] italic text-[#6e6e73]",
    rule: "border-[#d2d2d7]",
    listMarkerNumeric: "text-[#333336]",
  },
  /** The document's italic end note — same document palette, smaller and
   *  muted (`legal-document-content-mockup.png`'s copyright/disclaimer
   *  lines), always italic regardless of `*markers*` in the source. */
  "document-note": {
    text: "text-[13px] italic leading-relaxed text-[#6e6e73]",
    link: "text-[#0066cc] hover:underline",
    heading3: "text-base font-semibold italic text-[#6e6e73]",
    heading4: "text-sm font-semibold italic text-[#6e6e73]",
    marker: "bg-[#6e6e73]",
    quote: "border-l-2 border-[#d2d2d7] pl-3 text-[13px] italic text-[#6e6e73]",
    rule: "border-[#d2d2d7]",
    listMarkerNumeric: "text-[#6e6e73]",
  },
};

/**
 * Renders the whitelisted Markdown dialect directly as React elements —
 * never `dangerouslySetInnerHTML`. Shared by the admin editor's own preview/
 * side-by-side modes (`variant="inline"`, the original compact styling), the
 * full-page Apple-style `LegalDocument` preview (`variant="document"`,
 * matching `legal-document-content-mockup.png`), and that same document's
 * italic end note (`variant="document-note"`) — same parser, same
 * component, same whitelist as `markdown.ts`'s `validateMarkdown` either way.
 */
export function MarkdownView({
  source,
  bulletStyle = "circle",
  variant = "inline",
  className,
}: {
  source: string;
  bulletStyle?: "circle" | "check";
  variant?: Variant;
  className?: string;
}) {
  const blocks = parseMarkdown(source);
  const style = STYLES[variant];
  return (
    <div className={className}>
      {blocks.map((block, i) => (
        <Block key={i} node={block} bulletStyle={bulletStyle} style={style} />
      ))}
    </div>
  );
}

function Block({ node, bulletStyle, style }: { node: MdBlock; bulletStyle: "circle" | "check"; style: VariantStyle }) {
  switch (node.kind) {
    case "paragraph":
      return (
        <p className={style.text}>
          <Spans spans={node.spans} style={style} />
        </p>
      );
    case "heading": {
      const Tag = node.level === 3 ? "h3" : "h4";
      return (
        <Tag className={node.level === 3 ? style.heading3 : style.heading4}>
          <Spans spans={node.spans} style={style} />
        </Tag>
      );
    }
    case "bulletList":
      return (
        <ul className={`space-y-1.5 ${style.text}`}>
          {node.items.map((item, i) => (
            <ListItem key={i} blocks={item} bulletStyle={bulletStyle} style={style} marker={<BulletMarker bulletStyle={bulletStyle} style={style} />} />
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol className={`space-y-1.5 ${style.text}`}>
          {node.items.map((item, i) => (
            <ListItem
              key={i}
              blocks={item}
              bulletStyle={bulletStyle}
              style={style}
              marker={<span className={`shrink-0 font-semibold ${style.listMarkerNumeric}`}>{i + 1}.</span>}
            />
          ))}
        </ol>
      );
    case "blockquote":
      return (
        <blockquote className={style.quote}>
          {node.blocks.map((child, i) => (
            <Block key={i} node={child} bulletStyle={bulletStyle} style={style} />
          ))}
        </blockquote>
      );
    case "horizontalRule":
      return <hr className={style.rule} />;
  }
}

function BulletMarker({ bulletStyle, style }: { bulletStyle: "circle" | "check"; style: VariantStyle }) {
  if (bulletStyle === "check") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`mt-[3px] h-3.5 w-3.5 shrink-0 ${style.listMarkerNumeric}`} fill="none">
        <path d="m4 10.5 3.5 3.5 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return <span aria-hidden="true" className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${style.marker}`} />;
}

function ListItem({
  blocks,
  bulletStyle,
  style,
  marker,
}: {
  blocks: MdBlock[];
  bulletStyle: "circle" | "check";
  style: VariantStyle;
  marker: React.ReactNode;
}) {
  return (
    <li className="flex gap-2">
      {marker}
      <span className="min-w-0 flex-1">
        {blocks.map((child, i) => (
          <Block key={i} node={child} bulletStyle={bulletStyle} style={style} />
        ))}
      </span>
    </li>
  );
}

function Spans({ spans, style }: { spans: MdSpan[]; style: VariantStyle }) {
  return (
    <>
      {spans.map((span, i) => (
        <Span key={i} span={span} style={style} />
      ))}
    </>
  );
}

function Span({ span, style }: { span: MdSpan; style: VariantStyle }) {
  let node: React.ReactNode = span.text;
  if (span.href) {
    node = (
      <a
        href={span.href}
        target={span.href.startsWith("mailto:") || span.href.startsWith("/") ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={style.link}
      >
        {node}
      </a>
    );
  }
  if (span.bold) node = <strong>{node}</strong>;
  if (span.italic) node = <em>{node}</em>;
  return <>{node}</>;
}
