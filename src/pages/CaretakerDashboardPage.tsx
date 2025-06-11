import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AvailabilityScheduler from '../components/ui/AvailabilityScheduler';
import { useAuth } from '../lib/auth/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { caretakerProfileService } from '../lib/supabase/db';
import { Calendar, Check, Edit, LogOut, MapPin, Phone, Shield, Upload, Camera, Star, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';

function CaretakerDashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState(false);
  const [caretakerData, setCaretakerData] = useState({
    phoneNumber: userProfile?.phone_number || '',
    email: user?.email || '',
    plz: userProfile?.plz || '',
    city: userProfile?.city || ''
  });
  const [emailError, setEmailError] = useState<string | null>(null);

  // --- Verfügbarkeits-State ---
  type TimeSlot = { start: string; end: string };
  type AvailabilityState = Record<string, TimeSlot[]>;
  const defaultAvailability: AvailabilityState = {
    Mo: [{ start: '09:00', end: '17:00' }],
    Di: [{ start: '09:00', end: '17:00' }],
    Mi: [{ start: '09:00', end: '17:00' }],
    Do: [{ start: '09:00', end: '17:00' }],
    Fr: [{ start: '09:00', end: '17:00' }],
    Sa: [],
    So: [],
  };
  const [availability, setAvailability] = useState<AvailabilityState>({});

  // Handler für Speichern der Verfügbarkeit
  const handleSaveAvailability = async (newAvailability: AvailabilityState) => {
    if (!user || !profile) return;
    
    try {
      // Konvertiere TimeSlot-Objekte zu String-Array für Datenbank
      const dbAvailability: Record<string, string[]> = {};
      for (const [day, slots] of Object.entries(newAvailability)) {
        dbAvailability[day] = slots.map(slot => `${slot.start}-${slot.end}`);
      }
      
      await caretakerProfileService.saveProfile(user.id, {
        ...profile,
        services: profile.services || [],
        animalTypes: profile.animal_types || [],
        prices: profile.prices || {},
        serviceRadius: profile.service_radius || 0,
        availability: dbAvailability,
        homePhotos: profile.home_photos || [],
        qualifications: profile.qualifications || [],
        experienceDescription: profile.experience_description || '',
        shortAboutMe: profile.short_about_me || '',
        longAboutMe: profile.long_about_me || '',
      });
      
      setAvailability(newAvailability);
      setProfile((prev: any) => ({ ...prev, availability: newAvailability }));
    } catch (error) {
      console.error('Fehler beim Speichern der Verfügbarkeit:', error);
    }
  };

  // --- Leistungen & Qualifikationen State ---
  const [editSkills, setEditSkills] = useState(false);
  const [skillsDraft, setSkillsDraft] = useState({
    services: profile?.services || [],
    animal_types: profile?.animal_types || [],
    qualifications: profile?.qualifications || [],
    experience_description: profile?.experience_description || '',
    prices: profile?.prices || {},
  });
  // Freie Eingabe für Leistungen, Tierarten, Qualifikationen
  const [newService, setNewService] = useState('');
  const [newAnimal, setNewAnimal] = useState('');
  const [newQualification, setNewQualification] = useState('');

  // Default-Listen wie bei Anmeldung
  const defaultServices = [
    'Gassi-Service',
    'Haustierbetreuung',
    'Übernachtung',
    'Kurzbesuche',
    'Haussitting',
    'Hundetagesbetreuung',
  ];
  const defaultAnimals = [
    'Hunde',
    'Katzen',
    'Vögel',
    'Kaninchen',
    'Fische',
    'Kleintiere',
  ];
  const defaultQualifications = [
    'Erste-Hilfe am Tier zertifiziert',
    'Professioneller Hundetrainer',
    'Tierarzterfahrung',
    'Tierheim-Erfahrung',
  ];

  // Standard-Preisfelder wie bei der Anmeldung
  const defaultPriceFields = {
    'Gassi-Service': '',
    'Haustierbetreuung': '',
    'Übernachtung': '',
  };

  const priceFieldLabels = {
    'Gassi-Service': 'Gassi-Service (pro 30 Min)',
    'Haustierbetreuung': 'Haustierbetreuung (pro Besuch)',
    'Übernachtung': 'Übernachtung (pro Nacht)',
  };

  function handleSkillsChange(field: string, value: any) {
    setSkillsDraft(d => ({ ...d, [field]: value }));
  }
  function handlePriceChange(key: string, value: string) {
    setSkillsDraft(d => ({ ...d, prices: { ...d.prices, [key]: value } }));
  }
  function handleRemovePrice(key: string) {
    setSkillsDraft(d => { const p = { ...d.prices }; delete p[key]; return { ...d, prices: p }; });
  }
  function handleAddPrice() {
    setSkillsDraft(d => ({ ...d, prices: { ...d.prices, '': '' } }));
  }
  const handleSaveSkills = async () => {
    if (!user || !profile) return;
    
    try {
      // Konvertiere aktuelle Verfügbarkeit zu String-Array für Datenbank
      const dbAvailability: Record<string, string[]> = {};
      for (const [day, slots] of Object.entries(availability)) {
        dbAvailability[day] = slots.map(slot => `${slot.start}-${slot.end}`);
      }
      
      await caretakerProfileService.saveProfile(user.id, {
        ...profile,
        services: skillsDraft.services,
        animalTypes: skillsDraft.animal_types,
        prices: skillsDraft.prices,
        serviceRadius: profile.service_radius || 0,
        availability: dbAvailability,
        homePhotos: profile.home_photos || [],
        qualifications: skillsDraft.qualifications,
        experienceDescription: skillsDraft.experience_description,
        shortAboutMe: profile.short_about_me || '',
        longAboutMe: profile.long_about_me || '',
      });
      
      // Aktualisiere das Profil mit den neuen Daten
      setProfile((prev: any) => ({
        ...prev,
        services: skillsDraft.services,
        animal_types: skillsDraft.animal_types,
        qualifications: skillsDraft.qualifications,
        experience_description: skillsDraft.experience_description,
        prices: skillsDraft.prices,
      }));
      
      setEditSkills(false);
    } catch (error) {
      console.error('Fehler beim Speichern der Leistungen & Qualifikationen:', error);
    }
  };
  function handleCancelSkills() {
    setSkillsDraft({
      services: profile?.services || [],
      animal_types: profile?.animal_types || [],
      qualifications: profile?.qualifications || [],
      experience_description: profile?.experience_description || '',
      prices: profile?.prices || {},
    });
    setEditSkills(false);
  }

  // State für kurze Beschreibung im Texte-Tab
  const [shortDescription, setShortDescription] = useState(profile?.short_about_me || '');
  const [editShortDesc, setEditShortDesc] = useState(false);
  const [shortDescDraft, setShortDescDraft] = useState(shortDescription);
  const maxShortDesc = 140;

  // State für Über mich Box
  const [aboutMe, setAboutMe] = useState(profile?.long_about_me || '');
  const [editAboutMe, setEditAboutMe] = useState(false);
  const [aboutMeDraft, setAboutMeDraft] = useState(aboutMe);
  const minAboutMe = 500;

  // Handler für Speichern der kurzen Beschreibung
  const handleSaveShortDescription = async (newText: string) => {
    if (!user || !profile) return;
    
    try {
      // Konvertiere aktuelle Verfügbarkeit zu String-Array für Datenbank
      const dbAvailability: Record<string, string[]> = {};
      for (const [day, slots] of Object.entries(availability)) {
        dbAvailability[day] = slots.map(slot => `${slot.start}-${slot.end}`);
      }
      
      await caretakerProfileService.saveProfile(user.id, {
        ...profile,
        services: profile.services || [],
        animalTypes: profile.animal_types || [],
        prices: profile.prices || {},
        serviceRadius: profile.service_radius || 0,
        availability: dbAvailability,
        homePhotos: profile.home_photos || [],
        qualifications: profile.qualifications || [],
        experienceDescription: profile.experience_description || '',
        shortAboutMe: newText,
        longAboutMe: profile.long_about_me || '',
      });
      
      setShortDescription(newText);
      setProfile((prev: any) => ({ ...prev, short_about_me: newText }));
      setEditShortDesc(false);
    } catch (error) {
      console.error('Fehler beim Speichern der kurzen Beschreibung:', error);
    }
  };

  // Handler für Speichern der langen Beschreibung
  const handleSaveAboutMe = async (newText: string) => {
    if (!user || !profile) return;
    
    try {
      // Konvertiere aktuelle Verfügbarkeit zu String-Array für Datenbank
      const dbAvailability: Record<string, string[]> = {};
      for (const [day, slots] of Object.entries(availability)) {
        dbAvailability[day] = slots.map(slot => `${slot.start}-${slot.end}`);
      }
      
      await caretakerProfileService.saveProfile(user.id, {
        ...profile,
        services: profile.services || [],
        animalTypes: profile.animal_types || [],
        prices: profile.prices || {},
        serviceRadius: profile.service_radius || 0,
        availability: dbAvailability,
        homePhotos: profile.home_photos || [],
        qualifications: profile.qualifications || [],
        experienceDescription: profile.experience_description || '',
        shortAboutMe: profile.short_about_me || '',
        longAboutMe: newText,
      });
      
      setAboutMe(newText);
      setProfile((prev: any) => ({ ...prev, long_about_me: newText }));
      setEditAboutMe(false);
    } catch (error) {
      console.error('Fehler beim Speichern der Über mich Beschreibung:', error);
    }
  };

  // State für Fotos-Tab
  const [photos, setPhotos] = useState<(string | File)[]>([]);
  const fileInputRefFotos = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  function handlePhotoInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      setPhotos(prev => [...prev, ...Array.from(files)]);
    }
  }
  function handleDropFotos(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setPhotos(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }
  function handleDragOverFotos(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  // Hilfsfunktion: Upload eines einzelnen Bildes zu Supabase Storage
  async function uploadPhotoToSupabase(file: File, userId: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('caretaker-home-photos').upload(fileName, file, { upsert: true });
    if (uploadError) {
      setPhotoError('Fehler beim Bildupload: ' + uploadError.message);
      return null;
    }
    const { data: urlData } = supabase.storage.from('caretaker-home-photos').getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  }

  // Hilfsfunktion: Löschen eines Bildes aus Supabase Storage
  async function deletePhotoFromSupabase(url: string) {
    const match = url.match(/caretaker-home-photos\/([^?]+)/);
    const filePath = match ? match[1] : null;
    if (!filePath) return;
    await supabase.storage.from('caretaker-home-photos').remove([filePath]);
  }

  // Handler für neue Fotos (Upload + DB-Sync)
  async function handleAddPhotos(newFiles: FileList | File[]) {
    if (!user) return;
    setPhotoUploading(true);
    setPhotoError(null);
    const uploadedUrls: string[] = [];
    for (const file of Array.from(newFiles)) {
      const url = await uploadPhotoToSupabase(file, user.id);
      if (url) uploadedUrls.push(url);
    }
    // Update caretaker_profiles.home_photos
    const newPhotoList = [...(profile?.home_photos || []), ...uploadedUrls];
    // Konvertiere aktuelle Verfügbarkeit zu String-Array für Datenbank
    const dbAvailability: Record<string, string[]> = {};
    for (const [day, slots] of Object.entries(availability)) {
      dbAvailability[day] = slots.map(slot => `${slot.start}-${slot.end}`);
    }
    
    await caretakerProfileService.saveProfile(user.id, {
      ...profile,
      homePhotos: newPhotoList,
      services: profile.services || [],
      animalTypes: profile.animal_types || [],
      prices: profile.prices || {},
      serviceRadius: profile.service_radius || 0,
      availability: dbAvailability,
      qualifications: profile.qualifications || [],
      experienceDescription: profile.experience_description || '',
    });
    setPhotos(newPhotoList);
    setProfile((p: any) => ({ ...p, home_photos: newPhotoList }));
    setPhotoUploading(false);
  }

  // Handler für Löschen eines Fotos (Storage + DB)
  async function handleDeletePhoto(idx: number) {
    if (!user || !profile) return;
    const toDelete = photos[idx];
    if (typeof toDelete === 'string') {
      await deletePhotoFromSupabase(toDelete);
      const newPhotoList = photos.filter((_, i) => i !== idx).filter(Boolean) as string[];
      // Konvertiere aktuelle Verfügbarkeit zu String-Array für Datenbank
      const dbAvailability: Record<string, string[]> = {};
      for (const [day, slots] of Object.entries(availability)) {
        dbAvailability[day] = slots.map(slot => `${slot.start}-${slot.end}`);
      }
      
      await caretakerProfileService.saveProfile(user.id, {
        ...profile,
        homePhotos: newPhotoList,
        services: profile.services || [],
        animalTypes: profile.animal_types || [],
        prices: profile.prices || {},
        serviceRadius: profile.service_radius || 0,
        availability: dbAvailability,
        qualifications: profile.qualifications || [],
        experienceDescription: profile.experience_description || '',
      });
      setPhotos(newPhotoList);
      setProfile((p: any) => ({ ...p, home_photos: newPhotoList }));
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      const { data, error } = await caretakerProfileService.getProfile(user.id);
      if (error) setError('Fehler beim Laden des Profils!');
      setProfile(data);
      
      // Texte-States und Verfügbarkeit aktualisieren wenn Profil geladen wird
      if (data) {
        setShortDescription((data as any).short_about_me || '');
        setShortDescDraft((data as any).short_about_me || '');
        setAboutMe((data as any).long_about_me || '');
        setAboutMeDraft((data as any).long_about_me || '');
        
        // Aktualisiere skillsDraft mit geladenen Daten
        const loadedPrices = (data as any).prices || {};
        // Stelle sicher, dass Standard-Preisfelder immer vorhanden sind
        const mergedPrices = { ...defaultPriceFields, ...loadedPrices };
        
        setSkillsDraft({
          services: (data as any).services || [],
          animal_types: (data as any).animal_types || [],
          qualifications: (data as any).qualifications || [],
          experience_description: (data as any).experience_description || '',
          prices: mergedPrices,
        });
        
        // Aktualisiere Fotos-State
        setPhotos((data as any).home_photos || []);
        
        // Verfügbarkeit aus der Datenbank laden und validieren
        const dbAvailability = (data as any).availability;
        if (dbAvailability && typeof dbAvailability === 'object') {
          // Konvertiere String-Array-Daten zu TimeSlot-Objekten
          const validatedAvailability: AvailabilityState = {};
          
          for (const day of ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']) {
            const daySlots = dbAvailability[day];
            if (Array.isArray(daySlots)) {
              validatedAvailability[day] = daySlots
                .map((timeItem: any) => {
                  if (typeof timeItem === 'string' && timeItem.includes('-')) {
                    const [start, end] = timeItem.split('-');
                    return { start: start.trim(), end: end.trim() };
                  }
                  // Für Rückwärtskompatibilität: Falls bereits TimeSlot-Objekte
                  if (typeof timeItem === 'object' && timeItem?.start && timeItem?.end) {
                    return { start: timeItem.start, end: timeItem.end };
                  }
                  return null;
                })
                .filter((slot): slot is { start: string; end: string } => 
                  slot !== null && slot.start && slot.end
                );
            } else {
              validatedAvailability[day] = [];
            }
          }
          
          setAvailability(validatedAvailability);
        } else {
          // Falls keine Verfügbarkeit in der DB, verwende Default-Verfügbarkeit und speichere sie
          setAvailability(defaultAvailability);
          // Default-Verfügbarkeit auch in DB speichern für neuen Benutzer
          setTimeout(async () => {
            try {
              // Konvertiere Default-Verfügbarkeit zu String-Array für Datenbank
              const dbDefaultAvailability: Record<string, string[]> = {};
              for (const [day, slots] of Object.entries(defaultAvailability)) {
                dbDefaultAvailability[day] = slots.map(slot => `${slot.start}-${slot.end}`);
              }
              
              await caretakerProfileService.saveProfile(user.id, {
                ...data,
                services: (data as any).services || [],
                animalTypes: (data as any).animal_types || [],
                prices: (data as any).prices || {},
                serviceRadius: (data as any).service_radius || 0,
                availability: dbDefaultAvailability,
                homePhotos: (data as any).home_photos || [],
                qualifications: (data as any).qualifications || [],
                experienceDescription: (data as any).experience_description || '',
                shortAboutMe: (data as any).short_about_me || '',
                longAboutMe: (data as any).long_about_me || '',
              });
            } catch (error) {
              console.error('Fehler beim Speichern der Default-Verfügbarkeit:', error);
            }
          }, 100);
        }
      }
      
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    setCaretakerData({
      phoneNumber: userProfile?.phone_number || '',
      email: user?.email || '',
      plz: userProfile?.plz || '',
      city: userProfile?.city || ''
    });
  }, [userProfile, user]);

  // Dummy-Upload-Handler (hier bitte später echten Upload zu Supabase Storage einbauen)
  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // TODO: Upload zu Supabase Storage und Update der Profilbild-URL im User-Profil
    // Simuliere Upload
    setTimeout(() => {
      setUploading(false);
      // Nach Upload: Profilbild neu laden (hier ggf. fetchProfile() oder setProfile aktualisieren)
    }, 1500);
  };

  const handlePhoneNumberChange = (value: string) => {
    const phoneRegex = /^[+\d\s-]*$/;
    if (phoneRegex.test(value)) {
      setCaretakerData(d => ({ ...d, phoneNumber: value }));
    }
  };
  const handleEmailChange = (value: string) => {
    setCaretakerData(d => ({ ...d, email: value }));
    if (value.trim() === '') {
      setEmailError('E-Mail-Adresse ist ein Pflichtfeld');
    } else if (!/^\S+@\S+\.\S+$/.test(value)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
    } else {
      setEmailError(null);
    }
  };
  const handleSaveCaretakerData = async () => {
    // TODO: Update in Supabase
    setEditData(false);
  };
  const handleCancelEdit = () => {
    setCaretakerData({
      phoneNumber: userProfile?.phone_number || '',
      email: user?.email || '',
      plz: userProfile?.plz || '',
      city: userProfile?.city || ''
    });
    setEditData(false);
  };

  // Fallback-Profil für leere userProfile
  const fallbackProfile = {
    first_name: user?.email?.split('@')[0] || 'Benutzer',
    last_name: '',
    email: user?.email || '',
    phone_number: '',
    plz: '',
    city: '',
    user_type: 'caretaker' as const,
    avatar_url: null
  };

  // Hilfsfunktion für Initialen
  function getInitials(first: string | null | undefined, last: string | null | undefined) {
    const f = (first || '').trim();
    const l = (last || '').trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    if (l) return l.slice(0, 2).toUpperCase();
    return 'NN';
  }

  // Profilquelle: userProfile (users-Tabelle)!
  const profileData = userProfile || fallbackProfile;
  const fullName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || profileData.email;
  const initials = getInitials(profileData.first_name, profileData.last_name);
  const avatarUrl = profileData.profile_photo_url || profileData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=f3f4f6&color=374151&length=2`;

  // Tab-Navigation für Übersicht/Fotos
  const [activeTab, setActiveTab] = useState<'uebersicht' | 'fotos' | 'texte' | 'kunden' | 'bewertungen'>('uebersicht');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Bewertungen laden
  useEffect(() => {
    async function fetchReviews() {
      if (!user) return;
      setReviewsLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, user_id, users(first_name, last_name)')
        .eq('caretaker_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setReviews(data);
      setReviewsLoading(false);
    }
    if (activeTab === 'bewertungen') fetchReviews();
  }, [activeTab, user]);

  if (authLoading || loading) return <LoadingSpinner />;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nicht angemeldet</h2>
          <p className="text-gray-600">Bitte melde dich an, um dein Dashboard zu sehen.</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Kein Caretaker-Profil gefunden.</div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Profilkarte */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <div className="relative w-32 h-32 mx-auto lg:mx-0">
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary-100 shadow"
            />
            {/* Overlay-Button für Upload */}
            <label className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow cursor-pointer hover:bg-primary-50 transition-colors border border-gray-200">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePhotoChange}
                disabled={uploading}
              />
              <Camera className="h-5 w-5 text-primary-600" />
            </label>
            {uploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full"><div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div></div>}
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Name */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <h1 className="text-2xl font-bold">{fullName}</h1>
                  {editData && (
                    <div className="group relative">
                      <Info className="h-5 w-5 text-blue-500 cursor-help" />
                      <div className="absolute left-0 top-8 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        <div className="font-medium mb-1">Name ändern</div>
                        <div>Der Name kann nur über das Kontaktformular oder den Support geändert werden.</div>
                        <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Kontaktdaten */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Kontaktdaten</h3>
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    aria-label="Kontaktdaten bearbeiten"
                    onClick={() => setEditData(!editData)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {!editData ? (
                    <>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          {caretakerData.plz && caretakerData.city ?
                            `${caretakerData.plz} ${caretakerData.city}` :
                            caretakerData.plz ? caretakerData.plz :
                            caretakerData.city ? caretakerData.city :
                            '—'
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{caretakerData.phoneNumber || '—'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        <span className="text-gray-700">{caretakerData.email || '—'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                        <input
                          type="text"
                          className="input w-full"
                          value={caretakerData.plz}
                          onChange={e => setCaretakerData(d => ({ ...d, plz: e.target.value }))}
                          placeholder="PLZ"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
                        <input
                          type="text"
                          className="input w-full"
                          value={caretakerData.city}
                          onChange={e => setCaretakerData(d => ({ ...d, city: e.target.value }))}
                          placeholder="Ort"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefonnummer</label>
                        <input
                          type="tel"
                          className="input w-full"
                          value={caretakerData.phoneNumber}
                          onChange={e => handlePhoneNumberChange(e.target.value)}
                          placeholder="+49 123 456789"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          E-Mail <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          className={`input w-full ${emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={caretakerData.email}
                          onChange={e => handleEmailChange(e.target.value)}
                          placeholder="ihre@email.de"
                          required
                        />
                        {emailError && (
                          <p className="text-red-500 text-xs mt-1">{emailError}</p>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                          onClick={handleSaveCaretakerData}
                          disabled={!!emailError || !caretakerData.email.trim()}
                        >
                          Speichern
                        </button>
                        <button
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                          onClick={handleCancelEdit}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tab-Navigation (jetzt unter der Profilkarte) */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('uebersicht')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'uebersicht'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('fotos')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'fotos'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fotos
            </button>
            <button
              onClick={() => setActiveTab('texte')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'texte'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Texte
            </button>
            <button
              onClick={() => setActiveTab('kunden')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'kunden'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Kunden
            </button>
            <button
              onClick={() => setActiveTab('bewertungen')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bewertungen'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bewertungen
            </button>
          </nav>
        </div>
      </div>
      {/* Tab-Inhalt */}
      {activeTab === 'uebersicht' && (
        <>
          {/* Leistungen & Qualifikationen */}
          <div className="mb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 mb-2"><Shield className="w-5 h-5" /> Leistungen & Qualifikationen</h2>
          </div>
          <div className="bg-white rounded-xl shadow p-6 mb-8 relative">
            {!editSkills && (
              <button className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary-600" onClick={() => setEditSkills(true)} title="Bearbeiten">
                <Edit className="h-3.5 w-3.5" />
              </button>
            )}
            {!editSkills ? (
              <>
                <div className="mb-2">
                  <span className="font-semibold">Leistungen:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.services?.length ? profile.services.map((s: string) => (
                      <span key={s} className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">{s}</span>
                    )) : <span className="text-gray-400">Keine Angaben</span>}
                  </div>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Tierarten:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.animal_types?.length ? profile.animal_types.map((a: string) => (
                      <span key={a} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{a}</span>
                    )) : <span className="text-gray-400">Keine Angaben</span>}
                  </div>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Qualifikationen:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.qualifications?.length ? profile.qualifications.map((q: string) => (
                      <span key={q} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{q}</span>
                    )) : <span className="text-gray-400">Keine Angaben</span>}
                  </div>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Beschreibung:</span>
                  <div className="mt-1 text-gray-700 text-sm whitespace-pre-line">{profile.experience_description || <span className="text-gray-400">Keine Angaben</span>}</div>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Preise:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.prices ? Object.entries(profile.prices).map(([k, v]: [string, any]) => (
                      <span key={k} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">{k}: {v} €</span>
                    )) : <span className="text-gray-400">Keine Angaben</span>}
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={e => { e.preventDefault(); handleSaveSkills(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Leistungen</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {/* Default-Checkboxen */}
                    {defaultServices.map((s: string) => (
                      <label key={s} className={`px-2 py-1 rounded text-xs cursor-pointer border ${skillsDraft.services.includes(s) ? 'bg-primary-100 text-primary-700 border-primary-300' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        <input type="checkbox" className="mr-1" checked={skillsDraft.services.includes(s)} onChange={e => handleSkillsChange('services', e.target.checked ? [...skillsDraft.services, s] : skillsDraft.services.filter((x: string) => x !== s))} />
                        {s}
                      </label>
                    ))}
                    {/* Individuelle Leistungen als Chips */}
                    {skillsDraft.services.filter((s: string) => !defaultServices.includes(s)).map((s: string) => (
                      <span key={s} className="flex items-center px-2 py-1 rounded text-xs bg-primary-100 text-primary-700 border border-primary-300">
                        {s}
                        <button type="button" className="ml-1 text-gray-400 hover:text-red-500" onClick={() => handleSkillsChange('services', skillsDraft.services.filter((x: string) => x !== s))} title="Entfernen">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input className="input w-40" placeholder="Neue Leistung" value={newService} onChange={e => setNewService(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newService.trim()) { handleSkillsChange('services', [...skillsDraft.services, newService.trim()]); setNewService(''); } }} />
                    <button type="button" className="text-green-600 hover:bg-green-50 rounded p-1" disabled={!newService.trim()} onClick={() => { handleSkillsChange('services', [...skillsDraft.services, newService.trim()]); setNewService(''); }} title="Hinzufügen"><Check className="w-4 h-4" /></button>
                    <button type="button" className="text-gray-400 hover:text-red-500 rounded p-1" onClick={() => setNewService('')} title="Abbrechen"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tierarten</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {/* Default-Checkboxen */}
                    {defaultAnimals.map((a: string) => (
                      <label key={a} className={`px-2 py-1 rounded text-xs cursor-pointer border ${skillsDraft.animal_types.includes(a) ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        <input type="checkbox" className="mr-1" checked={skillsDraft.animal_types.includes(a)} onChange={e => handleSkillsChange('animal_types', e.target.checked ? [...skillsDraft.animal_types, a] : skillsDraft.animal_types.filter((x: string) => x !== a))} />
                        {a}
                      </label>
                    ))}
                    {/* Individuelle Tierarten als Chips */}
                    {skillsDraft.animal_types.filter((a: string) => !defaultAnimals.includes(a)).map((a: string) => (
                      <span key={a} className="flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-700 border border-green-300">
                        {a}
                        <button type="button" className="ml-1 text-gray-400 hover:text-red-500" onClick={() => handleSkillsChange('animal_types', skillsDraft.animal_types.filter((x: string) => x !== a))} title="Entfernen">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input className="input w-40" placeholder="Neue Tierart" value={newAnimal} onChange={e => setNewAnimal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newAnimal.trim()) { handleSkillsChange('animal_types', [...skillsDraft.animal_types, newAnimal.trim()]); setNewAnimal(''); } }} />
                    <button type="button" className="text-green-600 hover:bg-green-50 rounded p-1" disabled={!newAnimal.trim()} onClick={() => { handleSkillsChange('animal_types', [...skillsDraft.animal_types, newAnimal.trim()]); setNewAnimal(''); }} title="Hinzufügen"><Check className="w-4 h-4" /></button>
                    <button type="button" className="text-gray-400 hover:text-red-500 rounded p-1" onClick={() => setNewAnimal('')} title="Abbrechen"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Qualifikationen</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {/* Default-Checkboxen */}
                    {defaultQualifications.map((q: string) => (
                      <label key={q} className={`px-2 py-1 rounded text-xs cursor-pointer border ${skillsDraft.qualifications.includes(q) ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        <input type="checkbox" className="mr-1" checked={skillsDraft.qualifications.includes(q)} onChange={e => handleSkillsChange('qualifications', e.target.checked ? [...skillsDraft.qualifications, q] : skillsDraft.qualifications.filter((x: string) => x !== q))} />
                        {q}
                      </label>
                    ))}
                    {/* Individuelle Qualifikationen als Chips */}
                    {skillsDraft.qualifications.filter((q: string) => !defaultQualifications.includes(q)).map((q: string) => (
                      <span key={q} className="flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 border border-blue-300">
                        {q}
                        <button type="button" className="ml-1 text-gray-400 hover:text-red-500" onClick={() => handleSkillsChange('qualifications', skillsDraft.qualifications.filter((x: string) => x !== q))} title="Entfernen">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input className="input w-40" placeholder="Neue Qualifikation" value={newQualification} onChange={e => setNewQualification(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newQualification.trim()) { handleSkillsChange('qualifications', [...skillsDraft.qualifications, newQualification.trim()]); setNewQualification(''); } }} />
                    <button type="button" className="text-green-600 hover:bg-green-50 rounded p-1" disabled={!newQualification.trim()} onClick={() => { handleSkillsChange('qualifications', [...skillsDraft.qualifications, newQualification.trim()]); setNewQualification(''); }} title="Hinzufügen"><Check className="w-4 h-4" /></button>
                    <button type="button" className="text-gray-400 hover:text-red-500 rounded p-1" onClick={() => setNewQualification('')} title="Abbrechen"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Beschreibung</label>
                  <textarea
                    className="input w-full min-h-[60px]"
                    value={skillsDraft.experience_description}
                    onChange={e => handleSkillsChange('experience_description', e.target.value)}
                    placeholder="Erzähle den Tierbesitzern von deiner Erfahrung mit Tieren, inkl. beruflicher Erfahrung oder eigenen Tieren"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preise</label>
                  <div className="space-y-3">
                    {/* Standard-Preisfelder wie bei der Anmeldung */}
                    {Object.entries(defaultPriceFields).map(([service, _]) => (
                      <div key={service} className="flex items-center gap-4">
                        <label className="w-56 text-gray-700">{priceFieldLabels[service as keyof typeof priceFieldLabels]}</label>
                        <input 
                          type="number" 
                          min="0" 
                          className="input w-32" 
                          placeholder="€" 
                          value={skillsDraft.prices[service] || ''} 
                          onChange={e => handlePriceChange(service, e.target.value)} 
                        />
                      </div>
                    ))}
                    
                    {/* Zusätzliche individuelle Preise */}
                    {Object.entries(skillsDraft.prices).filter(([k, _]) => !defaultPriceFields.hasOwnProperty(k)).map(([k, v], idx) => (
                      <div key={k + idx} className="flex gap-2 items-center">
                        <input className="input w-32" placeholder="Leistung" value={k} onChange={e => {
                          const newKey = e.target.value;
                          const newPrices = { ...skillsDraft.prices };
                          delete newPrices[k];
                          newPrices[newKey] = v;
                          handleSkillsChange('prices', newPrices);
                        }} />
                        <input className="input w-24" placeholder="Preis (€)" value={String(v)} onChange={e => handlePriceChange(k, e.target.value)} />
                        <button type="button" className="text-red-500 hover:bg-red-50 rounded p-1" onClick={() => handleRemovePrice(k)} title="Entfernen"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    ))}
                    <button type="button" className="text-primary-600 hover:bg-primary-50 rounded px-2 py-1 text-xs" onClick={handleAddPrice}>+ Zusätzlichen Preis hinzufügen</button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm">Speichern</button>
                  <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm" onClick={handleCancelSkills}>Abbrechen</button>
                </div>
              </form>
            )}
          </div>

          {/* Verfügbarkeit */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-gray-900"><Calendar className="w-5 h-5" /> Verfügbarkeit</h2>
            <div className="bg-white rounded-xl shadow p-6">
              <AvailabilityScheduler
                availability={availability}
                onAvailabilityChange={handleSaveAvailability}
              />
            </div>
          </div>

          {/* Buchungen/Anfragen */}
          <div className="mb-2">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-gray-900"><Check className="w-5 h-5" /> Letzte Buchungen / Anfragen</h2>
          </div>
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <div className="text-gray-400">(Hier könnten Buchungen, Anfragen oder Bewertungen angezeigt werden)</div>
          </div>
        </>
      )}
      {activeTab === 'fotos' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-gray-900"><Upload className="w-5 h-5" /> Wohnungsfotos</h2>
          <div className="bg-white rounded-xl shadow p-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors mb-4"
              onClick={() => fileInputRefFotos.current?.click()}
              onDrop={async e => { e.preventDefault(); await handleAddPhotos(e.dataTransfer.files); }}
              onDragOver={handleDragOverFotos}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={fileInputRefFotos}
                onChange={async e => { if (e.target.files) await handleAddPhotos(e.target.files); }}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload className="w-8 h-8 text-primary-400 mb-1" />
                <span className="text-gray-700 font-medium">Bilder hierher ziehen oder klicken, um hochzuladen</span>
                <span className="text-xs text-gray-400">JPG, PNG, max. 5MB pro Bild</span>
              </div>
              {photoUploading && <div className="mt-2 text-primary-600 text-sm">Bilder werden hochgeladen...</div>}
              {photoError && <div className="mt-2 text-red-500 text-sm">{photoError}</div>}
            </div>
            <div className="flex flex-wrap gap-2">
              {photos.length ? photos.map((fileOrUrl, idx) => {
                const url = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);
                return (
                  <div key={idx} className="relative group">
                    <img src={url} alt="Wohnungsfoto" className="h-24 w-24 object-cover rounded border" />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow text-gray-400 hover:text-red-500"
                      onClick={() => handleDeletePhoto(idx)}
                      title="Foto entfernen"
                      disabled={photoUploading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                );
              }) : <span className="text-gray-400">Keine Fotos hochgeladen</span>}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'texte' && (
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow p-6 mb-8 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Kurze Beschreibung</h2>
              {!editShortDesc && (
                <button className="p-2 text-gray-400 hover:text-primary-600 absolute top-4 right-4" onClick={() => { setEditShortDesc(true); setShortDescDraft(shortDescription); }} title="Bearbeiten">
                  <Edit className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {!editShortDesc ? (
              <div className="text-gray-700 min-h-[32px]">{shortDescription || <span className="text-gray-400">Noch keine Beschreibung hinterlegt.</span>}</div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); handleSaveShortDescription(shortDescDraft); }}>
                <textarea
                  className="input w-full min-h-[48px]"
                  maxLength={maxShortDesc}
                  value={shortDescDraft}
                  onChange={e => setShortDescDraft(e.target.value)}
                  placeholder="Fasse dich kurz – z.B. 'Erfahrene Hundesitterin aus Berlin, liebevoll & zuverlässig.'"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${shortDescDraft.length > maxShortDesc ? 'text-red-500' : 'text-gray-400'}`}>{shortDescDraft.length}/{maxShortDesc} Zeichen</span>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-xs" disabled={shortDescDraft.length > maxShortDesc}>Speichern</button>
                    <button type="button" className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs" onClick={() => setEditShortDesc(false)}>Abbrechen</button>
                  </div>
                </div>
              </form>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-6 mb-8 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Über mich</h2>
              {!editAboutMe && (
                <button className="p-2 text-gray-400 hover:text-primary-600 absolute top-4 right-4" onClick={() => { setEditAboutMe(true); setAboutMeDraft(aboutMe); }} title="Bearbeiten">
                  <Edit className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {!editAboutMe ? (
              <div className="text-gray-700 min-h-[32px]">{aboutMe || <span className="text-gray-400">Noch kein Text hinterlegt.</span>}</div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); handleSaveAboutMe(aboutMeDraft); }}>
                <textarea
                  className="input w-full min-h-[160px]"
                  value={aboutMeDraft}
                  onChange={e => setAboutMeDraft(e.target.value)}
                  minLength={minAboutMe}
                  placeholder="Erzähle mehr über dich, deine Motivation, Erfahrung und was dich als Betreuer:in auszeichnet. Mindestens 540 Zeichen."
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${aboutMeDraft.length < minAboutMe ? 'text-red-500' : 'text-gray-400'}`}>{aboutMeDraft.length} Zeichen (min. {minAboutMe})</span>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-xs" disabled={aboutMeDraft.length < minAboutMe}>Speichern</button>
                    <button type="button" className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs" onClick={() => setEditAboutMe(false)}>Abbrechen</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {activeTab === 'kunden' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-gray-900">Kunden</h2>
          <div className="bg-white rounded-xl shadow p-6">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Name</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">E-Mail</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Letzte Buchung</th>
                  <th className="p-3 text-left font-semibold text-gray-700 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 text-gray-400 italic" colSpan={4}>Noch keine Kunden vorhanden.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'bewertungen' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 text-gray-900">Bewertungen</h2>
          <div className="bg-white rounded-xl shadow p-6">
            {reviewsLoading ? (
              <div className="text-gray-400">Bewertungen werden geladen...</div>
            ) : reviews.length === 0 ? (
              <div className="text-gray-400">Noch keine Bewertungen vorhanden.</div>
            ) : (
              <div className="space-y-6">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b last:border-b-0 pb-4 mb-4 last:mb-0 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-1 mb-1 sm:mb-0">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-5 h-5 ${i <= r.rating ? 'text-yellow-400 fill-yellow-300' : 'text-gray-300'}`} fill={i <= r.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-800 font-medium">{r.users?.first_name || ''} {r.users?.last_name || ''}</div>
                      <div className="text-gray-600 text-sm whitespace-pre-line">{r.comment || <span className="text-gray-400">(Kein Kommentar)</span>}</div>
                    </div>
                    <div className="text-xs text-gray-400 ml-auto sm:text-right">{r.created_at ? new Date(r.created_at).toLocaleDateString('de-DE', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CaretakerDashboardPage; 