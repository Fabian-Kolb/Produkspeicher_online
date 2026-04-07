import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ImagePlus, ArrowRight, Loader2 } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: name.trim() }
      });
      if (error) throw error;
      onComplete();
    } catch (err) {
      console.error('Failed to save display name:', err);
      // Fallback: Proceed anyway so the user is not completely blocked
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred Backdrop overlays the dashboard */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Decorative ambient elements */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Hi!</h2>
            <p className="text-white/60 text-base leading-relaxed">
              Wir kennen uns noch nicht. Wie soll ich dich in Ventory nennen?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
            {/* Profile Picture Placeholder */}
            <div className="mx-auto w-28 h-28 rounded-full border-2 border-white/10 border-dashed flex items-center justify-center bg-white/5 cursor-not-allowed hover:bg-white/10 transition-colors group">
              <div className="flex flex-col items-center gap-2">
                <ImagePlus className="w-8 h-8 text-white/40 group-hover:text-white/60 transition-colors" />
                <span className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">Optional</span>
              </div>
            </div>

            {/* Name Input */}
            <div className="relative group">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Wie soll ich dich nennen?"
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-center text-xl font-medium"
                autoFocus
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="w-full relative group overflow-hidden rounded-2xl bg-white text-black font-bold py-4 px-6 flex items-center justify-center gap-2 transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              {isSubmitting ? (
                <>
                  <span>Speichere...</span>
                  <Loader2 className="w-5 h-5 animate-spin" />
                </>
              ) : (
                <>
                  <span>Starten</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
