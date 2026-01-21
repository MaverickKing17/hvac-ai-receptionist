
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { CONFIG } from './constants';
import { 
  PhoneIcon, 
  MicrophoneIcon,
  SunIcon,
  MoonIcon,
  CheckBadgeIcon,
  BoltIcon,
  ShieldCheckIcon,
  RectangleGroupIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  EnvelopeIcon,
  UserIcon,
  ArrowRightIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  BanknotesIcon,
  LifebuoyIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';

// --- Webhook & Constants ---
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwhfqnUN4rTpJeQED9TBNphEOhkUxsBZrUIPL5Wvwxm/dev";
const CALENDLY_URL = "https://calendly.com/kingnarmer702/emergency-furnace-replacement-quote-priority";

// --- Audio Helpers ---
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

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

// UI Sound Chimes
const playChime = (type: 'sales' | 'support') => {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(type === 'sales' ? 880 : 523, ctx.currentTime);
  osc.connect(g);
  g.connect(masterGain);
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start();
  osc.stop(ctx.currentTime + 0.5);
  setTimeout(() => ctx.close(), 1000);
};

// --- Components ---

const ProductOrb: React.FC<{ isActive: boolean; mode: 'chloe' | 'sam'; status: 'idle' | 'connecting' | 'connected' | 'error' }> = ({ isActive, mode, status }) => {
  const color = mode === 'sam' ? 'orange' : 'sky';
  return (
    <div className="relative flex items-center justify-center h-[450px]">
      <div className={`absolute inset-0 bg-${color}-500/10 blur-[100px] rounded-full transition-all duration-1000 ${isActive ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`}></div>
      <div className={`relative w-72 h-72 md:w-80 md:h-80 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl border transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden ${isActive ? `border-${color}-500 ring-4 ring-${color}-500/10` : 'border-slate-200 dark:border-white/5'}`}>
        <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-500 ${status === 'connected' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : status === 'connecting' ? 'bg-sky-500 animate-pulse' : 'bg-transparent'}`}></div>
        <div className="absolute bottom-10 flex gap-1.5">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`w-2 rounded-full transition-all duration-300 ${isActive ? `bg-${color}-500 animate-wave-dynamic` : 'bg-slate-200 dark:bg-slate-800'}`} style={{ animationDelay: `${i * 0.08}s`, height: isActive ? '32px' : '6px' }}></div>
          ))}
        </div>
        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-700 ${isActive ? `bg-${color}-600 scale-105 shadow-lg` : 'bg-slate-50 dark:bg-slate-800/50'}`}>
          {status === 'error' ? <ExclamationTriangleIcon className="w-12 h-12 text-red-500 animate-pulse" /> : <MicrophoneIcon className={`w-12 h-12 ${isActive ? 'text-white' : 'text-slate-400'}`} />}
        </div>
        <div className="mt-8 text-center">
          <p className={`text-[11px] font-black uppercase tracking-[0.4em] mb-1 ${isActive ? `text-${color}-600` : status === 'error' ? 'text-red-500' : 'text-slate-400'}`}>
            {status === 'error' ? 'API ERROR' : status === 'connecting' ? 'SYNCING...' : isActive ? `${mode.toUpperCase()} LIVE` : 'STANDBY'}
          </p>
          <h4 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">{isActive ? (mode === 'chloe' ? 'Chloe Hub' : 'Sam Dispatch') : 'ServiceVoice'}</h4>
        </div>
      </div>
    </div>
  );
};

