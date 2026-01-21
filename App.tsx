
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { CONFIG } from './constants';
import { 
  PhoneIcon, 
  MicrophoneIcon,
  SunIcon,
  MoonIcon,
  CheckBadgeIcon,
  CpuChipIcon,
  ServerIcon,
  CalendarDaysIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowUpRightIcon,
  RectangleGroupIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  WrenchScrewdriverIcon,
  ChatBubbleBottomCenterTextIcon,
  XMarkIcon,
  SparklesIcon,
  EnvelopeIcon,
  UserIcon,
  ArrowRightIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/solid';

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

const ProductOrb: React.FC<{ isActive: boolean; mode: 'chloe' | 'sam' }> = ({ isActive, mode }) => {
  const color = mode === 'sam' ? 'orange' : 'sky';
  return (
    <div className="relative flex items-center justify-center h-[450px]">
      <div className={`absolute inset-0 bg-${color}-500/10 blur-[100px] rounded-full transition-all duration-1000 ${isActive ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`}></div>
      
      <div className={`relative w-72 h-72 md:w-80 md:h-80 bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-xl border ${isActive ? `border-${color}-500 ring-4 ring-${color}-500/10` : 'border-slate-200 dark:border-white/5'} transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden`}>
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-30"></div>
        <div className="absolute bottom-8 flex gap-1.5">
          {[...Array(16)].map((_, i) => (
            <div key={i} className={`w-1.5 rounded-full transition-all duration-300 ${isActive ? `bg-${color}-500 animate-wave-dynamic` : 'bg-slate-200 dark:bg-slate-800'}`} style={{ animationDelay: `${i * 0.05}s`, height: isActive ? '24px' : '6px' }}></div>
          ))}
        </div>

        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-700 ${isActive ? `bg-${color}-600 scale-105 shadow-lg` : 'bg-slate-50 dark:bg-slate-800/50'}`}>
          <MicrophoneIcon className={`w-12 h-12 ${isActive ? 'text-white' : 'text-slate-400'}`} />
        </div>
        
        <div className="mt-8 text-center">
          <p className={`text-[12px] font-bold uppercase tracking-[0.3em] mb-1 ${isActive ? `text-${color}-600` : 'text-slate-400'}`}>
            {isActive ? `${mode.toUpperCase()} ACTIVE` : 'READY TO VOICE'}
          </p>
          <h4 className="text-lg font-bold text-slate-800 dark:text-white">
            {isActive ? (mode === 'chloe' ? 'GTA Sales Hub' : 'GTA Dispatch Hub') : 'ServiceVoice AI'}
          </h4>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [activePersona, setActivePersona] = useState<'chloe' | 'sam'>('chloe');
  const [lastLead, setLastLead] = useState<any>(null);
  
  const [demoRequest, setDemoRequest] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Chat Widget State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([
    { role: 'agent', text: 'Hi! I\'m your ServiceVoice specialist. How can I help you scale your GTA HVAC brand today?' }
  ]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setDemoRequest({ name: '', email: '', phone: '' });
    }, 1200);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAgentTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...chatMessages.map(m => (m.role === 'user' ? 'User: ' + m.text : 'Agent: ' + m.text)), 'User: ' + userMsg].join('\n'),
        config: {
          systemInstruction: 'You are a ServiceVoice Support Specialist. Your goal is to help HVAC contractors understand the benefits of the ServiceVoice white-label AI platform. You are professional, tech-savvy, and knowledgeable about the Toronto/GTA market. Keep responses concise and helpful.',
        }
      });

      const agentText = response.text || "I'm sorry, I'm having trouble connecting. Could you try that again?";
      setChatMessages(prev => [...prev, { role: 'agent', text: agentText }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'agent', text: "Technical error. Please try again later." }]);
    } finally {
      setIsAgentTyping(false);
    }
  };

  const startVoiceDemo = async () => {
    if (isVoiceActive) { stopVoiceDemo(); return; }
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const leadFunction: FunctionDeclaration = {
        name: 'submit_lead',
        parameters: {
          type: Type.OBJECT,
          description: 'Submit customer lead data for a GTA-based HVAC brand.',
          properties: {
            name: { type: Type.STRING },
            phone: { type: Type.STRING },
            address: { type: Type.STRING },
            summary: { type: Type.STRING },
            program: { type: Type.STRING },
            persona: { type: Type.STRING }
          },
          required: ['name', 'phone', 'summary']
        }
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsVoiceActive(true);
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
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "lead successfully pushed" } }
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
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          tools: [{ functionDeclarations: [leadFunction] }],
          systemInstruction: `You are ServiceVoice GTA AI. 
          Market: Toronto/GTA. 
          Programs: HRS ($7500 heat pump), Enbridge ($2000 gas).
          Personas: Chloe (Sales) and Sam (Dispatch).
          Emergency Rule: Gas smell = Leave immediately, call 911.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e) { alert("Mic required."); }
  };

  const stopVoiceDemo = () => {
    setIsVoiceActive(false);
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();
    sourcesRef.current.forEach(s => s.stop());
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      {/* SaaS Nav Bar */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center shadow-md">
              <BoltIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">ServiceVoice <span className="text-sky-600 font-normal lowercase">GTA</span></h1>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-[15px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors">Features</a>
            <a href="#pricing" className="text-[15px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors">Pricing</a>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-500" /> : <MoonIcon className="w-6 h-6 text-slate-600" />}
            </button>
            <button className="bg-sky-600 text-white px-7 py-3 rounded-xl font-bold text-[15px] shadow-sm hover:bg-sky-700 transition-all">
              Request Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-2.5 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 px-5 py-2 rounded-full border border-sky-200 dark:border-sky-800">
            <MapPinIcon className="w-5 h-5 text-orange-500" />
            <span className="text-[12px] font-bold uppercase tracking-[0.15em]">Toronto & GTA specialized</span>
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] max-w-5xl mx-auto">
            The Smartest <span className="text-sky-600">AI Voice</span> <br/>
            Dispatcher for GTA Contractors.
          </h2>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
            ServiceVoice automates your reception, pre-qualifies Enbridge rebates, and dispatches crews across the GTA without missing a single lead.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
            <button 
              onClick={startVoiceDemo} 
              className={`px-10 py-5 rounded-2xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-4 active:scale-95 ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'}`}
            >
              {isVoiceActive ? 'Stop Demo Agent' : 'Try Demo Agent'}
              <MicrophoneIcon className="w-6 h-6" />
            </button>
            <a href="#request-demo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center">
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Demo Hub */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="glass-card rounded-[2.5rem] p-12 border border-slate-200 dark:border-slate-800 text-left">
            <div className="space-y-8 relative z-10">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Persona Dispatch Modes</h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Switch between Chloe and Sam to see how our white-label AI handles sales versus emergency scenarios for Toronto homeowners.</p>
              
              <div className="grid grid-cols-2 gap-5">
                <button 
                  onClick={() => setActivePersona('chloe')} 
                  className={`p-7 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${activePersona === 'chloe' ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/10' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                >
                  <SunIcon className="w-8 h-8 text-sky-600" />
                  <span className="font-bold text-[13px] uppercase tracking-wider">Chloe (Rebates)</span>
                </button>
                <button 
                  onClick={() => setActivePersona('sam')} 
                  className={`p-7 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${activePersona === 'sam' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                >
                  <WrenchScrewdriverIcon className="w-8 h-8 text-orange-600" />
                  <span className="font-bold text-[13px] uppercase tracking-wider">Sam (Emergency)</span>
                </button>
              </div>

              {lastLead && (
                <div className="mt-8 p-7 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[12px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">Captured Lead Data</span>
                    <CheckBadgeIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <pre className="text-sm font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap leading-normal">
                    {JSON.stringify(lastLead, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <ProductOrb isActive={isVoiceActive} mode={activePersona} />
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center">
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Optimized for Professional Fleets</h3>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-8 glass-card rounded-[2.5rem] p-10 flex flex-col justify-between border-slate-200 dark:border-slate-800 hover:shadow-md transition-all text-left">
              <GlobeAltIcon className="w-12 h-12 text-sky-600 mb-8" />
              <div>
                <h4 className="text-2xl font-bold mb-4 tracking-tight">GTA Routing Logic</h4>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Understands Toronto's unique geography. Automatically identifies area codes (416, 905, 647, 289) to route calls to the nearest available technician in North York, Peel, or Halton.</p>
              </div>
            </div>
            <div className="md:col-span-4 bg-sky-600 rounded-[2.5rem] p-10 text-white flex flex-col justify-between text-left shadow-lg">
              <DevicePhoneMobileIcon className="w-12 h-12 mb-8 opacity-90" />
              <div>
                <h4 className="text-2xl font-bold mb-4 tracking-tight">Mobile CRM Sync</h4>
                <p className="text-base opacity-95 font-medium leading-relaxed">Integrated with ServiceTitan & Jobber. Leads captured by the AI agent appear instantly as new jobs, including call transcriptions.</p>
              </div>
            </div>
            <div className="md:col-span-4 glass-card rounded-[2.5rem] p-10 flex flex-col border-slate-200 dark:border-slate-800 hover:shadow-md transition-all text-left">
              <ShieldCheckIcon className="w-12 h-12 text-orange-600 mb-8" />
              <h4 className="text-2xl font-bold mb-4 tracking-tight">Compliance Ready</h4>
              <p className="text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Trained on 2026 TSSA standards and Ontario Energy Audit protocols. Ensure every customer interaction is professional and compliant with regional laws.</p>
            </div>
            <div className="md:col-span-8 glass-card rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-10 items-center border-slate-200 dark:border-slate-800 text-left">
              <div className="flex-1">
                <h4 className="text-3xl font-bold mb-5 tracking-tight">Enbridge Billing Specialist</h4>
                <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Our AI understands Enbridge gas billing, rebates, and the Home Renovation Savings program better than any human receptionist. Convert more rebate inquiries into high-margin installs.</p>
              </div>
              <div className="w-full md:w-56 h-40 bg-slate-100 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center">
                 <ServerIcon className="w-16 h-16 opacity-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Hub */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Platform Plans</h3>
            <p className="text-xl text-slate-500 font-medium">Flexible SaaS pricing built for the Southern Ontario market.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {CONFIG.pricing.map((tier, i) => (
              <div key={i} className={`p-10 rounded-[3rem] border-2 flex flex-col transition-all text-left ${tier.popular ? 'bg-sky-600 border-sky-500 text-white shadow-xl' : 'glass-card border-slate-200 dark:border-slate-800'}`}>
                <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-3 opacity-80">{tier.name}</h4>
                <div className="text-5xl font-extrabold mb-8 tracking-tight">{tier.price}</div>
                <p className={`text-lg font-medium mb-10 ${tier.popular ? 'opacity-90' : 'text-slate-600 dark:text-slate-400'}`}>{tier.description}</p>
                <div className="space-y-5 mb-12 flex-1">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <CheckBadgeIcon className={`w-6 h-6 ${tier.popular ? 'opacity-90' : 'text-sky-600'}`} />
                      <span className="text-[15px] font-bold tracking-tight uppercase">{f}</span>
                    </div>
                  ))}
                </div>
                <a href="#request-demo" className={`w-full py-5 rounded-2xl font-bold text-lg text-center transition-all ${tier.popular ? 'bg-white text-sky-600' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                  Deploy Agent
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Capture Form */}
      <section id="request-demo" className="py-28 px-6 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-12 relative z-10">
          <div className="space-y-4">
            <h3 className="text-4xl font-bold tracking-tight">Personalized Technical Demo</h3>
            <p className="text-xl text-slate-400 font-medium">See how ServiceVoice can automate your Toronto territory. Our specialists will reach out within one business day.</p>
          </div>

          {isSubmitted ? (
            <div className="p-12 rounded-[2.5rem] bg-white/5 border border-green-500/30 space-y-8 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                <CheckBadgeIcon className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold">Request Received!</h4>
              <p className="text-base opacity-75 font-semibold uppercase tracking-widest">Our GTA team will be in touch shortly.</p>
              <button onClick={() => setIsSubmitted(false)} className="text-sky-400 font-bold uppercase tracking-[0.1em] text-sm hover:underline transition-all">Submit another request</button>
            </div>
          ) : (
            <form onSubmit={handleDemoSubmit} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] space-y-6 text-left">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[13px] font-bold uppercase tracking-widest opacity-60 ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                    <input required type="text" placeholder="John Smith" value={demoRequest.name} onChange={(e) => setDemoRequest({...demoRequest, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 pl-14 pr-6 focus:outline-none focus:border-sky-500 transition-all font-semibold text-base" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[13px] font-bold uppercase tracking-widest opacity-60 ml-1">Business Email</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                    <input required type="email" placeholder="owner@gta-hvac.ca" value={demoRequest.email} onChange={(e) => setDemoRequest({...demoRequest, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 pl-14 pr-6 focus:outline-none focus:border-sky-500 transition-all font-semibold text-base" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[13px] font-bold uppercase tracking-widest opacity-60 ml-1">Business Phone</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                  <input required type="tel" placeholder="+1 (416) 000-0000" value={demoRequest.phone} onChange={(e) => setDemoRequest({...demoRequest, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 pl-14 pr-6 focus:outline-none focus:border-sky-500 transition-all font-semibold text-base" />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-sky-600 hover:bg-sky-500 text-white py-5 rounded-2xl font-bold text-xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 mt-6">
                {isSubmitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <>Request Technical Demo <ArrowRightIcon className="w-6 h-6" /></>}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Professional SaaS Footer */}
      <footer className="bg-slate-950 text-white pt-28 pb-14 px-6">
        <div className="max-w-7xl mx-auto divide-y divide-white/5">
          <div className="grid md:grid-cols-4 gap-14 pb-20 text-left">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sky-600 rounded flex items-center justify-center font-bold text-[12px]">GTA</div>
                <span className="text-xl font-bold tracking-tight uppercase">ServiceVoice.</span>
              </div>
              <p className="text-[14px] font-medium opacity-50 leading-relaxed uppercase tracking-widest">The premier 2026 white-label AI voice platform for Greater Toronto HVAC contractors.</p>
            </div>
            
            <div className="space-y-6">
              <h5 className="text-[12px] font-bold uppercase tracking-[0.2em] text-sky-500">Service Coverage</h5>
              <ul className="space-y-4 text-[14px] font-semibold uppercase tracking-wider opacity-60">
                <li className="hover:text-white cursor-default">Toronto Core</li>
                <li className="hover:text-white cursor-default">Mississauga & Peel</li>
                <li className="hover:text-white cursor-default">Vaughan & York</li>
                <li className="hover:text-white cursor-default">Oakville & Halton</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="text-[12px] font-bold uppercase tracking-[0.2em] text-orange-500">Resources</h5>
              <ul className="space-y-4 text-[14px] font-semibold uppercase tracking-wider opacity-60">
                <li><a href="#" className="hover:text-white transition-colors">HRS Rebate Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Customer Stories</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Technical Support</a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h5 className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-500">Legal</h5>
              <ul className="space-y-4 text-[14px] font-semibold uppercase tracking-wider opacity-60">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security Standards</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Service SLA</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-14 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[12px] font-bold uppercase tracking-[0.3em] opacity-40">© 2026 ServiceVoice Technologies GTA.</p>
            <div className="flex gap-10 opacity-40 font-bold text-[12px] uppercase tracking-widest">
               Built for Ontario HVAC
            </div>
            <p className="text-[12px] font-bold uppercase tracking-[0.3em] opacity-40">All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Chat Widget */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
        {isChatOpen && (
          <div className="mb-6 w-[360px] md:w-[420px] h-[550px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300">
            {/* Header */}
            <div className="bg-sky-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-base font-bold tracking-tight">Support Specialist</h5>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-90">Online Now</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-2.5 hover:bg-black/10 rounded-xl transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-3xl text-sm font-semibold leading-relaxed ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-tr-none shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAgentTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-3xl rounded-tl-none flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleChatSubmit} className="p-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <input 
                type="text" 
                placeholder="Type your question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3.5 text-[15px] font-semibold focus:outline-none focus:border-sky-500"
              />
              <button type="submit" className="p-3.5 bg-sky-600 text-white rounded-2xl hover:bg-sky-500 transition-all shadow-md active:scale-95">
                <PaperAirplaneIcon className="w-6 h-6" />
              </button>
            </form>
          </div>
        )}

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isChatOpen ? 'bg-white dark:bg-slate-800 text-sky-600' : 'bg-sky-600 text-white'}`}
        >
          {isChatOpen ? <XMarkIcon className="w-8 h-8" /> : <ChatBubbleLeftRightIcon className="w-8 h-8" />}
        </button>
      </div>
    </div>
  );
};

export default App;
