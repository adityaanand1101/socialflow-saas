import { Link } from "react-router-dom";
import { 
  Sparkles, 
  BarChart3, 
  Calendar, 
  Zap, 
  Shield, 
  Globe, 
  ChevronRight,
  CheckCircle2,
  Share2,
  MessageSquare,
  Camera,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-morphism border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight italic">SocialFlow</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/sign-in">
              <Button variant="ghost" className="text-gray-300 hover:text-white">Log in</Button>
            </Link>
            <Link to="/sign-up">
              <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-pink-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-medium animate-fade-in">
            <Zap className="w-4 h-4" />
            <span>Now with AI-Powered Scheduling</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Automate your social <br />
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              growth with AI.
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The all-in-one platform to schedule content, generate captions with AI, and track performance across X, Instagram, and LinkedIn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/sign-up">
              <Button size="lg" className="h-14 px-8 text-lg bg-gradient-primary shadow-glow hover:opacity-90">
                Start Free Trial <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 hover:bg-white/5">
              Watch Demo
            </Button>
          </div>

          <div className="pt-12 flex flex-wrap justify-center gap-8 opacity-50 grayscale contrast-125">
             <MessageSquare className="w-8 h-8" />
             <Camera className="w-8 h-8" />
             <Briefcase className="w-8 h-8" />
             <Share2 className="w-8 h-8" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Built for modern creators</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Powerful tools to help you manage your digital footprint without the burnout.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: "Smart Scheduler",
                desc: "Plan and queue your content weeks in advance with our intuitive visual calendar."
              },
              {
                icon: Sparkles,
                title: "AI Caption Studio",
                desc: "Never stare at a blank screen again. Generate viral captions and hashtags in seconds."
              },
              {
                icon: BarChart3,
                title: "Deep Analytics",
                desc: "Understand what works. Track engagement, reach, and growth across all platforms."
              },
              {
                icon: Shield,
                title: "Secure Storage",
                desc: "Your assets are safe with us. Media hosted on Backblaze B2 with enterprise-grade security."
              },
              {
                icon: Globe,
                title: "Multi-Platform",
                desc: "One dashboard for everything. Seamlessly manage X, LinkedIn, Instagram, and more."
              },
              {
                icon: Zap,
                title: "Auto-Pilot",
                desc: "Set your strategy and let our background workers handle the heavy lifting."
              }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-transparent to-indigo-900/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-400">Scale your plan as your audience grows.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Starter", price: "0", features: ["3 Social Channels", "Basic AI Generation", "7-day History"] },
              { name: "Pro", price: "29", features: ["10 Social Channels", "Unlimited AI Studio", "Full Analytics", "Priority Support"], popular: true },
              { name: "Business", price: "99", features: ["Unlimited Channels", "Team Collaboration", "API Access", "Custom Branding"] }
            ].map((p, i) => (
              <div key={i} className={cn(
                "p-8 rounded-3xl border transition-all relative flex flex-col",
                p.popular ? "bg-navy-900 border-indigo-500 shadow-glow scale-105 z-10" : "bg-white/5 border-white/10"
              )}>
                {p.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${p.price}</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <div className="space-y-4 mb-8 flex-1">
                  {p.features.map((feat, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      {feat}
                    </div>
                  ))}
                </div>
                <Link to="/sign-up">
                  <Button className={cn(
                    "w-full h-12 rounded-xl text-lg font-bold",
                    p.popular ? "bg-gradient-primary hover:opacity-90" : "bg-white/10 hover:bg-white/20"
                  )}>
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="space-y-4 col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight italic">SocialFlow</span>
            </div>
            <p className="text-gray-400 max-w-xs">
              Empowering creators and brands to dominate social media through intelligent automation and AI.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold">Product</h4>
            <div className="flex flex-col gap-2 text-gray-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">Features</a>
              <a href="#" className="hover:text-white transition-colors">Analytics</a>
              <a href="#" className="hover:text-white transition-colors">AI Studio</a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold">Legal</h4>
            <div className="flex flex-col gap-2 text-gray-400 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-white/5 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} SocialFlow SaaS. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
