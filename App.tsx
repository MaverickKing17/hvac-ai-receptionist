
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { CONFIG } from './constants';
import { 
  PhoneIcon, 
  ChatBubbleBottomCenterTextIcon, 
  CheckBadgeIcon, 
  MicrophoneIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  CalendarIcon,
  BoltIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/solid';

// --- Helper Functions for Audio Processing ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const HeroAnimation: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto flex items-center justify-center overflow-hidden">
      {/* Dynamic Background Ripples when Active */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="absolute w-32 h-32 border-2 border-orange-500/30 rounded-full animate-ripple"></div>
          <div className="absolute w-32 h-32 border-2 border-orange-500/20 rounded-full animate-ripple" style={{ animationDelay: '0.6s' }}></div>
        </div>
      )}

      {/* Decorative pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 z-0">
        <div className={`w-full h-full rounded-full border border-blue-400 dark:border-blue-600 ${isActive ? 'animate-pulse-ring' : 'opacity-10'}`}></div>
        <div className={`absolute w-[80%] h-[80%] rounded-full border border-orange-400 dark:border-orange-600 ${isActive ? 'animate-pulse-ring' : 'opacity-10'}`} style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Container */}
      <div className="relative z-20 group">
        <div className={`absolute -inset-16 bg-blue-500/10 blur-[100px] rounded-full transition-all duration-1000 ${isActive ? 'opacity-100 scale-150' : 'opacity-0'}`}></div>
        
        <div className={`relative w-40 h-40 md:w-48 md:h-48 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-4xl flex flex-col items-center justify-center border border-white/40 dark:border-slate-800 transition-all duration-500 ${isActive ? 'scale-105 ring-1 ring-orange-500/40' : 'animate-float ring-1 ring-white/5'}`}>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-orange-500/5 rounded-[2.5rem]"></div>
          
          <div className="relative flex flex-col items-center gap-4">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center shadow-xl transition-all duration-700 ${isActive ? 'bg-orange-600 scale-110 animate-mic-glow' : 'bg-blue-700'}`}>
              <MicrophoneIcon className={`w-8 h-8 md:w-10 md:h-10 text-white transition-transform duration-500 ${isActive ? 'scale-110' : ''}`} />
            </div>
            
            <div className="flex flex-col items-center w-full px-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`text-[8px] font-black tracking-[0.3em] uppercase transition-colors duration-500 ${isActive ? 'text-orange-500' : 'text-blue-700 dark:text-blue-400'}`}>
                  {isActive ? 'Live' : 'Melissa AI'}
                </span>
                {isActive && <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span>}
              </div>

              <div className="flex gap-1 items-center h-5 justify-center">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className={`w-0.5 rounded-full transition-all duration-300 origin-center ${isActive ? 'bg-orange-500 animate-wave-dynamic' : 'bg-blue-500 opacity-10'}`} 
                    style={{ 
                      animationDelay: `${i * 0.12}s`,
                      height: isActive ? 'auto' : '3px',
                      minHeight: isActive ? (i % 2 === 0 ? '8px' : '12px') : '3px'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute w-full h-full animate-orbit pointer-events-none opacity-50">
        <div className="absolute top-0 left-1/2 -ml-5 w-10 h-10 glass-card rounded-xl flex items-center justify-center shadow-lg transform -rotate-12 border-orange-200">
          <PhoneIcon className="w-5 h-5 text-orange-500" />
        </div>
      </div>
      <div className="absolute w-full h-full animate-orbit pointer-events-none opacity-50" style={{ animationDelay: '-8s' }}>
        <div className="absolute top-0 left-1/2 -ml-5 w-10 h-10 glass-card rounded-xl flex items-center justify-center shadow-lg transform rotate-12 border-blue-200">
          <CalendarIcon className="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </div>
  );
};

const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = () => {
    if (!chatSessionRef.current) {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'Be brief. Help the user understand HVAC SaaS benefits.'
        }
      });
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      startChat();
      const stream = await chatSessionRef.current.sendMessageStream({ message: userMessage });
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: fullResponse };
          return newMessages;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error. Try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 w-[280px] md:w-[340px] h-[440px] glass-card !bg-white dark:!bg-slate-900 rounded-3xl shadow-4xl flex flex-col overflow-hidden border border-white/20 ring-1 ring-black/5 animate-in slide-in-from-bottom-2 duration-200">
          <div className="bg-blue-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
              </div>
              <div className="font-black text-xs">Melissa AI</div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1"><XMarkIcon className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-[11px] font-bold leading-snug shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-white/5'}`}>
                  {msg.text || "..."}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex gap-2">
            <input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Msg..." 
              className="flex-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-2.5 text-[10px] font-bold focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:text-white"
            />
            <button type="submit" className="w-9 h-9 bg-blue-700 text-white rounded-lg flex items-center justify-center hover:bg-blue-800" disabled={isTyping}>
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
      <button onClick={() => { setIsOpen(!isOpen); startChat(); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-3xl transition-all hover:scale-105 active:scale-95 ${isOpen ? 'bg-red-500 text-white' : 'bg-blue-700 text-white'}`}>
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />}
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRebateTool, setShowRebateTool] = useState(false);
  const [rebateValue, setRebateValue] = useState<number>(0);
  const [selectedRebates, setSelectedRebates] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  const toggleRebate = (type: string, value: number) => {
    if (selectedRebates.includes(type)) {
      setSelectedRebates(prev => prev.filter(r => r !== type));
      setRebateValue(prev => prev - value);
    } else {
      setSelectedRebates(prev => [...prev, type]);
      setRebateValue(prev => prev + value);
      setShowRebateTool(true);
    }
  };

  const startVoiceDemo = async () => {
    if (isVoiceActive) {
      stopVoiceDemo();
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outContextRef.current.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outContextRef.current, 24000, 1);
              const source = outContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
          },
          onclose: () => stopVoiceDemo(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: 'Be a professional AI receptionist. Demonstrate high quality voice interactions.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      alert("Mic access required.");
    }
  };

  const stopVoiceDemo = () => {
    setIsVoiceActive(false);
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    if (outContextRef.current) outContextRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  return (
    <div className="min-h-screen mesh-gradient selection:bg-orange-200 dark:selection:bg-blue-900 transition-colors duration-500 overflow-x-hidden">
      {/* Refined Small Navbar */}
      <nav className="sticky top-0 z-50 px-3 md:px-6 transition-all duration-300">
        <div className="max-w-[1100px] mx-auto mt-3 glass-card rounded-2xl border-white/20 dark:border-white/5 shadow-2xl px-5 py-3 flex justify-between items-center ring-1 ring-white/5">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
              <MicrophoneIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-black text-sm md:text-base tracking-tighter text-slate-900 dark:text-white leading-none uppercase">Peel AI</span>
              <span className="text-[7px] font-black tracking-[0.25em] uppercase text-blue-600 dark:text-blue-400 mt-0.5 opacity-70">SaaS Platform</span>
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-6">
            {['FEATURES', 'ANALYTICS', 'REBATES', 'PRICING'].map((item) => (
              <button 
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())} 
                className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
              >
                {item}
              </button>
            ))}
            <div className="h-4 w-px bg-slate-200 dark:bg-white/5 mx-1"></div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5 shadow-sm"
            >
              {isDarkMode ? <SunIcon className="w-4 h-4 text-yellow-400" /> : <MoonIcon className="w-4 h-4 text-slate-700" />}
            </button>
            <a 
              href={`tel:${CONFIG.emergencyPhone}`} 
              className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg hover:bg-blue-800 transition-all flex items-center gap-2 active:scale-95"
            >
              <PhoneIcon className="w-3.5 h-3.5" /> 
              {CONFIG.emergencyPhone}
            </a>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-lg border border-white/5">
              <Bars3Icon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Scaled Down */}
      <section className="relative pt-12 pb-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-4 py-1.5 rounded-full text-[8px] font-black mb-5 uppercase tracking-[0.15em] border border-blue-200/10">
              <span className={`w-1.5 h-1.5 rounded-full ${isVoiceActive ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></span>
              {isVoiceActive ? 'Melissa Listening...' : 'HVAC Front Desk AI'}
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black mb-6 leading-tight tracking-tight dark:text-white">
              Turn Missed Calls <br/>Into <span className="text-orange-500">Booked Jobs.</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mb-8 max-w-lg leading-relaxed font-bold opacity-80">
              Never lose a lead again. Melissa handles your dispatching while you focus on the wrench.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <button onClick={startVoiceDemo} className={`px-6 py-3 rounded-xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
                {isVoiceActive ? 'End Call' : 'Try Voice AI'} <MicrophoneIcon className="w-4 h-4" />
              </button>
              <button onClick={() => scrollToSection('analytics')} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white border border-slate-100 dark:border-white/5 px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-50 transition-all shadow-md">
                View Tech
              </button>
            </div>
          </div>
          <div className="flex-1 w-full max-w-sm">
            <HeroAnimation isActive={isVoiceActive} />
          </div>
        </div>
      </section>

      {/* Analytics - Compact */}
      <section id="analytics" className="py-20 px-4 md:px-8 bg-slate-900/5 dark:bg-white/5 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em]">Intelligence</span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Growth Visible.</h2>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-bold max-w-md">
                Stop guessing ROI. See conversion data in real-time.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 glass-card rounded-2xl border border-white/10 shadow-lg flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-black dark:text-white">94%</div>
                    <div className="text-[8px] uppercase font-black text-blue-500">Success</div>
                  </div>
                </div>
                <div className="p-4 glass-card rounded-2xl border border-white/10 shadow-lg flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center">
                    <UserCircleIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-lg font-black dark:text-white">2.4m</div>
                    <div className="text-[8px] uppercase font-black text-orange-500">Response</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-lg">
              <div className="bg-[#020617] p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[9px] font-black uppercase text-slate-400">Live Dashboard Feed</span>
                  <div className="text-[8px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Online</div>
                </div>
                <div className="h-32 flex items-end justify-between gap-2 mb-6">
                  {[45, 70, 50, 85, 60, 100, 75].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-900/50 to-blue-500 rounded-t-lg transition-all" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-[8px] uppercase text-slate-500 mb-1">Traffic</div>
                    <div className="text-base font-black text-white">1.2k</div>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <div className="text-[8px] uppercase text-slate-500 mb-1">Jobs</div>
                    <div className="text-base font-black text-blue-400">412</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] uppercase text-slate-500 mb-1">Profit</div>
                    <div className="text-base font-black text-orange-400">$18k</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rebates - Dense */}
      <section id="rebates" className="py-20 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#0F172A] rounded-[3rem] p-8 md:p-12 text-white border border-white/5 shadow-3xl">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <span className="bg-orange-500 text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase mb-6 inline-block tracking-[0.1em]">2026 Rebate Hub</span>
                <h2 className="text-2xl md:text-4xl font-black mb-8 leading-tight tracking-tight">
                  Sales Growth <br/><span className="text-orange-400">$10,500</span>
                </h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <button onClick={() => toggleRebate('heatpump', 7100)} className={`p-6 rounded-2xl border transition-all text-left shadow-lg ${selectedRebates.includes('heatpump') ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10'}`}>
                     <div className="font-black text-2xl mb-1">$7.1k</div>
                     <div className="text-[9px] uppercase font-black text-blue-200">Heat Pump</div>
                   </button>
                   <button onClick={() => toggleRebate('insulation', 1500)} className={`p-6 rounded-2xl border transition-all text-left shadow-lg ${selectedRebates.includes('insulation') ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10'}`}>
                     <div className="font-black text-2xl mb-1">$1.5k</div>
                     <div className="text-[9px] uppercase font-black text-blue-200">Insulation</div>
                   </button>
                </div>
                {showRebateTool && (
                   <div className="mb-8 p-6 bg-blue-700 rounded-2xl border border-blue-500 flex items-center justify-between shadow-xl">
                      <div>
                        <div className="text-[8px] font-black uppercase text-blue-100 mb-1">Savings Forecast</div>
                        <div className="text-3xl font-black">${rebateValue.toLocaleString()}</div>
                      </div>
                      <button onClick={() => { setShowRebateTool(false); setSelectedRebates([]); setRebateValue(0); }} className="text-[9px] uppercase font-black border border-white/20 px-3 py-1.5 rounded-lg">Reset</button>
                   </div>
                )}
                <button onClick={() => scrollToSection('audit-form')} className="bg-white text-blue-950 px-8 py-4 rounded-xl font-black text-base shadow-xl active:scale-95 transition-all">
                  Launch Proposal
                </button>
              </div>
              <div className="flex-1 w-full hidden lg:block max-w-xs">
                <div className="glass-card !bg-slate-800/80 p-10 rounded-[2.5rem] shadow-4xl text-center">
                   <h3 className="text-sm font-black mb-8 uppercase tracking-widest text-slate-400">Market Pulse</h3>
                   <div className="space-y-8">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="font-bold text-slate-300 text-xs">HER+ Program</span>
                        <span className="font-black text-orange-400 text-xl">$10k</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <span className="font-bold text-slate-300 text-xs">Enbridge</span>
                        <span className="font-black text-orange-400 text-xl">$7k</span>
                      </div>
                      <div className="pt-4 text-[8px] font-black tracking-widest text-slate-600 uppercase">NRCAN Certified</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audit Form - Refined */}
      <section id="audit-form" className="py-24 px-4 md:px-8 bg-[#01040D] text-white">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight tracking-tight text-white">Scale Your <br/><span className="text-blue-600">Empire.</span></h2>
              <p className="text-sm md:text-base text-slate-400 mb-10 max-w-md font-black italic">Booking high tickets while you sleep.</p>
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-blue-900/20 rounded-xl flex items-center justify-center border border-white/5">
                    <PhoneIcon className="w-6 h-6 text-orange-500" />
                 </div>
                 <div>
                   <div className="text-[9px] uppercase font-black text-blue-500 tracking-[0.1em] mb-0.5">Setup Line</div>
                   <div className="text-2xl font-black text-white tracking-tighter">{CONFIG.emergencyPhone}</div>
                 </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-md">
               <div className="glass-card !bg-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-4xl relative border border-white/5 ring-1 ring-white/5">
                  <h3 className="text-xl font-black mb-8 tracking-tight">Get Your Audit</h3>
                  <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert("Team calling you shortly!"); }}>
                    <div className="space-y-1.5">
                       <label className="text-[8px] font-black uppercase tracking-[0.1em] text-blue-400 ml-1">Company Name</label>
                       <input type="text" required placeholder="HVAC Co" className="w-full bg-[#080B14] border border-white/5 rounded-xl p-4 focus:ring-1 focus:ring-blue-600 outline-none font-bold text-base placeholder:text-slate-900" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-[0.1em] text-blue-400 ml-1">Email</label>
                          <input type="email" required placeholder="owner@hvac.ca" className="w-full bg-[#080B14] border border-white/5 rounded-xl p-4 focus:ring-1 focus:ring-blue-600 outline-none font-bold text-base placeholder:text-slate-900" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-[0.1em] text-blue-400 ml-1">Mobile</label>
                          <input type="tel" required placeholder="416-000-0000" className="w-full bg-[#080B14] border border-white/5 rounded-xl p-4 focus:ring-1 focus:ring-blue-600 outline-none font-bold text-base placeholder:text-slate-900" />
                       </div>
                    </div>
                    <button type="submit" className="w-full bg-blue-700 text-white py-4 rounded-xl font-black text-lg shadow-xl hover:bg-blue-800 active:scale-[0.98] transition-all mt-4 group flex items-center justify-center gap-3">
                      Build Demo <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[8px] text-center text-slate-600 mt-5 font-black uppercase tracking-[0.1em]">Secure Partner Portal</p>
                  </form>
               </div>
            </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="bg-[#01040D] text-white pt-16 pb-10 px-4 md:px-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
                  <MicrophoneIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-xl tracking-tighter uppercase">Peel AI</span>
              </div>
              <p className="text-slate-500 text-xs font-bold leading-relaxed">GTA's automation engine for high-output contractors.</p>
            </div>
            <div>
              <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-blue-500 mb-6 pl-3 border-l-2 border-blue-600">Hubs</h4>
              <ul className="space-y-3 text-xs text-slate-400 font-bold">
                <li>Toronto Metro</li>
                <li>Peel Region</li>
                <li>York Region</li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-blue-500 mb-6 pl-3 border-l-2 border-blue-600">Resources</h4>
              <ul className="space-y-3 text-xs text-slate-400 font-bold">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-blue-500">Features</button></li>
                <li><button onClick={() => scrollToSection('analytics')} className="hover:text-blue-500">Dashboard</button></li>
                <li><button onClick={() => scrollToSection('rebates')} className="hover:text-blue-500">Rebates</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-blue-500 mb-6 pl-3 border-l-2 border-blue-600">Contact</h4>
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-blue-600 transition-all">
                <div className="text-[9px] font-black uppercase text-blue-500 mb-1">Partner Support</div>
                <div className="text-base font-black text-white">1-888-PEEL-AI</div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-6 grayscale opacity-20 text-[8px] font-black uppercase">
               <span>TSSA Certified</span>
               <span>HRAI Member</span>
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-700">
              © 2026 Peel AI Systems • <a href="#" className="hover:text-white">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
      <LiveChatWidget />
    </div>
  );
};

export default App;
