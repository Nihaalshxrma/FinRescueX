// FinRescue X — Document Preflight Service
import fs from 'fs';
import path from 'path';

// Magic bytes for common file formats
const MAGIC_BYTES: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
};

const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_FILE_SIZE_KB = 10240; // 10MB

export interface PreflightResult {
  id: string;
  documentId: string;
  filename: string;
  mimeType: string;
  fileSizeKB: number;
  isPdf: boolean;
  pageCount: number;
  isPasswordProtected: boolean;
  isCorrupted: boolean;
  hasEmptyPages: boolean;
  emptyPageNumbers: number[];
  rotationNeededPages: number[];
  inconsistentDimensions: boolean;
  status: string;
  statusMessage: string;
  reasons: string[];
  safeForOcr: boolean;
  timestamp: string;
}

export async function runPreflight(filePath: string, originalFilename: string, mimeType: string, documentId: string): Promise<PreflightResult> {
  const id = `pf-${Date.now().toString(36)}`;
  const timestamp = new Date().toISOString();
  const reasons: string[] = [];

  // Check file exists
  if (!fs.existsSync(filePath)) {
    return createResult(id, documentId, originalFilename, mimeType, 0, false, 0, 'INVALID_FILE', 'File not found on server', ['File does not exist at expected path'], timestamp);
  }

  const stats = fs.statSync(filePath);
  const fileSizeKB = Math.round(stats.size / 1024);

  // Check file size
  if (stats.size === 0) {
    return createResult(id, documentId, originalFilename, mimeType, 0, false, 0, 'EMPTY_DOCUMENT', 'Uploaded file is empty (0 bytes)', ['File has zero bytes'], timestamp);
  }
  if (fileSizeKB > MAX_FILE_SIZE_KB) {
    return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, false, 0, 'INVALID_FILE', `File size ${fileSizeKB}KB exceeds maximum ${MAX_FILE_SIZE_KB}KB`, ['File exceeds maximum allowed size'], timestamp);
  }

  // Check MIME type
  if (!ALLOWED_MIMES.includes(mimeType)) {
    return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, false, 0, 'UNSUPPORTED_FORMAT', `File type '${mimeType}' is not supported`, ['Unsupported file format'], timestamp);
  }

  // Validate magic bytes
  const buffer = Buffer.alloc(16);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 16, 0);
  fs.closeSync(fd);

  const ext = path.extname(originalFilename).toLowerCase();
  const isPdf = mimeType === 'application/pdf' || ext === '.pdf';

  // Check magic bytes match
  if (isPdf) {
    const pdfMagic = MAGIC_BYTES['application/pdf'];
    const matches = pdfMagic.every((b, i) => buffer[i] === b);
    if (!matches) {
      // Check if it's a different file masquerading as PDF
      if (mimeType === 'application/pdf') {
        return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, true, 0, 'CORRUPTED_PDF', 'File claims to be PDF but does not have a valid PDF header', ['PDF magic bytes not found', 'File extension/MIME mismatch'], timestamp);
      }
    }
  }

  // PDF-specific checks
  if (isPdf) {
    try {
      const fileContent = fs.readFileSync(filePath);
      const contentStr = fileContent.toString('latin1');

      // Check for encryption/password protection
      if (contentStr.includes('/Encrypt') || contentStr.includes('/Standard')) {
        // Check if it has an Encrypt dictionary
        const hasEncrypt = contentStr.includes('/Encrypt');
        if (hasEncrypt) {
          return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, true, 0, 'PASSWORD_PROTECTED', 'This PDF is password protected. Please upload an unlocked copy or follow an approved document-submission method.', ['PDF requires a password to open', 'Do not attempt to crack or bypass the password'], timestamp);
        }
      }

      // Count pages (simple heuristic)
      const pageMatches = contentStr.match(/\/Type\s*\/Page[^s]/g);
      const pageCount = pageMatches ? pageMatches.length : 0;

      if (pageCount === 0) {
        return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, true, 0, 'EMPTY_DOCUMENT', 'PDF has zero readable pages', ['No page objects found in PDF structure'], timestamp);
      }

      // Check for corruption indicators
      if (!contentStr.includes('%%EOF')) {
        reasons.push('PDF may be truncated — missing EOF marker');
      }

      // Check for malformed xref
      if (!contentStr.includes('xref') && !contentStr.includes('XRef')) {
        reasons.push('PDF cross-reference table missing or malformed');
      }

      // If we got warnings but file is parseable
      if (reasons.length > 0) {
        return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, true, pageCount, 'READY_WITH_WARNINGS', `PDF parsed with ${reasons.length} warning(s)`, reasons, timestamp);
      }

      return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, true, pageCount, 'READY_FOR_VERIFICATION', 'PDF passed all preflight checks', [], timestamp);
    } catch (e: any) {
      return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, true, 0, 'CORRUPTED_PDF', 'Unable to parse PDF file structure', ['PDF parsing error: ' + (e.message || 'Unknown error')], timestamp);
    }
  }

  // Image checks
  if (mimeType.startsWith('image/')) {
    // Basic image validation — check magic bytes match claimed type
    let expectedMagic = MAGIC_BYTES[mimeType];
    if (expectedMagic) {
      const magicMatch = expectedMagic.every((b, i) => buffer[i] === b);
      if (!magicMatch && mimeType !== 'image/webp') {
        reasons.push('Image file header does not match claimed MIME type');
      }
    }

    if (fileSizeKB < 5) {
      reasons.push('Image file is very small — may be low quality or corrupt');
    }

    if (reasons.length > 0) {
      return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, false, 1, 'READY_WITH_WARNINGS', 'Image file has warnings', reasons, timestamp);
    }
    return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, false, 1, 'READY_FOR_VERIFICATION', 'Image file passed preflight checks', [], timestamp);
  }

  return createResult(id, documentId, originalFilename, mimeType, fileSizeKB, false, 1, 'READY_FOR_VERIFICATION', 'File passed preflight checks', [], timestamp);
}

function createResult(id: string, documentId: string, filename: string, mimeType: string, fileSizeKB: number, isPdf: boolean, pageCount: number, status: string, statusMessage: string, reasons: string[], timestamp: string): PreflightResult {
  return {
    id, documentId, filename, mimeType, fileSizeKB, isPdf, pageCount,
    isPasswordProtected: status === 'PASSWORD_PROTECTED',
    isCorrupted: status === 'CORRUPTED_PDF',
    hasEmptyPages: false, emptyPageNumbers: [], rotationNeededPages: [],
    inconsistentDimensions: false,
    status, statusMessage, reasons,
    safeForOcr: status === 'READY_FOR_VERIFICATION' || status === 'READY_WITH_WARNINGS',
    timestamp
  };
}
