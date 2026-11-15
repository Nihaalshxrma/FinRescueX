// FinRescue X — LlamaParse Cloud Service (v2 Parse Engine)
// Dedicated document processing & layout-aware OCR parser for bank statements, salary slips & ITRs
import fs from 'fs';

export interface LlamaParsedPage {
  pageNumber: number;
  markdown: string;
  success: boolean;
}

export interface LlamaParseResult {
  jobId: string;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  pageCount: number;
  pages: LlamaParsedPage[];
  fullMarkdown: string;
  tablesDetected: number;
  extractedEntities?: {
    accountNumber?: string;
    ifscCode?: string;
    panNumber?: string;
    salaryAmount?: number;
    closingBalance?: number;
  };
}

export class LlamaParseService {
  private static getApiKey(customKey?: string): string {
    return (customKey || process.env.LLAMA_PARSE_API_KEY || '').trim();
  }

  /**
   * Upload file and parse via LlamaParse v2 API
   */
  public static async parseDocument(
    filePath: string,
    filename: string,
    options?: {
      apiKey?: string;
      tier?: 'fast' | 'cost_effective' | 'agentic' | 'agentic_plus';
      maxPages?: number;
    }
  ): Promise<LlamaParseResult> {
    const key = this.getApiKey(options?.apiKey);
    if (!key) {
      throw new Error('LlamaParse API key not configured (LLAMA_PARSE_API_KEY)');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, filename);

    const config: any = {
      tier: options?.tier || 'fast',
      version: 'latest'
    };
    if (options?.maxPages) {
      config.page_ranges = { max_pages: options.maxPages };
    }
    formData.append('configuration', JSON.stringify(config));

    // 1. Submit Parse Job (v2 /api/v2/parse/upload)
    const uploadRes = await fetch('https://api.cloud.llamaindex.ai/api/v2/parse/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`
      },
      body: formData
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`LlamaParse upload error (${uploadRes.status}): ${errText}`);
    }

    const uploadData: any = await uploadRes.json();
    const jobId = uploadData.id;
    if (!jobId) {
      throw new Error('LlamaParse did not return a valid jobId');
    }

    // 2. Poll for Completion (up to 30 seconds)
    const maxAttempts = 15;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 2000));

      const pollRes = await fetch(
        `https://api.cloud.llamaindex.ai/api/v2/parse/${jobId}?expand=markdown`,
        {
          headers: {
            Authorization: `Bearer ${key}`
          }
        }
      );

      if (!pollRes.ok) continue;

      const pollData: any = await pollRes.json();
      const status = pollData.job?.status;

      if (status === 'COMPLETED') {
        const rawPages = pollData.markdown?.pages || [];
        const parsedPages: LlamaParsedPage[] = rawPages.map((p: any, idx: number) => ({
          pageNumber: p.page_number || idx + 1,
          markdown: p.markdown || '',
          success: p.success !== false
        }));

        const fullMarkdown = parsedPages.map((p) => p.markdown).join('\n\n---\n\n');

        // Simple entity extraction heuristics from parsed markdown
        const entities: any = {};
        const panMatch = fullMarkdown.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
        if (panMatch) entities.panNumber = panMatch[0];

        const ifscMatch = fullMarkdown.match(/[A-Z]{4}0[A-Z0-9]{6}/);
        if (ifscMatch) entities.ifscCode = ifscMatch[0];

        const accMatch = fullMarkdown.match(/(?:A\/C|Account|A\/c|Acc)\s*(?:No\.?|Number)?\s*[:\-]?\s*([0-9]{9,18})/i);
        if (accMatch) entities.accountNumber = accMatch[1];

        // Count markdown tables
        const tableMatches = fullMarkdown.match(/\|[\s-:]+\|/g);
        const tablesDetected = tableMatches ? tableMatches.length : 0;

        return {
          jobId,
          status: 'COMPLETED',
          pageCount: parsedPages.length,
          pages: parsedPages,
          fullMarkdown,
          tablesDetected,
          extractedEntities: entities
        };
      } else if (status === 'FAILED') {
        throw new Error(`LlamaParse job failed: ${pollData.job?.error_message || 'Unknown processing error'}`);
      }
    }

    throw new Error('LlamaParse job processing timed out after 30 seconds');
  }
}
