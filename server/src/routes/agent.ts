// FinRescue X — AI Agent Routes (Sarvam AI Native + Gemini + Regional Voice)
import { Router, Response } from 'express';
import { findMany, findById, addRecord } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { SarvamService } from '../services/sarvamService';
import multer from 'multer';
import { v4 as uuid } from 'uuid';

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB audio limit

let genaiClient: any = null;

async function getGenAI(customApiKey?: string) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    genaiClient = new GoogleGenAI({ apiKey });
    return genaiClient;
  } catch (e) {
    console.log('[AI] Gemini SDK init error:', e);
    return null;
  }
}

const SYSTEM_PROMPT = `You are "Merchant Care" — an empathetic, sovereign AI advisor for FinRescue X helping users and merchants with personal loans, business loans, document verification, and journey recovery.
You assist both retail salaried users and business merchants.
- Explain loan criteria, reducing balance EMI vs daily settlement deductions, ROI, APR, processing fees, and Key Fact Statements.
- Troubleshoot document rejection (blur, bad lighting, PDF encryption, unreadable pages).
- Explain single page replacement: when 1 page is damaged, the customer can replace just that single page while valid pages remain safe.
- Answer natively and accurately in the requested Indian language (English, Hindi, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada).
- Keep responses concise, warm, professional, and directly actionable.
- Note: This is an independent hackathon demo environment.`;

const REGIONAL_FALLBACKS: Record<string, string> = {
  'hi-IN': `नमस्ते! मैं आपका "Merchant Care" AI सहायक हूँ।\n\n• क्या आपका बैंक स्टेटमेंट या पैन कार्ड रिजेक्ट हुआ है? आप केवल धुंधले पेज को 'Replace Page' से बदल सकते हैं।\n• लोन की शर्तें (EMI, ROI, APR) या पुनर्भुगतान के बारे में कोई भी प्रश्न पूछें।\n• यदि आपको तुरंत सहायता चाहिए तो 1 मिनट के अंदर कॉलबैक का अनुरोध करें!`,
  'mr-IN': `नमस्कार! मी तुमचा "Merchant Care" AI सहाय्यक आहे.\n\n• तुमचे बँक स्टेटमेंट किंवा कागदपत्र रिजेक्ट झाले आहे का? संपूर्ण डॉक्युमेंट पुन्हा अपलोड न करता तुम्ही फक्त अस्पष्ट पेज बदलू शकता ('Replace Page').\n• कर्ज व्याजदर (ROI), EMI किंवा परतफेडीबद्दल काहीही विचारा.\n• आम्ही मदतीसाठी सदैव उपलब्ध आहोत!`,
  'gu-IN': `નમસ્તે! હું તમારો "Merchant Care" AI સહાયક છું.\n\n• શું તમારું બેંક સ્ટેટમેન્ટ રિજેક્ટ થયું છે? તમે માત્ર અસ્પષ્ટ પેજને 'Replace Page' દ્વારા બદલી શકો છો.\n• લોન વ્યાજ દર (ROI), EMI અને દૈનિક કપાત વિશે કંઈ પણ પૂછો. અમે મદદ કરવા તૈયાર છીએ!`,
  'bn-IN': `নমস্কার! আমি আপনার "Merchant Care" AI সহকারী।\n\n• আপনার ব্যাঙ্ক স্টেটমেন্ট কি বাতিল হয়েছে? আপনি পুরো নথির পরিবর্তে শুধুমাত্র ঝাপসা পৃষ্ঠাটি রিপ্লেস করতে পারেন।\n• লোনের শর্তাবলী, EMI বা প্রতিদিনের ডিডাকশন সম্পর্কে যেকোন প্রশ্ন করতে পারেন।`,
  'ta-IN': `வணக்கம்! நான் உங்கள் "Merchant Care" AI உதவியாளர்.\n\n• உங்கள் வங்கி அறிக்கை நிராகரிக்கப்பட்டதா? மங்கலான பக்கத்தை மட்டும் 'Replace Page' மூலம் மாற்றலாம்.\n• கடன் வட்டி விகிதம் (ROI), EMI அல்லது திருப்பிச் செலுத்துதல் பற்றி எதுவும் கேளுங்கள்.`,
  'te-IN': `నమస్కారం! నేను మీ "Merchant Care" AI సహాయకుడిని.\n\n• మీ బ్యాంక్ స్టేట్‌మెంట్ తిరస్కరించబడిందా? మొత్తం డాక్యుమెంట్‌కు బదులుగా బ్లర్ అయిన పేజీని మాత్రమే 'Replace Page' ద్వారా మార్చవచ్చు.\n• లోన్ వడ్డీ రేట్లు, EMI మరియు నిబంధనల గురించి ఏదైనా అడగండి.`,
  'kn-IN': `ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ "Merchant Care" AI ಸಹಾಯಕ.\n\n• ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್ ತಿರಸ್ಕರಿಸಲ್ಪಟ್ಟಿದೆಯೇ? ಮಸುಕಾದ ಪುಟವನ್ನು ಮಾತ್ರ 'Replace Page' ಮೂಲಕ ಬದಲಾಯಿಸಬಹುದು.\n• ಸಾಲದ ನಿಯಮಗಳು, EMI ಅಥವಾ ಮರುಪಾವತಿಯ ಬಗ್ಗೆ ಯಾವುದೇ ಮಾಹಿತಿ ಪಡೆಯಿರಿ.`,
  'en-IN': `Hello! I am Merchant Care, your personal and business loan assistant.\n\n• If your bank statement had an unreadable page, you only need to replace that single page — previously valid pages are preserved!\n• Ask me anything about reducing-balance EMIs, APR, daily QR settlements, or KYC verification.\n• Need quick human assistance? Request a 1-minute callback anytime!`
};

