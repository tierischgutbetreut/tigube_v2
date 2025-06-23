import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { PawPrint as Paw, ChevronLeft, ChevronRight, Upload, Check, AlertCircle, Trash2, Eye, EyeOff, Edit, CopyPlus, Plus, X, ExternalLink } from 'lucide-react';
import Button from '../components/ui/Button';
import ServiceSelector from '../components/ui/ServiceSelector';
import AvailabilityScheduler from '../components/ui/AvailabilityScheduler';
import RangeSlider from '../components/ui/RangeSlider';
import PhotoGalleryUpload from '../components/ui/PhotoGalleryUpload';
import AboutMeEditor from '../components/ui/AboutMeEditor';
import Badge from '../components/ui/Badge';
import LanguageSelector from '../components/ui/LanguageSelector';
import CommercialInfoInput from '../components/ui/CommercialInfoInput';
import { auth, supabase } from '../lib/supabase/client';
import { userService, petService, ownerPreferencesService, caretakerProfileService } from '../lib/supabase/db';
import { useDropzone } from 'react-dropzone';
import { plzService } from '../lib/supabase/db';
import { useAuth } from '../lib/auth/AuthContext';
import { SubscriptionService } from '../lib/services/subscriptionService';

// Hilfsfunktionen für localStorage
const REGISTRATION_CACHE_KEY = 'tigube_registration_data';

