import { useEffect, useState } from "react";
import { Twitter, Instagram, Linkedin, Facebook, Youtube, MessageCircle, Send, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const socialPlatforms = [
  { name: "Twitter", icon: Twitter, color: "from-[#1DA1F2] to-[#0d8bd9]", delay: 0 },
  { name: "Instagram", icon: Instagram, color: "from-[#E4405F] to-[#C13584]", delay: 0.5 },
  { name: "LinkedIn", icon: Linkedin, color: "from-[#0A66C2] to-[#004182]", delay: 1 },
  { name: "Facebook", icon: Facebook, color: "from-[#1877F2] to-[#0e5bb8]", delay: 1.5 },
  { name: "YouTube", icon: Youtube, color: "from-[#FF0000] to-[#cc0000]", delay: 2 },
  { name: "TikTok", icon: MessageCircle, color: "from-[#000000] to-[#EE1D52]", delay: 2.5 },
  { name: "Telegram", icon: Send, color: "from-[#0088cc] to-[#006699]", delay: 3 },
  { name: "WhatsApp", icon: Phone, color: "from-[#25D366] to-[#128C7E]", delay: 3.5 },
];

export function AnimatedSocialShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % socialPlatforms.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="relative overflow-hidden border-2 hover:shadow-2xl transition-all duration-500 animate-in fade-in-50 scale-in duration-700">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5" style={{ animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => {
          const delay = Math.random() * 5;
          const duration = 3 + Math.random() * 4;
          return (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${duration}s ease-in-out ${delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      <CardContent className="relative z-10 p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in slide-in-from-top-4 duration-500">
            Unified Social Media Command
          </h3>
          <p className="text-muted-foreground mt-2 animate-in fade-in-50 duration-500 delay-100">
            One platform to rule them all
          </p>
        </div>

        {/* Central Hub */}
        <div className="relative w-full h-80 flex items-center justify-center">
          {/* Center Core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl animate-pulse flex items-center justify-center">
              <div className="w-28 h-28 rounded-full bg-background flex items-center justify-center">
                <span className="text-2xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                  HUB
                </span>
              </div>
            </div>
          </div>

          {/* Orbiting Social Icons */}
          {socialPlatforms.map((platform, index) => {
            const angle = (index / socialPlatforms.length) * 2 * Math.PI;
            const radius = 140;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const Icon = platform.icon;
            const isActive = index === activeIndex;

            return (
              <div
                key={platform.name}
                className="absolute transition-all duration-1000"
                style={{
                  transform: `translate(${x}px, ${y}px) ${isActive ? 'scale(1.3)' : 'scale(1)'}`,
                  animation: isVisible ? `orbit 20s linear ${platform.delay}s infinite` : 'none',
                }}
              >
                <div
                  className={`relative group cursor-pointer transition-all duration-500 ${
                    isActive ? 'z-20' : 'z-10'
                  }`}
                >
                  {/* Connection line to center */}
                  <div
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      isActive ? 'opacity-100' : 'opacity-30'
                    }`}
                    style={{
                      width: '2px',
                      height: `${radius}px`,
                      background: `linear-gradient(to bottom, transparent, ${
                        isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                      })`,
                      transform: 'translateX(50%) rotate(180deg)',
                      transformOrigin: 'top',
                      left: '50%',
                      top: '50%',
                    }}
                  />

                  {/* Icon container */}
                  <div
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${platform.color} 
                      shadow-xl flex items-center justify-center transition-all duration-500
                      hover:scale-125 hover:shadow-2xl group-hover:rotate-12
                      ${isActive ? 'shadow-2xl ring-4 ring-primary/50 animate-pulse' : ''}`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Platform name */}
                  <div
                    className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                      transition-all duration-300 ${
                        isActive ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
                      }`}
                  >
                    <span className="text-xs font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {platform.name}
                    </span>
                  </div>

                  {/* Glow effect */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse"
                      style={{
                        background: `linear-gradient(to bottom right, ${platform.color})`,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-4 gap-4">
          {[
            { label: "Platforms", value: "8+" },
            { label: "Connections", value: "∞" },
            { label: "Reach", value: "Global" },
            { label: "Impact", value: "Massive" },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="text-center p-3 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-all duration-300 hover:scale-105"
              style={{ 
                animation: `fade-in 0.5s ease-out ${idx * 100}ms both`,
              }}
            >
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.6;
          }
        }

        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(140px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(140px) rotate(-360deg);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  );
}
