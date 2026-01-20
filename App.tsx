
import React, { useState, useEffect, useRef } from 'react';
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
  XMarkIcon
} from '@heroicons/react/24/solid';

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
            <img src={CONFIG.logoUrl} alt={CONFIG.companyName} className="h-8 md:h-10 rounded shadow-sm" />
            <span className="font-bold text-lg md:text-xl tracking-tight hidden sm:block">{CONFIG.companyName}</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="hover:text-orange-500 transition-colors font-medium">Features</a>
            <a href="#rebates" className="hover:text-orange-500 transition-colors font-medium">Rebates</a>
            <a href="#pricing" className="hover:text-orange-500 transition-colors font-medium">Pricing</a>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-slate-700" />}
            </button>
            <a 
              href={`tel:${CONFIG.emergencyPhone}`} 
              className="bg-blue-700 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-800 transition-all active:scale-95 flex items-center gap-2"
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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-4 py-1.5 rounded-full text-sm font-bold mb-6 animate-pulse">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Emergency? 24/7 No Heat? Talk Now
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              {CONFIG.heroTagline}
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl leading-relaxed">
              {CONFIG.heroSubheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={toggleVoice}
                className="bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 hover:bg-blue-800 transition-all flex items-center justify-center gap-3 active:scale-95 group"
              >
                <div className={`flex items-end gap-0.5 h-6 ${isVoiceActive ? 'animate-waveform' : ''}`}>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                  <div className="waveform-bar"></div>
                </div>
                Talk to AI Agent Now
              </button>
              <a 
                href="#pricing"
                className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 dark:bg-slate-800 dark:text-white dark:border-slate-700"
              >
                Get Your Demo Site
                <ArrowRightIcon className="w-5 h-5" />
              </a>
            </div>

            <div className="mt-12 flex flex-wrap justify-center md:justify-start gap-6 opacity-75">
              {CONFIG.guarantees.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-semibold">
                  <CheckBadgeIcon className="w-5 h-5 text-teal-600" />
                  {g}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg">
            <div className="glass-card p-6 md:p-8 rounded-3xl relative">
              <div className="absolute -top-4 -right-4 bg-orange-500 text-white text-xs font-black px-4 py-2 rounded-full shadow-lg">
                LIVE DEMO
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center">
                  <MicrophoneIcon className="w-8 h-8 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold italic">"Say: My furnace died in Brampton"</h3>
                  <p className="text-sm text-slate-500">Melissa - 24/7 AI Receptionist</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl mb-6 border border-slate-100 dark:border-slate-800">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <span className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-lg text-xs font-bold h-fit">YOU</span>
                    <p className="text-sm italic">"Hey, my heating isn't working and it's freezing outside..."</p>
                  </div>
                  <div className="flex gap-2 justify-end text-right">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">"I'm sorry to hear that! I can help. Is this an emergency in Brampton? I have a slot open at 2:00 PM today."</p>
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-bold h-fit">AI</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={toggleVoice}
                className={`w-full py-4 rounded-xl font-black text-lg transition-all ${isVoiceActive ? 'bg-red-500 text-white' : 'bg-blue-700 text-white shadow-lg'}`}
              >
                {isVoiceActive ? 'END CALL' : 'CLICK TO TRY MELISSA'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <div className="bg-slate-900 text-white py-12 px-4 border-y border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-black text-orange-500">4.9/5</div>
              <div className="text-xs uppercase tracking-widest font-bold">Google Rating</div>
            </div>
            <div className="h-10 w-px bg-slate-700"></div>
            <div className="text-center">
              <div className="text-3xl font-black text-blue-400">200+</div>
              <div className="text-xs uppercase tracking-widest font-bold">HVAC Pros Onboard</div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Mock Certifications */}
             <div className="font-bold tracking-tighter text-xl">GOOGLE GUARANTEED</div>
             <div className="font-bold tracking-tighter text-xl">HRAI MEMBER</div>
             <div className="font-bold tracking-tighter text-xl">ENERGY STAR</div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Built Specifically for HVAC</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">The tech stack you need to compete with the big guys, without the big franchise fees.</p>
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
      <section id="rebates" className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase mb-6 inline-block tracking-widest">Limited Time 2026</span>
                <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                  Maximize Your Clients' Savings up to <span className="text-orange-400">{CONFIG.rebateAmount}</span>
                </h2>
                <p className="text-lg text-indigo-100 mb-8 max-w-xl">
                  Our built-in Rebate Calculator helps your sales team show immediate ROI on heat pump installations and attic insulation. Stop guessing, start closing.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                     <div className="font-black text-2xl">$7,100</div>
                     <div className="text-xs text-indigo-200">Enbridge Heat Pump</div>
                   </div>
                   <div className="bg-white/10 p-4 rounded-xl border border-white/20">
                     <div className="font-black text-2xl">$1,500</div>
                     <div className="text-xs text-indigo-200">Attic Insulation</div>
                   </div>
                </div>
                <button className="bg-white text-blue-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all active:scale-95 shadow-xl shadow-black/20">
                  Try Rebate Calculator Stub
                </button>
              </div>
              <div className="flex-1 w-full flex justify-center">
                <div className="glass-card !bg-white/10 !border-white/20 p-8 rounded-3xl w-full max-w-sm">
                   <div className="space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b border-white/10">
                        <span className="font-bold">Program</span>
                        <span className="font-bold">Max Reward</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-80">HER+ Ontario</span>
                        <span className="font-bold text-orange-400">$10,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-80">Greener Homes</span>
                        <span className="font-bold text-orange-400">$5,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm opacity-80">Enbridge Bonus</span>
                        <span className="font-bold text-orange-400">$600</span>
                      </div>
                      <div className="pt-4 mt-4 border-t border-white/20 text-center text-xs opacity-60 italic">
                        *Estimates based on current 2026 guidelines.
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 md:px-8 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Trusted by GTA HVAC Pros</h2>
            <div className="flex justify-center gap-1 text-yellow-500 mb-2">
              {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-6 h-6" />)}
            </div>
            <p className="font-bold text-slate-500">Google Verified Reviews</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CONFIG.testimonials.map((t, i) => (
              <div key={i} className="glass-card p-8 rounded-3xl flex flex-col h-full">
                <div className="flex text-yellow-500 mb-4">
                  {[...Array(t.rating)].map((_, i) => <StarIcon key={i} className="w-4 h-4" />)}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-8 italic flex-grow leading-relaxed">"{t.text}"</p>
                <div>
                  <div className="font-black text-lg">{t.name}</div>
                  <div className="text-sm text-slate-500">{t.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Your New Website in 4 Steps</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">We do the heavy lifting so you can focus on the tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-12 left-0 w-full h-1 bg-blue-100 dark:bg-blue-900 -z-10"></div>
            <StepCard number="1" title="Customize" desc="Choose your colors, upload your logo, and pick your service areas." />
            <StepCard number="2" title="Train AI" desc="Provide your service pricing and typical answers for Melissa." />
            <StepCard number="3" title="Go Live" desc="We point your domain and your phone lines to the AI hub." />
            <StepCard number="4" title="Book Jobs" desc="Sit back as the AI qualifies leads and books slots in your calendar." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 md:px-8 bg-slate-950 text-white rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">Simple, Honest Pricing</h2>
            <p className="text-xl text-slate-400">No long-term contracts. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {CONFIG.pricing.map((tier, i) => (
              <div 
                key={i} 
                className={`p-8 md:p-10 rounded-[2.5rem] flex flex-col h-full transition-all duration-300 hover:translate-y-[-10px] ${tier.popular ? 'bg-white text-slate-900 pricing-card-popular ring-8 ring-blue-600/10' : 'bg-slate-900 text-white border border-slate-800'}`}
              >
                {tier.popular && (
                  <div className="bg-orange-500 text-white text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full w-fit mb-6">Most Popular</div>
                )}
                <h3 className="text-2xl font-black mb-2">{tier.name}</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-black">{tier.price}</span>
                </div>
                <p className={`mb-8 text-sm ${tier.popular ? 'text-slate-600' : 'text-slate-400'}`}>{tier.description}</p>
                <div className="space-y-4 mb-10 flex-grow">
                  {tier.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <CheckBadgeIcon className={`w-5 h-5 ${tier.popular ? 'text-blue-600' : 'text-orange-500'}`} />
                      <span className="text-sm font-semibold">{f}</span>
                    </div>
                  ))}
                </div>
                <button className={`w-full py-4 rounded-xl font-black text-lg transition-all active:scale-95 ${tier.popular ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-xl shadow-blue-500/30' : 'bg-white text-slate-900 hover:bg-slate-100'}`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Footer */}
      <footer className="bg-slate-950 text-white pt-24 pb-12 px-4 md:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8">Ready to automate your GTA HVAC business?</h2>
              <p className="text-lg text-slate-400 mb-12 max-w-lg">
                Join 200+ contractors who are winning the local search game and booking more no-heat calls with AI.
              </p>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                      <PhoneIcon className="w-6 h-6 text-orange-500" />
                   </div>
                   <div>
                     <div className="text-sm text-slate-500">Emergency Line</div>
                     <div className="text-xl font-bold">{CONFIG.emergencyPhone}</div>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                      <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-blue-500" />
                   </div>
                   <div>
                     <div className="text-sm text-slate-500">Service Areas</div>
                     <div className="text-sm font-medium">{CONFIG.serviceAreas.join(', ')}</div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="glass-card !bg-slate-900/50 !border-slate-800 p-8 md:p-10 rounded-[3rem]">
              <h3 className="text-2xl font-black mb-6">Get Your Branded Demo</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Company Name</label>
                  <input type="text" placeholder="Your HVAC Co" className="w-full bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-600 transition-all outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Email Address</label>
                    <input type="email" placeholder="owner@company.com" className="w-full bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-600 transition-all outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block">Phone Number</label>
                    <input type="tel" placeholder="416-555-1234" className="w-full bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-600 transition-all outline-none" />
                  </div>
                </div>
                <button className="w-full bg-blue-700 text-white py-5 rounded-xl font-black text-xl hover:bg-blue-800 transition-all active:scale-95 shadow-2xl shadow-blue-500/20 mt-4">
                  Send My Free Audit
                </button>
                <p className="text-[10px] text-center text-slate-600 mt-4">
                  By clicking, you agree to our 2026 Privacy Policy and Terms of Service. Melissa might text you to confirm.
                </p>
              </form>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={CONFIG.logoUrl} alt={CONFIG.companyName} className="h-6 grayscale opacity-50" />
              <span className="text-sm text-slate-600 font-bold">© 2026 {CONFIG.companyName} SaaS. All Rights Reserved.</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-500 font-semibold">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">White-Label Docs</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 p-4">
        <div className="glass-card flex items-center justify-between p-3 rounded-2xl border border-white/40 shadow-2xl">
           <a href={`tel:${CONFIG.emergencyPhone}`} className="flex flex-col items-center gap-0.5 px-4 text-blue-700">
             <PhoneIcon className="w-6 h-6" />
             <span className="text-[10px] font-black">CALL NOW</span>
           </a>
           <button 
            onClick={toggleVoice}
            className="flex-grow mx-4 bg-blue-700 text-white rounded-xl py-3 font-black text-sm shadow-lg active:scale-95"
           >
             TALK TO AI AGENT
           </button>
           <button className="flex flex-col items-center gap-0.5 px-4 text-slate-600">
             <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />
             <span className="text-[10px] font-black">QUOTE</span>
           </button>
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({ icon, title, description }) => (
  <div className="glass-card p-8 rounded-[2rem] hover:translate-y-[-5px] transition-all duration-300 group">
    <div className="mb-6 bg-slate-50 dark:bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-black mb-3">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

const StepCard: React.FC<{number: string, title: string, desc: string}> = ({ number, title, desc }) => (
  <div className="text-center group relative">
    <div className="w-16 h-16 bg-white dark:bg-slate-900 border-4 border-blue-600 text-blue-600 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all relative z-10 shadow-xl">
      {number}
    </div>
    <h3 className="text-lg font-black mb-2">{title}</h3>
    <p className="text-sm text-slate-500 max-w-[12rem] mx-auto">{desc}</p>
  </div>
);

export default App;