// Unified Sarvam AI / Gemini Chat Handler
const handleChatRequest = async (req: AuthRequest, res: Response) => {
  const { message, language, applicationId, customApiKey, sarvamApiKey, preferredEngine } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const lang = language || 'hi-IN';
  const timestamp = new Date().toISOString();

  // Save user message
  const userMsg = {
    id: uuid(),
    applicationId: applicationId || null,
    userId: req.user.id,
    sender: 'user',
    text: message,
    language: lang,
    timestamp
  };
  addRecord('chatMessages', userMsg);

  let responseText = '';
  let poweredBy = 'fallback';

  // Extract root cause alert from document preflight / credential checks if available
  let rootCauseAlert = '';
  if (applicationId) {
    const app = findById('applications', applicationId);
    if (app) {
      const appDocs = app.documents || findMany('documents', (d: any) => d.applicationId === applicationId);
      const failedDocs = (appDocs || []).filter((d: any) =>
        d.preflightReport?.status === 'CREDENTIAL_MISMATCH' ||
        d.credentialReport?.passed === false ||
        !d.preflightReport?.safeForOcr ||
        d.validationReport?.overallStatus === 'FAILED' ||
        d.validationReport?.overallStatus === 'PARTIAL_REPLACEMENT_NEEDED' ||
        d.validationReport?.pageReports?.some((p: any) => p.quality === 'Blurry')
      );
      if (failedDocs.length > 0) {
        const issues = failedDocs.map((d: any) => {
          const reason = d.preflightReport?.statusMessage || d.credentialReport?.failureReason || 'Blurry or unreadable page';
          return `${d.documentType}: ${reason}`;
        }).join('; ');
        rootCauseAlert = `\n[ROOT CAUSE ALERT]: Applicant had document verification issue: ${issues}. Applicant Name: "${app.personalDetails?.fullName || ''}", Registered PAN: "${app.personalDetails?.panNumber || ''}". Please proactively guide the merchant/applicant with empathetic, clear steps to re-upload a clear document matching their registered profile.`;
      }
    }
  }

  // 1. Try Sarvam AI first (or if requested)
  if (preferredEngine !== 'gemini' && (process.env.SARVAM_API_KEY || sarvamApiKey)) {
    try {
      let sysPrompt = SYSTEM_PROMPT + `\nRespond natively in language: ${lang}.`;
      if (applicationId) {
        const app = findById('applications', applicationId);
        if (app) {
          sysPrompt += ` Current application: ${app.id}, Category: ${app.applicantCategory}, Amount: ₹${app.requestedAmountINR}, Status: ${app.status}.`;
        }
      }
      if (rootCauseAlert) {
        sysPrompt += rootCauseAlert;
      }

      const sarvamRes = await SarvamService.generateChatResponse([
        { role: 'system', content: sysPrompt },
        { role: 'user', content: message }
      ], {
        apiKey: sarvamApiKey
      });

      if (sarvamRes.text) {
        responseText = sarvamRes.text;
        poweredBy = 'sarvam-ai';
      }
    } catch (sarvamErr: any) {
      console.warn('[AI] Sarvam Chat failed, attempting Gemini:', sarvamErr.message);
    }
  }

  // 2. If Sarvam did not produce response, try Gemini
  if (!responseText) {
    const genai = await getGenAI(customApiKey);
    if (genai) {
      try {
        let context = SYSTEM_PROMPT + `\n\nUser Language: ${lang}. You MUST respond completely in the script/language associated with: ${lang}.\n`;
        if (applicationId) {
          const app = findById('applications', applicationId);
          if (app) {
            context += `Current application: ${app.id}, Category: ${app.applicantCategory}, Stage: ${app.stage}, Status: ${app.status}, Amount: ₹${app.requestedAmountINR}\n`;
          }
        }
        if (rootCauseAlert) {
          context += rootCauseAlert;
        }

        const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
        const result = await genai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: `${context}\n\nUser query: "${message}"` }] }]
        });
        responseText = result.text || 'I could not generate a response. Please try again.';
        poweredBy = 'gemini';
      } catch (geminiErr: any) {
        console.error('[AI] Gemini generation failed, falling back:', geminiErr.message);
        responseText = getSmartRegionalResponse(message, lang);
      }
    } else {
      responseText = getSmartRegionalResponse(message, lang);
    }
  }

  // Save assistant message
  const assistantMsg = {
    id: uuid(),
    applicationId: applicationId || null,
    userId: req.user.id,
    sender: 'assistant',
    text: responseText,
    language: lang,
    timestamp: new Date().toISOString(),
    poweredBy
  };
  addRecord('chatMessages', assistantMsg);

  res.json({
    response: assistantMsg,
    poweredBy,
    sarvamActive: !!(process.env.SARVAM_API_KEY || sarvamApiKey),
    geminiActive: !!(process.env.GEMINI_API_KEY || customApiKey)
  });
};

