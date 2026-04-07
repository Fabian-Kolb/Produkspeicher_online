import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useUIStore } from '../../store/useUIStore';
import { X, ImagePlus, User, Loader2, Save, Trash2 } from 'lucide-react';

export const ProfileSettingsModal: React.FC = () => {
  const { isProfileModalOpen, toggleProfileModal } = useUIStore();
  
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

  if (!isProfileModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={toggleProfileModal}
      />

      <div className="relative z-10 w-full max-w-md bg-bg-card border border-border-primary rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-playfair flex items-center gap-2">
            <User className="text-text-secondary" />
            Profil-Einstellungen
          </h2>
          <button 
            onClick={toggleProfileModal}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-border-primary/50 hover:bg-border-primary text-text-secondary transition-colors"
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
              className="relative w-28 h-28 rounded-full border-2 border-border-primary flex items-center justify-center bg-bg-secondary cursor-pointer hover:border-text-primary transition-colors group overflow-hidden"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="w-8 h-8 text-text-muted group-hover:text-text-secondary transition-colors" />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">Profilbild</p>
              <p className="text-xs text-text-muted">Klicken zum Ändern</p>
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
            <label className="block text-sm font-medium text-text-secondary mb-2">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Vorname"
              className="w-full bg-bg-secondary border border-border-primary rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-text-primary transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={isSubmitting || isUploading || !name.trim()}
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50
                         bg-text-primary text-bg-primary hover:opacity-90"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Änderungen speichern
            </button>
            
            <button
              onClick={handleClearName}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors
                         text-heart hover:bg-heart/10 border border-transparent hover:border-heart/20"
            >
              <Trash2 className="w-4 h-4" />
              Namen löschen / Reset
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
