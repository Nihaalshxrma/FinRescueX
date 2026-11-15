import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import {
  Bot,
  Send,
  X,
  PhoneCall,
  Sparkles,
  User,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe,
  Loader2,
  Radio,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MerchantCareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const INDIC_LANGUAGES = [
  { code: 'hi-IN', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr-IN', label: 'मराठी', flag: '🇮🇳' },
  { code: 'gu-IN', label: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bn-IN', label: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta-IN', label: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te-IN', label: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'en-IN', label: 'English', flag: '🌐' },
];

export const MerchantCareDrawer: React.FC<MerchantCareDrawerProps> = ({ isOpen, onClose }) => {
  const { user, sarvamApiKey, geminiApiKey } = useAuth();
  const [language, setLanguage] = useState<string>('hi-IN');
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `नमस्ते ${user?.name ? user.name.split(' ')[0] : ''}! मैं "Merchant Care & Merchant AI" हूँ (Powered by Sarvam AI)।\n\nलोन की शर्तें, बैंक स्टेटमेंट या डॉक्यूमेंट रिजेक्शन, अथवा 1-मिनट कॉलबैक सहायता के लिए नीचे बोलें या लिखें।`,
      timestamp: new Date().toISOString(),
      language: 'hi-IN',
      poweredBy: 'sarvam-ai'
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [ttsLoadingMessageId, setTtsLoadingMessageId] = useState<string | null>(null);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const webSpeechRecognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, messages]);

  // Clean up audio playback when drawer is closed
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
    }
  }, [isOpen]);

  // Web Speech Fallback for low-latency voice
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
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        webSpeechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition init err', err);
      }
    }
  }, [language]);

  // Stop any active audio
  const stopSpeaking = () => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      setActiveAudio(null);
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingMessageId(null);
    setTtsLoadingMessageId(null);
  };

  // Play voice using Sarvam AI Bulbul v3
  const speakWithSarvam = async (text: string, langCode: string, msgId?: string) => {
    stopSpeaking();
    if (msgId) setTtsLoadingMessageId(msgId);

    try {
      const res = await api.post('/agent/tts', {
        text,
        language: langCode || language,
        speaker: 'ritu',
        sarvamApiKey: sarvamApiKey || undefined
      });

      if (res.data?.audioBase64) {
        const audioSrc = `data:${res.data.format || 'audio/wav'};base64,${res.data.audioBase64}`;
        const audio = new Audio(audioSrc);
        setActiveAudio(audio);
        setIsSpeaking(true);
        if (msgId) setSpeakingMessageId(msgId);
        setTtsLoadingMessageId(null);

        audio.onended = () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
          setActiveAudio(null);
        };

        audio.onerror = () => {
          stopSpeaking();
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Sarvam TTS failed, using browser speech fallback:', e);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode || language;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => stopSpeaking();
        utterance.onerror = () => stopSpeaking();
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setTtsLoadingMessageId(null);
    }
  };

  // Record audio with Sarvam AI Saaras v4
  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

        if (audioBlob.size > 800) {
          setIsProcessingAudio(true);
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'merchant_care_mic.wav');
            formData.append('language', language);
            if (sarvamApiKey) formData.append('sarvamApiKey', sarvamApiKey);

            const res = await api.post('/agent/stt', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.transcript) {
              setInputText(res.data.transcript);
              handleSend(res.data.transcript);
            }
          } catch (sttErr) {
            console.warn('Sarvam STT error:', sttErr);
          } finally {
            setIsProcessingAudio(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Mic permission error, using WebSpeech:', err);
      if (webSpeechRecognitionRef.current) {
        try {
          webSpeechRecognitionRef.current.lang = language;
          webSpeechRecognitionRef.current.start();
          setIsRecording(true);
        } catch {
          setIsRecording(false);
        }
      }
    }
  };

  // Send Chat message via Sarvam AI
  const handleSend = async (customText?: string) => {
    const text = customText || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
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

      // Speak response in Indic Voice via Sarvam Bulbul v3
      speakWithSarvam(assistantMsg.text, language, assistantMsg.id);
    } catch (e) {
      console.error('Chat error', e);
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-minute callback trigger
  const handleInstantCallback = async () => {
    try {
      await api.post('/support/callbacks', {
        applicationId: 'FNX-DEMO-1001',
        preferredTime: 'WITHIN_1_MINUTE',
        reason: 'Urgent Loan & Document Assistance via Merchant Care',
        phone: user?.mobile || '9876543210'
      });

      const confirmMsg = {
        id: `cb-confirm-${Date.now()}`,
        sender: 'assistant',
        text: `⚡ आपका 1-मिनट प्राथमिकता कॉलबैक अनुरोध दर्ज कर लिया गया है!\n\nहमारे वरिष्ठ क्रेडिट व सपोर्ट अधिकारी 60 सेकंड के भीतर आपके मोबाइल (${user?.mobile || '9876543210'}) पर कॉल करेंगे।`,
        language,
        timestamp: new Date().toISOString(),
        poweredBy: 'sarvam-ai'
      };
      setMessages((prev) => [...prev, confirmMsg]);
      speakWithSarvam(confirmMsg.text, language, confirmMsg.id);
    } catch (err: any) {
      alert('Callback request error: ' + (err.response?.data?.error || err.message));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 top-14 bg-white/95 backdrop-blur-md z-50 flex flex-col border-t border-slate-200 shadow-2xl animate-in slide-in-from-bottom duration-200">
      {/* Drawer Header */}
      <div className="p-3 bg-gradient-to-r from-paytm-blue via-paytm-navy to-slate-950 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-paytm-sky flex items-center justify-center shadow-xs relative">
            <Bot className="w-4 h-4 text-white" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 ring-2 ring-slate-900 animate-pulse"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs tracking-tight">Merchant Care • Merchant AI</h3>
              <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded border border-purple-400/30 flex items-center gap-0.5 font-bold font-mono">
                <Sparkles className="w-2.5 h-2.5 text-purple-300" /> Sarvam AI
              </span>
            </div>
            <p className="text-[10px] text-sky-200">
              Indic 105B Sovereign Chat • Bulbul v3 Voice • Saaras v4 STT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center bg-white/10 rounded-lg px-2 py-1 text-[10px] border border-white/20">
            <Globe className="w-3 h-3 text-sky-300 mr-1" />
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                const chosen = INDIC_LANGUAGES.find((l) => l.code === e.target.value);
                handleSend(`Switching language to ${chosen?.label || e.target.value}`);
              }}
              className="bg-transparent text-white font-bold text-[10px] focus:outline-none cursor-pointer"
            >
              {INDIC_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="text-slate-900 font-semibold">
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          const isThisSpeaking = isSpeaking && speakingMessageId === m.id;
          const isThisTtsLoading = ttsLoadingMessageId === m.id;

          return (
            <div key={m.id} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-paytm-sky text-white flex items-center justify-center shrink-0 text-[10px] mt-0.5 shadow-2xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] p-2.5 rounded-2xl leading-relaxed space-y-1.5 ${
                  isUser
                    ? 'bg-paytm-blue text-white rounded-br-none shadow-xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80 shadow-xs'
                }`}
              >
                <p className="whitespace-pre-line text-[11px] leading-relaxed">{m.text}</p>

                {/* Assistant Audio Action Bar */}
                {!isUser && (
                  <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-[9px] text-purple-700 font-bold font-mono flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                      Sarvam Indic Voice
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (isThisSpeaking) {
                          stopSpeaking();
                        } else {
                          speakWithSarvam(m.text, m.language || language, m.id);
                        }
                      }}
                      className="px-2 py-0.5 rounded-full bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 font-bold flex items-center gap-1 text-[9px] shadow-2xs transition"
                    >
                      {isThisTtsLoading ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-purple-600" />
                      ) : isThisSpeaking ? (
                        <>
                          <VolumeX className="w-2.5 h-2.5 text-rose-600" /> Stop
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-2.5 h-2.5 text-purple-600" /> Listen
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-[11px] text-purple-800 bg-purple-50 border border-purple-200/60 p-2 rounded-xl w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
            <span className="font-semibold">Merchant Care (Sarvam 105B) is thinking...</span>
          </div>
        )}

        {isProcessingAudio && (
          <div className="flex items-center gap-2 text-[11px] text-sky-800 bg-sky-50 border border-sky-200 p-2 rounded-xl w-fit">
            <Radio className="w-3.5 h-3.5 animate-pulse text-paytm-sky" />
            <span className="font-semibold">Transcribing speech via Sarvam Saaras v4...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions & Actions */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex gap-1.5 overflow-x-auto text-[10px]">
        <button
          onClick={handleInstantCallback}
          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-full text-amber-900 font-bold whitespace-nowrap flex items-center gap-1 shadow-2xs"
        >
          <PhoneCall className="w-3 h-3 text-amber-600" /> ⚡ 1-Minute Callback
        </button>
        <button
          onClick={() => handleSend('Why was my bank statement flagged as blurry and how do I replace page 2?')}
          className="px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 whitespace-nowrap font-medium"
        >
          📄 Bank Statement Error
        </button>
        <button
          onClick={() => handleSend('How does single page replacement work in FinRescue X?')}
          className="px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 whitespace-nowrap font-medium"
        >
          🔄 Single Page Replace
        </button>
        <button
          onClick={() => handleSend('What is the interest rate, APR, and daily settlement deduction?')}
          className="px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-100 whitespace-nowrap font-medium"
        >
          💰 Loan Terms & ROI
        </button>
      </div>

      {/* Input Bar with Sarvam Mic Input */}
      <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
        {/* Sarvam STT Voice Input Button */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={loading || isProcessingAudio}
          className={`p-2 rounded-xl transition shadow-xs flex items-center justify-center ${
            isRecording
              ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
              : 'bg-purple-100 hover:bg-purple-200 text-purple-900'
          }`}
          title={isRecording ? 'Stop recording voice' : 'Speak to Merchant Care via Sarvam AI Voice STT'}
        >
          {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-purple-700" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Ask Merchant Care in ${INDIC_LANGUAGES.find((l) => l.code === language)?.label || 'Indic'}...`}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-paytm-sky text-slate-800"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim() || loading}
          className="p-2 bg-paytm-sky hover:bg-[#00a8dc] text-white rounded-xl disabled:opacity-40 shadow-xs transition"
          title="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
