import React, { useState, useEffect } from 'react';
import { X, Clock, Users, Sparkles } from 'lucide-react';
import { SubscriptionService, BETA_CONFIG } from '../../lib/services/subscriptionService';

interface BetaBannerProps {
  className?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function BetaBanner({ className = '', onDismiss, showDismiss = true }: BetaBannerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isDismissed, setIsDismissed] = useState(false);
  const [betaStats, setBetaStats] = useState({ totalUsers: 0, activeUsers: 0 });

  useEffect(() => {
    // Load beta stats
    SubscriptionService.getBetaStats().then(stats => {
      setBetaStats(stats);
    });

    // Load dismissed state from localStorage
    const dismissed = localStorage.getItem('beta-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Update countdown every second
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endDate = new Date(BETA_CONFIG.endDate).getTime();
      const difference = endDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('beta-banner-dismissed', 'true');
    onDismiss?.();
  };

  const shouldShowWarning = SubscriptionService.shouldShowBetaWarning();
  const isActive = SubscriptionService.isBetaActive();

  if (isDismissed || !isActive) return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated gradient background */}
      <div className={`
        ${shouldShowWarning 
          ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500' 
          : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600'
        } 
        animate-gradient-x bg-300% text-white
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="font-semibold text-sm">
                  {shouldShowWarning ? 'Beta endet bald!' : 'Beta-Phase aktiv'}
                </span>
              </div>
              
              <div className="hidden sm:flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-mono">
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {betaStats.totalUsers} Beta-Tester
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm hidden md:block">
                {shouldShowWarning 
                  ? 'Sichere dir Premium-Features vor dem Ende!' 
                  : 'Alle Premium-Features kostenlos bis 31. Oktober'
                }
              </span>
              
              {showDismiss && (
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Banner schließen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile countdown */}
      <div className="sm:hidden bg-black/10 text-white text-center py-2">
        <div className="flex justify-center items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span className="font-mono">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{betaStats.totalUsers} Tester</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BetaBanner; 