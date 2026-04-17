import { scrapePage } from './static-scraper'

const MAX_PAGES = 10   // max pages to crawl per program
const MAX_DEPTH = 2    // how many levels deep to follow links
const MIN_TEXT_LENGTH = 500  // chars — below this we consider a page JS-rendered

export type CrawlResult = {
  combinedText: string
  pagesCrawled: string[]
  failedPages: string[]
}

/**
 * Crawls a program URL and all relevant sub-pages within the same path prefix.
 * Returns combined cleaned text ready for chunking.
 */
export async function crawlProgram(rootUrl: string): Promise<CrawlResult> {
  const base = new URL(rootUrl)

  // Only follow links that share the same path prefix as the root
  // e.g. root = /graduate/cs → only follow /graduate/cs/*
  const pathPrefix = base.pathname.replace(/\/$/, '')

  const visited = new Set<string>()
  const pagesCrawled: string[] = []
  const failedPages: string[] = []
  const textParts: string[] = []

  // Queue entries: [url, depth]
  const queue: Array<[string, number]> = [[rootUrl, 0]]

  while (queue.length > 0 && pagesCrawled.length < MAX_PAGES) {
    const [url, depth] = queue.shift()!

    if (visited.has(url)) continue
    visited.add(url)

    const result = await scrapePage(url)

    if (!result.success || result.text.length < MIN_TEXT_LENGTH) {
      // Page failed or returned too little text (likely JS-rendered)
      // TODO: Playwright fallback goes here in v2
      if (!result.success) failedPages.push(url)
      continue
    }

    textParts.push(`\n\n--- Page: ${url} ---\n\n${result.text}`)
    pagesCrawled.push(url)

    // Enqueue sub-links if we haven't hit depth limit
    if (depth < MAX_DEPTH) {
      for (const link of result.links) {
        if (!visited.has(link) && isRelevantLink(link, base.hostname, pathPrefix)) {
          queue.push([link, depth + 1])
        }
      }
    }
  }

  return {
    combinedText: textParts.join(''),
    pagesCrawled,
    failedPages,
  }
}

/**
 * Returns true if the link is worth crawling:
 * - same hostname
 * - starts with the root path prefix
 * - not a file download
 */
function isRelevantLink(url: string, hostname: string, pathPrefix: string): boolean {
  try {
    const parsed = new URL(url)

    if (parsed.hostname !== hostname) return false
    if (!parsed.pathname.startsWith(pathPrefix)) return false

    // Skip file downloads
    const skipExtensions = ['.pdf', '.doc', '.docx', '.xls', '.zip', '.png', '.jpg', '.jpeg']
    if (skipExtensions.some((ext) => parsed.pathname.endsWith(ext))) return false

    return true
  } catch {
    return false
  }
}
