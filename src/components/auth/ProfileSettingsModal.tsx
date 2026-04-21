import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { X, ImagePlus, User, Loader2, Save, Trash2 } from 'lucide-react';

export const ProfileSettingsModal: React.FC = () => {
  const { isProfileModalOpen, toggleProfileModal } = useUIStore();
  const settings = useAppStore(state => state.settings);
  
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isProfileModalOpen) {
      loadProfileData();
    } else {
      setErrorMsg('');
    }
  }, [isProfileModalOpen]);

  const loadProfileData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setName(session.user.user_metadata?.display_name || '');
      setAvatarUrl(session.user.user_metadata?.avatar_url || null);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setErrorMsg('');
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Nicht eingeloggt.");

      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}-${Math.random()}.${fileExt}`;

      // Upload to Supabase Storage Bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
            throw new Error('Der Storage Bucket "avatars" wurde noch nicht in Supabase angelegt.');
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Fehler beim Hochladen des Profilbildes.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const { error } = await supabase.auth.updateUser({
        data: { 
          display_name: name.trim(),
          avatar_url: avatarUrl
        }
      });
      if (error) throw error;
      toggleProfileModal();
      // Reload page to refresh topnav/sidebar data seamlessly (until we add a global user store)
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Fehler beim Speichern.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearName = async () => {
    if (!window.confirm("Möchtest du deinen Profil-Namen löschen? Beim nächsten Login startet das Onboarding neu.")) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.updateUser({
        data: { display_name: '' }
      });
      if (error) throw error;
      toggleProfileModal();
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Fehler beim Löschen des Namens.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isModalDark = settings.modalTheme === 'dark' || (settings.modalTheme === 'auto' && settings.theme === 'dark');
  const isModalGlass = settings.modalStyle === 'glass';

  if (!isProfileModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className={cn(
          "absolute inset-0 bg-black/60 transition-opacity duration-300",
          settings.isGlassEnabled && "backdrop-blur-sm"
        )}
        onClick={toggleProfileModal}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(
          "relative z-10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl overflow-hidden transition-all duration-500",
          isModalDark 
            ? (isModalGlass ? "bg-[#1a1a1a]/80 backdrop-blur-2xl border border-white/10 text-white" : "bg-[#2a2a2a] border border-border-primary/50 text-white")
            : (isModalGlass ? "bg-white/70 backdrop-blur-2xl border border-white/40 text-[#111827]" : "bg-white border border-black/5 text-[#111827]"),
          isModalDark ? "shadow-black/40" : "shadow-black/10"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-playfair flex items-center gap-3">
            <User className={cn("transition-colors", isModalDark ? "text-white/40" : "text-black/20")} />
            Profil
          </h2>
          <button 
            onClick={toggleProfileModal}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
              isModalDark 
                ? "bg-white/5 hover:bg-white/10 text-white/40 hover:text-white" 
                : "bg-black/5 hover:bg-black/10 text-black/20 hover:text-black"
            )}
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-heart/10 text-heart text-sm border border-heart/20">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-8">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative w-28 h-28 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all group overflow-hidden",
                isModalDark 
                  ? "bg-white/5 border-white/10 hover:border-white/30 shadow-inner" 
                  : "bg-black/5 border-black/5 hover:border-black/10 shadow-inner"
              )}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className={cn(
                    "w-8 h-8 transition-colors",
                    isModalDark ? "text-white/20 group-hover:text-white/40" : "text-black/10 group-hover:text-black/20"
                  )} />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Profilbild</p>
              <p className="text-[10px] font-bold opacity-20 uppercase tracking-tight">Klicken zum Ändern</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Name Section */}
          <div>
            <label className={cn(
              "block text-[10px] font-black uppercase tracking-[0.2em] mb-3 opacity-40",
              isModalDark ? "text-white" : "text-black"
            )}>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Vorname"
              className={cn(
                "w-full rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none transition-all",
                isModalDark 
                  ? "bg-white/5 border border-white/5 focus:bg-white/10 focus:border-white/10 text-white placeholder:text-white/20" 
                  : "bg-black/5 border border-black/5 focus:bg-black/[0.08] focus:border-black/5 text-black placeholder:text-black/20"
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={isSubmitting || isUploading || !name.trim()}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg",
                isModalDark 
                  ? "bg-white text-[#1a1a1a] hover:bg-white/90 shadow-white/5" 
                  : "bg-black text-white hover:bg-black/90 shadow-black/10"
              )}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Speichern
            </button>
            
            <button
              onClick={handleClearName}
              disabled={isSubmitting}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all",
                isModalDark 
                  ? "text-heart/60 hover:text-heart hover:bg-heart/10" 
                  : "text-heart/80 hover:text-heart hover:bg-heart/5"
              )}
            >
              <Trash2 className="w-4 h-4" />
              Reset & Onboarding
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
