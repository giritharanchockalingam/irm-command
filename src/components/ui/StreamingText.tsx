import React, { useEffect, useState, useMemo } from 'react';
import { useThemeStore } from '../../store/themeStore';

interface StreamingTextProps {
  text: string;
  onComplete?: () => void;
  className?: string;
  speed?: number;
}

/**
 * Parses digest text into structured sections.
 * Detects ALL_CAPS headers (like "RISK PROFILE AND CONTROL ENVIRONMENT")
 * and splits body paragraphs into readable blocks.
 */
function parseDigestSections(text: string): { title: string; body: string }[] {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const sections: { title: string; body: string }[] = [];
  let currentTitle = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Detect ALL_CAPS headers (at least 3 words, all uppercase, may contain & - / ,)
    const isHeader = /^[A-Z][A-Z\s&\-\/,()]+$/.test(trimmed) && trimmed.length > 10;

    if (isHeader) {
      // Save previous section
      if (currentTitle || currentBody.length > 0) {
        sections.push({ title: currentTitle, body: currentBody.join('\n\n') });
      }
      currentTitle = trimmed;
      currentBody = [];
    } else {
      currentBody.push(trimmed);
    }
  }

  // Save last section
  if (currentTitle || currentBody.length > 0) {
    sections.push({ title: currentTitle, body: currentBody.join('\n\n') });
  }

  return sections;
}

/**
 * Renders a formatted section with a styled header and readable paragraphs.
 * Highlights key metrics (numbers, percentages, ratings) inline.
 */
function FormattedSection({ title, body, isDark }: { title: string; body: string; isDark: boolean }) {
  // Format title to Title Case
  const formattedTitle = title
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .replace(/ And /g, ' & ')
    .replace(/ Of /g, ' of ')
    .replace(/ The /g, ' the ')
    .replace(/ In /g, ' in ')
    .replace(/ For /g, ' for ');

  // Highlight key metrics in the body text
  const highlightMetrics = (text: string) => {
    const parts: (string | React.ReactElement)[] = [];
    // Match: numbers with units (e.g., "12 KRIs", "$4.50M", "85%"), ratings, and key terms
    const regex = /((?:USD\s*)?\$?[\d,.]+(?:\s*(?:M|K|%|kris|KRIs|risks|controls|vendors|issues|findings|items|days|events|losses|frameworks|metrics|vendors)))|(\b(?:Critical|High|Satisfactory|Satisfactory-Watchlist|Needs Improvement|Deficient|adequate|inadequate|Breach|Warning|Deteriorating|Improving|MRA|MRIA|MRIA)\b)/gi;

    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const matched = match[0];
      const isRating = match[2];

      let color = 'text-cyan-400';
      if (isRating) {
        const lower = matched.toLowerCase();
        if (['critical', 'deficient', 'inadequate', 'mria', 'deteriorating', 'breach'].includes(lower)) {
          color = 'text-red-400';
        } else if (['high', 'needs improvement', 'warning'].includes(lower)) {
          color = 'text-orange-400';
        } else if (['satisfactory', 'adequate', 'improving'].includes(lower)) {
          color = 'text-emerald-400';
        } else if (['satisfactory-watchlist', 'mra'].includes(lower)) {
          color = 'text-amber-400';
        }
      }

      parts.push(
        <span key={key++} className={`${color} font-semibold`}>
          {matched}
        </span>
      );
      lastIndex = match.index + matched.length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  const paragraphs = body.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <div className="mb-4 last:mb-0">
      {title && (
        <h4
          className={`text-xs font-bold uppercase tracking-wider mb-2 pb-1 border-b ${
            isDark
              ? 'text-cyan-400 border-slate-700/60'
              : 'text-cyan-600 border-gray-200'
          }`}
        >
          {formattedTitle}
        </h4>
      )}
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className={`text-sm leading-relaxed mb-2 last:mb-0 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {highlightMetrics(para)}
        </p>
      ))}
    </div>
  );
}

export function StreamingText({ text, onComplete, className = '', speed = 5 }: StreamingTextProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const isDark = useThemeStore((state) => state.isDark);

  const sections = useMemo(() => parseDigestSections(text), [text]);

  // Calculate which sections to show based on progress
  const totalLength = text.length;

  useEffect(() => {
    if (progress >= totalLength) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const chunkSize = Math.max(3, Math.floor(totalLength / 80)); // Fast reveal
    const timeout = setTimeout(() => {
      setProgress((prev) => Math.min(prev + chunkSize, totalLength));
    }, speed);

    return () => clearTimeout(timeout);
  }, [progress, totalLength, speed, onComplete]);

  // Determine how many sections to show based on progress
  let charCount = 0;
  const visibleSections: { title: string; body: string; partial: boolean }[] = [];

  for (const section of sections) {
    const sectionLength = section.title.length + section.body.length;
    if (charCount + sectionLength <= progress) {
      visibleSections.push({ ...section, partial: false });
      charCount += sectionLength;
    } else if (charCount < progress) {
      const remaining = progress - charCount;
      const partialBody = section.body.slice(0, Math.max(0, remaining - section.title.length));
      visibleSections.push({ title: section.title, body: partialBody, partial: true });
      break;
    } else {
      break;
    }
  }

  return (
    <div className={className}>
      <div className="space-y-1">
        {visibleSections.map((section, i) => (
          <FormattedSection
            key={i}
            title={section.title}
            body={section.body}
            isDark={isDark}
          />
        ))}
      </div>
      {!isComplete && (
        <div className="flex items-center gap-2 mt-3">
          <div className={`h-1 flex-1 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
            <div
              className="h-full bg-cyan-500 transition-all duration-100 rounded-full"
              style={{ width: `${Math.round((progress / totalLength) * 100)}%` }}
            />
          </div>
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            {Math.round((progress / totalLength) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