function saveRegistrationData(data: any) {
  try {
    localStorage.setItem(REGISTRATION_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Fehler beim Speichern der Registrierungsdaten:', error);
  }
}

function loadRegistrationData() {
  try {
    const stored = localStorage.getItem(REGISTRATION_CACHE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Fehler beim Laden der Registrierungsdaten:', error);
    return null;
  }
}

function clearRegistrationData() {
  try {
    localStorage.removeItem(REGISTRATION_CACHE_KEY);
  } catch (error) {
    console.warn('Fehler beim Löschen der Registrierungsdaten:', error);
  }
}

function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateProfileState } = useAuth();
  const initialType = searchParams.get('type') || 'owner';
  
  // Lade gespeicherte Registrierungsdaten
  const savedData = loadRegistrationData();
  
  // Fix: Accept both 'caregiver' and 'caretaker' as valid caretaker types
  const [userType, setUserType] = useState<'owner' | 'caretaker'>(
    savedData?.userType || (initialType === 'caregiver' || initialType === 'caretaker' ? 'caretaker' : 'owner')
  );
  const [step, setStep] = useState(savedData?.step || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Formular-Daten für Schritt 1 (Grundlegende Kontoinformationen)
  const [formStep1, setFormStep1] = useState(savedData?.formStep1 || {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    termsAccepted: false
  });

  // Formular-Daten für Schritt 2 (Tierbesitzer)
  const [formStep2Owner, setFormStep2Owner] = useState(savedData?.formStep2Owner || {
    plz: '',
    city: '',
    street: '',
    phoneNumber: '',
    profilePhotoUrl: '',
    pets: [{
      name: '',
      type: '',
      typeOther: '',
      breed: '',
      age: '',
      weight: '',
      photoUrl: '',
      description: '',
      gender: '',
      neutered: false,
    }],
    services: [] as string[],
    otherServices: [''],
    vetName: '',
    vetAddress: '',
    vetPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    careInstructions: ''
  });

  // Formular-Daten für Schritt 2 (Caretaker)
  interface WeeklyAvailability {
    [key: string]: string[];
  }
  const [formStep2Caretaker, setFormStep2Caretaker] = useState<{
    plz: string;
    city: string;
    street: string;
    phoneNumber: string;
    profilePhotoUrl: string;
    services: string[];
    animalTypes: string[];
    prices: {
      'Gassi-Service': string;
      'Haustierbetreuung': string;
      'Übernachtung': string;
    };
    serviceRadius: number;
    availability: WeeklyAvailability;
    homePhotos: (string | File)[];
    qualifications: string[];
    newQualification?: string;
    experienceDescription?: string;
    shortAboutMe?: string;
    longAboutMe?: string;
    languages: string[];
    isCommercial: boolean;
    companyName: string;
    taxNumber: string;
    vatId: string;
  }>(
    savedData?.formStep2Caretaker || {
      plz: '',
      city: '',
      street: '',
      phoneNumber: '',
      profilePhotoUrl: '',
      services: [],
      animalTypes: [],
      prices: {
        'Gassi-Service': '',
        'Haustierbetreuung': '',
        'Übernachtung': '',
      },
      serviceRadius: 10,
      availability: {
        Mo: [],
        Di: [],
        Mi: [],
        Do: [],
        Fr: [],
        Sa: [],
        So: [],
      },
      homePhotos: [],
          qualifications: [],
    newQualification: '',
    experienceDescription: '',
    shortAboutMe: '',
    longAboutMe: '',
    languages: [],
    isCommercial: false,
    companyName: '',
    taxNumber: '',
    vatId: '',
    }
  );

  // Benutzer-ID nach der Registrierung
  const [userId, setUserId] = useState<string | null>(savedData?.userId || null);

  // Neue Variable für Multistep-Formular
  const [profileStep, setProfileStep] = useState(savedData?.profileStep || 1); // 1=Kontakt, 2=Services&Preise, 3=Erfahrung, 4=Fotos&Profile

  const [showPassword, setShowPassword] = useState(false);

  const [petPhotoUploading, setPetPhotoUploading] = useState<{[key: number]: boolean}>({});
  const [petPhotoError, setPetPhotoError] = useState<{[key: number]: string | null}>({});

  // Upload-Status für Profilbild
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(null);

  // --- Neue Verfügbarkeits-Logik für Caretaker-Registrierung ---
  type TimeSlot = { start: string; end: string };
  type AvailabilityState = Record<string, TimeSlot[]>;
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const defaultAvailability: AvailabilityState = {
    Mo: [{ start: '08:00', end: '18:00' }],
    Di: [{ start: '08:00', end: '18:00' }],
    Mi: [{ start: '08:00', end: '18:00' }],
    Do: [{ start: '08:00', end: '18:00' }],
    Fr: [{ start: '08:00', end: '18:00' }],
    Sa: [],
    So: [],
  };
  const [availability, setAvailability] = useState<AvailabilityState>(parseWeeklyAvailability(formStep2Caretaker.availability || defaultAvailability));
  const [editSlot, setEditSlot] = useState<{ day: string; idx: number | null }>({ day: '', idx: null });
  const [slotDraft, setSlotDraft] = useState<TimeSlot>({ start: '', end: '' });

  // State für das aktuelle Inputfeld (neuer Wunsch)
  const [otherServiceInput, setOtherServiceInput] = useState('');

  function handleSlotChange(day: string, idx: number, field: 'start' | 'end', value: string) {
    setAvailability(avail => {
      const slots = [...avail[day]];
      slots[idx] = { ...slots[idx], [field]: value };
      return { ...avail, [day]: slots };
    });
  }
  function handleAddSlot(day: string) {
    setEditSlot({ day, idx: null });
    setSlotDraft({ start: '', end: '' });
  }
  function handleEditSlot(day: string, idx: number) {
    setEditSlot({ day, idx });
    setSlotDraft({ ...availability[day][idx] });
  }
  function handleSaveSlot() {
    setAvailability(avail => {
      const slots = [...avail[editSlot.day]];
      if (editSlot.idx === null) {
        slots.push(slotDraft);
      } else {
        slots[editSlot.idx] = slotDraft;
      }
      return { ...avail, [editSlot.day]: slots };
    });
    setEditSlot({ day: '', idx: null });
    setSlotDraft({ start: '', end: '' });
  }
  function handleDeleteSlot(day: string, idx: number) {
    setAvailability(avail => {
      const slots = [...avail[day]];
      slots.splice(idx, 1);
      return { ...avail, [day]: slots };
    });
  }
  function handleCopySlots(fromDay: string, toDay: string) {
    setAvailability(avail => ({ ...avail, [toDay]: [...avail[fromDay]] }));
  }
  function handleCancelSlotEdit() {
    setEditSlot({ day: '', idx: null });
    setSlotDraft({ start: '', end: '' });
  }

  // Funktion zum Hinzufügen eines weiteren Tieres
  const addPet = () => {
    setFormStep2Owner({
      ...formStep2Owner,
      pets: [
        ...formStep2Owner.pets,
        {
          name: '',
          type: '',
          typeOther: '',
          breed: '',
          age: '',
          weight: '',
          photoUrl: '',
          description: '',
          gender: '',
          neutered: false,
        }
      ]
    });
  };

  // Funktion zum Aktualisieren der Tierinformationen
  const updatePet = (index: number, field: string, value: string | boolean) => {
    const updatedPets = [...formStep2Owner.pets];
    updatedPets[index] = { ...updatedPets[index], [field]: value };
    setFormStep2Owner({
      ...formStep2Owner,
      pets: updatedPets
    });
  };

  // Funktion zum Aktualisieren der ausgewählten Dienste
  const toggleService = (service: string) => {
    if (formStep2Owner.services.includes(service)) {
      setFormStep2Owner({
        ...formStep2Owner,
        services: formStep2Owner.services.filter(s => s !== service)
      });
    } else {
      setFormStep2Owner({
        ...formStep2Owner,
        services: [...formStep2Owner.services, service]
      });
    }
  };

  // Funktion zum Entfernen eines Tieres
  const removePet = (index: number) => {
    setFormStep2Owner({
      ...formStep2Owner,
      pets: formStep2Owner.pets.filter((_, i) => i !== index)
    });
  };

  // Handler für dynamische Sonstige Leistungen
  const handleOtherServiceChange = (idx: number, value: string) => {
    setFormStep2Owner((prev) => ({
      ...prev,
      otherServices: prev.otherServices.map((s, i) => (i === idx ? value : s)),
    }));
  };

  const handleAddOtherService = () => {
    setFormStep2Owner((prev) => ({
      ...prev,
      otherServices: [...prev.otherServices, ''],
    }));
  };

  const handleRemoveOtherService = (idx: number) => {
    setFormStep2Owner((prev) => ({
      ...prev,
      otherServices: prev.otherServices.filter((_, i) => i !== idx),
    }));
  };

  // useEffect-Hooks zum automatischen Speichern der Registrierungsdaten
  useEffect(() => {
    const dataToSave = {
      userType,
      step,
      profileStep,
      userId,
      formStep1,
      formStep2Owner,
      formStep2Caretaker,
      availability: convertAvailabilityToWeekly(availability),
    };
    saveRegistrationData(dataToSave);
  }, [userType, step, profileStep, userId, formStep1, formStep2Owner, formStep2Caretaker, availability]);

  // Funktion zum Fortfahren zum nächsten Schritt
  const nextStep = async () => {
    setError(null);
    
    if (step === 1) {
      // Validierung für Schritt 1
      if (!formStep1.firstName || !formStep1.lastName || !formStep1.email || !formStep1.password) {
        setError('Bitte fülle alle Pflichtfelder aus.');
        return;
      }
      
      if (formStep1.password.length < 8) {
        setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
        return;
      }

      if (!formStep1.termsAccepted) {
        setError('Bitte akzeptiere die Nutzungsbedingungen und Datenschutzbestimmungen.');
        return;
      }

      try {
        setLoading(true);
        // Benutzer bei Supabase registrieren
        const { data, error } = await auth.signUp(
          formStep1.email,
          formStep1.password,
          {
            options: {
              data: {
                full_name: `${formStep1.firstName} ${formStep1.lastName}`,
                first_name: formStep1.firstName,
                last_name: formStep1.lastName
              }
            }
          }
        );
        
        if (error) throw error;
        
        if (data.user) {
          // Benutzer in users-Tabelle anlegen
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: formStep1.email,
              first_name: formStep1.firstName,
              last_name: formStep1.lastName,
              user_type: userType,
              profile_completed: false
            });

          if (insertError) {
            setError("Profil konnte nicht gespeichert werden. Bitte versuche es erneut.");
            return;
          }

          // User-ID speichern für Schritt 2
          setUserId(data.user.id);
          setStep(1.5); // Zwischenschritt
        }
      } catch (err: any) {
        console.error('Fehler bei der Registrierung:', err);
        setError(err.message || 'Bei der Registrierung ist ein Fehler aufgetreten.');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!userId) {
        setError('Benutzer-ID fehlt. Bitte versuche es erneut.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // PLZ-Check für Owner und Caretaker
        const plz = userType === 'owner' ? formStep2Owner.plz : formStep2Caretaker.plz;
        const city = userType === 'owner' ? formStep2Owner.city : formStep2Caretaker.city;
        if (plz && city) {
          // Prüfe, ob PLZ+Stadt-Kombination existiert
          const { data: existingPlzCity, error: plzError } = await plzService.getByPlzAndCity(plz, city);
          if (plzError && plzError.code !== 'PGRST116') {
            throw new Error(`Fehler bei der PLZ-Prüfung: ${plzError.message}`);
          }
          if (!existingPlzCity) {
            const { error: createPlzError } = await plzService.create(plz, city);
            if (createPlzError) throw createPlzError;
          }
        }

        // Jetzt User-Profil aktualisieren
        const { error: profileError } = await userService.updateUserProfile(
          userId,
          {
            plz,
            city,
            street: userType === 'owner' ? formStep2Owner.street : formStep2Caretaker.street,
            phoneNumber: userType === 'owner' ? formStep2Owner.phoneNumber : formStep2Caretaker.phoneNumber,
            profileCompleted: true, // Jetzt als abgeschlossen markieren
            profilePhotoUrl: userType === 'owner' ? formStep2Owner.profilePhotoUrl : formStep2Caretaker.profilePhotoUrl
          }
        );
        if (profileError) throw profileError;

        // Haustiere hinzufügen
        for (const pet of userType === 'owner' ? formStep2Owner.pets : []) {
          if (pet.name && pet.type) {
            const { error: petError } = await petService.addPet(
              userId,
              {
                name: pet.name,
                type: pet.type,
                breed: pet.breed || undefined,
                age: pet.age ? parseInt(pet.age) : undefined,
                weight: pet.weight ? parseFloat(pet.weight) : undefined,
                photoUrl: pet.photoUrl || undefined,
                description: pet.description || undefined
              }
            );
            if (petError) throw petError;
          }
        }

        // Betreuungswünsche speichern
        if (userType === 'owner') {
          const { error: preferencesError } = await ownerPreferencesService.savePreferences(
            userId,
            {
              services: formStep2Owner.services,
              otherServices: formStep2Owner.otherServices.filter(s => s.trim()).join(', ') || undefined,
              vetName: formStep2Owner.vetName || undefined,
              vetAddress: formStep2Owner.vetAddress || undefined,
              vetPhone: formStep2Owner.vetPhone || undefined,
              emergencyContactName: formStep2Owner.emergencyContactName || undefined,
              emergencyContactPhone: formStep2Owner.emergencyContactPhone || undefined,
              careInstructions: formStep2Owner.careInstructions || undefined
            }
          );
          if (preferencesError) throw preferencesError;
        } else if (userType === 'caretaker') {
          // Profilbild-URL direkt verwenden
          const profilePhotoUrl = formStep2Caretaker.profilePhotoUrl;
          // Wohnungsfotos in Supabase Storage hochladen und URLs sammeln
          const homePhotoUrls: string[] = [];
          
          console.log('🔍 Starting photo upload for user:', userId);
          console.log('📸 Photos to upload:', formStep2Caretaker.homePhotos.length);
          
          for (const file of formStep2Caretaker.homePhotos) {
            if (
              typeof window !== 'undefined' &&
              typeof window.File !== 'undefined' &&
              file && file.constructor && file.constructor.name === 'File' &&
              typeof file !== 'string' && 'name' in file
            ) {
              const fileObj = file as File;
              const fileExt = fileObj.name.split('.').pop();
              const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
              
              console.log('📤 Uploading file:', fileName);
              
              try {
                // Prüfe Auth-Status vor Upload
                const { data: authUser } = await supabase.auth.getUser();
                if (!authUser?.user) {
                  throw new Error('User nicht authentifiziert für Storage-Upload');
                }
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('caretaker-home-photos')
                  .upload(fileName, fileObj, { upsert: true });
                  
                if (uploadError) {
                  console.error('❌ Upload Error Details:', {
                    message: uploadError.message,
                    error: uploadError
                  });
                  
                  // Falls RLS-Fehler, versuche ohne Folder-Struktur
                  if (uploadError.message.includes('policy') || uploadError.message.includes('RLS') || uploadError.message.includes('permission')) {
                    console.log('🔄 Retrying upload without folder structure...');
                    const simpleName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                    const { data: retryData, error: retryError } = await supabase.storage
                      .from('caretaker-home-photos')
                      .upload(simpleName, fileObj, { upsert: true });
                    
                    if (retryError) {
                      throw retryError;
                    }
                    
                    console.log('✅ Retry upload successful:', retryData);
                    const { data: retryUrlData } = supabase.storage
                      .from('caretaker-home-photos')
                      .getPublicUrl(simpleName);
                    
                    if (retryUrlData?.publicUrl) {
                      homePhotoUrls.push(retryUrlData.publicUrl);
                      console.log('📎 Retry Public URL generated:', retryUrlData.publicUrl);
                      continue; // Nächste Datei
                    }
                  }
                  
                  throw uploadError;
                }
                
                console.log('✅ Upload successful:', uploadData);
                
                const { data: urlData } = supabase.storage
                  .from('caretaker-home-photos')
                  .getPublicUrl(fileName);
                  
                if (urlData?.publicUrl) {
                  homePhotoUrls.push(urlData.publicUrl);
                  console.log('📎 Public URL generated:', urlData.publicUrl);
                }
              } catch (uploadErr: any) {
                console.error('❌ Storage upload failed:', uploadErr);
                setError(`Fehler beim Bildupload: ${uploadErr.message || 'Unbekannter Fehler'}`);
                return;
              }
            } else if (typeof file === 'string') {
              // Bereits vorhandene URL (z.B. beim Editieren)
              homePhotoUrls.push(file);
            }
          }
          
          console.log('📷 All photos uploaded, URLs:', homePhotoUrls);
          
          const { error: caretakerError } = await caretakerProfileService.saveProfile(userId, {
            services: formStep2Caretaker.services,
            animalTypes: formStep2Caretaker.animalTypes,
            prices: formStep2Caretaker.prices,
            serviceRadius: Number(formStep2Caretaker.serviceRadius),
            availability: formStep2Caretaker.availability,
            homePhotos: homePhotoUrls,
            qualifications: formStep2Caretaker.qualifications,
            experienceDescription: formStep2Caretaker.experienceDescription || '',
            shortAboutMe: formStep2Caretaker.shortAboutMe || '',
            longAboutMe: formStep2Caretaker.longAboutMe || '',
            languages: formStep2Caretaker.languages,
            isCommercial: formStep2Caretaker.isCommercial,
            companyName: formStep2Caretaker.companyName || undefined,
            taxNumber: formStep2Caretaker.taxNumber || undefined,
            vatId: formStep2Caretaker.vatId || undefined,
          });
          if (caretakerError) throw caretakerError;
        }

        // Nach Dashboard navigieren
        const { data: freshProfile, error: freshProfileError1 } = await userService.getUserProfile(userId);
        if (!freshProfileError1 && freshProfile) {
          updateProfileState(freshProfile);
        }
        
        // Registrierung erfolgreich abgeschlossen - Cache-Daten löschen
        clearRegistrationData();
        
        navigate(userType === 'owner' ? '/dashboard-owner' : '/dashboard-caretaker');
      } catch (err: any) {
        console.error('Fehler beim Vervollständigen des Profils:', err);
        setError(err.message || 'Beim Speichern deiner Daten ist ein Fehler aufgetreten.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Funktion zum Zurückgehen zum vorherigen Schritt
  const prevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  // Funktion zum Abschließen der Registrierung (nach Schritt 2)
  const completeRegistration = async () => {
    setError(null);
    
    if (step === 1) {
      // Validierung für Schritt 1
      if (!formStep1.firstName || !formStep1.lastName || !formStep1.email || !formStep1.password) {
        setError('Bitte fülle alle Pflichtfelder aus.');
        return;
      }
      
      if (formStep1.password.length < 8) {
        setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
        return;
      }

      if (!formStep1.termsAccepted) {
        setError('Bitte akzeptiere die Nutzungsbedingungen und Datenschutzbestimmungen.');
        return;
      }

      try {
        setLoading(true);
        // Benutzer bei Supabase registrieren
        const { data, error } = await auth.signUp(
          formStep1.email,
          formStep1.password,
          {
            options: {
              data: {
                full_name: `${formStep1.firstName} ${formStep1.lastName}`,
                first_name: formStep1.firstName,
                last_name: formStep1.lastName
              }
            }
          }
        );
        
        if (error) throw error;
        
        if (data.user) {
          // Benutzer in users-Tabelle anlegen
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: formStep1.email,
              first_name: formStep1.firstName,
              last_name: formStep1.lastName,
              user_type: userType,
              profile_completed: false
            });

          if (insertError) {
            setError("Profil konnte nicht gespeichert werden. Bitte versuche es erneut.");
            return;
          }

          // Trial-Subscription für neuen User erstellen
          try {
            console.log('🎯 Creating trial subscription for new registered user...');
            await SubscriptionService.createTrialSubscription(data.user.id, userType);
            console.log('✅ Trial subscription created during registration');
          } catch (subscriptionError) {
            console.error('❌ Failed to create trial subscription during registration:', subscriptionError);
            // Continue anyway - subscription creation failure should not block registration
          }

          // User-ID speichern für Schritt 2
          setUserId(data.user.id);
          // Zum nächsten Schritt wechseln
          setStep(2);
        }
      } catch (err: any) {
        console.error('Fehler bei der Registrierung:', err);
        setError(err.message || 'Bei der Registrierung ist ein Fehler aufgetreten.');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!userId) {
        setError('Benutzer-ID fehlt. Bitte versuche es erneut.');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // PLZ-Check für Owner und Caretaker
        const plz = userType === 'owner' ? formStep2Owner.plz : formStep2Caretaker.plz;
        const city = userType === 'owner' ? formStep2Owner.city : formStep2Caretaker.city;
        if (plz && city) {
          // Prüfe, ob PLZ+Stadt-Kombination existiert
          const { data: existingPlzCity, error: plzError } = await plzService.getByPlzAndCity(plz, city);
          if (plzError && plzError.code !== 'PGRST116') {
            throw new Error(`Fehler bei der PLZ-Prüfung: ${plzError.message}`);
          }
          if (!existingPlzCity) {
            const { error: createPlzError } = await plzService.create(plz, city);
            if (createPlzError) throw createPlzError;
          }
        }

        // Jetzt User-Profil aktualisieren
        const { error: profileError } = await userService.updateUserProfile(
          userId,
          {
            plz,
            city,
            street: userType === 'owner' ? formStep2Owner.street : formStep2Caretaker.street,
            phoneNumber: userType === 'owner' ? formStep2Owner.phoneNumber : formStep2Caretaker.phoneNumber,
            profileCompleted: true, // Jetzt als abgeschlossen markieren
            profilePhotoUrl: userType === 'owner' ? formStep2Owner.profilePhotoUrl : formStep2Caretaker.profilePhotoUrl
          }
        );
        if (profileError) throw profileError;

        // Haustiere hinzufügen
        for (const pet of userType === 'owner' ? formStep2Owner.pets : []) {
          if (pet.name && pet.type) {
            const { error: petError } = await petService.addPet(
              userId,
              {
                name: pet.name,
                type: pet.type === 'Andere' ? pet.typeOther : pet.type,
                breed: pet.breed || undefined,
                age: pet.age ? parseInt(pet.age) : undefined,
                weight: pet.weight ? parseFloat(pet.weight) : undefined,
                photoUrl: pet.photoUrl || undefined,
                description: pet.description || undefined,
                gender: pet.gender || undefined,
                neutered: pet.neutered || false
              }
            );
            if (petError) throw petError;
          }
        }

        // Betreuungswünsche speichern
        if (userType === 'owner') {
          const { error: preferencesError } = await ownerPreferencesService.savePreferences(
            userId,
            {
              services: formStep2Owner.services,
              otherServices: formStep2Owner.otherServices.filter(s => s.trim()).join(', ') || undefined,
              vetName: formStep2Owner.vetName || undefined,
              vetAddress: formStep2Owner.vetAddress || undefined,
              vetPhone: formStep2Owner.vetPhone || undefined,
              emergencyContactName: formStep2Owner.emergencyContactName || undefined,
              emergencyContactPhone: formStep2Owner.emergencyContactPhone || undefined,
              careInstructions: formStep2Owner.careInstructions || undefined
            }
          );
          if (preferencesError) throw preferencesError;
        } else if (userType === 'caretaker') {
          // Profilbild-URL direkt verwenden
          const profilePhotoUrl = formStep2Caretaker.profilePhotoUrl;
          // Wohnungsfotos in Supabase Storage hochladen und URLs sammeln
          const homePhotoUrls: string[] = [];
          
          console.log('🔍 Starting photo upload for user:', userId);
          console.log('📸 Photos to upload:', formStep2Caretaker.homePhotos.length);
          
          for (const file of formStep2Caretaker.homePhotos) {
            if (
              typeof window !== 'undefined' &&
              typeof window.File !== 'undefined' &&
              file && file.constructor && file.constructor.name === 'File' &&
              typeof file !== 'string' && 'name' in file
            ) {
              const fileObj = file as File;
              const fileExt = fileObj.name.split('.').pop();
              const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
              
              console.log('📤 Uploading file:', fileName);
              
              try {
                // Prüfe Auth-Status vor Upload
                const { data: authUser } = await supabase.auth.getUser();
                if (!authUser?.user) {
                  throw new Error('User nicht authentifiziert für Storage-Upload');
                }
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('caretaker-home-photos')
                  .upload(fileName, fileObj, { upsert: true });
                  
                if (uploadError) {
                  console.error('❌ Upload Error Details:', {
                    message: uploadError.message,
                    error: uploadError
                  });
                  
                  // Falls RLS-Fehler, versuche ohne Folder-Struktur
                  if (uploadError.message.includes('policy') || uploadError.message.includes('RLS') || uploadError.message.includes('permission')) {
                    console.log('🔄 Retrying upload without folder structure...');
                    const simpleName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                    const { data: retryData, error: retryError } = await supabase.storage
                      .from('caretaker-home-photos')
                      .upload(simpleName, fileObj, { upsert: true });
                    
                    if (retryError) {
                      throw retryError;
                    }
                    
                    console.log('✅ Retry upload successful:', retryData);
                    const { data: retryUrlData } = supabase.storage
                      .from('caretaker-home-photos')
                      .getPublicUrl(simpleName);
                    
                    if (retryUrlData?.publicUrl) {
                      homePhotoUrls.push(retryUrlData.publicUrl);
                      console.log('📎 Retry Public URL generated:', retryUrlData.publicUrl);
                      continue; // Nächste Datei
                    }
                  }
                  
                  throw uploadError;
                }
                
                console.log('✅ Upload successful:', uploadData);
                
                const { data: urlData } = supabase.storage
                  .from('caretaker-home-photos')
                  .getPublicUrl(fileName);
                  
                if (urlData?.publicUrl) {
                  homePhotoUrls.push(urlData.publicUrl);
                  console.log('📎 Public URL generated:', urlData.publicUrl);
                }
              } catch (uploadErr: any) {
                console.error('❌ Storage upload failed:', uploadErr);
                setError(`Fehler beim Bildupload: ${uploadErr.message || 'Unbekannter Fehler'}`);
                return;
              }
            } else if (typeof file === 'string') {
              // Bereits vorhandene URL (z.B. beim Editieren)
              homePhotoUrls.push(file);
            }
          }
          
          console.log('📷 All photos uploaded, URLs:', homePhotoUrls);
          
          const { error: caretakerError } = await caretakerProfileService.saveProfile(userId, {
            services: formStep2Caretaker.services,
            animalTypes: formStep2Caretaker.animalTypes,
            prices: formStep2Caretaker.prices,
            serviceRadius: Number(formStep2Caretaker.serviceRadius),
            availability: formStep2Caretaker.availability,
            homePhotos: homePhotoUrls,
            qualifications: formStep2Caretaker.qualifications,
            experienceDescription: formStep2Caretaker.experienceDescription || '',
            shortAboutMe: formStep2Caretaker.shortAboutMe || '',
            longAboutMe: formStep2Caretaker.longAboutMe || '',
            languages: formStep2Caretaker.languages,
            isCommercial: formStep2Caretaker.isCommercial,
            companyName: formStep2Caretaker.companyName || undefined,
            taxNumber: formStep2Caretaker.taxNumber || undefined,
            vatId: formStep2Caretaker.vatId || undefined,
          });
          if (caretakerError) throw caretakerError;
        }

        // Nach Dashboard navigieren
        const { data: freshProfile, error: freshProfileError2 } = await userService.getUserProfile(userId);
        if (!freshProfileError2 && freshProfile) {
          updateProfileState(freshProfile);
        }
        
        // Registrierung erfolgreich abgeschlossen - Cache-Daten löschen
        clearRegistrationData();
        
        navigate(userType === 'owner' ? '/dashboard-owner' : '/dashboard-caretaker');
      } catch (err: any) {
        console.error('Fehler beim Vervollständigen des Profils:', err);
        setError(err.message || 'Beim Speichern deiner Daten ist ein Fehler aufgetreten.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Funktion zum Löschen eines Wohnungsfotos aus Storage und State
  async function handleDeleteHomePhoto(url: string, idx: number) {
    // Extrahiere den Pfad aus der URL
    const match = url.match(/caretaker-home-photos\/([^?]+)/);
    const filePath = match ? match[1] : null;
    if (!filePath) return;
    const { error } = await supabase.storage.from('caretaker-home-photos').remove([filePath]);
    if (!error) {
      setFormStep2Caretaker(prev => ({
        ...prev,
        homePhotos: prev.homePhotos.filter((f, i) => (typeof f === 'string' ? f !== url : i !== idx))
      }));
    } else {
      setError('Fehler beim Löschen des Fotos: ' + error.message);
    }
  }

  // Hilfsfunktion zur Konvertierung für das DB-Format
  function parseWeeklyAvailability(weekly: WeeklyAvailability): AvailabilityState {
    const result: AvailabilityState = {};
    for (const day of days) {
      result[day] = (weekly[day] || []).map((str: string) => {
        const [start, end] = str.split('-');
        return { start, end };
      });
    }
    return result;
  }

  // Hilfsfunktion zur Konvertierung für das DB-Format
  function convertAvailabilityToWeekly(availability: AvailabilityState): WeeklyAvailability {
    const result: WeeklyAvailability = {};
    for (const day of days) {
      result[day] = availability[day].map(slot => `${slot.start}-${slot.end}`);
    }
    return result;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-3xl">
        {/* Headline & Beschreibung */}
        {step === 1 ? (
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center mb-6">
              <img src="/Image/Logos/tigube_logo_klein.png" alt="tigube Logo" className="h-10 w-auto mr-2" />
            </Link>
            <h1 className="text-3xl font-bold mb-4">
              {userType === 'owner' ? 'Als Tierbesitzer registrieren' : 'Als Betreuer registrieren'}
            </h1>
            <p className="text-gray-600 max-w-lg mx-auto">
              {userType === 'owner' 
                ? 'Erstelle ein Konto, um vertrauenswürdige Betreuer für deine Tiere zu finden.'
                : 'Erstelle ein Konto, um Betreuungsdienste anzubieten und Tierbesitzer zu erreichen.'}
            </p>
          </div>
        ) : step === 1.5 ? (
          <div className="flex justify-center">
            <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-xl text-center">
              <h2 className="text-2xl font-bold mb-2">Hallo, {formStep1.firstName} <span role='img' aria-label='Winkende Hand'>👋</span></h2>
              <h3 className="text-xl font-semibold mb-4">Willkommen an Bord!</h3>
              <p className="text-lg text-gray-700 mb-4">
                {userType === 'owner'
                  ? <><span>Du hast dich erfolgreich angemeldet.<br/>Im nächsten Schritt kannst du dein Profil vervollständigen.</span><br/><span className='text-primary-600'>Keine Sorge, dein Haustier wird dich nicht verpetzen, wenn du es später machst!</span></>
                  : <><span>Du hast dich erfolgreich angemeldet.<br/>Im nächsten Schritt kannst du dein Betreuer-Profil vervollständigen.</span><br/><span className='text-primary-600'>Je mehr Infos, desto mehr Anfragen bekommst du!</span></>
                }
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <Button variant="primary" onClick={() => setStep(2)}>
                  Jetzt vervollständigen
                </Button>
                <Button variant="ghost" onClick={() => navigate(userType === 'owner' ? '/dashboard-owner' : '/dashboard-caretaker')}>
                  Mach ich später
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Profil vervollständigen</h2>
            {/* Step-spezifischer Titel */}
            {step === 2 && (
              <>
                {profileStep === 1 && <p className="text-gray-600">Kontaktinformationen</p>}
                {profileStep === 2 && <p className="text-gray-600">{userType === 'owner' ? 'Tierdetails' : 'Services & Preise'}</p>}
                {profileStep === 3 && <p className="text-gray-600">{userType === 'owner' ? 'Betreuungswünsche' : 'Erfahrung & Qualifikationen'}</p>}
                {profileStep === 4 && <p className="text-gray-600">Fotos & Persönliches Profil</p>}
              </>
            )}
          </div>
        )}
        
        {/* User Type Toggle */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
            <div className="flex">
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg text-center transition-colors ${
                  userType === 'owner'
                    ? 'bg-primary-500 text-white'
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setUserType('owner')}
              >
                Tierbesitzer
              </button>
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg text-center transition-colors ${
                  userType === 'caretaker'
                    ? 'bg-primary-500 text-white'
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setUserType('caretaker')}
                // disabled={true} // Optional: Entfernen, wenn Betreuer-Registrierung aktiv
              >
                Betreuer
              </button>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Form Steps */}
        {step !== 1.5 && (
          <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8 animate-fade-in">
            {step === 1 ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-6">Konto erstellen</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Vorname
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="input"
                      placeholder="Dein Vorname"
                      value={formStep1.firstName}
                      onChange={(e) => setFormStep1({...formStep1, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nachname
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="input"
                      placeholder="Dein Nachname"
                      value={formStep1.lastName}
                      onChange={(e) => setFormStep1({...formStep1, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="input"
                    placeholder="deine.email@beispiel.de"
                    value={formStep1.email}
                    onChange={(e) => setFormStep1({...formStep1, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="input pr-10"
                      placeholder="Sicheres Passwort erstellen"
                      value={formStep1.password}
                      onChange={(e) => setFormStep1({...formStep1, password: e.target.value})}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Mindestens 8 Zeichen, eine Zahl und ein Sonderzeichen
                  </p>
                </div>
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                    checked={formStep1.termsAccepted}
                    onChange={(e) => setFormStep1({...formStep1, termsAccepted: e.target.checked})}
                    required
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
                    Ich akzeptiere die{' '}
                    <Link to="/agb" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                      Nutzungsbedingungen
                      <ExternalLink className="h-3 w-3" />
                    </Link>{' '}
                    und{' '}
                    <Link to="/datenschutz" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                      Datenschutzbestimmungen
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </label>
                </div>
                <div className="flex justify-end mt-8">
                  <Button
                    variant="primary"
                    onClick={nextStep}
                    isLoading={loading}
                    disabled={loading}
                  >
                    Jetzt Registrieren
                  </Button>
                </div>
              </div>
            ) : step === 1.5 ? null : (
              <div className="space-y-6">
                {/* Multistep für Schritt 2 */}
                {profileStep === 1 && (
                  <>
                    {userType === 'owner' && (
                      <div className="p-4 bg-gray-50 rounded-lg mb-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1">
                            <label htmlFor="plz" className="block text-sm font-medium text-gray-700 mb-1">
                              PLZ
                            </label>
                            <input
                              type="text"
                              id="plz"
                              className="input"
                              placeholder="Deine Postleitzahl"
                              value={formStep2Owner.plz}
                              pattern="[0-9]{5}"
                              maxLength={5}
                              onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                                setFormStep2Owner({ ...formStep2Owner, plz: val });
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                              Ort
                            </label>
                            <input
                              type="text"
                              id="city"
                              className="input"
                              placeholder="Deine Stadt"
                              value={formStep2Owner.city}
                              onChange={(e) => setFormStep2Owner({...formStep2Owner, city: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                            Straße & Hausnummer
                          </label>
                          <input
                            type="text"
                            id="street"
                            className="input"
                            placeholder="Deine Straße und Hausnummer"
                            value={formStep2Owner.street}
                            onChange={(e) => setFormStep2Owner({...formStep2Owner, street: e.target.value})}
                          />
                        </div>
                        <div className="mt-4">
                          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Telefonnummer
                          </label>
                          <input
                            type="tel"
                            id="phoneNumber"
                            className="input"
                            placeholder="Deine Telefonnummer"
                            value={formStep2Owner.phoneNumber}
                            pattern="[0-9+() ]*"
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9+() ]/g, '');
                              setFormStep2Owner({ ...formStep2Owner, phoneNumber: val });
                            }}
                          />
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Profilbild</label>
                          <PhotoDropzone
                            index={-1}
                            photoUrl={formStep2Owner.profilePhotoUrl}
                            onUpload={async (file) => {
                              setProfilePhotoUploading(true);
                              setProfilePhotoError(null);
                              try {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                                const { data, error } = await supabase.storage.from('profile-photos').upload(fileName, file, { upsert: true });
                                if (error) throw error;
                                const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
                                setFormStep2Owner((prev) => ({ ...prev, profilePhotoUrl: urlData.publicUrl }));
                              } catch (err: any) {
                                setProfilePhotoError(err.message || 'Upload fehlgeschlagen');
                              } finally {
                                setProfilePhotoUploading(false);
                              }
                            }}
                            uploading={profilePhotoUploading}
                            error={profilePhotoError}
                          />
                        </div>
                      </div>
                    )}
                    {userType === 'caretaker' && (
                      <div className="p-4 bg-gray-50 rounded-lg mb-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-1">
                            <label htmlFor="plz" className="block text-sm font-medium text-gray-700 mb-1">
                              PLZ
                            </label>
                            <input
                              type="text"
                              id="plz"
                              className="input"
                              placeholder="Deine Postleitzahl"
                              value={formStep2Caretaker.plz}
                              pattern="[0-9]{5}"
                              maxLength={5}
                              onChange={e => {
                                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                                setFormStep2Caretaker({ ...formStep2Caretaker, plz: val });
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                              Ort
                            </label>
                            <input
                              type="text"
                              id="city"
                              className="input"
                              placeholder="Deine Stadt"
                              value={formStep2Caretaker.city}
                              onChange={(e) => setFormStep2Caretaker({ ...formStep2Caretaker, city: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                            Straße & Hausnummer
                          </label>
                          <input
                            type="text"
                            id="street"
                            className="input"
                            placeholder="Deine Straße und Hausnummer"
                            value={formStep2Caretaker.street}
                            onChange={(e) => setFormStep2Caretaker({ ...formStep2Caretaker, street: e.target.value })}
                          />
                        </div>
                        <div className="mt-4">
                          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Telefonnummer
                          </label>
                          <input
                            type="tel"
                            id="phoneNumber"
                            className="input"
                            placeholder="Deine Telefonnummer"
                            value={formStep2Caretaker.phoneNumber}
                            pattern="[0-9+() ]*"
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9+() ]/g, '');
                              setFormStep2Caretaker({ ...formStep2Caretaker, phoneNumber: val });
                            }}
                          />
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Profilbild</label>
                          <PhotoDropzone
                            index={-1}
                            photoUrl={formStep2Caretaker.profilePhotoUrl}
                            onUpload={async (file) => {
                              setProfilePhotoUploading(true);
                              setProfilePhotoError(null);
                              try {
                                const fileExt = file.name.split('.').pop();
                                const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                                const { data, error } = await supabase.storage
                                  .from('profile-photos')
                                  .upload(fileName, file, { upsert: true });
                                if (error) throw error;
                                const { data: urlData } = supabase.storage
                                  .from('profile-photos')
                                  .getPublicUrl(fileName);
                                if (urlData?.publicUrl) {
                                  setFormStep2Caretaker((prev) => ({ ...prev, profilePhotoUrl: urlData.publicUrl }));
                                }
                              } catch (err: any) {
                                setProfilePhotoError(err.message || 'Upload fehlgeschlagen');
                              } finally {
                                setProfilePhotoUploading(false);
                              }
                            }}
                            uploading={profilePhotoUploading}
                            error={profilePhotoError}
                          />
                        </div>
                        <div className="mt-6">
                          <CommercialInfoInput
                            isCommercial={formStep2Caretaker.isCommercial}
                            companyName={formStep2Caretaker.companyName}
                            taxNumber={formStep2Caretaker.taxNumber}
                            vatId={formStep2Caretaker.vatId}
                            onIsCommercialChange={(value) => 
                              setFormStep2Caretaker({...formStep2Caretaker, isCommercial: value, taxNumber: value ? formStep2Caretaker.taxNumber : '', companyName: value ? formStep2Caretaker.companyName : '', vatId: value ? formStep2Caretaker.vatId : ''})
                            }
                            onCompanyNameChange={(value) => 
                              setFormStep2Caretaker({...formStep2Caretaker, companyName: value})
                            }
                            onTaxNumberChange={(value) => 
                              setFormStep2Caretaker({...formStep2Caretaker, taxNumber: value})
                            }
                            onVatIdChange={(value) => 
                              setFormStep2Caretaker({...formStep2Caretaker, vatId: value})
                            }
                            errors={{
                              taxNumber: formStep2Caretaker.isCommercial && !formStep2Caretaker.taxNumber.trim() ? 'Steuernummer ist bei gewerblichen Betreuern erforderlich' : undefined
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
                {profileStep === 2 && (
                  <>
                    {userType === 'owner' && (
                      <>
                        {formStep2Owner.pets.map((pet, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg mb-6 relative">
                            {/* Trash Icon nur für weitere Tiere (ab index > 0) */}
                            {index > 0 && (
                              <button
                                type="button"
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                                onClick={() => removePet(index)}
                                aria-label="Tier entfernen"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                            <div>
                              <label htmlFor={`petName-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                Name des Tieres
                              </label>
                              <input
                                type="text"
                                id={`petName-${index}`}
                                className="input"
                                placeholder="Name deines Tieres"
                                value={pet.name}
                                onChange={(e) => updatePet(index, 'name', e.target.value)}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                              <div>
                                <label htmlFor={`petType-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                  Tierart
                                </label>
                                <select 
                                  id={`petType-${index}`} 
                                  className="input"
                                  value={pet.type}
                                  onChange={(e) => updatePet(index, 'type', e.target.value)}
                                >
                                  <option value="">Tierart auswählen</option>
                                  <option value="Hund">Hund</option>
                                  <option value="Katze">Katze</option>
                                  <option value="Vogel">Vogel</option>
                                  <option value="Kaninchen">Kaninchen</option>
                                  <option value="Andere">Andere</option>
                                </select>
                                {pet.type === 'Andere' && (
                                  <input
                                    type="text"
                                    className="input mt-2"
                                    placeholder="Bitte Tierart angeben"
                                    value={pet.typeOther || ''}
                                    onChange={e => updatePet(index, 'typeOther', e.target.value)}
                                  />
                                )}
                              </div>
                              <div>
                                <label htmlFor={`petBreed-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                  Rasse/Art
                                </label>
                                <input
                                  type="text"
                                  id={`petBreed-${index}`}
                                  className="input"
                                  placeholder="Rasse des Tieres"
                                  value={pet.breed}
                                  onChange={(e) => updatePet(index, 'breed', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                              <div>
                                <label htmlFor={`petAge-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                  Alter
                                </label>
                                <input
                                  type="number"
                                  id={`petAge-${index}`}
                                  className="input"
                                  placeholder="Jahre"
                                  min="0"
                                  value={pet.age}
                                  onChange={(e) => updatePet(index, 'age', e.target.value)}
                                />
                              </div>
                              <div>
                                <label htmlFor={`petWeight-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                  Gewicht (kg)
                                </label>
                                <input
                                  type="number"
                                  id={`petWeight-${index}`}
                                  className="input"
                                  placeholder="Gewicht in kg"
                                  min="0"
                                  step="0.1"
                                  value={pet.weight}
                                  onChange={(e) => updatePet(index, 'weight', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <span className="block text-sm font-medium text-gray-700 mb-1">
                                Tierfoto
                              </span>
                              <PhotoDropzone
                                index={index}
                                photoUrl={pet.photoUrl}
                                onUpload={async (file) => {
                                  setPetPhotoUploading((prev) => ({ ...prev, [index]: true }));
                                  setPetPhotoError((prev) => ({ ...prev, [index]: null }));
                                  try {
                                    const fileExt = file.name.split('.').pop();
                                    const filePath = `pet-${index}-${Date.now()}.${fileExt}`;
                                    const { data, error } = await supabase.storage.from('pet-photos').upload(filePath, file, { upsert: true });
                                    if (error) throw error;
                                    const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(filePath);
                                    updatePet(index, 'photoUrl', urlData.publicUrl);
                                  } catch (err: any) {
                                    setPetPhotoError((prev) => ({ ...prev, [index]: err.message || 'Upload fehlgeschlagen' }));
                                  } finally {
                                    setPetPhotoUploading((prev) => ({ ...prev, [index]: false }));
                                  }
                                }}
                                uploading={!!petPhotoUploading[index]}
                                error={petPhotoError[index]}
                              />
                            </div>
                            <div className="mt-4">
                              <label htmlFor={`petDescription-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                Über dein Tier
                              </label>
                              <textarea
                                id={`petDescription-${index}`}
                                rows={4}
                                className="input"
                                placeholder="Beschreibe das Wesen, Vorlieben, Abneigungen und besondere Bedürfnisse deines Tieres"
                                value={pet.description}
                                onChange={(e) => updatePet(index, 'description', e.target.value)}
                              ></textarea>
                            </div>
                            {pet.type === 'Hund' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                  <label htmlFor={`petGender-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Geschlecht
                                  </label>
                                  <select
                                    id={`petGender-${index}`}
                                    className="input"
                                    value={pet.gender || ''}
                                    onChange={e => updatePet(index, 'gender', e.target.value)}
                                  >
                                    <option value="">Geschlecht wählen</option>
                                    <option value="Rüde">Rüde</option>
                                    <option value="Hündin">Hündin</option>
                                  </select>
                                </div>
                                <div className="flex items-center mt-6 md:mt-0">
                                  <input
                                    type="checkbox"
                                    id={`petNeutered-${index}`}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    checked={!!pet.neutered}
                                    onChange={e => updatePet(index, 'neutered', e.target.checked)}
                                  />
                                  <label htmlFor={`petNeutered-${index}`} className="ml-2 block text-sm text-gray-700">
                                    Kastriert/Sterilisiert
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="pt-4">
                          <Button
                            variant="ghost"
                            className="text-primary-600"
                            onClick={addPet}
                            leftIcon={<Paw className="h-4 w-4" />}
                          >
                            Weiteres Tier hinzufügen
                          </Button>
                        </div>
                      </>
                    )}
                    {userType === 'caretaker' && (
                      <div className="p-4 bg-gray-50 rounded-lg mb-6 space-y-8">
                        {/* Leistungen mit Badge-System */}
                        <ServiceSelector
                          title="Deine Leistungen"
                          description="Welche Leistungen bietest du an?"
                          predefinedServices={[
                            "Gassi-Service",
                            "Haustierbetreuung", 
                            "Übernachtung",
                            "Kurzbesuche",
                            "Haussitting",
                            "Hundetagesbetreuung"
                          ]}
                          selectedServices={formStep2Caretaker.services}
                          onServicesChange={(services) => 
                            setFormStep2Caretaker(prev => ({ ...prev, services }))
                          }
                          placeholder="Z.B. Medikamentengabe, Tierphysiotherapie..."
                        />
                        {/* Tierarten mit Badge-System */}
                        <ServiceSelector
                          title="Welche Tiere betreust du?"
                          description="Wähle die Tierarten aus, die du gerne betreust"
                          predefinedServices={[
                            "Hunde",
                            "Katzen", 
                            "Vögel",
                            "Kaninchen",
                            "Fische",
                            "Kleintiere"
                          ]}
                          selectedServices={formStep2Caretaker.animalTypes}
                          onServicesChange={(animalTypes) => 
                            setFormStep2Caretaker(prev => ({ ...prev, animalTypes }))
                          }
                          placeholder="Z.B. Reptilien, Hamster, Meerschweinchen..."
                        />
                        {/* Preise */}
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Lege deine Preise fest</h3>
                          <div className="space-y-3">
                            {Object.entries(formStep2Caretaker.prices).map(([service, value]) => (
                              <div key={service} className="flex items-center gap-4">
                                <label className="w-56 text-gray-700">{service} {service === 'Gassi-Service' ? '(pro 30 Min)' : service === 'Haustierbetreuung' ? '(pro Besuch)' : '(pro Nacht)'}</label>
                                <input type="number" min="0" className="input w-32" placeholder="€" value={value} onChange={e => setFormStep2Caretaker(prev => ({ ...prev, prices: { ...prev.prices, [service]: e.target.value } }))} />
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Einsatzgebiet mit Slider */}
                        <RangeSlider
                          label="Einsatzgebiet"
                          value={formStep2Caretaker.serviceRadius}
                          onChange={(value) => setFormStep2Caretaker(prev => ({ ...prev, serviceRadius: value }))}
                          min={0}
                          max={200}
                          step={5}
                          unit="km"
                          description="Wie weit sind Sie bereit zu fahren?"
                        />
                        {/* Verfügbarkeit mit verbessertem System */}
                        <AvailabilityScheduler
                          availability={availability}
                          onAvailabilityChange={(newAvailability) => {
                            setAvailability(newAvailability);
                            setFormStep2Caretaker(prev => ({ 
                              ...prev, 
                              availability: convertAvailabilityToWeekly(newAvailability) 
                            }));
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
                {profileStep === 3 && userType === 'owner' && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-6">
                    <h2 className="text-xl font-bold mb-6">Betreuungswünsche</h2>
                    {/* Services */}
                    <div className="mb-4">
                      <label className="block font-semibold mb-2">Gewünschte Leistungen</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {["Gassi-Service", "Haustierbetreuung", "Übernachtung", "Kurzbesuche", "Haussitting", "Hundetagesbetreuung"].map(service => (
                          <label key={service} className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
                            <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" checked={formStep2Owner.services.includes(service)} onChange={() => toggleService(service)} />
                            <span className="ml-3 text-gray-700">{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {/* Sonstige Leistungen */}
                    <div className="mb-4">
                      <label className="block font-semibold mb-2">Weitere Wünsche</label>
                      {/* Badges */}
                      {formStep2Owner.otherServices.filter(wish => wish.trim()).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formStep2Owner.otherServices.filter(wish => wish.trim()).map((wish, idx) => (
                            <Badge
                              key={idx}
                              variant="primary"
                              removable
                              onRemove={() => handleRemoveOtherService(formStep2Owner.otherServices.indexOf(wish))}
                            >
                              {wish}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {/* Input für neuen Wunsch */}
                      <div className="flex gap-2 mb-1 items-center">
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder="Sonstige Leistung..."
                          value={otherServiceInput}
                          onChange={e => setOtherServiceInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && otherServiceInput.trim()) {
                              setFormStep2Owner(prev => ({ ...prev, otherServices: [...prev.otherServices, otherServiceInput.trim()] }));
                              setOtherServiceInput('');
                            }
                          }}
                        />
                        {otherServiceInput.trim() && (
                          <button
                            type="button"
                            className="p-2 rounded hover:bg-green-100 text-green-600"
                            onClick={() => {
                              setFormStep2Owner(prev => ({ ...prev, otherServices: [...prev.otherServices, otherServiceInput.trim()] }));
                              setOtherServiceInput('');
                            }}
                            title="Hinzufügen"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Tierarztinformationen */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-base mb-2 mt-4">Tierarztinformationen</h3>
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="Name der Tierarztpraxis"
                          value={formStep2Owner.vetName}
                          onChange={e => setFormStep2Owner(prev => ({ ...prev, vetName: e.target.value }))}
                        />
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="Adresse der Tierarztpraxis"
                          value={formStep2Owner.vetAddress}
                          onChange={e => setFormStep2Owner(prev => ({ ...prev, vetAddress: e.target.value }))}
                        />
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="Telefonnummer der Tierarztpraxis"
                          value={formStep2Owner.vetPhone}
                          onChange={e => setFormStep2Owner(prev => ({ ...prev, vetPhone: e.target.value }))}
                        />
                      </div>
                    </div>
                    {/* Notfallkontakt */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-base mb-2 mt-4">Notfallkontakt</h3>
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="Name des Notfallkontakts"
                          value={formStep2Owner.emergencyContactName}
                          onChange={e => setFormStep2Owner(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                        />
                        <input
                          type="text"
                          className="input w-full"
                          placeholder="Telefonnummer des Notfallkontakts"
                          value={formStep2Owner.emergencyContactPhone}
                          onChange={e => setFormStep2Owner(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                        />
                      </div>
                    </div>
                    {/* Pflegehinweise */}
                    <div className="mb-4">
                      <label className="block font-semibold mb-2">Pflegehinweise</label>
                      <textarea className="input w-full min-h-[80px]" value={formStep2Owner.careInstructions} onChange={e => setFormStep2Owner(prev => ({ ...prev, careInstructions: e.target.value }))} placeholder="Gibt es Besonderheiten, Allergien, Medikamente oder Wünsche?" />
                    </div>
                  </div>
                )}
                {profileStep === 3 && userType === 'caretaker' && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-6 space-y-6">
                    <h2 className="text-xl font-bold mb-6">Deine Erfahrung & Qualifikationen</h2>
                    
                    {/* Qualifikationen */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Qualifikationen & Zertifikate</h4>
                        <p className="text-xs text-gray-500 mb-4">
                          Wähle deine Qualifikationen aus oder füge eigene hinzu
                        </p>
                        
                        {/* Vordefinierte Qualifikationen zum Abhaken */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          {[
                            "Tierpfleger-Ausbildung",
                            "Hundetrainer-Zertifikat", 
                            "Erste-Hilfe für Tiere",
                            "Veterinärassistent/in",
                            "Hundefriseur-Ausbildung",
                            "Tierpsychologie-Kurs"
                          ].map(qualification => (
                            <label 
                              key={qualification} 
                              className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer transition-colors"
                            >
                              <input 
                                type="checkbox" 
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" 
                                checked={formStep2Caretaker.qualifications.includes(qualification)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormStep2Caretaker(prev => ({
                                      ...prev,
                                      qualifications: [...prev.qualifications, qualification]
                                    }));
                                  } else {
                                    setFormStep2Caretaker(prev => ({
                                      ...prev,
                                      qualifications: prev.qualifications.filter(q => q !== qualification)
                                    }));
                                  }
                                }}
                              />
                              <span className="ml-3 text-gray-700 text-sm">{qualification}</span>
                            </label>
                          ))}
                        </div>
                        
                        {/* Qualifikationen Badges */}
                        {formStep2Caretaker.qualifications.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Ausgewählte Qualifikationen:</h5>
                            <div className="flex flex-wrap gap-2">
                              {formStep2Caretaker.qualifications.map((qual, idx) => (
                                <span key={idx} className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                  {qual}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormStep2Caretaker(prev => ({
                                        ...prev,
                                        qualifications: prev.qualifications.filter((_, i) => i !== idx)
                                      }));
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Input für zusätzliche Qualifikationen */}
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-2">Weitere Qualifikationen hinzufügen:</h5>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="input flex-1"
                              placeholder="Z.B. Katzenverhaltensberatung, Aquaristik-Zertifikat..."
                              value={formStep2Caretaker.newQualification || ''}
                              onChange={e => setFormStep2Caretaker(prev => ({ ...prev, newQualification: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && formStep2Caretaker.newQualification?.trim()) {
                                  setFormStep2Caretaker(prev => ({
                                    ...prev,
                                    qualifications: [...prev.qualifications, prev.newQualification!.trim()],
                                    newQualification: ''
                                  }));
                                }
                              }}
                            />
                            {formStep2Caretaker.newQualification?.trim() && (
                              <button
                                type="button"
                                className="p-2 rounded hover:bg-green-100 text-green-600"
                                onClick={() => {
                                  setFormStep2Caretaker(prev => ({
                                    ...prev,
                                    qualifications: [...prev.qualifications, prev.newQualification!.trim()],
                                    newQualification: ''
                                  }));
                                }}
                                title="Hinzufügen"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sprachen */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Sprachen
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        In welchen Sprachen kannst du dich mit Tierbesitzern verständigen?
                      </p>
                      <LanguageSelector
                        selectedLanguages={formStep2Caretaker.languages}
                        onChange={(languages) => setFormStep2Caretaker(prev => ({ ...prev, languages }))}
                        placeholder="Sprachen auswählen..."
                        className="w-full"
                      />
                    </div>

                    {/* Erfahrungsbeschreibung */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Deine Erfahrung mit Tieren
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        Erzähle von deiner bisherigen Erfahrung: Hattest du schon mal eigene Tiere? Hast du schon mal Tiere betreut?
                      </p>
                      <textarea
                        className="input w-full"
                        rows={4}
                        placeholder="Beschreibe deine Erfahrung mit Tieren. Zum Beispiel: Welche Tiere hattest du bereits? Wie lange betreust du schon Tiere? Was ist dir bei der Betreuung besonders wichtig?"
                        value={formStep2Caretaker.experienceDescription || ''}
                        onChange={e => setFormStep2Caretaker(prev => ({ ...prev, experienceDescription: e.target.value }))}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {(formStep2Caretaker.experienceDescription || '').length} Zeichen
                      </div>
                    </div>
                  </div>
                )}
                {profileStep === 4 && userType === 'caretaker' && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-6 space-y-8">
                    <h2 className="text-xl font-bold mb-6">Fotos & Persönliches Profil</h2>
                    
                    {/* Fotos von der Betreuungsumgebung */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Fotos deiner Betreuungsumgebung</h4>
                      <p className="text-xs text-gray-500 mb-4">
                        Zeige Tierbesitzern, wo ihre Lieblinge betreut werden. Lade Fotos von deinem Zuhause, Garten oder anderen Betreuungsorten hoch.
                      </p>
                      <PhotoGalleryUpload
                        photos={formStep2Caretaker.homePhotos}
                        onPhotosChange={(photos) => setFormStep2Caretaker(prev => ({ ...prev, homePhotos: photos }))}
                        maxPhotos={10}
                      />
                    </div>

                    {/* Kurzer "Über mich"-Text */}
                    <AboutMeEditor
                      title="Kurze Vorstellung"
                      value={formStep2Caretaker.shortAboutMe || ''}
                      onChange={(value) => setFormStep2Caretaker(prev => ({ ...prev, shortAboutMe: value }))}
                      placeholder="Beschreibe dich in wenigen Worten. Was macht dich zu einem besonderen Tierbetreuer?"
                      maxLength={140}
                      description="Diese kurze Beschreibung erscheint in den Suchergebnissen"
                      required={true}
                    />

                    {/* Langer "Über mich"-Text */}
                    <AboutMeEditor
                      title="Ausführliche Beschreibung"
                      value={formStep2Caretaker.longAboutMe || ''}
                      onChange={(value) => setFormStep2Caretaker(prev => ({ ...prev, longAboutMe: value }))}
                      placeholder="Erzähle deine Geschichte! Warum liebst du Tiere? Was ist dir bei der Betreuung wichtig? Teile persönliche Erfahrungen und schaffe Vertrauen bei Tierbesitzern."
                      minLength={500}
                      description="Diese ausführliche Beschreibung hilft Tierbesitzern, dich besser kennenzulernen"
                      required={true}
                    />
                  </div>
                )}
                {/* Multistep-Navigation */}
                <div className="flex justify-between items-center mt-8">
                  <div>
                    {profileStep > 1 && (
                      <Button
                        className="bg-white text-primary-600 border border-primary-500 hover:bg-primary-50"
                        onClick={() => setProfileStep(profileStep - 1)}
                        disabled={loading}
                      >
                        Zurück
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Anpassung: Für Besitzer 3 Schritte, für Caretaker 4 Schritte */}
                    {((userType === 'owner' && profileStep === 3) || (userType === 'caretaker' && profileStep === 4)) ? (
                      <Button onClick={completeRegistration} isLoading={loading} disabled={loading}>
                        Speichern
                      </Button>
                    ) : (
                      <Button onClick={() => {
                        // Validierung für Caretaker Schritt 1 (Commercial Info)
                        if (userType === 'caretaker' && profileStep === 1) {
                          if (formStep2Caretaker.isCommercial && !formStep2Caretaker.taxNumber.trim()) {
                            setError('Bitte geben Sie Ihre Steuernummer an, wenn Sie als gewerblicher Betreuer tätig sind.');
                            return;
                          }
                        }
                        setError(null);
                        setProfileStep(profileStep + 1);
                      }} disabled={loading}>
                        Weiter
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Login Link */}
        {step === 1 && (
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Bereits registriert?{' '}
              <Link to="/anmelden" className="text-primary-600 hover:text-primary-700 font-medium">
                Jetzt anmelden
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoDropzone({ index, photoUrl, onUpload, uploading, error }: {
  index: number;
  photoUrl?: string;
  onUpload: (file: File) => Promise<void>;
  uploading?: boolean;
  error?: string | null;
}) {
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      onUpload(acceptedFiles[0]);
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });
  return (
    <div {...getRootProps()} className={`mt-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white'}` + (uploading ? ' opacity-50 pointer-events-none' : '')}>
      <input {...getInputProps()} />
      {photoUrl ? (
        <img src={photoUrl} alt="Tierfoto" className="h-24 w-24 object-cover rounded-full mb-2" />
      ) : (
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
      )}
      <p className="text-sm text-gray-600 mb-1">{isDragActive ? 'Datei hier ablegen ...' : 'Datei hierher ziehen oder klicken, um hochzuladen'}</p>
      <p className="text-xs text-gray-500">PNG, JPG, GIF bis 10MB</p>
      {uploading && <p className="text-xs text-primary-600 mt-2">Wird hochgeladen ...</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

export default RegisterPage;