// POST /api/agent/chat — Powered by Sarvam AI 105B (with Gemini / rule fallbacks)
router.post('/chat', authenticateToken, handleChatRequest);
router.post('/merchant-ai/chat', authenticateToken, handleChatRequest);
router.post('/merchant-care/chat', authenticateToken, handleChatRequest);

// POST /api/agent/tts — Voice synthesis via Sarvam AI Bulbul v3
router.post('/tts', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { text, language, speaker, sarvamApiKey, pace } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text required for TTS' });
  }

  try {
    const ttsResult = await SarvamService.textToSpeech(
      text,
      language || 'hi-IN',
      {
        apiKey: sarvamApiKey,
        speaker: speaker || 'ritu',
        pace: pace ? Number(pace) : 1.0
      }
    );

    res.json({
      success: true,
      audioBase64: ttsResult.audioBase64,
      format: ttsResult.format,
      speaker: speaker || 'ritu',
      poweredBy: 'sarvam-bulbul-v3'
    });
  } catch (err: any) {
    console.error('[TTS] Sarvam TTS error:', err.message);
    res.status(500).json({ error: 'Failed to synthesize speech with Sarvam AI: ' + err.message });
  }
});

// POST /api/agent/stt — Voice transcription via Sarvam AI Saaras v4
router.post('/stt', authenticateToken, upload.single('audio'), async (req: AuthRequest, res: Response) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ error: 'Audio file upload required' });
  }

  const { language, sarvamApiKey } = req.body;

  try {
    const sttResult = await SarvamService.speechToText(
      req.file.buffer,
      req.file.originalname || 'voice_input.wav',
      {
        apiKey: sarvamApiKey,
        languageCode: language || 'hi-IN'
      }
    );

    res.json({
      success: true,
      transcript: sttResult.transcript,
      languageCode: sttResult.languageCode,
      poweredBy: 'sarvam-saaras-v4'
    });
  } catch (err: any) {
    console.error('[STT] Sarvam STT error:', err.message);
    res.status(500).json({ error: 'Failed to transcribe speech with Sarvam AI: ' + err.message });
  }
});

