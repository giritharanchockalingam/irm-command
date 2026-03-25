import React from 'react';

interface FormattedMessageProps {
  text: string;
  isDark: boolean;
}

/**
 * Renders AI response text with structured formatting.
 * Parses headings (ALL CAPS lines), bullet points (•), numbered items,
 * key-value pairs, and section dividers into styled UI elements.
 */
export function FormattedMessage({ text, isDark }: FormattedMessageProps) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Section heading: ALL CAPS line (at least 3 chars, >60% uppercase letters)
    const letters = trimmed.replace(/[^a-zA-Z]/g, '');
    const upperLetters = trimmed.replace(/[^A-Z]/g, '');
    const isHeading =
      letters.length >= 3 &&
      upperLetters.length / Math.max(letters.length, 1) > 0.6 &&
      !trimmed.startsWith('•') &&
      !trimmed.startsWith('-') &&
      !trimmed.match(/^\d+\./);

    if (isHeading) {
      // Check if it has a parenthetical like "RISK SUMMARY (15 risks)"
      const match = trimmed.match(/^(.+?)(\(.+\))?$/);
      const title = match?.[1]?.trim() || trimmed;
      const subtitle = match?.[2]?.trim();

      elements.push(
        <div
          key={`h-${i}`}
          className={`flex items-center gap-2 mt-1 mb-2 pb-1.5 border-b ${
            isDark ? 'border-slate-700' : 'border-gray-200'
          }`}
        >
          <span
            className={`text-xs font-bold tracking-wider ${
              isDark ? 'text-cyan-400' : 'text-blue-600'
            }`}
          >
            {title}
          </span>
          {subtitle && (
            <span
              className={`text-xs ${
                isDark ? 'text-slate-500' : 'text-gray-400'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      );
      i++;
      continue;
    }

    // Bullet point block: collect consecutive • or - lines
    if (trimmed.startsWith('•') || (trimmed.startsWith('-') && trimmed.length > 1 && trimmed[1] === ' ')) {
      const bullets: string[] = [];
      while (i < lines.length) {
        const bLine = lines[i]?.trim();
        if (bLine?.startsWith('•') || (bLine?.startsWith('-') && bLine.length > 1 && bLine[1] === ' ')) {
          bullets.push(bLine.replace(/^[•\-]\s*/, ''));
          i++;
        } else {
          break;
        }
      }
      elements.push(
        <div key={`bl-${i}`} className="space-y-1.5 my-1.5">
          {bullets.map((bullet, bi) => {
            // Check for "Key: Value" pattern
            const kvMatch = bullet.match(/^(.+?):\s+(.+)$/);
            return (
              <div
                key={bi}
                className={`flex items-start gap-2 text-xs pl-1 py-0.5 rounded ${
                  isDark ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'
                }`}
              >
                <span
                  className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isDark ? 'bg-cyan-500' : 'bg-blue-500'
                  }`}
                />
                {kvMatch ? (
                  <span>
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                      {kvMatch[1]}:
                    </span>{' '}
                    <span className={isDark ? 'text-slate-400' : 'text-gray-600'}>{formatInlineMetrics(kvMatch[2], isDark)}</span>
                  </span>
                ) : (
                  <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{formatInlineMetrics(bullet, isDark)}</span>
                )}
              </div>
            );
          })}
        </div>
      );
      continue;
    }

    // Numbered item: "1. Title" followed by indented detail line
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      const num = numMatch[1];
      const title = numMatch[2];
      // Check if next line is indented detail
      let detail: string | null = null;
      if (i + 1 < lines.length && lines[i + 1]?.match(/^\s{2,}/)) {
        detail = lines[i + 1].trim();
        i++;
      }
      elements.push(
        <div
          key={`num-${i}`}
          className={`flex items-start gap-2.5 my-1 py-1.5 px-2 rounded-md ${
            isDark ? 'bg-slate-800/60' : 'bg-gray-50'
          }`}
        >
          <span
            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              isDark ? 'bg-cyan-900/60 text-cyan-300' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {num}
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
              {title}
            </p>
            {detail && (
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {formatInlineMetrics(detail, isDark)}
              </p>
            )}
          </div>
        </div>
      );
      i++;
      continue;
    }

    // Metric line: "Key: Value | Key: Value | ..."
    const pipeSegments = trimmed.split('|').map((s) => s.trim());
    if (pipeSegments.length >= 2 && pipeSegments.every((s) => s.includes(':'))) {
      elements.push(
        <div
          key={`metrics-${i}`}
          className={`flex flex-wrap gap-2 my-2 p-2 rounded-md ${
            isDark ? 'bg-slate-800/80' : 'bg-gray-50'
          }`}
        >
          {pipeSegments.map((seg, si) => {
            const [label, ...valueParts] = seg.split(':');
            const value = valueParts.join(':').trim();
            return (
              <div
                key={si}
                className={`flex-1 min-w-[80px] text-center px-2 py-1 rounded ${
                  isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'
                }`}
              >
                <p className={`text-[10px] uppercase tracking-wide ${getMetricColor(label.trim(), isDark) !== (isDark ? 'text-slate-100' : 'text-gray-900') ? getMetricColor(label.trim(), isDark) : isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {label.trim()}
                </p>
                <p className={`text-xs font-bold ${getMetricColor(value, isDark) !== (isDark ? 'text-slate-100' : 'text-gray-900') ? getMetricColor(value, isDark) : getMetricColor(label.trim(), isDark)}`}>{value}</p>
              </div>
            );
          })}
        </div>
      );
      i++;
      continue;
    }

    // Sub-heading or label line ending with ":"
    if (trimmed.endsWith(':') && trimmed.length < 60) {
      elements.push(
        <p
          key={`sub-${i}`}
          className={`text-xs font-semibold mt-2 mb-0.5 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}
        >
          {trimmed}
        </p>
      );
      i++;
      continue;
    }

    // Default: plain text paragraph
    elements.push(
      <p
        key={`p-${i}`}
        className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}
      >
        {formatInlineMetrics(trimmed, isDark)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

/**
 * Highlights inline numeric values and status keywords
 */
function formatInlineMetrics(text: string, isDark: boolean): React.ReactNode {
  // Split on patterns like "$6.8M", "87%", "33/37", status words
  const parts = text.split(
    /(\$[\d,.]+[MBK]?|\d+\/\d+|\d+\.?\d*%|\b(?:Critical|High|Medium|Low|Breach|Warning|Normal|Effective|Ineffective|Red|Yellow|Green|Implemented|Planned|Active|Mitigated|Open|Closed|Overdue)\b)/gi
  );

  return parts.map((part, i) => {
    // Numbers and percentages
    if (/^\$[\d,.]+[MBK]?$/.test(part) || /^\d+\/\d+$/.test(part) || /^\d+\.?\d*%$/.test(part)) {
      return (
        <span key={i} className={`font-bold ${isDark ? 'text-cyan-300' : 'text-blue-700'}`}>
          {part}
        </span>
      );
    }
    // Status keywords
    if (/^(Critical|Breach|Red|Ineffective|Overdue)$/i.test(part)) {
      return (
        <span key={i} className="font-semibold text-red-400">
          {part}
        </span>
      );
    }
    if (/^(High|Warning|Yellow)$/i.test(part)) {
      return (
        <span key={i} className="font-semibold text-amber-400">
          {part}
        </span>
      );
    }
    if (/^(Effective|Green|Implemented|Active|Normal|Mitigated|Closed)$/i.test(part)) {
      return (
        <span key={i} className="font-semibold text-emerald-400">
          {part}
        </span>
      );
    }
    if (/^(Medium|Low|Open|Planned)$/i.test(part)) {
      return (
        <span key={i} className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/**
 * Color-code metric values based on content
 */
function getMetricColor(value: string, isDark: boolean): string {
  const v = value.toLowerCase();
  if (v.includes('critical') || v.includes('breach') || v.includes('red') || v.includes('overdue')) {
    return 'text-red-400';
  }
  if (v.includes('high') || v.includes('warning') || v.includes('yellow')) {
    return 'text-amber-400';
  }
  if (v.includes('effective') || v.includes('green') || v.includes('implemented') || v.includes('normal')) {
    return 'text-emerald-400';
  }
  return isDark ? 'text-slate-100' : 'text-gray-900';
}

export default FormattedMessage;
