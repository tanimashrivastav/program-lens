import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,      // max characters per chunk
  chunkOverlap: 200,    // characters shared between adjacent chunks
  separators: [
    '\n\n',  // paragraph breaks first
    '\n',    // then line breaks
    '. ',    // then sentences
    ' ',     // then words
    '',      // last resort: characters
  ],
})

export type TextChunk = {
  content: string
  chunkIndex: number
  tokenCount: number
}

/**
 * Splits raw scraped text into overlapping chunks ready for embedding.
 */
export async function chunkText(text: string): Promise<TextChunk[]> {
  const docs = await splitter.createDocuments([text])

  return docs.map((doc, index) => ({
    content: doc.pageContent,
    chunkIndex: index,
    tokenCount: estimateTokenCount(doc.pageContent),
  }))
}

/**
 * Rough token estimate: ~4 characters per token (OpenAI rule of thumb).
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}
