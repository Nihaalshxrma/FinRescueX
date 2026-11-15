// FinRescue X — Gemini Natural Language Explanation Service
// Generates plain-language explanations of document verification results, discrepancies,
// and step-by-step re-upload guidance using Google Gemini API.

export class GeminiExplanationService {
  static async generateVerificationExplanation(
    documentType: string,
    verificationStatus: string,
    fieldChecks: any[],
    discrepancies: string[],
    applicantName?: string
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return this.fallbackExplanation(documentType, verificationStatus, discrepancies);
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

      const prompt = `You are FinRescue X KYC Verification Advisor. Provide a brief (2-3 sentences), warm, clear explanation of the following document verification outcome for ${applicantName || 'the applicant'}:
Document Type: ${documentType}
Verification Status: ${verificationStatus}
Field Checks: ${JSON.stringify(fieldChecks)}
Discrepancies: ${discrepancies.join(', ') || 'None'}

Rules:
- If MATCH: confirm verification success and assure the applicant their details matched.
- If MISMATCH or REUPLOAD_REQUIRED: clearly state what did not match and give gentle instructions on what document to re-upload.
- If UNREADABLE: explain why the document could not be read (blur, crop, darkness) and advise taking a clear flat photo.
- Keep tone professional, empathetic, and Indian fintech context. Never mention AI model names.`;

      const resp = await ai.models.generateContent({
        model,
        contents: prompt
      });

      return resp.text?.trim() || this.fallbackExplanation(documentType, verificationStatus, discrepancies);
    } catch (err: any) {
      console.warn('[GeminiExplanation] Gemini API failed, using fallback:', err.message);
      return this.fallbackExplanation(documentType, verificationStatus, discrepancies);
    }
  }

  private static fallbackExplanation(
    documentType: string,
    status: string,
    discrepancies: string[]
  ): string {
    const docName = documentType.replace(/_/g, ' ');
    if (status === 'MATCH' || status === 'VERIFIED') {
      return `Your ${docName} has been successfully validated. All extracted identifiers match your registered profile credentials.`;
    }
    if (status === 'MISMATCH' || status === 'REUPLOAD_REQUIRED') {
      const details = discrepancies.length > 0 ? discrepancies.join('. ') : 'A discrepancy was found between the document and your profile.';
      return `We could not verify your ${docName}. ${details}. Please ensure you upload an official document issued in your registered legal name.`;
    }
    if (status === 'UNREADABLE') {
      return `Your ${docName} appears unclear or blurry. Please upload a high-resolution, uncropped copy in good lighting or a digital PDF.`;
    }
    if (status === 'MANUAL_REVIEW') {
      return `Your ${docName} shows minor variations and has been routed to our verification team for manual underwriting review.`;
    }
    return `Your ${docName} is currently ${status.toLowerCase().replace(/_/g, ' ')}.`;
  }
}
