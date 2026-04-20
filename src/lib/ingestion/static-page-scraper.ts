import * as cheerio from 'cheerio'

// Tags that never contain useful program content
const NOISE_SELECTORS = [
  'nav', 'header', 'footer', 'aside',
  '.nav', '.header', '.footer', '.sidebar',
  '.cookie', '.banner', '.alert', '.modal',
  '.social', '.share', '.advertisement',
  'script', 'style', 'noscript', 'iframe',
]

export type ScrapeResult = {
  url: string
  text: string
  links: string[]       // same-domain links found on this page
  success: boolean
  error?: string
}

/**
 * Fetches a single URL and returns cleaned text + outbound links.
 */
export async function scrapePage(url: string): Promise<ScrapeResult> {
  let html: string

  try {
    const response = await fetch(url, {
      headers: {
        // Pose as a real browser — some university sites block bots
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10_000), // 10s timeout per page
    })

    if (!response.ok) {
      return { url, text: '', links: [], success: false, error: `HTTP ${response.status}` }
    }

    html = await response.text()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown fetch error'
    return { url, text: '', links: [], success: false, error: message }
  }

  const $ = cheerio.load(html)

  // Remove noise elements before extracting text
  $(NOISE_SELECTORS.join(', ')).remove()

  // Extract and clean body text
  const text = $('body')
    .text()
    .replace(/\s+/g, ' ')   // collapse whitespace
    .replace(/\n{3,}/g, '\n\n') // max two consecutive newlines
    .trim()

  // Collect all same-domain links
  const base = new URL(url)
  const links: string[] = []

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return

    try {
      const resolved = new URL(href, base)

      // Stay on the same hostname, skip anchors and non-http links
      if (
        resolved.hostname === base.hostname &&
        (resolved.protocol === 'http:' || resolved.protocol === 'https:') &&
        resolved.pathname !== base.pathname
      ) {
        // Normalise: strip hash and trailing slash
        resolved.hash = ''
        const clean = resolved.toString().replace(/\/$/, '')
        links.push(clean)
      }
    } catch {
      // Malformed href — skip
    }
  })

  // Deduplicate links
  const uniqueLinks = [...new Set(links)]

  return { url, text, links: uniqueLinks, success: true }
}