const GTAMap: React.FC = () => {
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const cities = [
    { id: 'Toronto', x: '50%', y: '60%' }, { id: 'Mississauga', x: '40%', y: '65%' },
    { id: 'Brampton', x: '35%', y: '50%' }, { id: 'Vaughan', x: '45%', y: '40%' },
    { id: 'Markham', x: '55%', y: '40%' }, { id: 'Oakville', x: '35%', y: '75%' }
  ];
  return (
    <div className="relative w-full h-[500px] bg-slate-100 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      <div className="absolute top-10 left-10 text-left z-10"><h4 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Live GTA Network</h4><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time AI node status</p></div>
      {cities.map((city) => (
        <div key={city.id} className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer" style={{ left: city.x, top: city.y }} onMouseEnter={() => setActiveCity(city.id)} onMouseLeave={() => setActiveCity(null)}>
          <div className="absolute inset-0 w-8 h-8 -translate-x-1/4 -translate-y-1/4 bg-sky-500/20 rounded-full animate-ping pointer-events-none"></div>
          <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 shadow-xl ${activeCity === city.id ? 'bg-sky-500 border-white scale-125' : 'bg-white dark:bg-slate-800 border-sky-500'}`}></div>
          <div className={`absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-2xl transition-all duration-300 pointer-events-none ${activeCity === city.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
            <div className="flex items-center gap-2"><SignalIcon className="w-3 h-3 text-green-500" /><span className="text-[11px] font-black uppercase tracking-wider">{city.id} Node</span></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [activePersona, setActivePersona] = useState<'chloe' | 'sam'>('chloe');
  const [lastLead, setLastLead] = useState<any>(null);
  
  // Lead Capture
  const [demoRequest, setDemoRequest] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({ name: false, email: false, phone: false });

  // Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPersona, setChatPersona] = useState<'sales' | 'support' | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  // Validation
  const isNameValid = demoRequest.name.trim().split(' ').length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(demoRequest.email);
  const isPhoneValid = demoRequest.phone.replace(/\D/g, '').length === 10;
  const isFormValid = isNameValid && isEmailValid && isPhoneValid;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').substring(0, 10);
    const area = input.substring(0, 3);
    const mid = input.substring(3, 6);
    const end = input.substring(6, 10);
    let formatted = input.length > 6 ? `(${area}) ${mid}-${end}` : input.length > 3 ? `(${area}) ${mid}` : input.length > 0 ? `(${area}` : "";
    setDemoRequest({ ...demoRequest, phone: formatted });
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedFields({ name: true, email: true, phone: true });
    if (!isFormValid) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setDemoRequest({ name: '', email: '', phone: '' });
      setTouchedFields({ name: false, email: false, phone: false });
    }, 1500);
  };

  const startVoiceDemo = async () => {
    if (isVoiceActive) { stopVoiceDemo(); return; }
    setVoiceStatus('connecting');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const leadFunc: FunctionDeclaration = {
        name: 'submit_lead',
        parameters: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            phone: { type: Type.STRING },
            summary: { type: Type.STRING },
            temp: { type: Type.STRING }
          },
          required: ['name', 'phone', 'summary']
        }
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
            setVoiceStatus('connected');
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.toolCall) {
              for (const fc of msg.toolCall.functionCalls) {
                if (fc.name === 'submit_lead') {
                  setLastLead(fc.args);
                  // Trigger Elite Dispatch Webhook
                  fetch(WEBHOOK_URL, {
                    method: 'POST',
                    body: JSON.stringify({ ...fc.args, agent: activePersona }),
                    mode: 'no-cors'
                  });
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "lead_captured_and_dispatched" } }
                  }));
                }
              }
            }
            const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio && outContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outContextRef.current.currentTime);
              const buffer = await decodeAudioData(decode(audio), outContextRef.current, 24000, 1);
              const source = outContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: () => setVoiceStatus('error'),
          onclose: () => { setIsVoiceActive(false); setVoiceStatus('idle'); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [leadFunc] }],
          systemInstruction: `Persona: ${activePersona === 'chloe' ? 'Chloe (Sales/Rebates)' : 'Sam (Emergency Dispatch)'}. 
          Location: Toronto/GTA.
          Safety: Gas smell = Hang up, call 911. 
          Task: Collect Name and Phone. If Sam, offer 4h guarantee. If Chloe, offer $7500 HRS rebate.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) {
      setVoiceStatus('error');
    }
  };

  const stopVoiceDemo = () => {
    setIsVoiceActive(false);
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
    setVoiceStatus('idle');
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatPersona) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAgentTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...chatMessages.map(m => (m.role === 'user' ? 'User: ' + m.text : 'Agent: ' + m.text)), 'User: ' + userMsg].join('\n'),
        config: { systemInstruction: `You are ServiceVoice ${chatPersona === 'sales' ? 'Growth Strategist' : 'Support Specialist'} for the Toronto HVAC market.` }
      });
      setChatMessages(prev => [...prev, { role: 'agent', text: response.text || "Technical glitch." }]);
      playChime(chatPersona);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'agent', text: "API Unavailable." }]);
    } finally {
      setIsAgentTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-lg"><BoltIcon className="w-6 h-6 text-white" /></div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">ServiceVoice <span className="text-sky-600 lowercase font-medium">GTA</span></h1>
          </div>
          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Pricing'].map(l => <a key={l} href={`#${l.toLowerCase()}`} className="text-[14px] font-black uppercase tracking-widest hover:text-sky-600 transition-colors">{l}</a>)}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-500" /> : <MoonIcon className="w-6 h-6 text-slate-600" />}
            </button>
            <button className="bg-sky-600 text-white px-8 py-3.5 rounded-2xl font-black text-[13px] shadow-xl hover:bg-sky-700 transition-all uppercase tracking-widest">Free Consultation</button>
          </div>
        </div>
      </nav>

      <main className="pt-44 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 px-6 py-2.5 rounded-full border border-sky-200 dark:border-sky-800 mb-10">
          <MapPinIcon className="w-5 h-5 text-orange-500" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em]">Toronto & GTA Market Verified</span>
        </div>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9] mb-10">
          Scale Your HVAC Fleet <br/>
          With <span className="text-sky-600 underline decoration-sky-600/30">AI Voice</span> Dispatch.
        </h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-bold max-w-3xl mx-auto leading-relaxed mb-12">
          Automate your Toronto reception, pre-qualify $7,500 rebates, and book emergency calls while your crews are on the road. Engineered for GTA leaders.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <button onClick={startVoiceDemo} className={`px-12 py-6 rounded-[2rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-5 active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
            {voiceStatus === 'connecting' ? 'SYNCING...' : isVoiceActive ? 'STOP DEMO' : 'TEST LIVE AGENT'}
            <MicrophoneIcon className="w-7 h-7" />
          </button>
          <a href="#request-demo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-12 py-6 rounded-[2rem] font-black text-2xl hover:bg-slate-50 shadow-xl flex items-center justify-center">GET PRICING</a>
        </div>
      </main>

      <section className="py-24 px-6 grid lg:grid-cols-2 gap-20 items-center max-w-7xl mx-auto">
        <div className="glass-card rounded-[3.5rem] p-16 text-left shadow-2xl space-y-10">
          <div className="space-y-4">
            <h3 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Dispatch Personas</h3>
            <p className="text-lg text-slate-500 font-bold">Switch modes to test Chloe (Sales) vs Sam (Emergency Dispatch).</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <button onClick={() => setActivePersona('chloe')} className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-5 ${activePersona === 'chloe' ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
              <SunIcon className="w-10 h-10 text-sky-600" /><span className="font-black text-[12px] uppercase tracking-widest">Chloe (Rebates)</span>
            </button>
            <button onClick={() => setActivePersona('sam')} className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-5 ${activePersona === 'sam' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-slate-100 dark:border-slate-800'}`}>
              <WrenchScrewdriverIcon className="w-10 h-10 text-orange-600" /><span className="font-black text-[12px] uppercase tracking-widest">Sam (Emergency)</span>
            </button>
          </div>
          {lastLead && (
            <div className="p-8 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-3xl animate-in zoom-in duration-500">
              <div className="flex justify-between items-center mb-6"><span className="text-[11px] font-black uppercase tracking-[0.2em] text-green-700">Dispatch Log</span><CheckIcon className="w-6 h-6 text-green-600" /></div>
              <pre className="text-sm font-mono text-slate-700 dark:text-slate-300 overflow-hidden">{JSON.stringify(lastLead, null, 2)}</pre>
            </div>
          )}
        </div>
        <ProductOrb isActive={isVoiceActive} mode={activePersona} status={voiceStatus} />
      </section>

      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30 text-center">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-black tracking-tighter mb-20 uppercase">Southern Ontario Infrastructure</h3>
          <GTAMap />
        </div>
      </section>

      <section id="request-demo" className="py-32 px-6 bg-slate-900 text-white relative">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4"><h3 className="text-5xl font-black tracking-tighter">Deploy Your Agency</h3><p className="text-xl text-slate-400 font-bold tracking-tight">Claim your territory. We onboard only 2 fleets per GTA city each month.</p></div>
          {isSubmitted ? (
            <div className="p-16 rounded-[4rem] bg-white/5 border border-green-500/30 space-y-8 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl"><CheckIcon className="w-12 h-12 text-white" /></div>
              <h4 className="text-3xl font-black uppercase">Onboarding Started</h4>
              <p className="text-lg opacity-70 font-bold">A senior account director will call you within one business hour.</p>
            </div>
          ) : (
            <form onSubmit={handleDemoSubmit} className="bg-white/5 border border-white/10 p-12 rounded-[4rem] space-y-8 text-left backdrop-blur-3xl shadow-2xl">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="flex justify-between px-1"><label className="text-[12px] font-black uppercase tracking-widest opacity-60">Fleet Owner Name</label>{touchedFields.name && (isNameValid ? <CheckIcon className="w-4 h-4 text-green-500" /> : <span className="text-[10px] text-red-400 font-black uppercase tracking-tighter">Full Name Req</span>)}</div>
                  <div className="relative group"><UserIcon className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-all ${touchedFields.name ? (isNameValid ? 'text-green-500' : 'text-red-500') : 'opacity-40'}`} /><input required type="text" placeholder="John Smith" value={demoRequest.name} onBlur={() => setTouchedFields({...touchedFields, name: true})} onChange={(e) => setDemoRequest({...demoRequest, name: e.target.value})} className={`w-full bg-slate-800/50 border rounded-2xl py-5 pl-14 focus:outline-none transition-all font-bold text-lg ${touchedFields.name ? (isNameValid ? 'border-green-500/50' : 'border-red-500/50') : 'border-white/10 focus:border-sky-500'}`} /></div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between px-1"><label className="text-[12px] font-black uppercase tracking-widest opacity-60">Business Email</label>{touchedFields.email && (isEmailValid ? <CheckIcon className="w-4 h-4 text-green-500" /> : <span className="text-[10px] text-red-400 font-black uppercase tracking-tighter">Invalid Email</span>)}</div>
                  <div className="relative"><EnvelopeIcon className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-all ${touchedFields.email ? (isEmailValid ? 'text-green-500' : 'text-red-500') : 'opacity-40'}`} /><input required type="email" placeholder="owner@torontohvac.ca" value={demoRequest.email} onBlur={() => setTouchedFields({...touchedFields, email: true})} onChange={(e) => setDemoRequest({...demoRequest, email: e.target.value})} className={`w-full bg-slate-800/50 border rounded-2xl py-5 pl-14 focus:outline-none transition-all font-bold text-lg ${touchedFields.email ? (isEmailValid ? 'border-green-500/50' : 'border-red-500/50') : 'border-white/10 focus:border-sky-500'}`} /></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between px-1"><label className="text-[12px] font-black uppercase tracking-widest opacity-60">GTA Dispatch Number</label>{touchedFields.phone && (isPhoneValid ? <CheckIcon className="w-4 h-4 text-green-500" /> : <span className="text-[10px] text-red-400 font-black uppercase tracking-tighter">10 Digits Required</span>)}</div>
                <div className="relative"><DevicePhoneMobileIcon className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-all ${touchedFields.phone ? (isPhoneValid ? 'text-green-500' : 'text-red-500') : 'opacity-40'}`} /><input required type="tel" placeholder="(416) 000-0000" value={demoRequest.phone} onBlur={() => setTouchedFields({...touchedFields, phone: true})} onChange={handlePhoneChange} className={`w-full bg-slate-800/50 border rounded-2xl py-5 pl-14 focus:outline-none transition-all font-bold text-lg ${touchedFields.phone ? (isPhoneValid ? 'border-green-500/50' : 'border-red-500/50') : 'border-white/10 focus:border-sky-500'}`} /></div>
              </div>
              <button type="submit" disabled={isSubmitting} className={`w-full py-6 rounded-3xl font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-5 active:scale-95 ${isFormValid ? 'bg-sky-600 hover:bg-sky-500' : 'bg-slate-700 cursor-not-allowed disabled:opacity-50'}`}>{isSubmitting ? <ArrowPathIcon className="w-8 h-8 animate-spin" /> : <>DEPLOY MY AGENT <ArrowRightIcon className="w-8 h-8" /></>}</button>
            </form>
          )}
        </div>
      </section>

      <footer className="bg-slate-950 text-white py-14 px-6 text-center opacity-30">
        <p className="text-[11px] font-black uppercase tracking-[0.5em]">© 2026 ServiceVoice Technologies GTA | Ontario Infrastructure</p>
      </footer>

      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
        {isChatOpen && (
          <div className="mb-6 w-[360px] md:w-[420px] h-[550px] bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
            <div className={`p-6 text-white flex justify-between items-center ${!chatPersona ? 'bg-slate-800' : chatPersona === 'sales' ? 'bg-orange-600' : 'bg-sky-600'}`}>
              <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black">AI</div><div><h5 className="text-base font-black tracking-tighter uppercase">{!chatPersona ? 'Select Specialist' : chatPersona + ' Strategist'}</h5><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><span className="text-[10px] font-black uppercase tracking-widest">Online</span></div></div></div>
              <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-black/10 rounded-xl transition-all"><XMarkIcon className="w-6 h-6" /></button>
            </div>
            {!chatPersona ? (
              <div className="flex-1 p-8 flex flex-col justify-center gap-6">
                <button onClick={() => { setChatPersona('sales'); playChime('sales'); }} className="bg-orange-50 border-2 border-orange-200 p-8 rounded-[2rem] flex items-center gap-5 hover:border-orange-500 transition-all text-left"><div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg"><BanknotesIcon className="w-8 h-8 text-white" /></div><div><h6 className="font-black text-orange-900 uppercase tracking-tighter">Growth & ROI</h6><p className="text-xs font-bold text-orange-700/60 leading-tight">Scale your GTA install volume</p></div></button>
                <button onClick={() => { setChatPersona('support'); playChime('support'); }} className="bg-sky-50 border-2 border-sky-200 p-8 rounded-[2rem] flex items-center gap-5 hover:border-sky-500 transition-all text-left"><div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg"><LifebuoyIcon className="w-8 h-8 text-white" /></div><div><h6 className="font-black text-sky-900 uppercase tracking-tighter">Technical Sync</h6><p className="text-xs font-bold text-sky-700/60 leading-tight">CRM & Agent Logic setup</p></div></button>
              </div>
            ) : (
              <>
                <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-slate-950/20">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-bold shadow-sm ${msg.role === 'user' ? (chatPersona === 'sales' ? 'bg-orange-600' : 'bg-sky-600') + ' text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-slate-800'}`}>{msg.text}</div>
                    </div>
                  ))}
                  {isAgentTyping && <div className="flex justify-start"><div className="bg-white p-5 rounded-3xl flex gap-1.5 items-center"><div className="w-2 h-2 rounded-full animate-bounce bg-sky-400"></div><div className="w-2 h-2 rounded-full animate-bounce delay-75 bg-sky-400"></div></div></div>}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="p-6 border-t border-slate-100 flex gap-4 bg-white dark:bg-slate-900">
                  <input type="text" placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-[15px] font-bold focus:outline-none" />
                  <button type="submit" className={`p-4 text-white rounded-2xl shadow-xl transition-all ${chatPersona === 'sales' ? 'bg-orange-600' : 'bg-sky-600'}`}><PaperAirplaneIcon className="w-6 h-6" /></button>
                </form>
              </>
            )}
          </div>
        )}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-18 h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${isChatOpen ? 'bg-white text-slate-800' : 'bg-sky-600 text-white hover:scale-105 active:scale-95'}`}>
          {isChatOpen ? <XMarkIcon className="w-10 h-10" /> : <ChatBubbleLeftRightIcon className="w-10 h-10" />}
        </button>
      </div>
    </div>
  );
};

export default App;
