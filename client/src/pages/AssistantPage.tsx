import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileShell } from '../components/MobileShell';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  RotateCcw,
  Bot,
  User,
  Globe,
  Sparkles,
  Zap,
  Radio,
  Sliders,
  CheckCircle2,
  Loader2
} from 'lucide-react';

const LANGUAGES = [
  { code: 'hi-IN', label: 'हिंदी (Hindi)', flag: '🇮🇳' },
  { code: 'mr-IN', label: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'gu-IN', label: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'en-IN', label: 'English (Indian)', flag: '🌐' },
];

const SARVAM_SPEAKERS = [
  { id: 'ritu', label: 'Ritu (Female, Natural Warm)' },
  { id: 'aditya', label: 'Aditya (Male, Confident)' },
  { id: 'priya', label: 'Priya (Female, Crisp Professional)' },
  { id: 'rahul', label: 'Rahul (Male, Clear Advisor)' },
  { id: 'pooja', label: 'Pooja (Female, Calm Support)' },
  { id: 'ashutosh', label: 'Ashutosh (Male, Deep Voice)' }
];

export const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { geminiApiKey, sarvamApiKey, setSarvamApiKey } = useAuth();

  const [messages, setMessages] = useState<any[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'नमस्ते! मैं आपका Merchant Care AI वॉइस और चैट असिस्टेंट हूँ (Powered by Sarvam AI & Gemini)।\n\nआप मुझसे हिंदी, मराठी, गुजराती, तमिल या अपनी क्षेत्रीय भाषा में पर्सनल लोन, ब्याज दर (ROI), EMI या बैंक स्टेटमेंट रिजेक्शन के बारे में बोलकर या लिखकर पूछ सकते हैं।',
      language: 'hi-IN',
      timestamp: new Date().toISOString(),
      poweredBy: 'sarvam-ai'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('hi-IN');
  const [selectedSpeaker, setSelectedSpeaker] = useState('ritu');
  const [useSarvamVoice, setUseSarvamVoice] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null);

  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [ttsLoadingMessageId, setTtsLoadingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const webSpeechRecognitionRef = useRef<any>(null);

  // Initialize browser speech recognition as zero-latency local fallback
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          handleSend(transcript);
          setIsRecording(false);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        webSpeechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn('Speech recognition init error:', err);
      }
    }
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Send Chat
  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      language,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.post('/agent/chat', {
        message: text,
        language,
        applicationId: 'FNX-DEMO-1001',
        sarvamApiKey: sarvamApiKey || undefined,
        customApiKey: geminiApiKey || undefined,
        preferredEngine: 'sarvam'
      });

      const assistantMsg = res.data.response;
      setMessages((prev) => [...prev, assistantMsg]);

      // Automatically speak the response in Sarvam Indian Voice
      speakWithSarvamOrWeb(assistantMsg.text, language);
    } catch (e) {
      console.error('Chat error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Play audio using Sarvam Bulbul v3 TTS
  const speakWithSarvamOrWeb = async (text: string, langCode: string, msgId?: string) => {
    stopSpeaking();

    if (msgId) {
      setTtsLoadingMessageId(msgId);
    }

    if (useSarvamVoice) {
      try {
        const res = await api.post('/agent/tts', {
          text,
          language: langCode,
          speaker: selectedSpeaker,
          sarvamApiKey: sarvamApiKey || undefined
        });

        if (res.data?.audioBase64) {
          const audioSrc = `data:${res.data.format || 'audio/wav'};base64,${res.data.audioBase64}`;
          const audio = new Audio(audioSrc);
          setActiveAudioElement(audio);
          setIsSpeaking(true);
          if (msgId) setSpeakingMessageId(msgId);
          setTtsLoadingMessageId(null);

          audio.onended = () => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
            setActiveAudioElement(null);
          };

          audio.onerror = () => {
            setIsSpeaking(false);
            setSpeakingMessageId(null);
            setActiveAudioElement(null);
            speakWithBrowserFallback(text, langCode);
          };

          await audio.play();
          return;
        }
      } catch (err) {
        console.warn('[Sarvam TTS failed, using browser speech]:', err);
      } finally {
        setTtsLoadingMessageId(null);
      }
    }

    // Fallback to browser Web Speech API
    speakWithBrowserFallback(text, langCode);
  };

  const speakWithBrowserFallback = (text: string, langCode: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;

        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find((v) => v.lang.startsWith(langCode.substring(0, 2)));
        if (matchedVoice) utterance.voice = matchedVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      }
    } else {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  const stopSpeaking = () => {
    if (activeAudioElement) {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      setActiveAudioElement(null);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    setTtsLoadingMessageId(null);
  };

  // Sarvam AI Speech-to-Text via MediaRecorder
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

        if (audioBlob.size > 1000) {
          setIsProcessingAudio(true);
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'mic_record.wav');
            formData.append('language', language);
            if (sarvamApiKey) {
              formData.append('sarvamApiKey', sarvamApiKey);
            }

            const res = await api.post('/agent/stt', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.transcript) {
              setInputText(res.data.transcript);
              handleSend(res.data.transcript);
            }
          } catch (sttErr: any) {
            console.warn('[Sarvam STT failed, using WebSpeech fallback]:', sttErr);
          } finally {
            setIsProcessingAudio(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (micErr) {
      console.warn('Microphone permission or MediaRecorder error, falling back to WebSpeech:', micErr);
      if (webSpeechRecognitionRef.current) {
        try {
          webSpeechRecognitionRef.current.lang = language;
          webSpeechRecognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          setIsRecording(false);
        }
      } else {
        alert('Could not access microphone. You can type freely in Hindi, Marathi, or English below.');
      }
    }
  };

  return (
    <MobileShell title="Sarvam AI Multilingual Voice Hub" showBack onBack={() => navigate('/home')}>
      <div className="flex flex-col h-full bg-slate-50">
        {/* Sarvam AI Engine & Language Ribbon */}
        <div className="bg-white px-3 py-2 border-b border-slate-200 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-paytm-navy">
              <span className="p-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span>Sarvam AI Sovereign Indian Voice</span>
            </div>
            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" /> Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Language Selector */}
            <div>
              <label className="text-[10px] text-slate-500 block font-semibold mb-0.5">Language:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-sky-50 border border-sky-200 rounded-lg px-2 py-1 text-xs font-bold text-paytm-blue focus:outline-hidden"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sarvam Voice Speaker Persona */}
            <div>
              <label className="text-[10px] text-slate-500 block font-semibold mb-0.5">Bulbul v3 Voice:</label>
              <select
                value={selectedSpeaker}
                onChange={(e) => setSelectedSpeaker(e.target.value)}
                className="w-full bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 text-xs font-bold text-amber-900 focus:outline-hidden"
              >
                {SARVAM_SPEAKERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-paytm-blue to-paytm-sky text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[84%] p-3 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-paytm-blue text-white rounded-br-none shadow-xs'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 text-[9px] text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-paytm-sky">
                      {isUser ? 'You' : 'Merchant Care AI'}
                    </span>
                    {m.poweredBy && (
                      <span className="text-[8px] bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
                        {m.poweredBy === 'sarvam-ai'
                          ? '🇮🇳 Sarvam-105B'
                          : m.poweredBy === 'gemini'
                          ? '✨ Gemini AI'
                          : 'Deterministic'}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-line">{m.text}</p>
                  {!isUser && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => speakWithSarvamOrWeb(m.text, m.language || language, m.id)}
                        disabled={ttsLoadingMessageId === m.id}
                        className={`text-[10px] flex items-center gap-1 font-bold transition ${
                          speakingMessageId === m.id
                            ? 'text-emerald-600 animate-pulse'
                            : 'text-paytm-blue hover:text-paytm-sky'
                        }`}
                      >
                        {ttsLoadingMessageId === m.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-paytm-sky" />
                            <span>Synthesizing voice...</span>
                          </>
                        ) : speakingMessageId === m.id ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                            <span>Playing in Sarvam Voice ({selectedSpeaker})...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-paytm-sky" />
                            <span>Listen in Sarvam Voice ({selectedSpeaker})</span>
                          </>
                        )}
                      </button>
                      {(isSpeaking || speakingMessageId === m.id) && (
                        <button
                          onClick={stopSpeaking}
                          className="text-[10px] text-rose-500 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          <VolumeX className="w-3 h-3" /> Stop
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2 items-center text-xs text-slate-500 p-2.5 bg-white rounded-xl border border-slate-200 w-max shadow-xs">
              <Loader2 className="w-4 h-4 text-paytm-sky animate-spin" />
              <span>Sarvam 105B is generating Indic response...</span>
            </div>
          )}

          {isProcessingAudio && (
            <div className="flex gap-2 items-center text-xs text-amber-800 p-2.5 bg-amber-50 rounded-xl border border-amber-200 w-max shadow-xs">
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Saaras v4 is transcribing your voice...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Voice Controls */}
        <div className="p-3 bg-white border-t border-slate-200 space-y-2 shadow-md">
          {/* Quick Regional Prompts */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px]">
            <button
              onClick={() => handleSend('मेरा बैंक स्टेटमेंट क्यों रिजेक्ट हुआ?')}
              className="bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full whitespace-nowrap text-paytm-blue font-semibold hover:bg-sky-100"
            >
              🇮🇳 स्टेटमेंट क्यों रिजेक्ट हुआ?
            </button>
            <button
              onClick={() => handleSend('माझा बँक स्टेटमेंट रिजेक्ट का झाला?')}
              className="bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full whitespace-nowrap text-paytm-blue font-semibold hover:bg-sky-100"
            >
              🇮🇳 स्टेटमेंट रिजेक्ट का झाले? (Marathi)
            </button>
            <button
              onClick={() => handleSend('What is reducing balance EMI vs daily settlement?')}
              className="bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full whitespace-nowrap text-paytm-blue font-semibold hover:bg-sky-100"
            >
              Reducing EMI vs Daily
            </button>
            <button
              onClick={() => handleSend('1 मिनट में कॉलबैक कैसे मिलेगा?')}
              className="bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap text-amber-900 font-bold"
            >
              ⚡ 1-Minute Callback
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleRecording}
              className={`p-2.5 rounded-full transition shadow-xs ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90'
              }`}
              title={isRecording ? 'Tap to finish voice input' : 'Tap to speak via Sarvam Saaras'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? 'Listening via Sarvam Saaras AI...' : 'Type or tap mic to speak in regional language...'}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-paytm-sky font-medium"
            />

            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className="p-2.5 bg-paytm-blue hover:bg-paytm-navy text-white rounded-full disabled:opacity-40 transition shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-between items-center text-[9px] text-slate-400 pt-0.5">
            <span>Powered by Sarvam AI (105B, Bulbul v3, Saaras v4)</span>
            <span className="text-paytm-sky font-semibold">22+ Indian Languages Supported</span>
          </div>
        </div>
      </div>
    </MobileShell>
  );
};
