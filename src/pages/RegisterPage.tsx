import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { PawPrint as Paw, ChevronLeft, ChevronRight, Upload, Check, AlertCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';
import { auth, supabase } from '../lib/supabase/client';
import { userService, petService, ownerPreferencesService } from '../lib/supabase/db';
import { useDropzone } from 'react-dropzone';

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

        // Benutzerprofil mit zusätzlichen Informationen aktualisieren
        const { error: profileError } = await userService.updateUserProfile(
          userId,
          {
            plz: formStep2Owner.plz,
            city: formStep2Owner.city,
            phoneNumber: formStep2Owner.phoneNumber,
            profileCompleted: true, // Jetzt als abgeschlossen markieren
            profilePhotoUrl: formStep2Owner.profilePhotoUrl
          }
        );

        if (profileError) throw profileError;

        // Haustiere hinzufügen
        for (const pet of formStep2Owner.pets) {
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

        // Nach Dashboard navigieren
        navigate('/dashboard-owner');
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

        // Benutzerprofil mit zusätzlichen Informationen aktualisieren
        const { error: profileError } = await userService.updateUserProfile(
          userId,
          {
            plz: formStep2Owner.plz,
            city: formStep2Owner.city,
            phoneNumber: formStep2Owner.phoneNumber,
            profileCompleted: true, // Jetzt als abgeschlossen markieren
            profilePhotoUrl: formStep2Owner.profilePhotoUrl
          }
        );

        if (profileError) throw profileError;

        // Haustiere hinzufügen
        for (const pet of formStep2Owner.pets) {
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

        // Nach Dashboard navigieren
        navigate('/dashboard-owner');
      } catch (err: any) {
        console.error('Fehler beim Vervollständigen des Profils:', err);
        setError(err.message || 'Beim Speichern deiner Daten ist ein Fehler aufgetreten.');
      } finally {
        setLoading(false);
      }
    }
  };

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
        ) : step === 1.5 ? null : (
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
          ) : step === 1.5 ? (
            <div className="space-y-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Hallo, {formStep1.firstName} <span role='img' aria-label='Winkende Hand'>👋</span></h2>
              <h3 className="text-xl font-semibold mb-4">Willkommen an Bord!</h3>
              <p className="text-lg text-gray-700">Du hast dich erfolgreich angemeldet.<br/>Im nächsten Schritt kannst du dein Profil vervollständigen.<br/><span className='text-primary-600'>Keine Sorge, dein Haustier wird dich nicht verpetzen, wenn du es später machst!</span></p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <Button
                  variant="primary"
                  onClick={() => setStep(2)}
                >
                  Jetzt vervollständigen
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard-owner')}
                >
                  Mach ich später
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Multistep für Schritt 2 */}
              {profileStep === 1 && (
                <>
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
                            const filePath = `profile-${Date.now()}.${fileExt}`;
                            const { data, error } = await supabase.storage.from('profile-photos').upload(filePath, file, { upsert: true });
                            if (error) throw error;
                            const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
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
                </>
              )}
              {profileStep === 2 && (
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
              {profileStep === 3 && (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg mb-6">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-3">
                        Welche Leistungen suchst du?
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {["Gassi-Service", "Haustierbetreuung", "Übernachtung", "Kurzbesuche", "Haussitting", "Hundetagesbetreuung"].map((service) => (
                          <label key={service} className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              checked={formStep2Owner.services.includes(service)}
                              onChange={() => toggleService(service)}
                            />
                            <span className="ml-3 text-gray-700">{service}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sonstige Leistungen</label>
                        <div className="space-y-2">
                          {formStep2Owner.otherServices.map((service, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                                className="flex-1 input"
                                placeholder={`Leistung ${idx + 1}`}
                                value={service}
                                onChange={e => handleOtherServiceChange(idx, e.target.value)}
                              />
                              {formStep2Owner.otherServices.length > 1 && (
                                <button
                                  type="button"
                                  className="text-red-500 hover:text-red-700 px-2"
                                  onClick={() => handleRemoveOtherService(idx)}
                                  aria-label="Leistung entfernen"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            className="mt-1 text-primary-600 hover:underline text-sm"
                            onClick={handleAddOtherService}
                          >
                            + Weitere Leistung hinzufügen
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tierarztinformationen</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                        className="input"
                          placeholder="Name des Tierarztes"
                          value={formStep2Owner.vetName}
                          onChange={e => setFormStep2Owner({ ...formStep2Owner, vetName: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="Adresse der Praxis"
                          value={formStep2Owner.vetAddress}
                          onChange={e => setFormStep2Owner({ ...formStep2Owner, vetAddress: e.target.value })}
                        />
                        <input
                          type="text"
                          className="input"
                          placeholder="Telefonnummer"
                          value={formStep2Owner.vetPhone}
                          onChange={e => setFormStep2Owner({ ...formStep2Owner, vetPhone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
                        Notfallkontakt
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                          type="text"
                          id="emergencyContactName"
                          className="input"
                          placeholder="Name des Kontakts"
                          value={formStep2Owner.emergencyContactName}
                          onChange={(e) => setFormStep2Owner({...formStep2Owner, emergencyContactName: e.target.value})}
                        />
                        <input
                          type="text"
                          id="emergencyContactPhone"
                          className="input"
                          placeholder="Telefonnummer"
                          value={formStep2Owner.emergencyContactPhone}
                          onChange={(e) => setFormStep2Owner({...formStep2Owner, emergencyContactPhone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label htmlFor="careInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                        Besondere Hinweise zur Betreuung
                      </label>
                      <textarea
                        id="careInstructions"
                        rows={4}
                        className="input"
                        placeholder="Besondere Hinweise für Betreuer (Medikamente, Allergien, Unverträglichkeiten, Fütterungszeiten, Verhalten, etc.)"
                        value={formStep2Owner.careInstructions}
                        onChange={(e) => setFormStep2Owner({...formStep2Owner, careInstructions: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                </>
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