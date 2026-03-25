import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * CISO-004: CSP Violation Report Collector
 * Receives Content-Security-Policy violation reports from browsers.
 * In production, forward these to SIEM.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const report = req.body;

  // Log for monitoring (production: forward to SIEM)
  console.warn('[CSP-VIOLATION]', JSON.stringify({
    documentUri: report?.['csp-report']?.['document-uri'] || report?.documentURL,
    violatedDirective: report?.['csp-report']?.['violated-directive'] || report?.violatedDirective,
    blockedUri: report?.['csp-report']?.['blocked-uri'] || report?.blockedURL,
    timestamp: new Date().toISOString(),
  }));

  return res.status(204).end();
}
