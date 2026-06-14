import { SignIn, SignUp } from "@clerk/react";
import { useLocation, Link } from "react-router-dom";
import { Sparkles, CheckCircle2 } from "lucide-react";

export const AuthPage = () => {
  const location = useLocation();
  const isSignUp = location.pathname.startsWith("/sign-up");

  return (
    <div className="min-h-screen bg-[#0F1117] flex flex-col lg:flex-row">
      {/* Left Side: Marketing/Value Prop */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between bg-gradient-to-br from-indigo-900/20 via-[#0F1117] to-[#0F1117] border-r border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight italic">SocialFlow</span>
        </div>

        <div className="space-y-8">
          <h1 className="text-5xl font-extrabold text-white leading-tight">
            Scale your social presence <br />
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              autonomously.
            </span>
          </h1>
          
          <div className="space-y-4">
            {[
              "Multi-platform scheduling (X, Insta, LinkedIn)",
              "AI-powered caption & hashtag generation",
              "Advanced analytics & team collaboration",
              "Secure media library with Backblaze B2"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-lg">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-morphism border border-white/10">
          <p className="text-gray-300 italic text-lg">
            "SocialFlow changed how we handle our brand's social media. The AI Studio is a game changer."
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary" />
            <div>
              <p className="text-white font-semibold">Alex Rivera</p>
              <p className="text-gray-500 text-sm">Growth Lead at TechScale</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Clerk Auth */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px]" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center lg:hidden mb-8">
             <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight italic">SocialFlow</span>
            </div>
          </div>

          <div className="flex justify-center">
            {isSignUp ? (
              <SignUp 
                routing="path" 
                path="/sign-up" 
                signInUrl="/sign-in"
                forceRedirectUrl="/app"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-navy-900 border border-white/10 shadow-2xl",
                    headerTitle: "text-white",
                    headerSubtitle: "text-gray-400",
                    socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
                    socialButtonsBlockButtonText: "text-white font-medium",
                    formButtonPrimary: "bg-gradient-primary hover:opacity-90",
                    footerActionLink: "text-indigo-400 hover:text-indigo-300",
                    formFieldLabel: "text-gray-300",
                    formFieldInput: "bg-white/5 border-white/10 text-white focus:border-indigo-500",
                    dividerLine: "bg-white/10",
                    dividerText: "text-gray-500"
                  }
                }}
              />
            ) : (
              <SignIn 
                routing="path" 
                path="/sign-in" 
                signUpUrl="/sign-up"
                forceRedirectUrl="/app"
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-navy-900 border border-white/10 shadow-2xl",
                    headerTitle: "text-white",
                    headerSubtitle: "text-gray-400",
                    socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
                    socialButtonsBlockButtonText: "text-white font-medium",
                    formButtonPrimary: "bg-gradient-primary hover:opacity-90",
                    footerActionLink: "text-indigo-400 hover:text-indigo-300",
                    formFieldLabel: "text-gray-300",
                    formFieldInput: "bg-white/5 border-white/10 text-white focus:border-indigo-500",
                    dividerLine: "bg-white/10",
                    dividerText: "text-gray-500"
                  }
                }}
              />
            )}
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-gray-400 hover:text-white underline underline-offset-4">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-gray-400 hover:text-white underline underline-offset-4">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};
