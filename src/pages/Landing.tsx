import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Shield, 
  Globe, 
  CheckCircle2,
  Share2,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Zap,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Components ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500 px-6 py-4",
        scrolled ? "top-2" : "top-0"
      )}
    >
      <div className={cn(
        "max-w-6xl mx-auto flex items-center justify-between px-6 py-2.5 rounded-2xl border transition-all duration-500",
        scrolled 
          ? "bg-slate-950/80 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
          : "bg-transparent border-transparent"
      )}>
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/50 transition-all duration-300">
            <Sparkles className="text-white w-4.5 h-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tighter text-white">SocialFlow</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-400">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a>
          <a href="#solutions" className="hover:text-indigo-400 transition-colors">Enterprise</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/sign-in">
            <Button variant="ghost" className="text-slate-300 hover:text-white text-xs font-bold">Sign In</Button>
          </Link>
          <Link to="/sign-up">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-500 px-5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all">
              Try Free
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-48 pb-32 px-6 flex flex-col items-center justify-center overflow-hidden">
      {/* Mesh Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-8 max-w-4xl"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[11px] font-black uppercase tracking-widest">
          <Zap className="w-3 h-3 fill-indigo-400" />
          <span>The New Standard in Social Growth</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.95] text-white">
          Dominate Social <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400">
            Without the Effort.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
          Scale your brand autonomously across X, LinkedIn, and Instagram. AI-powered scheduling and viral intelligence, all in one premium dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
          <Link to="/sign-up">
            <Button size="lg" className="h-14 px-10 text-base bg-white text-slate-950 hover:bg-slate-100 rounded-2xl font-black shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all">
              Start Your Empire <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button size="lg" variant="ghost" className="h-14 px-8 text-base text-slate-300 hover:text-white font-bold border border-white/5 bg-white/5 rounded-2xl backdrop-blur-md transition-all">
            See the Magic
          </Button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale hover:opacity-100 transition-all duration-700"
        >
          <div className="flex items-center justify-center gap-2 font-bold text-lg italic"><Globe className="w-5 h-5"/> SUPABASE</div>
          <div className="flex items-center justify-center gap-2 font-bold text-lg italic"><Shield className="w-5 h-5"/> BACKBLAZE</div>
          <div className="flex items-center justify-center gap-2 font-bold text-lg italic"><Sparkles className="w-5 h-5"/> OPENAI</div>
          <div className="flex items-center justify-center gap-2 font-bold text-lg italic"><Share2 className="w-5 h-5"/> VERCEL</div>
        </motion.div>
      </motion.div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, className, delay = 0 }: any) => {
  return (
    <motion.div
      whileInView={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={cn(
        "group p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden",
        className
      )}
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-[40px] group-hover:bg-indigo-500/20 transition-all" />
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
        <Icon className="w-6 h-6 text-indigo-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm font-medium">{desc}</p>
    </motion.div>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="space-y-4 max-w-xl">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic">Engineered for <br/>Scale.</h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">We've built the ultimate command center for your digital presence. Everything is integrated, everything is fast.</p>
          </div>
          <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 text-slate-300 font-bold px-8">Explored Integrated Stack</Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={Sparkles}
            title="AI Studio"
            desc="Generate viral threads and posts tailored to your tone of voice. Our LLMs learn from your best performing content."
            className="md:col-span-2 bg-gradient-to-br from-slate-900/40 to-indigo-900/10"
            delay={0.1}
          />
          <FeatureCard 
            icon={TrendingUp}
            title="Real-time Intel"
            desc="Predictive analytics that tell you what to post and when."
            delay={0.2}
          />
          <FeatureCard 
            icon={Calendar}
            title="Smarter Queue"
            desc="Visual timeline to orchestrate multi-platform campaigns effortlessly."
            delay={0.3}
          />
          <FeatureCard 
            icon={ShieldCheck}
            title="Vault-Grade Security"
            desc="Your social tokens are encrypted and your media is hosted on secure Backblaze B2 clusters."
            className="md:col-span-2 bg-gradient-to-br from-slate-900/40 to-emerald-900/10"
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 space-y-8">
           <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">Pure Value.</h2>
           
           {/* Toggle */}
           <div className="flex items-center justify-center gap-4">
              <span className={cn("text-xs font-bold uppercase tracking-widest", !isYearly ? "text-white" : "text-slate-500")}>Monthly</span>
              <button 
                onClick={() => setIsYearly(!isYearly)}
                className="w-14 h-7 rounded-full bg-slate-800 p-1 relative flex items-center border border-white/5"
              >
                <motion.div 
                  animate={{ x: isYearly ? 28 : 0 }}
                  className="w-5 h-5 rounded-full bg-indigo-500 shadow-lg"
                />
              </button>
              <span className={cn("text-xs font-bold uppercase tracking-widest", isYearly ? "text-white" : "text-slate-500")}>Yearly</span>
              <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Save 20%</span>
           </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free */}
          <div className="p-10 rounded-[2.5rem] bg-slate-900/40 border border-white/5 flex flex-col justify-between transition-all hover:bg-slate-900/60">
            <div className="space-y-8">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Foundations</h3>
              <div className="text-6xl font-black text-white tracking-tighter">$0</div>
              <ul className="space-y-4">
                {["3 Channels", "Standard AI", "7-day history"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500/50" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/sign-up" className="mt-12">
              <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 text-slate-300 font-bold">Start Building</Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="p-10 rounded-[2.5rem] bg-indigo-600 text-white flex flex-col justify-between relative shadow-[0_32px_64px_rgba(79,70,229,0.3)] hover:-translate-y-2 transition-all duration-500">
            <div className="absolute top-6 right-8 text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Most Popular</div>
            <div className="space-y-8 text-center md:text-left">
              <h3 className="text-sm font-black text-indigo-100 uppercase tracking-widest italic">The Growth Tier</h3>
              <div className="text-6xl font-black tracking-tighter">${isYearly ? "24" : "29"}</div>
              <ul className="space-y-4">
                {["15 Channels", "Unlimited AI Studio", "Team Collaboration", "Priority Publishing"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-white text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4 text-white" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/sign-up" className="mt-12">
              <Button className="w-full h-14 rounded-2xl bg-white text-indigo-600 hover:bg-slate-100 font-black text-lg transition-all shadow-xl">Launch Now</Button>
            </Link>
          </div>

          {/* Business */}
          <div className="p-10 rounded-[2.5rem] bg-slate-900/40 border border-white/5 flex flex-col justify-between transition-all hover:bg-slate-900/60">
            <div className="space-y-8">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Enterprise</h3>
              <div className="text-6xl font-black text-white tracking-tighter">$99</div>
              <ul className="space-y-4">
                {["Unlimited Channels", "API Access", "Custom AI Models", "White Label"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500/50" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/sign-up" className="mt-12">
              <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 hover:bg-white/5 text-slate-300 font-bold">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  return (
    <section className="py-40 px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto rounded-[3.5rem] bg-gradient-to-br from-indigo-600 to-blue-700 p-16 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] mix-blend-overlay" />
        <div className="relative z-10 space-y-10">
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic">Ready for <br/>Infinite Reach?</h2>
          <div className="flex flex-col items-center gap-6">
            <Link to="/sign-up">
              <Button size="lg" className="h-16 px-14 text-xl bg-white text-indigo-600 hover:bg-slate-100 rounded-2xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95">
                Start Your Trial
              </Button>
            </Link>
            <p className="text-indigo-100/60 font-bold text-xs uppercase tracking-[0.3em]">Built for the top 1% of creators</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 font-sans overflow-x-hidden antialiased">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <CTA />
      
      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#01030e]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tighter text-white italic">SocialFlow.</span>
            </div>
            <p className="text-slate-500 max-w-xs text-xs font-bold uppercase tracking-widest text-center md:text-left">
              The Next Evolution of Social Media Intelligence.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
             <Link to="/privacy" className="hover:text-white transition-all">Privacy</Link>
             <Link to="/terms" className="hover:text-white transition-all">Terms</Link>
             <a href="#" className="hover:text-white transition-all">Studio</a>
             <a href="#" className="hover:text-white transition-all">Analytics</a>
          </div>

          <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
            © {new Date().getFullYear()} SOCIALFLOW TECHNOLOGIES.
          </div>
        </div>
      </footer>
    </div>
  );
};
