import { Link } from "react-router-dom";
import { 
  Sparkles, 
  BarChart3, 
  Shield, 
  Globe, 
  ChevronRight,
  CheckCircle2,
  Share2,
  Rocket,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 rounded-full border border-white/5 bg-slate-950/40 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">SocialFlow<span className="text-indigo-400">.</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-[13px] font-semibold uppercase tracking-widest text-slate-400">
            <a href="#features" className="hover:text-white transition-all">Features</a>
            <a href="#pricing" className="hover:text-white transition-all">Pricing</a>
            <a href="#solutions" className="hover:text-white transition-all">Solutions</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/sign-in">
              <Button variant="ghost" className="text-slate-300 hover:text-white text-sm font-semibold">Log in</Button>
            </Link>
            <Link to="/sign-up">
              <Button className="bg-white text-slate-950 hover:bg-slate-200 px-6 rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-32 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-left space-y-10 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[13px] font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(99,102,241,0.1)]">
              <Rocket className="w-3.5 h-3.5" />
              <span>Next-Gen Social Automation</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.95] text-white">
              Growth on <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400">
                Autopilot.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed font-medium">
              SocialFlow empowers brands to dominate digital spaces using AI-driven scheduling, viral content generation, and deep-intelligence analytics.
            </p>

            <div className="flex flex-wrap items-center gap-5">
              <Link to="/sign-up">
                <Button size="lg" className="h-14 px-10 text-base bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all hover:-translate-y-1">
                  Launch Your Success <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="h-14 px-8 text-base text-slate-300 hover:text-white font-bold border border-white/5 hover:bg-white/5 rounded-full">
                View Intelligence Studio
              </Button>
            </div>

            <div className="pt-8 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#020617] bg-slate-800 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Sparkles key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />)}
                </div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">Trusted by 2,000+ top creators</p>
              </div>
            </div>
          </div>

          {/* Interactive Mockup Element */}
          <div className="relative group perspective-1000">
             <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] group-hover:bg-indigo-500/30 transition-all" />
             <div className="relative rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-2xl p-4 shadow-[0_40px_100px_rgba(0,0,0,0.5)] transform-gpu rotate-y-[-10deg] rotate-x-[5deg] group-hover:rotate-0 transition-all duration-700 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <div className="flex items-center justify-between mb-6 px-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-slate-500 font-mono">dashboard.socialflow.io</div>
                </div>
                <div className="grid grid-cols-6 gap-3">
                   <div className="col-span-2 space-y-3">
                      <div className="h-32 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
                      <div className="h-20 rounded-2xl bg-white/5 border border-white/5" />
                   </div>
                   <div className="col-span-4 space-y-3">
                      <div className="h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center px-4">
                        <div className="w-1/2 h-2 rounded bg-indigo-400/30" />
                      </div>
                      <div className="h-42 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-end p-4">
                        <div className="w-full h-20 rounded-xl bg-gradient-to-t from-indigo-500/10 to-transparent" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 space-y-4 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">The platform designed <br />to convert.</h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">Everything you need to scale your audience across every major social network, simplified into one workspace.</p>
          </div>

          <div className="grid md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
            {/* Feature 1: AI */}
            <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-10 hover:border-indigo-500/30 transition-all">
              <div className="absolute top-0 right-0 p-8">
                <Sparkles className="w-12 h-12 text-indigo-500 opacity-20 group-hover:opacity-100 transition-all group-hover:scale-110" />
              </div>
              <div className="h-full flex flex-col justify-end space-y-4">
                <h3 className="text-3xl font-black text-white">AI Content Lab</h3>
                <p className="text-slate-400 leading-relaxed max-w-sm">Use our proprietary Large Language Models to generate viral threads, posts, and captions that match your brand's unique voice.</p>
                <div className="pt-4 flex gap-2 flex-wrap">
                  {["Viral Detection", "Voice Mirroring", "Hashtag Intel"].map(t => (
                    <span key={t} className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase text-slate-500 border border-white/5">{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2: Analytics */}
            <div className="md:col-span-2 group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-10 hover:border-blue-500/30 transition-all">
               <div className="flex items-center gap-6">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white">Neural Analytics</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-[200px]">Real-time engagement tracking across all connected channels.</p>
                  </div>
                  <div className="flex-1 h-32 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center relative overflow-hidden">
                    <TrendingUp className="w-full h-full text-blue-500/20 absolute -bottom-4 -right-4" />
                    <BarChart3 className="text-blue-500 w-10 h-10" />
                  </div>
               </div>
            </div>

            {/* Feature 3: Security */}
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 hover:border-emerald-500/30 transition-all">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Vault Storage</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Media encrypted via Backblaze B2 infrastructure.</p>
            </div>

            {/* Feature 4: Global */}
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-900/50 p-8 hover:border-pink-500/30 transition-all">
                <Globe className="w-8 h-8 text-pink-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Omni-Channel</h3>
                <p className="text-slate-500 text-xs leading-relaxed">One pipeline for X, LinkedIn, Insta, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12 italic">Powered by elite infrastructure</p>
          <div className="flex flex-wrap justify-center items-center gap-16 opacity-30 saturate-0 hover:opacity-100 hover:saturate-100 transition-all duration-500">
             <div className="flex items-center gap-2 font-bold text-xl"><Globe className="w-6 h-6"/> Supabase</div>
             <div className="flex items-center gap-2 font-bold text-xl"><Shield className="w-6 h-6"/> Backblaze</div>
             <div className="flex items-center gap-2 font-bold text-xl"><Sparkles className="w-6 h-6"/> OpenAI</div>
             <div className="flex items-center gap-2 font-bold text-xl"><Share2 className="w-6 h-6"/> Vercel</div>
          </div>
        </div>
      </section>

      {/* Pricing: The Power Choice */}
      <section id="pricing" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
             <h2 className="text-5xl font-black text-white italic">Select your tier.</h2>
             <p className="text-slate-400 font-medium">Simple, value-driven pricing for builders of all scales.</p>
          </div>

            {[
              { name: "Starter", price: "0", features: ["3 Channels", "Standard AI", "7-day history", "Community support"] },
              { name: "Pro", price: "29", features: ["15 Channels", "Unlimited AI Studio", "Predictive Analytics", "Team Access", "24/7 Priority"], popular: true },
              { name: "Elite", price: "99", features: ["Unlimited everything", "Custom AI Fine-tuning", "Dedicated strategist", "API Access", "White-labeling"] }
            ].map((p, i) => (
              <div key={i} className={cn(
                "p-10 rounded-[3rem] transition-all flex flex-col justify-between relative overflow-hidden group",
                p.popular 
                  ? "bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-[0_40px_100px_rgba(79,70,229,0.2)] hover:scale-105" 
                  : "bg-slate-900/30 border border-white/5 hover:bg-slate-900/50"
              )}>
                {p.popular && (
                  <div className="absolute top-0 right-0 p-8 scale-150 opacity-10 group-hover:rotate-12 transition-transform">
                    <Rocket className="w-24 h-24" />
                  </div>
                )}
                
                <div className="space-y-8">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <h3 className={cn(
                        "text-sm font-black uppercase tracking-widest italic",
                        p.popular ? "text-indigo-200" : "text-slate-500"
                      )}>{p.name}</h3>
                      {p.popular && <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Best Value</span>}
                    </div>
                    <div className="text-5xl font-black tracking-tighter text-white">${p.price}</div>
                  </div>

                  <div className="space-y-4">
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className={cn("w-4 h-4", p.popular ? "text-white" : "text-indigo-500/50")} />
                        <span className={p.popular ? "text-white/90" : "text-slate-400"}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link to="/sign-up" className="mt-12 relative z-10">
                  <Button className={cn(
                    "w-full h-14 rounded-2xl font-black text-lg shadow-xl transition-all",
                    p.popular ? "bg-white text-indigo-600 hover:bg-slate-100" : "bg-white/10 hover:bg-white/20 text-slate-300"
                  )}>
                    {p.popular ? "Go Professional" : p.name === "Elite" ? "Contact Sales" : "Start Building"}
                  </Button>
                </Link>
              </div>
            ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-40 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto rounded-[4rem] bg-gradient-to-b from-indigo-500/10 to-transparent border border-white/5 p-16 text-center relative">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-full h-full bg-indigo-500/10 blur-[120px] -z-10" />
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter italic">Ready to automate <br />your legacy?</h2>
          <Link to="/sign-up">
            <Button size="lg" className="h-16 px-12 text-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-90 rounded-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
              Get Started for Free
            </Button>
          </Link>
          <p className="mt-8 text-slate-500 font-bold text-xs uppercase tracking-widest">No credit card required • Instant access</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#01030e]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 justify-center md:justify-start">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tighter text-white italic">SocialFlow.</span>
            </div>
            <p className="text-slate-500 max-w-xs text-sm font-medium leading-relaxed text-center md:text-left">
              Intelligent social management for modern creators who value their time.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-12 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
             <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
             <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
             <a href="#" className="hover:text-white transition-colors">Twitter</a>
             <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>

          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
            © {new Date().getFullYear()} SocialFlow Tech.
          </div>
        </div>
      </footer>
    </div>
  );
};
