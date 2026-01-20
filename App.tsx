
import React, { useState, useEffect } from 'react';
import { CONFIG } from './constants';
import { 
  PhoneIcon, 
  ChatBubbleBottomCenterTextIcon, 
  CheckBadgeIcon, 
  LightBulbIcon, 
  ShieldCheckIcon,
  MicrophoneIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  StarIcon,
  Bars3Icon,
  XMarkIcon,
  CalendarIcon,
  UserGroupIcon,
  BoltIcon
} from '@heroicons/react/24/solid';

const HeroAnimation: React.FC = () => {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto flex items-center justify-center overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-full h-full rounded-full border border-blue-400 dark:border-blue-600 animate-pulse-ring"></div>
        <div className="absolute w-[80%] h-[80%] rounded-full border border-orange-400 dark:border-orange-600 animate-pulse-ring" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-[60%] h-[60%] rounded-full border border-teal-400 dark:border-teal-600 animate-pulse-ring" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Central AI Node */}
      <div className="relative z-20 group">
        <div className="absolute -inset-8 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/40 transition-all duration-700"></div>
        <div className="relative w-40 h-40 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-white/50 dark:border-slate-800 animate-float">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-orange-500/10 rounded-[2.5rem]"></div>
          <div className="relative flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
              <MicrophoneIcon className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-black tracking-tighter text-blue-700 dark:text-blue-400">MELISSA AI</span>
            {/* Visual Listening Waves */}
            <div className="flex gap-1 items-center h-4">
              <div className="w-1 h-2 bg-blue-500 rounded-full animate-waveform" style={{ animationDelay: '0s' }}></div>
              <div className="w-1 h-3 bg-blue-400 rounded-full animate-waveform" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-4 bg-blue-600 rounded-full animate-waveform" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-1 h-2 bg-blue-500 rounded-full animate-waveform" style={{ animationDelay: '0.6s' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements (Orbiting) */}
      <div className="absolute w-full h-full animate-orbit">
        <div className="absolute top-0 left-1/2 -ml-6 w-12 h-12 glass-card rounded-xl flex items-center justify-center shadow-lg transform -rotate-12 border-orange-200">
          <PhoneIcon className="w-6 h-6 text-orange-500" />
        </div>
      </div>
      <div className="absolute w-full h-full animate-orbit" style={{ animationDelay: '-5s' }}>
        <div className="absolute top-0 left-1/2 -ml-6 w-12 h-12 glass-card rounded-xl flex items-center justify-center shadow-lg transform rotate-12 border-blue-200">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <div className="absolute w-full h-full animate-orbit" style={{ animationDelay: '-10s' }}>
        <div className="absolute top-0 left-1/2 -ml-6 w-12 h-12 glass-card rounded-xl flex items-center justify-center shadow-lg border-teal-200">
          <UserGroupIcon className="w-6 h-6 text-teal-600" />
        </div>
      </div>
      <div className="absolute w-full h-full animate-orbit" style={{ animationDelay: '-15s' }}>
        <div className="absolute top-0 left-1/2 -ml-6 w-12 h-12 glass-card rounded-xl flex items-center justify-center shadow-lg border-rose-200">
          <BoltIcon className="w-6 h-6 text-rose-500" />
        </div>
      </div>

      {/* Incoming Call Animation Tracks */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="animate-incoming absolute" style={{ top: '20%', left: '10%', animationDelay: '0s' }}>
           <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-xl text-[10px] font-bold border border-slate-100 dark:border-slate-700 flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
             Incoming: Brampton No Heat
           </div>
        </div>
        <div className="animate-incoming absolute" style={{ top: '60%', left: '5%', animationDelay: '2s' }}>
           <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-xl text-[10px] font-bold border border-slate-100 dark:border-slate-700 flex items-center gap-2">
             <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
             Booking: AC Service 2PM
           </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
    console.log(isVoiceActive ? "Stopping voice..." : "Starting voice demo...");
  };

  return (
    <div className="min-h-screen mesh-gradient selection:bg-orange-200 dark:selection:bg-blue-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-card px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <MicrophoneIcon className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tight hidden sm:block">{CONFIG.companyName}</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="hover:text-orange-500 transition-colors font-bold uppercase tracking-wider">Features</a>
            <a href="#rebates" className="hover:text-orange-500 transition-colors font-bold uppercase tracking-wider">Rebates</a>
            <a href="#pricing" className="hover:text-orange-500 transition-colors font-bold uppercase tracking-wider">Pricing</a>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
            </button>
            <a 
              href={`tel:${CONFIG.emergencyPhone}`} 
              className="bg-blue-700 text-white px-6 py-2.5 rounded-full font-black shadow-lg shadow-blue-500/20 hover:bg-blue-800 transition-all active:scale-95 flex items-center gap-2"
            >
              <PhoneIcon className="w-4 h-4" />
              {CONFIG.emergencyPhone}
            </a>
          </div>

          <div className="md:hidden flex items-center gap-4">
             <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full"
              >
                {isDarkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
              </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-slate-900 pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6 text-2xl font-bold">
            <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#rebates" onClick={() => setIsMenuOpen(false)}>Rebates</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a 
              href={`tel:${CONFIG.emergencyPhone}`}
              className="text-blue-600 flex items-center gap-2"
            >
              <PhoneIcon className="w-6 h-6" />
              {CONFIG.emergencyPhone}
            </a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-black mb-6 uppercase tracking-widest animate-pulse">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              The Future of HVAC Dispatching
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
              Turn Missed Calls <br/>Into <span className="text-orange-500">Booked Jobs.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed font-medium">
              {CONFIG.heroSubheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center md:justify-start">
              <button 
                onClick={toggleVoice}
                className="bg-blue-700 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-blue-500/40 hover:bg-blue-800 transition-all flex items-center justify-center gap-4 active:scale-95 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className={`flex items-end gap-0.5 h-6 ${isVoiceActive ? 'animate-waveform' : ''}`}>
                  <div className="waveform-bar !bg-white"></div>
                  <div className="waveform-bar !bg-white"></div>
                  <div className="waveform-bar !bg-white"></div>
                  <div className="waveform-bar !bg-white"></div>
                </div>
                {isVoiceActive ? 'Stop AI Demo' : 'Live Voice Demo'}
              </button>
              <a 
                href="#pricing"
                className="bg-white text-slate-900 border-2 border-slate-100 px-10 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              >
                View Plans
                <ArrowRightIcon className="w-5 h-5" />
              </a>
            </div>

            <div className="mt-14 flex flex-wrap justify-center md:justify-start gap-8">
              {CONFIG.guarantees.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                  <CheckBadgeIcon className="w-5 h-5 text-orange-500" />
                  {g}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <HeroAnimation />
            {/* Overlay Info Card */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-xs glass-card p-4 rounded-2xl border-white/50 shadow-2xl animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckBadgeIcon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-xs font-black uppercase tracking-wider">Job Booked Successfully</div>
                </div>
                <div className="text-[10px] text-slate-500 font-bold">
                    "Melissa booked a Furnace Repair in Oakville for 3:00 PM today. Added to your Jobber calendar."
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <div className="bg-slate-900 text-white py-14 px-4 border-y border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-10">
            <div className="text-center">
              <div className="text-4xl font-black text-orange-500 tracking-tighter">4.9/5</div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mt-1">Google Reviews</div>
            </div>
            <div className="h-12 w-px bg-slate-800"></div>
            <div className="text-center">
              <div className="text-4xl font-black text-blue-400 tracking-tighter">24/7</div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mt-1">Availability</div>
            </div>
            <div className="h-12 w-px bg-slate-800"></div>
            <div className="text-center">
              <div className="text-4xl font-black text-teal-400 tracking-tighter">10s</div>
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mt-1">Setup Time</div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-10 opacity-40 font-black tracking-widest text-sm uppercase">
             <span>Google Guaranteed</span>
             <span>HRAI Member</span>
             <span>Energy Star</span>
             <span>BAHCA Approved</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-32 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <span className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mb-4 block">Core Technology</span>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Built Specifically for HVAC Pros</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Everything you need to run a 7-figure HVAC business while you're in the attic.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<CheckBadgeIcon className="w-8 h-8 text-blue-600" />}
              title="Custom AI Website"
              description="High-converting, mobile-first design tailored to your branding and services in the GTA."
            />
            <FeatureCard 
              icon={<MicrophoneIcon className="w-8 h-8 text-orange-600" />}
              title="Voice Receptionist"
              description="Melissa handles 100% of incoming calls 24/7. No more missed leads or after-hours stress."
            />
            <FeatureCard 
              icon={<LightBulbIcon className="w-8 h-8 text-teal-600" />}
              title="Rebate Optimizer"
              description="Instantly calculate Enbridge and HER+ rebates to close bigger sales on the spot."
            />
            <FeatureCard 
              icon={<PhoneIcon className="w-8 h-8 text-indigo-600" />}
              title="Smart Lead Dispatch"
              description="Urgent no-heat calls get routed to your phone immediately with a full transcript."
            />
            <FeatureCard 
              icon={<ShieldCheckIcon className="w-8 h-8 text-rose-600" />}
              title="Calendar Sync"
              description="The AI books appointments directly into your Housecall Pro, Jobber, or Google Calendar."
            />
            <FeatureCard 
              icon={<StarIcon className="w-8 h-8 text-yellow-500" />}
              title="Review Booster"
              description="Automatically text customers for reviews after a job is completed. Rank higher on Google."
            />
          </div>
        </div>
      </section>

      {/* Rebates Urgency Section */}
      <section id="rebates" className="py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-[4rem] p-8 md:p-20 text-white overflow-hidden relative border border-white/5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <span className="bg-orange-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase mb-8 inline-block tracking-[0.2em]">2026 Ontario Program</span>
                <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] tracking-tighter">
                  Close Sales Faster <br/>With <span className="text-orange-400">{CONFIG.rebateAmount}</span> Rebates
                </h2>
                <p className="text-xl text-blue-200/70 mb-10 max-w-xl leading-relaxed">
                  Our AI doesn't just answer phones—it educates callers on available Enbridge and HER+ savings, qualifying higher-ticket heat pump leads before you even arrive.
                </p>
                <div className="grid grid-cols-2 gap-5 mb-10">
                   <div className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                     <div className="font-black text-3xl mb-1">$7,100</div>
                     <div className="text-[10px] uppercase tracking-widest font-black text-blue-300">Hybrid Heat Pump</div>
                   </div>
                   <div className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                     <div className="font-black text-3xl mb-1">$1,500</div>
                     <div className="text-[10px] uppercase tracking-widest font-black text-blue-300">Attic Insulation</div>
                   </div>
                </div>
                <button className="bg-white text-blue-900 px-10 py-5 rounded-2xl font-black text-xl hover:bg-blue-50 transition-all active:scale-95 shadow-2xl shadow-black/40">
                  Open Rebate Tool
                </button>
              </div>
              <div className="flex-1 w-full">
                <div className="glass-card !bg-white/5 !border-white/10 p-10 rounded-[3rem] w-full max-w-md mx-auto shadow-2xl">
                   <h3 className="text-xl font-black mb-8 text-center uppercase tracking-widest">Active Incentives</h3>
                   <div className="space-y-8">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="font-bold text-blue-200">HER+ Ontario</span>
                        <span className="font-black text-orange-400 text-2xl">$10,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="font-bold text-blue-200">Greener Homes</span>
                        <span className="font-black text-orange-400 text-2xl">$5,000</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="font-bold text-blue-200">Enbridge Bonus</span>
                        <span className="font-black text-orange-400 text-2xl">$600</span>
                      </div>
                      <div className="pt-6 text-center text-[10px] font-black tracking-widest opacity-30 italic uppercase">
                        *Live Data Fed From NRCAN 2026
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-4 md:px-8 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Contractors ❤️ Melissa</h2>
            <div className="flex justify-center gap-1 text-yellow-500 mb-4">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-8 h-8" />)}
            </div>
            <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Verified Google Local Service Reviews</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {CONFIG.testimonials.map((t, i) => (
              <div key={i} className="glass-card p-10 rounded-[3rem] flex flex-col h-full border-white shadow-xl hover:shadow-2xl transition-all">
                <div className="flex text-yellow-500 mb-6">
                  {[...Array(t.rating)].map((_, i) => <StarIcon key={i} className="w-4 h-4" />)}
                </div>
                <p className="text-lg text-slate-700 dark:text-slate-300 mb-10 italic flex-grow leading-relaxed font-medium">"{t.text}"</p>
                <div className="flex items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center font-black text-blue-700">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-lg tracking-tight">{t.name}</div>
                    <div className="text-xs uppercase font-black text-slate-400 tracking-widest">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-4 md:px-8 bg-slate-950 text-white rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter">Simple Pricing.</h2>
            <p className="text-2xl text-slate-400 font-medium tracking-tight">No contracts. No hidden fees. Cancel in 1-click.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
            {CONFIG.pricing.map((tier, i) => (
              <div 
                key={i} 
                className={`p-10 md:p-12 rounded-[4rem] flex flex-col transition-all duration-500 hover:scale-[1.02] ${tier.popular ? 'bg-white text-slate-900 shadow-[0_0_80px_rgba(30,64,175,0.3)]' : 'bg-slate-900/50 text-white border border-slate-800'}`}
              >
                {tier.popular && (
                  <div className="bg-orange-500 text-white text-[10px] font-black tracking-[0.3em] uppercase px-5 py-2 rounded-full w-fit mb-10 mx-auto">Scaling Fast</div>
                )}
                <h3 className="text-3xl font-black mb-4 tracking-tight text-center">{tier.name}</h3>
                <div className="flex items-center justify-center gap-1 mb-8">
                  <span className="text-5xl font-black tracking-tighter">{tier.price}</span>
                  <span className="text-slate-400 font-bold">/mo</span>
                </div>
                <p className={`mb-12 text-center text-sm font-medium leading-relaxed ${tier.popular ? 'text-slate-500' : 'text-slate-400'}`}>{tier.description}</p>
                <div className="space-y-6 mb-14 flex-grow">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <div className={`p-1 rounded-full ${tier.popular ? 'bg-blue-100' : 'bg-blue-900/30'}`}>
                        <CheckBadgeIcon className={`w-5 h-5 ${tier.popular ? 'text-blue-600' : 'text-blue-400'}`} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest">{f}</span>
                    </div>
                  ))}
                </div>
                <button className={`w-full py-6 rounded-[2rem] font-black text-xl transition-all active:scale-95 ${tier.popular ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-2xl shadow-blue-500/40' : 'bg-white text-slate-900 hover:bg-slate-100'}`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-32 pb-16 px-4 md:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 mb-32">
            <div>
              <h2 className="text-5xl md:text-7xl font-black mb-10 leading-[0.9] tracking-tighter">Automate Your <br/>HVAC Business.</h2>
              <p className="text-xl text-slate-400 mb-16 max-w-lg leading-relaxed font-medium">
                Join 200+ contractors who are winning the local search game and booking more no-heat calls with AI.
              </p>
              <div className="space-y-10">
                 <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-800 shadow-xl">
                      <PhoneIcon className="w-8 h-8 text-orange-500" />
                   </div>
                   <div>
                     <div className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-1">Direct Line</div>
                     <div className="text-2xl font-black tracking-tight">{CONFIG.emergencyPhone}</div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="glass-card !bg-white/5 !border-white/10 p-10 md:p-14 rounded-[4rem] shadow-2xl">
              <h3 className="text-3xl font-black mb-10 tracking-tight">Claim Your Free AI Audit</h3>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3 block">Company Name</label>
                  <input type="text" placeholder="e.g. Toronto Heating Experts" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-5 focus:ring-2 focus:ring-blue-600 transition-all outline-none font-bold" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3 block">Work Email</label>
                    <input type="email" placeholder="owner@hvac.com" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-5 focus:ring-2 focus:ring-blue-600 transition-all outline-none font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3 block">Phone Number</label>
                    <input type="tel" placeholder="416-000-0000" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-5 focus:ring-2 focus:ring-blue-600 transition-all outline-none font-bold" />
                  </div>
                </div>
                <button className="w-full bg-blue-700 text-white py-6 rounded-2xl font-black text-xl hover:bg-blue-800 transition-all active:scale-95 shadow-2xl shadow-blue-500/30 mt-6">
                  Get My Free Demo Site
                </button>
                <p className="text-[10px] text-center text-slate-500 mt-8 font-black uppercase tracking-widest opacity-50">
                  © 2026 {CONFIG.companyName} Automation
                </p>
              </form>
            </div>
          </div>

          <div className="pt-16 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                 <MicrophoneIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-slate-500 font-black uppercase tracking-widest">Peel AI Systems</span>
            </div>
            <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">API Status</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 p-4">
        <div className="glass-card flex items-center justify-between p-3 rounded-3xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
           <a href={`tel:${CONFIG.emergencyPhone}`} className="flex flex-col items-center gap-0.5 px-4 text-blue-700">
             <PhoneIcon className="w-6 h-6" />
             <span className="text-[10px] font-black">CALL</span>
           </a>
           <button 
            onClick={toggleVoice}
            className="flex-grow mx-4 bg-blue-700 text-white rounded-2xl py-4 font-black text-sm shadow-xl active:scale-95 flex items-center justify-center gap-2"
           >
             <div className={`flex items-end gap-0.5 h-3 ${isVoiceActive ? 'animate-waveform' : ''}`}>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
             </div>
             TALK TO AI
           </button>
           <button className="flex flex-col items-center gap-0.5 px-4 text-slate-600">
             <StarIcon className="w-6 h-6" />
             <span className="text-[10px] font-black">DEMO</span>
           </a>
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({ icon, title, description }) => (
  <div className="glass-card p-10 rounded-[3rem] hover:translate-y-[-10px] transition-all duration-500 group border-white shadow-lg hover:shadow-2xl">
    <div className="mb-8 bg-slate-50 dark:bg-slate-900 w-20 h-20 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-50 transition-all duration-500 shadow-sm">
      {icon}
    </div>
    <h3 className="text-2xl font-black mb-4 tracking-tight uppercase tracking-[0.05em]">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">{description}</p>
  </div>
);

export default App;
