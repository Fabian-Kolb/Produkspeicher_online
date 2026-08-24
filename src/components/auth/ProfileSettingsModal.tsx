import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useUIStore } from '../../store/useUIStore';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { X, ImagePlus, User, Loader2, Save, Trash2, LogOut, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

export const ProfileSettingsModal: React.FC = () => {
  const { isProfileModalOpen, toggleProfileModal } = useUIStore();
  const { settings, isGuest, exitGuestMode, setUserName, setAvatarUrl: setStoreAvatar } = useAppStore();
  
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
    if (isGuest) {
      setName(useAppStore.getState().userName || 'Gast');
      setAvatarUrl(useAppStore.getState().avatarUrl || null);
      return;
    }

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

      if (isGuest) {
        // In guest mode, use local object URL
        const localUrl = URL.createObjectURL(file);
        setAvatarUrl(localUrl);
        return;
      }

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

      if (isGuest) {
        setUserName(name.trim());
        setStoreAvatar(avatarUrl);
        toggleProfileModal();
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: { 
          display_name: name.trim(),
          avatar_url: avatarUrl
        }
      });
      if (error) throw error;
      toggleProfileModal();
      // Reload page to refresh topnav/sidebar data seamlessly
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
      if (isGuest) {
        setUserName('Gast');
        toggleProfileModal();
        return;
      }
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

  const handleLogout = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      if (isGuest) {
        exitGuestMode();
        toggleProfileModal();
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toggleProfileModal();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Fehler beim Abmelden.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        className="relative z-10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl overflow-hidden transition-all duration-500 glass-panel text-text-primary shadow-black/40"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-playfair flex items-center gap-3">
            <User className="transition-colors text-text-secondary" />
            Profil
          </h2>
          <button 
            onClick={toggleProfileModal}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer bg-text-primary/5 hover:bg-text-primary/10 text-text-secondary hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-heart/10 text-heart text-sm border border-heart/20">
            {errorMsg}
          </div>
        )}

        {isGuest && (
          <div className="mb-6 p-4 rounded-2xl bg-accent/10 border border-accent/20 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-text-primary block font-bold">Gast-Sitzung aktiv</strong>
              <p className="text-text-secondary leading-relaxed">
                Änderungen werden rein lokal gehalten. Klicke auf „Abmelden / Logout“, um zur Login-Seite zurückzukehren.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-28 h-28 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all group overflow-hidden bg-text-primary/5 border-border-primary/50 hover:border-accent/40 shadow-inner"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="w-8 h-8 transition-colors text-text-secondary group-hover:text-accent" />
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
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3 opacity-40 text-text-secondary">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Vorname"
              className="w-full rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none bg-text-primary/5 border border-border-primary/30 hover:border-text-secondary focus:border-text-secondary hover:-translate-y-0.5 focus:-translate-y-0.5 hover:scale-[1.015] focus:scale-[1.015] hover:shadow-md focus:shadow-md focus:bg-text-primary/10 text-text-primary placeholder:text-text-secondary/45 transition-all duration-500 ease-out transform-gpu origin-center"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={handleSave}
              disabled={isSubmitting || isUploading || !name.trim()}
              className="w-full py-4 font-black text-xs uppercase tracking-[0.2em] gap-3"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Speichern
            </Button>

            <Button
              variant="danger"
              onClick={handleLogout}
              disabled={isSubmitting}
              className="w-full py-4 font-black text-xs uppercase tracking-[0.2em] gap-3"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
              Abmelden / Logout
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleClearName}
              disabled={isSubmitting}
              className="w-full py-4 font-black text-[10px] uppercase tracking-[0.2em] gap-2 text-heart hover:bg-heart/10 hover:text-heart shadow-none hover:shadow-none"
            >
              <Trash2 className="w-4 h-4" />
              Reset & Onboarding
            </Button>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