// POST /api/agent/set-sarvam-key — Update Sarvam API Key dynamically
router.post('/set-sarvam-key', authenticateToken, (req: AuthRequest, res: Response) => {
  const { apiKey } = req.body;
  if (apiKey && typeof apiKey === 'string') {
    process.env.SARVAM_API_KEY = apiKey.trim();
    return res.json({ success: true, message: 'Sarvam AI API Key updated successfully.' });
  }
  res.status(400).json({ error: 'Valid apiKey string required' });
});

// POST /api/agent/set-key
router.post('/set-key', authenticateToken, (req: AuthRequest, res: Response) => {
  const { apiKey } = req.body;
  if (apiKey && typeof apiKey === 'string') {
    process.env.GEMINI_API_KEY = apiKey.trim();
    genaiClient = null;
    return res.json({ success: true, message: 'Gemini API Key configured dynamically for this session.' });
  }
  res.status(400).json({ error: 'Valid apiKey string required' });
});

// GET /api/agent/:applicationId/history
router.get('/:applicationId/history', authenticateToken, (req: AuthRequest, res: Response) => {
  const messages = findMany('chatMessages', (m: any) => 
    (!m.applicationId || m.applicationId === req.params.applicationId) && m.userId === req.user.id
  );
  res.json({ messages: messages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) });
});

function getSmartRegionalResponse(message: string, lang: string): string {
  const base = REGIONAL_FALLBACKS[lang] || REGIONAL_FALLBACKS['en-IN'];
  const lower = message.toLowerCase();

  if (lower.includes('callback') || lower.includes('call') || lower.includes('contact') || lower.includes('phone') || lower.includes('फोन')) {
    if (lang === 'hi-IN') return `आप 1 मिनट के अंदर सहायता कॉलबैक का अनुरोध कर सकते हैं! 'Support' पेज पर जाएं या ऊपर दिए गए '1-Min Quick Callback' बटन पर टैप करें। हमारी टीम तुरंत आपके नंबर पर संपर्क करेगी।`;
    if (lang === 'mr-IN') return `तुम्ही 1 मिनिटात कॉलबॅक मिळवू शकता! 'Support' टॅबवर जाऊन '1-Min Quick Callback' विनंती पाठवा.`;
    return `You can request an instant 1-Minute Priority Callback! Head over to Support or tap the 1-Min Quick Callback option in the header. Our loan officer will ring your mobile right away.`;
  }

  if (lower.includes('replace') || lower.includes('blurry') || lower.includes('धुंधला') || lower.includes('page 2') || lower.includes('reject')) {
    if (lang === 'hi-IN') return `आपके बैंक स्टेटमेंट का केवल पेज 2 धुंधला था। FinRescue X की खासियत है कि आपको पूरा डॉक्यूमेंट फिर से अपलोड करने की जरूरत नहीं है — 'Replace Page 2 Only' बटन दबाएं, और पहले से पास हुए बाकी पेजेस सुरक्षित रहेंगे। या आप 'Replace All' भी चुन सकते हैं।`;
    if (lang === 'mr-IN') return `तुमच्या डॉक्युमेंटचे फक्त दुसरे पान अस्पष्ट होते. तुम्ही 'Replace Page 2' द्वारे फक्त तेच पान बदलू शकता, किंवा सर्व पाने पुन्हा अपलोड करण्यासाठी 'Replace All' वापरू शकता.`;
    return `Page 2 of your bank statement was flagged as blurry. With FinRescue X, you don't need to restart! Click 'Replace Page 2 Only' to substitute only that page while keeping pages 1, 3, and 4 intact. Or you can click 'Replace All' if you prefer a complete re-upload.`;
  }

  return base;
}

export default router;
