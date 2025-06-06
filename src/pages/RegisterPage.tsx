import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { PawPrint as Paw, ChevronLeft, ChevronRight, Upload, Check, AlertCircle, Trash2, Eye, EyeOff, Edit, CopyPlus, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import { auth, supabase } from '../lib/supabase/client';
import { userService, petService, ownerPreferencesService, caretakerProfileService } from '../lib/supabase/db';
import { useDropzone } from 'react-dropzone';
import { plzService } from '../lib/supabase/db';

function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialType = searchParams.get('type') || 'owner';
  
  const [userType, setUserType] = useState<'owner' | 'caretaker'>(initialType === 'caretaker' ? 'caretaker' : 'owner');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Formular-Daten für Schritt 1 (Grundlegende Kontoinformationen)
  const [formStep1, setFormStep1] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    termsAccepted: false
  });

  // Formular-Daten für Schritt 2 (Tierbesitzer)
  const [formStep2Owner, setFormStep2Owner] = useState({
    plz: '',
    city: '',
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
      description: ''
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
    phoneNumber: string;
    profilePhotoUrl: string;
    services: string[];
    animalTypes: string[];
    prices: {
      'Gassi-Service': string;
      'Haustierbetreuung': string;
      'Übernachtung': string;
    };
    serviceRadius: string;
    availability: WeeklyAvailability;
    homePhotos: File[];
    qualifications: string[];
    newQualification?: string;
    experienceDescription?: string;
  }>(
    {
      plz: '',
      city: '',
      phoneNumber: '',
      profilePhotoUrl: '',
      services: [],
      animalTypes: [],
      prices: {
        'Gassi-Service': '',
        'Haustierbetreuung': '',
        'Übernachtung': '',
      },
      serviceRadius: '',
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
    }
  );

  // Benutzer-ID nach der Registrierung
  const [userId, setUserId] = useState<string | null>(null);

  // Neue Variable für Multistep-Formular
  const [profileStep, setProfileStep] = useState(1); // 1=Kontakt, 2=Tierdetails, 3=Betreuungswünsche

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
          description: ''
        }
      ]
    });
  };

  // Funktion zum Aktualisieren der Tierinformationen
  const updatePet = (index: number, field: string, value: string) => {
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
          const { data: existingPlz, error: plzError } = await plzService.getByPlz(plz);
          if (plzError && plzError.code !== 'PGRST116') {
            // PGRST116 = Not found, das ist ok
            throw new Error(`Fehler bei der PLZ-Prüfung: ${plzError.message}`);
          }
          if (!existingPlz) {
            await plzService.create(plz, city);
          }
        }

        // Jetzt User-Profil aktualisieren
        const { error: profileError } = await userService.updateUserProfile(
          userId,
          {
            plz,
            city,
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
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('caretaker-home-photos')
                .upload(fileName, fileObj, { upsert: true });
              if (uploadError) {
                setError('Fehler beim Bildupload: ' + uploadError.message);
                return;
              }
              const { data: urlData } = supabase.storage
                .from('caretaker-home-photos')
                .getPublicUrl(fileName);
              if (urlData?.publicUrl) {
                homePhotoUrls.push(urlData.publicUrl);
              }
            } else if (typeof file === 'string') {
              // Bereits vorhandene URL (z.B. beim Editieren)
              homePhotoUrls.push(file);
            }
          }
          const { error: caretakerError } = await caretakerProfileService.saveProfile(userId, {
            services: formStep2Caretaker.services,
            animalTypes: formStep2Caretaker.animalTypes,
            prices: formStep2Caretaker.prices,
            serviceRadius: Number(formStep2Caretaker.serviceRadius),
            availability: formStep2Caretaker.availability,
            homePhotos: homePhotoUrls,
            qualifications: formStep2Caretaker.qualifications,
            experienceDescription: formStep2Caretaker.experienceDescription || '',
          });
          if (caretakerError) throw caretakerError;
        }

        // Nach Dashboard navigieren
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
          const { data: existingPlz, error: plzError } = await plzService.getByPlz(plz);
          if (plzError && plzError.code !== 'PGRST116') {
            // PGRST116 = Not found, das ist ok
            throw new Error(`Fehler bei der PLZ-Prüfung: ${plzError.message}`);
          }
          if (!existingPlz) {
            await plzService.create(plz, city);
          }
        }

        // Jetzt User-Profil aktualisieren
        const { error: profileError } = await userService.updateUserProfile(
          userId,
          {
            plz,
            city,
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
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('caretaker-home-photos')
                .upload(fileName, fileObj, { upsert: true });
              if (uploadError) {
                setError('Fehler beim Bildupload: ' + uploadError.message);
                return;
              }
              const { data: urlData } = supabase.storage
                .from('caretaker-home-photos')
                .getPublicUrl(fileName);
              if (urlData?.publicUrl) {
                homePhotoUrls.push(urlData.publicUrl);
              }
            } else if (typeof file === 'string') {
              // Bereits vorhandene URL (z.B. beim Editieren)
              homePhotoUrls.push(file);
            }
          }
          const { error: caretakerError } = await caretakerProfileService.saveProfile(userId, {
            services: formStep2Caretaker.services,
            animalTypes: formStep2Caretaker.animalTypes,
            prices: formStep2Caretaker.prices,
            serviceRadius: Number(formStep2Caretaker.serviceRadius),
            availability: formStep2Caretaker.availability,
            homePhotos: homePhotoUrls,
            qualifications: formStep2Caretaker.qualifications,
            experienceDescription: formStep2Caretaker.experienceDescription || '',
          });
          if (caretakerError) throw caretakerError;
        }

        // Nach Dashboard navigieren
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
                {profileStep === 2 && <p className="text-gray-600">Tierdetails</p>}
                {profileStep === 3 && <p className="text-gray-600">Betreuungswünsche</p>}
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
                    <Link to="/agb" className="text-primary-600 hover:text-primary-700">
                      Nutzungsbedingungen
                    </Link>{' '}
                    und{' '}
                    <Link to="/datenschutz" className="text-primary-600 hover:text-primary-700">
                      Datenschutzbestimmungen
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
                              onChange={(e) => setFormStep2Owner({...formStep2Owner, plz: e.target.value})}
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
                          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Telefonnummer
                          </label>
                          <input
                            type="tel"
                            id="phoneNumber"
                            className="input"
                            placeholder="Deine Telefonnummer"
                            value={formStep2Owner.phoneNumber}
                            onChange={(e) => setFormStep2Owner({...formStep2Owner, phoneNumber: e.target.value})}
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
                              onChange={(e) => setFormStep2Caretaker({ ...formStep2Caretaker, plz: e.target.value })}
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
                          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Telefonnummer
                          </label>
                          <input
                            type="tel"
                            id="phoneNumber"
                            className="input"
                            placeholder="Deine Telefonnummer"
                            value={formStep2Caretaker.phoneNumber}
                            onChange={(e) => setFormStep2Caretaker({ ...formStep2Caretaker, phoneNumber: e.target.value })}
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
                                  <option value="dog">Hund</option>
                                  <option value="cat">Katze</option>
                                  <option value="bird">Vogel</option>
                                  <option value="rabbit">Kaninchen</option>
                                  <option value="other">Andere</option>
                                </select>
                                {pet.type === 'other' && (
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
                        {/* Leistungen */}
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Deine Leistungen</h3>
                          <p className="text-sm text-gray-600 mb-3">Welche Leistungen bietest du an?</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {["Gassi-Service", "Haustierbetreuung", "Übernachtung", "Kurzbesuche", "Haussitting", "Hundetagesbetreuung"].map(service => (
                              <label key={service} className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
                                <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" checked={formStep2Caretaker.services.includes(service)} onChange={() => setFormStep2Caretaker(prev => ({ ...prev, services: prev.services.includes(service) ? prev.services.filter(s => s !== service) : [...prev.services, service] }))} />
                                <span className="ml-3 text-gray-700">{service}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {/* Tierarten */}
                        <div>
                          <p className="text-sm text-gray-600 mb-3">Welche Tiere betreust du?</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {["Hunde", "Katzen", "Vögel", "Kaninchen", "Fische", "Kleintiere"].map(animal => (
                              <label key={animal} className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
                                <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" checked={formStep2Caretaker.animalTypes.includes(animal)} onChange={() => setFormStep2Caretaker(prev => ({ ...prev, animalTypes: prev.animalTypes.includes(animal) ? prev.animalTypes.filter(a => a !== animal) : [...prev.animalTypes, animal] }))} />
                                <span className="ml-3 text-gray-700">{animal}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {/* Preise */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Lege deine Preise fest</h4>
                          <div className="space-y-3">
                            {Object.entries(formStep2Caretaker.prices).map(([service, value]) => (
                              <div key={service} className="flex items-center gap-4">
                                <label className="w-56 text-gray-700">{service} {service === 'Gassi-Service' ? '(pro 30 Min)' : service === 'Haustierbetreuung' ? '(pro Besuch)' : '(pro Nacht)'}</label>
                                <input type="number" min="0" className="input w-32" placeholder="€" value={value} onChange={e => setFormStep2Caretaker(prev => ({ ...prev, prices: { ...prev.prices, [service]: e.target.value } }))} />
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Einsatzgebiet */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Einsatzgebiet (Km)</label>
                          <input type="number" min="0" className="input w-32" placeholder="z.B. 5" value={formStep2Caretaker.serviceRadius} onChange={e => setFormStep2Caretaker(prev => ({ ...prev, serviceRadius: e.target.value }))} />
                        </div>
                        {/* Verfügbarkeit */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Verfügbarkeit</label>
                          <span className="text-xs text-gray-500">Hier können Sie festlegen, wann Sie regelmäßig für Termine zur Verfügung stehen.</span>
                          <div className="overflow-x-auto mt-2">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="p-2 text-left">Tag</th>
                                  <th className="p-2 text-left">Von</th>
                                  <th className="p-2 text-left">Bis</th>
                                  <th className="p-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {days.map(day => (
                                  <React.Fragment key={day}>
                                    {availability[day].length === 0 ? (
                                      <tr className="border-b">
                                        <td className="p-2 font-semibold w-24">{day}</td>
                                        <td className="p-2 text-gray-400" colSpan={2}>Nicht verfügbar</td>
                                        <td className="p-2">
                                          <button className="text-primary-600 hover:bg-primary-50 rounded p-1" onClick={() => handleAddSlot(day)} title="Zeitfenster hinzufügen">
                                            <Plus className="w-5 h-5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ) : availability[day].map((slot, idx) => (
                                      <tr key={day + idx} className="border-b">
                                        <td className="p-2 font-semibold w-24">{day}{idx > 0 && <span className="text-xs text-gray-400 ml-1">({idx + 1})</span>}</td>
                                        <td className="p-2">
                                          {editSlot.day === day && editSlot.idx === idx ? (
                                            <input type="time" className="input w-28" value={slotDraft.start} onChange={e => setSlotDraft(d => ({ ...d, start: e.target.value }))} />
                                          ) : (
                                            <span>{slot.start}</span>
                                          )}
                                        </td>
                                        <td className="p-2">
                                          {editSlot.day === day && editSlot.idx === idx ? (
                                            <input type="time" className="input w-28" value={slotDraft.end} onChange={e => setSlotDraft(d => ({ ...d, end: e.target.value }))} />
                                          ) : (
                                            <span>{slot.end}</span>
                                          )}
                                        </td>
                                        <td className="p-2 flex gap-1">
                                          {editSlot.day === day && editSlot.idx === idx ? (
                                            <>
                                              <button className="text-green-600 hover:bg-green-50 rounded p-1" onClick={handleSaveSlot} title="Speichern"><Edit className="w-4 h-4" /></button>
                                              <button className="text-gray-400 hover:bg-gray-100 rounded p-1" onClick={handleCancelSlotEdit} title="Abbrechen"><Trash2 className="w-4 h-4" /></button>
                                            </>
                                          ) : (
                                            <>
                                              <button className="text-primary-600 hover:bg-primary-50 rounded p-1" onClick={() => handleEditSlot(day, idx)} title="Bearbeiten"><Edit className="w-4 h-4" /></button>
                                              <button className="text-red-500 hover:bg-red-50 rounded p-1" onClick={() => handleDeleteSlot(day, idx)} title="Löschen"><Trash2 className="w-4 h-4" /></button>
                                              <button className="text-gray-400 hover:bg-gray-100 rounded p-1" onClick={() => handleCopySlots(day, days.find(d => d !== day) || day)} title="Kopieren"><CopyPlus className="w-4 h-4" /></button>
                                            </>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                    {editSlot.day === day && editSlot.idx === null && (
                                      <tr key={day + 'add'}>
                                        <td className="p-2 font-semibold w-24">{day}</td>
                                        <td className="p-2"><input type="time" className="input w-28" value={slotDraft.start} onChange={e => setSlotDraft(d => ({ ...d, start: e.target.value }))} /></td>
                                        <td className="p-2"><input type="time" className="input w-28" value={slotDraft.end} onChange={e => setSlotDraft(d => ({ ...d, end: e.target.value }))} /></td>
                                        <td className="p-2 flex gap-1">
                                          <button className="text-green-600 hover:bg-green-50 rounded p-1" onClick={handleSaveSlot} title="Speichern"><Edit className="w-4 h-4" /></button>
                                          <button className="text-gray-400 hover:bg-gray-100 rounded p-1" onClick={handleCancelSlotEdit} title="Abbrechen"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            type="button"
                            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                            onClick={() => {
                              setFormStep2Caretaker(prev => ({ ...prev, availability: convertAvailabilityToWeekly(availability) }));
                            }}
                          >
                            Verfügbarkeit übernehmen
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {profileStep === 3 && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-6">
                    <h2 className="text-xl font-bold mb-6">Verifizierung & Profil</h2>
                    {/* Fotos von Zuhause */}
                    <div className="mb-6">
                      <label className="block font-semibold mb-2">Fotos von deinem Zuhause (für Übernachtung/Haussitting)</label>
                      <PhotoDropzone
                        index={-2}
                        photoUrl={undefined}
                        onUpload={async (file) => {
                          setFormStep2Caretaker(prev => ({
                            ...prev,
                            homePhotos: [...(prev.homePhotos || []), file]
                          }));
                        }}
                        uploading={false}
                        error={null}
                      />
                      {/* Vorschau & Löschen */}
                      {formStep2Caretaker.homePhotos && formStep2Caretaker.homePhotos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formStep2Caretaker.homePhotos.map((file, idx) => (
                            <div key={idx} className="relative">
                              <img src={typeof file === 'string' ? file : URL.createObjectURL(file)} alt="Wohnung" className="h-20 w-20 object-cover rounded border" />
                              <button type="button" className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow" onClick={() => {
                                if (typeof file === 'string') {
                                  handleDeleteHomePhoto(file, idx);
                                } else {
                                  setFormStep2Caretaker(prev => ({ ...prev, homePhotos: prev.homePhotos.filter((f, i) => (typeof f === 'string' ? f !== file : i !== idx)) }));
                                }
                              }}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Lade mehrere Fotos deiner Wohnumgebung hoch</p>
                    </div>
                    {/* Qualifikationen */}
                    <div className="mb-6">
                      <label className="block font-semibold mb-2">Erfahrung & Qualifikationen</label>
                      <div className="space-y-2 mb-3">
                        {["Erste-Hilfe am Tier zertifiziert", "Professioneller Hundetrainer", "Tierarzterfahrung", "Tierheim-Erfahrung"].map(q => (
                          <label key={q} className="flex items-center gap-2">
                            <input type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" checked={formStep2Caretaker.qualifications?.includes(q)} onChange={() => setFormStep2Caretaker(prev => ({ ...prev, qualifications: prev.qualifications?.includes(q) ? prev.qualifications.filter((x: string) => x !== q) : [...(prev.qualifications || []), q] }))} />
                            <span>{q}</span>
                          </label>
                        ))}
                      </div>
                      {/* Eigene Qualifikation hinzufügen */}
                      <div className="flex gap-2 mb-1">
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder="Eigene Qualifikation hinzufügen..."
                          value={formStep2Caretaker.newQualification || ''}
                          onChange={e => setFormStep2Caretaker(prev => ({ ...prev, newQualification: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && formStep2Caretaker.newQualification?.trim()) {
                              setFormStep2Caretaker(prev => ({
                                ...prev,
                                qualifications: [...(prev.qualifications || []), prev.newQualification!],
                                newQualification: ''
                              }));
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (formStep2Caretaker.newQualification?.trim()) {
                              setFormStep2Caretaker(prev => ({
                                ...prev,
                                qualifications: [...(prev.qualifications || []), prev.newQualification!],
                                newQualification: ''
                              }));
                            }
                          }}
                        >
                          Hinzufügen
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">Füge weitere Qualifikationen oder Erfahrungen hinzu, die für die Tierbetreuung relevant sind</p>
                      {/* Liste eigene Qualifikationen */}
                      {formStep2Caretaker.qualifications && formStep2Caretaker.qualifications.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formStep2Caretaker.qualifications.map((q: string, idx: number) => (
                            <span key={idx} className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                              {q}
                              <button type="button" className="ml-1" onClick={() => setFormStep2Caretaker(prev => ({ ...prev, qualifications: prev.qualifications.filter((x: string, i: number) => i !== idx) }))}>
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Beschreibung der Erfahrung */}
                    <div className="mb-2">
                      <label className="block font-semibold mb-2">Beschreibe deine Erfahrung</label>
                      <textarea
                        className="input w-full min-h-[100px]"
                        placeholder="Erzähle den Tierbesitzern von deiner Erfahrung mit Tieren, inkl. beruflicher Erfahrung oder eigenen Tieren"
                        value={formStep2Caretaker.experienceDescription || ''}
                        onChange={e => setFormStep2Caretaker(prev => ({ ...prev, experienceDescription: e.target.value }))}
                      />
                    </div>
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
                    {profileStep === 3 ? (
                      <Button onClick={completeRegistration} isLoading={loading} disabled={loading}>
                        Speichern
                      </Button>
                    ) : (
                      <Button onClick={() => setProfileStep(profileStep + 1)} disabled={loading}>
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