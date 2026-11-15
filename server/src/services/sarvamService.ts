// FinRescue X — Sarvam AI Sovereign Service
// Powers Indic Chat Completion, Text-to-Speech (Bulbul v3), and Speech-to-Text (Saaras v4)

export interface SarvamChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class SarvamService {
  private static getApiKey(customKey?: string): string {
    return (customKey || process.env.SARVAM_API_KEY || '').trim();
  }

  /**
   * Sanitizes markdown & special formatting and splits text into chunks of <= 450 characters
   * because Sarvam TTS enforces a strict 500-char per item limit and max 3 items per request.
   */
  public static prepareTtsChunks(text: string, maxLen: number = 450, maxChunks: number = 3): string[] {
    if (!text) return [];

    // Strip markdown formatting, bullet symbols, asterisks, brackets
    let clean = text
      .replace(/[*#_`~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    if (clean.length <= maxLen) {
      return [clean];
    }

    // Split on sentence boundaries including Indic Danda (।), period, question mark, or exclamation
    const sentences = clean.split(/([.?!।\n]+)/);
    const chunks: string[] = [];
    let current = '';

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] || '';
      const punct = sentences[i + 1] || '';
      const full = (sentence + punct).trim();
      if (!full) continue;

      if ((current + ' ' + full).trim().length <= maxLen) {
        current = (current + ' ' + full).trim();
      } else {
        if (current) {
          chunks.push(current);
        }
        // If single sentence itself exceeds maxLen, truncate cleanly
        current = full.slice(0, maxLen);
      }

      if (chunks.length >= maxChunks) break;
    }

    if (current && chunks.length < maxChunks) {
      chunks.push(current);
    }

    return chunks.slice(0, maxChunks);
  }

  /**
   * Chat completion using Sarvam 105B Conversations or Token Factory models
   */
  public static async generateChatResponse(
    messages: SarvamChatMessage[],
    options?: {
      apiKey?: string;
      model?: string;
      temperature?: number;
    }
  ): Promise<{ text: string; model: string }> {
    const key = this.getApiKey(options?.apiKey);
    if (!key) {
      throw new Error('Sarvam API key not configured');
    }

    const model = options?.model || process.env.SARVAM_CHAT_MODEL || 'sarvam-105b-conversations';

    const response = await fetch('https://api.sarvam.ai/v2/chat/completions', {
      method: 'POST',
      headers: {
        'api-subscription-key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.5
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Sarvam Chat API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const replyText = data.choices?.[0]?.message?.content || '';
    return { text: replyText, model };
  }

  /**
   * Text-to-Speech conversion using Bulbul v3 with authentic Indian accent/voices
   * Handles regional languages (Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, English)
   * Safely formats and chunks text to stay strictly within Sarvam's API boundaries.
   */
  public static async textToSpeech(
    text: string,
    targetLanguageCode: string = 'hi-IN',
    options?: {
      apiKey?: string;
      speaker?: string;
      model?: string;
      pace?: number;
    }
  ): Promise<{ audioBase64: string; format: string }> {
    const key = this.getApiKey(options?.apiKey);
    if (!key) {
      throw new Error('Sarvam API key not configured');
    }

    const speaker = options?.speaker || 'ritu';
    const model = options?.model || process.env.SARVAM_TTS_MODEL || 'bulbul:v3';

    // Normalize language codes to Sarvam standard format (hi-IN, mr-IN, gu-IN, bn-IN, ta-IN, te-IN, kn-IN, en-IN)
    let lang = targetLanguageCode;
    if (lang === 'en') lang = 'en-IN';
    if (lang === 'hi') lang = 'hi-IN';
    if (lang === 'mr') lang = 'mr-IN';
    if (lang === 'gu') lang = 'gu-IN';
    if (lang === 'bn') lang = 'bn-IN';
    if (lang === 'ta') lang = 'ta-IN';
    if (lang === 'te') lang = 'te-IN';
    if (lang === 'kn') lang = 'kn-IN';

    // Prepare clean chunks <= 450 characters (Sarvam limit is 500 chars per item, max 3 items)
    const chunks = this.prepareTtsChunks(text, 450, 3);
    if (chunks.length === 0) {
      throw new Error('No speakable text provided');
    }

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: chunks,
        target_language_code: lang,
        speaker,
        model,
        pace: options?.pace ?? 1.0
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Sarvam TTS error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const audioBase64 = data.audios?.[0] || '';
    return { audioBase64, format: 'audio/wav' };
  }

  /**
   * Speech-to-Text conversion using Saaras v4
   * Takes audio buffer and outputs transcribed text
   */
  public static async speechToText(
    audioBuffer: Buffer,
    filename: string = 'audio.wav',
    options?: {
      apiKey?: string;
      languageCode?: string;
      model?: string;
    }
  ): Promise<{ transcript: string; languageCode?: string }> {
    const key = this.getApiKey(options?.apiKey);
    if (!key) {
      throw new Error('Sarvam API key not configured');
    }

    const model = options?.model || process.env.SARVAM_STT_MODEL || 'saaras:v4';

    const formData = new FormData();
    const blob = new Blob([audioBuffer]);
    formData.append('file', blob, filename);
    formData.append('model', model);
    formData.append('mode', 'transcribe');
    if (options?.languageCode) {
      formData.append('language_code', options.languageCode);
    }

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': key
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Sarvam STT error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    return {
      transcript: data.transcript || '',
      languageCode: data.language_code
    };
  }
}
