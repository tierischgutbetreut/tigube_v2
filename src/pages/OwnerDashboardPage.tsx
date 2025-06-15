import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { MapPin, Phone, PawPrint, Edit, Shield, Heart, Trash, Check, X, Plus, Upload, LogOut, Settings, Camera, AlertTriangle, Trash2 } from 'lucide-react';
import { mockPetOwners, mockBookings, mockCaregivers } from '../data/mockData';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ownerPreferencesService, petService, userService, ownerCaretakerService } from '../lib/supabase/db';
import type { ShareSettings } from '../lib/supabase/db';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../lib/auth/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { plzService } from '../lib/supabase/db';
import { useNavigate } from 'react-router-dom';

const ALL_SERVICES = [
  'Gassi-Service',
  'Haustierbetreuung',
  'Übernachtung',
  'Kurzbesuche',
  'Haussitting',
  'Hundetagesbetreuung',
];

// Typ für Haustier-Formulare
interface PetFormData {
  name: string;
  type: string;
  typeOther: string;
  breed: string;
  age: string;
  image: string | File;
  gender?: 'Rüde' | 'Hündin' | '';
  neutered?: boolean;
}

function PhotoDropzone({ photoUrl, onUpload }: {
  photoUrl?: string | File;
  onUpload: (file: File) => void;
}) {
  let previewUrl: string | undefined = undefined;
  if (photoUrl) {
    if (typeof photoUrl === 'string') {
      previewUrl = photoUrl;
    } else if (photoUrl instanceof File) {
      previewUrl = URL.createObjectURL(photoUrl);
    }
  }
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
  });
  return (
    <div {...getRootProps()} className={`mt-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white'}`}>
      <input {...getInputProps()} />
      {previewUrl ? (
        <img src={previewUrl} alt="Tierfoto" className="h-24 w-24 object-cover rounded-full mb-2" />
      ) : (
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
      )}
      <p className="text-sm text-gray-600 mb-1">{isDragActive ? 'Bild hier ablegen ...' : 'Bild hierher ziehen oder klicken, um hochzuladen'}</p>
      <p className="text-xs text-gray-500">PNG, JPG, GIF bis 10MB</p>
    </div>
  );
}

function OwnerDashboardPage() {
  const { user, userProfile, loading: authLoading, updateProfileState, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Demo: initiale Services (später aus DB laden)
  const [services, setServices] = useState<string[]>([]);
  const [otherWishes, setOtherWishes] = useState<string[]>([]);
  const [newOtherWish, setNewOtherWish] = useState('');
  const [otherWishError, setOtherWishError] = useState<string | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsSaveMsg, setPrefsSaveMsg] = useState<string | null>(null);

  const [pets, setPets] = useState<any[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petError, setPetError] = useState<string | null>(null);
  const [showAddPet, setShowAddPet] = useState(false);
  const [newPet, setNewPet] = useState<PetFormData>({ name: '', type: '', typeOther: '', breed: '', age: '', image: '', gender: '', neutered: false });
  const [activeTab, setActiveTab] = useState<'uebersicht' | 'einstellungen'>('uebersicht');
  const [editData, setEditData] = useState(false);
  const [ownerData, setOwnerData] = useState({
    phoneNumber: '',
    email: '',
    plz: '',
    street: '',
    location: ''
  });
  const [editVet, setEditVet] = useState(false);
  const [vetData, setVetData] = useState({
    name: '',
    address: '',
    phone: ''
  });
  const [vetLoading, setVetLoading] = useState(false);
  const [vetError, setVetError] = useState<string | null>(null);
  const [vetSaveMsg, setVetSaveMsg] = useState<string | null>(null);
  const [editEmergency, setEditEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState({
    name: '',
    phone: ''
  });
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [emergencySaveMsg, setEmergencySaveMsg] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    phoneNumber: true,
    email: false,
    address: true,
    vetInfo: true,
    emergencyContact: false,
    petDetails: true,
    carePreferences: true
  });
  const [shareSettingsLoading, setShareSettingsLoading] = useState(false);
  const [shareSettingsError, setShareSettingsError] = useState<string | null>(null);
  const [shareSettingsSaveMsg, setShareSettingsSaveMsg] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [editPet, setEditPet] = useState<string | null>(null);
  const [editPetData, setEditPetData] = useState<PetFormData>({ name: '', type: '', typeOther: '', breed: '', age: '', image: '', gender: '', neutered: false });
  // State für Edit-Modus und lokale Kopie der Betreuungsvorlieben
  const [editPrefs, setEditPrefs] = useState(false);
  const [editServices, setEditServices] = useState<string[]>([]);
  const [editOtherWishes, setEditOtherWishes] = useState<string[]>([]);
  const [editNewOtherWish, setEditNewOtherWish] = useState('');
  const [editOtherWishError, setEditOtherWishError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Modal states für Betreuer löschen
  const [showDeleteCaretakerModal, setShowDeleteCaretakerModal] = useState(false);
  const [caretakerToDelete, setCaretakerToDelete] = useState<any | null>(null);
  const [deleteCaretakerConfirmationText, setDeleteCaretakerConfirmationText] = useState('');

  // Load user data on component mount and when userProfile changes
  useEffect(() => {
    // console.log('✨ OwnerDashboardPage userProfile effect triggered.'); // Clean up debug log
    // console.log('🔍 Current userProfile:', userProfile); // Clean up debug log
    // console.log('🔍 userProfile.postal_code:', userProfile?.postal_code); // Clean up debug log
    
    if (userProfile) {
      setOwnerData({
        phoneNumber: userProfile.phone_number || '',
        email: userProfile.email || '',
        plz: userProfile.plz || '',
        street: userProfile.street || '',
        location: userProfile.city || '',
      });
    } else if (user && !authLoading) {
      // Fallback: Setze E-Mail vom Auth-User
      setOwnerData(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
  }, [userProfile, user, authLoading]);

  // Haustiere aus DB laden
  useEffect(() => {
    const fetchPets = async () => {
      if (!user) return;
      setPetsLoading(true);
      setPetError(null);
      try {
        const { data, error } = await petService.getOwnerPets(user.id);
        if (error) {
          setPetError('Fehler beim Laden der Tiere!');
          setPets([]);
        } else {
          // Mappe DB-Felder auf UI-Felder
          setPets(
            (data || []).map((pet: any) => ({
              id: pet.id,
              name: pet.name,
              type: pet.type,
              breed: pet.breed || '',
              age: pet.age ?? '',
              image: pet.photo_url || '',
              description: pet.description || '',
              gender: pet.gender || '',
              neutered: pet.neutered || false,
            }))
          );
        }
      } catch (e) {
        setPetError('Fehler beim Laden der Tiere!');
        setPets([]);
      } finally {
        setPetsLoading(false);
      }
    };
    fetchPets();
  }, [user]);

  // Gespeicherte Betreuer aus DB laden
  useEffect(() => {
    const fetchSavedCaretakers = async () => {
      if (!user) return;
      setContactsLoading(true);
      setContactsError(null);
      try {
        const { data, error } = await ownerCaretakerService.getSavedCaretakers(user.id);
        if (error) {
          setContactsError('Fehler beim Laden der Betreuer!');
          setContacts([]);
        } else {
          setContacts(data || []);
        }
      } catch (e) {
        setContactsError('Fehler beim Laden der Betreuer!');
        setContacts([]);
      } finally {
        setContactsLoading(false);
      }
    };

    fetchSavedCaretakers();
  }, [user]);

  // Tierarzt-Infos aus DB laden
  useEffect(() => {
    if (activeTab !== 'einstellungen' || !user) return;
    setVetLoading(true);
    setVetError(null);
    ownerPreferencesService.getPreferences(user.id)
      .then(({ data, error }) => {
        if (error) {
          setVetError('Fehler beim Laden der Tierarzt-Informationen!');
          setVetData({ name: '', address: '', phone: '' });
        } else if (data) {
          // vet_info kann als JSON oder als einzelne Felder vorliegen
          let name = '', address = '', phone = '';
          if (data.vet_info) {
            try {
              const info = typeof data.vet_info === 'string' ? JSON.parse(data.vet_info) : data.vet_info;
              name = info.name || '';
              address = info.address || '';
              phone = info.phone || '';
            } catch {
              // Fallback: evtl. plain string
              name = data.vet_info;
            }
          }
          setVetData({ name, address, phone });
        } else {
          // Keine Daten gefunden - setze leere Standardwerte
          setVetData({ name: '', address: '', phone: '' });
        }
      })
      .catch(() => setVetError('Fehler beim Laden der Tierarzt-Informationen!'))
      .finally(() => setVetLoading(false));
  }, [activeTab, user]);

  // Notfallkontakt aus DB laden
  useEffect(() => {
    if (activeTab !== 'einstellungen' || !user) return;
    setEmergencyLoading(true);
    setEmergencyError(null);
    ownerPreferencesService.getPreferences(user.id)
      .then(({ data, error }) => {
        if (error) {
          setEmergencyError('Fehler beim Laden des Notfallkontakts!');
          setEmergencyData({ name: '', phone: '' });
        } else if (data) {
          setEmergencyData({
            name: data.emergency_contact_name || '',
            phone: data.emergency_contact_phone || ''
          });
        } else {
          // Keine Daten gefunden - setze leere Standardwerte
          setEmergencyData({ name: '', phone: '' });
        }
      })
      .catch(() => setEmergencyError('Fehler beim Laden des Notfallkontakts!'))
      .finally(() => setEmergencyLoading(false));
  }, [activeTab, user]);

  // Betreuungsvorlieben aus DB laden
  useEffect(() => {
    if (activeTab !== 'einstellungen' || !user) return;
    setPrefsLoading(true);
    setPrefsError(null);
    ownerPreferencesService.getPreferences(user.id)
      .then(({ data, error }) => {
        if (error) {
          setPrefsError('Fehler beim Laden der Betreuungsvorlieben!');
          setServices([]);
          setOtherWishes([]);
        } else if (data) {
          setServices(data.services || []);
          // Sonstige Wünsche: als String (mit Komma oder Zeilenumbruch getrennt) oder Array
          let wishes: string[] = [];
          if (Array.isArray(data.other_services)) {
            wishes = data.other_services;
          } else if (typeof data.other_services === 'string') {
            wishes = data.other_services.split(/,|\n/).map((w: string) => w.trim()).filter(Boolean);
          }
          setOtherWishes(wishes);
        } else {
          // Keine Daten gefunden - setze leere Standardwerte
          setServices([]);
          setOtherWishes([]);
        }
      })
      .catch(() => setPrefsError('Fehler beim Laden der Betreuungsvorlieben!'))
      .finally(() => setPrefsLoading(false));
  }, [activeTab, user]);

  // Share-Settings aus Datenbank laden
  useEffect(() => {
    const loadShareSettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await ownerPreferencesService.getShareSettings(user.id);
        if (error) {
          console.warn('Fehler beim Laden der Datenschutz-Einstellungen:', error);
          // Behalte Standardwerte bei
        } else if (data) {
          setShareSettings(data);
        }
      } catch (e) {
        console.warn('Fehler beim Laden der Datenschutz-Einstellungen:', e);
        // Behalte Standardwerte bei
      }
    };

    loadShareSettings();
  }, [user]);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nicht angemeldet</h2>
          <p className="text-gray-600">Bitte melden Sie sich an, um Ihr Dashboard zu sehen.</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <h2 className="text-xl font-semibold text-gray-900 mb-2 mt-4">Profil wird geladen ...</h2>
          <p className="text-gray-600">Bitte warten Sie einen Moment. Ihr Profil wird geladen.</p>
        </div>
      </div>
    );
  }

  // Fallback für fehlende Profile-Daten
  const fallbackProfile = {
    first_name: user.email?.split('@')[0] || 'Benutzer',
    last_name: '',
    email: user.email || '',
    phone_number: '',
    plz: '',
    city: '',
    user_type: 'owner' as const,
    avatar_url: null
  };

  const profile = userProfile || fallbackProfile;
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unbekannter Benutzer';
  const avatarUrl = profile.profile_photo_url
    || profile.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=f3f4f6&color=374151`;

  // Debug-Info wenn Profile fehlt
  if (!userProfile) {
    console.warn('⚠️ UserProfile missing, using fallback data for user:', user.id);
  }

  // handleServiceToggle: jetzt mit Autosave
  const handleServiceToggle = (service: string) => {
    setServices((prev) => {
      const updated = prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service];
      autosavePreferences(updated, otherWishes);
      return updated;
    });
  };

  // handleAddOtherWish: jetzt mit Autosave
  const handleAddOtherWish = () => {
    const trimmed = newOtherWish.trim();
    if (!trimmed) return;
    const exists = otherWishes.some(w => w.trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setOtherWishError('Dieser Wunsch existiert bereits!');
      return;
    }
    const updated = [...otherWishes, trimmed];
    setOtherWishes(updated);
    setNewOtherWish('');
    setOtherWishError(null);
    autosavePreferences(services, updated);
  };

  // handleRemoveOtherWish: jetzt mit Autosave
  const handleRemoveOtherWish = (idx: number) => {
    const updated = otherWishes.filter((_, i) => i !== idx);
    setOtherWishes(updated);
    setOtherWishError(null);
    autosavePreferences(services, updated);
  };

  // Autosave-Funktion für Betreuungsvorlieben
  const autosavePreferences = async (servicesToSave: string[], wishesToSave: string[]) => {
    if (!user) return;
    setPrefsLoading(true);
    setPrefsSaveMsg(null);
    setPrefsError(null);
    try {
      const { error } = await ownerPreferencesService.savePreferences(user.id, {
        services: servicesToSave,
        otherServices: wishesToSave.join(', '),
      });
      if (error) {
        setPrefsError('Fehler beim Speichern der Betreuungsvorlieben!');
      } else {
        setPrefsSaveMsg('Betreuungsvorlieben erfolgreich gespeichert!');
      }
    } catch {
      setPrefsError('Fehler beim Speichern der Betreuungsvorlieben!');
    } finally {
      setPrefsLoading(false);
      setTimeout(() => setPrefsSaveMsg(null), 4000);
    }
  };



  // Hilfsfunktion für Pet-Image-Upload
  async function uploadPetPhoto(file: File): Promise<string> {
    const { supabase } = await import('../lib/supabase/client');
    const fileExt = file.name.split('.').pop();
    const filePath = `pet-${user!.id}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('pet-photos').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('pet-photos').getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  // Haustier hinzufügen (DB)
  const handleAddPet = async () => {
    if (!user) return;
    if (!newPet.name.trim() || !newPet.type.trim() || (newPet.type === 'Andere' && !newPet.typeOther.trim())) return;
    const typeValue = newPet.type === 'Andere' ? newPet.typeOther : newPet.type;
    let photoUrl = '';
    if (newPet.image && typeof newPet.image !== 'string') {
      photoUrl = await uploadPetPhoto(newPet.image);
    } else if (typeof newPet.image === 'string') {
      photoUrl = newPet.image;
    }
    const petData = {
      name: newPet.name,
      type: typeValue,
      breed: newPet.breed,
      age: Number(newPet.age),
      photoUrl: photoUrl,
      description: '',
      gender: newPet.gender || '',
      neutered: newPet.neutered || false,
    };
    try {
      const { error } = await petService.addPet(user.id, petData);
      if (error) throw error;
      const { data } = await petService.getOwnerPets(user.id);
      setPets((data || []).map((pet: any) => ({
        id: pet.id,
        name: pet.name,
        type: pet.type,
        breed: pet.breed || '',
        age: pet.age ?? '',
        image: pet.photo_url || '',
        description: pet.description || '',
        gender: pet.gender || '',
        neutered: pet.neutered || false,
      })));
      setShowAddPet(false);
      setNewPet({ name: '', type: '', typeOther: '', breed: '', age: '', image: '', gender: '', neutered: false });
    } catch (e) {
      setPetError('Fehler beim Hinzufügen des Tiers!');
    }
  };

  // Haustier bearbeiten (DB)
  const handleSavePet = async () => {
    if (!user) return;
    if (!editPet) return; // Guard: keine ID, kein Update
    if (!editPetData.name.trim()) return;
    let photoUrl = '';
    if (editPetData.image && typeof editPetData.image !== 'string') {
      photoUrl = await uploadPetPhoto(editPetData.image);
    } else if (typeof editPetData.image === 'string') {
      photoUrl = editPetData.image;
    }
    const petData = {
      name: editPetData.name,
      type: editPetData.type === 'Andere' ? editPetData.typeOther : editPetData.type,
      breed: editPetData.breed,
      age: Number(editPetData.age),
      photoUrl: photoUrl,
      description: '',
      gender: editPetData.gender || '',
      neutered: editPetData.neutered || false,
    };
    try {
      const { error } = await petService.updatePet(editPet, petData);
      if (error) throw error;
      const { data } = await petService.getOwnerPets(user.id);
      setPets((data || []).map((pet: any) => ({
        id: pet.id,
        name: pet.name,
        type: pet.type,
        breed: pet.breed || '',
        age: pet.age ?? '',
        image: pet.photo_url || '',
        description: pet.description || '',
        gender: pet.gender || '',
        neutered: pet.neutered || false,
      })));
      setEditPet(null);
      setEditPetData({ name: '', type: '', typeOther: '', breed: '', age: '', image: '', gender: '', neutered: false });
    } catch (e) {
      setPetError('Fehler beim Bearbeiten des Tiers!');
    }
  };

  // Haustier löschen (DB)
  const handleDeletePet = async (petId: string) => {
    if (!user) return;
    try {
      const { error } = await petService.deletePet(petId);
      if (error) throw error;
      const { data } = await petService.getOwnerPets(user.id);
      setPets((data || []).map((pet: any) => ({
        id: pet.id,
        name: pet.name,
        type: pet.type,
        breed: pet.breed || '',
        age: pet.age ?? '',
        image: pet.photo_url || '',
        description: pet.description || '',
        gender: pet.gender || '',
        neutered: pet.neutered || false,
      })));
      setEditPet(null);
    } catch (e) {
      setPetError('Fehler beim Löschen des Tiers!');
    }
  };

  // Haustier-Foto-Upload für neues Tier
  const handlePetPhotoUpload = (file: File) => {
    setNewPet(p => ({ ...p, image: file }));
  };

  // Haustier-Foto-Upload für Edit
  const handleEditPetPhotoUpload = (file: File) => {
    setEditPetData(p => ({ ...p, image: file }));
  };

  const handleEditPet = (pet: any) => {
    setEditPet(pet.id);
    setEditPetData({
      name: pet.name,
      type: pet.type,
      typeOther: '',
      breed: pet.breed,
      age: pet.age.toString(),
      image: pet.image,
      gender: pet.gender || '',
      neutered: pet.neutered || false,
    });
  };

  const handleDeleteContact = (caregiver: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCaretakerToDelete(caregiver);
    setShowDeleteCaretakerModal(true);
  };

  const handleDeleteCaretakerConfirm = async () => {
    if (caretakerToDelete && deleteCaretakerConfirmationText === 'BETREUER ENTFERNEN' && user) {
      try {
        const { error } = await ownerCaretakerService.removeCaretaker(user.id, caretakerToDelete.id);
        if (error) {
          console.error('Fehler beim Entfernen des Betreuers:', error);
          alert('Fehler beim Entfernen des Betreuers. Bitte versuchen Sie es erneut.');
          return;
        }
        
        // Aktualisiere lokalen State
        setContacts(prev => prev.filter(contact => contact.id !== caretakerToDelete.id));
        
        // Modal schließen
        setShowDeleteCaretakerModal(false);
        setCaretakerToDelete(null);
        setDeleteCaretakerConfirmationText('');
        
        // Erfolgsbenachrichtigung
        alert(`${caretakerToDelete.name} wurde erfolgreich entfernt und hat keinen Zugriff mehr auf Ihr Profil.`);
      } catch (error) {
        console.error('Fehler beim Entfernen des Betreuers:', error);
        alert('Fehler beim Entfernen des Betreuers. Bitte versuchen Sie es erneut.');
      }
    }
  };

  const handleDeleteCaretakerCancel = () => {
    setShowDeleteCaretakerModal(false);
    setCaretakerToDelete(null);
    setDeleteCaretakerConfirmationText('');
  };

  const handleShareToggle = async (setting: keyof ShareSettings) => {
    if (!user) return;
    
    const newSettings = {
      ...shareSettings,
      [setting]: !shareSettings[setting]
    };
    
    // Optimistisches Update für bessere UX
    setShareSettings(newSettings);
    setShareSettingsLoading(true);
    setShareSettingsError(null);
    setShareSettingsSaveMsg(null);
    
    try {
      // Echte Datenbank-Speicherung
      const { error } = await ownerPreferencesService.saveShareSettings(user.id, newSettings);
      
      if (error) {
        // Bei Fehler: Rollback der UI-Änderung
        setShareSettings(shareSettings);
        setShareSettingsError('Fehler beim Speichern der Datenschutz-Einstellungen!');
      } else {
        setShareSettingsSaveMsg('Datenschutz-Einstellungen erfolgreich gespeichert!');
        setTimeout(() => setShareSettingsSaveMsg(null), 3000);
      }
    } catch (e) {
      // Bei Fehler: Rollback der UI-Änderung
      setShareSettings(shareSettings);
      setShareSettingsError('Fehler beim Speichern der Datenschutz-Einstellungen!');
    } finally {
      setShareSettingsLoading(false);
    }
  };

  const handlePhoneNumberChange = (value: string, field: 'phoneNumber' | 'emergencyPhone' | 'vetPhone') => {
    // Nur Zahlen, Leerzeichen, Plus und Bindestriche erlauben
    const phoneRegex = /^[+\d\s-]*$/;
    if (phoneRegex.test(value)) {
      if (field === 'phoneNumber') {
        setOwnerData(d => ({ ...d, phoneNumber: value }));
      } else if (field === 'emergencyPhone') {
        setEmergencyData(d => ({ ...d, phone: value }));
      } else if (field === 'vetPhone') {
        setVetData(d => ({ ...d, phone: value }));
      }
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setOwnerData(d => ({ ...d, email: value }));
    
    if (value.trim() === '') {
      setEmailError('E-Mail-Adresse ist ein Pflichtfeld');
    } else if (!validateEmail(value)) {
      setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
    } else {
      setEmailError(null);
    }
  };

  const handleSaveOwnerData = async () => {
    if (!user) return; // Should not happen due to auth check, but for safety

    try {
      // Prepare data for updateProfile
      const dataToUpdate: { [key: string]: any } = {};

      // Only include fields that have changed
      if (ownerData.phoneNumber !== (userProfile?.phone_number || '')) dataToUpdate.phoneNumber = ownerData.phoneNumber;
      if (ownerData.email !== (userProfile?.email || '')) dataToUpdate.email = ownerData.email;
      if (ownerData.street !== (userProfile?.street || '')) dataToUpdate.street = ownerData.street;

      // Handle PLZ and City logic
      const plzChanged = ownerData.plz !== (userProfile?.plz || '');
      const cityChanged = ownerData.location !== (userProfile?.city || '');

      if (plzChanged || cityChanged) {
          // Check if PLZ+Stadt-Kombination exists in plzs table
          const { data: existingPlzCity, error: plzError } = await plzService.getByPlzAndCity(ownerData.plz, ownerData.location);

          if (plzError && plzError.code !== 'PGRST116') { // PGRST116 means not found, which is expected if new
               console.error('Error checking PLZ+Stadt in plzs table:', plzError);
               throw new Error(`Fehler bei der PLZ-Prüfung: ${plzError.message}`);
          }

          if (!existingPlzCity) {
              // PLZ+Stadt-Kombination does not exist, create it in plzs table
              console.log('PLZ+Stadt not found in plzs table, creating...');
              const { error: createPlzError } = await plzService.create(ownerData.plz, ownerData.location);

              if (createPlzError) {
                  console.error('Error creating PLZ+Stadt in plzs table:', createPlzError);
                   // Continue updating user profile even if adding to plzs fails, but log error
              } else {
                   console.log('PLZ+Stadt successfully created in plzs table.');
              }
          }

          // Add PLZ and City to dataToUpdate for users table
          dataToUpdate.plz = ownerData.plz;
          dataToUpdate.location = ownerData.location;
      }

      // If no fields have changed, exit without saving
      if (Object.keys(dataToUpdate).length === 0) {
          return;
      }

      // Call the service to update the user profile
      const { data: updatedProfile, error: updateError } = await userService.updateUserProfile(user.id, dataToUpdate);

      if (updateError) {
        console.error('Fehler beim Speichern der Kontaktdaten:', updateError);
      } else {
        // Profil nach dem Speichern neu laden (Race-Condition vermeiden)
        const { data: freshProfile, error: freshError } = await userService.getUserProfile(user.id);
        if (!freshError && freshProfile) {
          updateProfileState(freshProfile);
        }
        setEditData(false);
      }
    } catch (e) {
      console.error('Exception beim Speichern der Kontaktdaten:', e);
    }
  };

  const handleCancelEdit = () => {
    // Reset ownerData to current userProfile values
    if (userProfile) {
      setOwnerData({
        phoneNumber: userProfile.phone_number || '',
        email: userProfile.email || '',
        plz: userProfile.plz || '',
        street: userProfile.street || '',
        location: userProfile.city || '',
      });
    } else if (user) {
       // Fallback for users without a profile yet
        setOwnerData(prev => ({
          ...prev,
          email: user.email || '' // Keep email from auth if profile is missing
        }));
    } else {
       // Should not happen
       setOwnerData({ phoneNumber: '', email: '', plz: '', street: '', location: '' });
    }
    setEditData(false); // Exit edit mode
  };

  // Tierarzt-Infos speichern
  const handleSaveVet = async () => {
    if (!user) return;
    setVetLoading(true);
    setVetSaveMsg(null);
    setVetError(null);
    try {
      const { error } = await ownerPreferencesService.saveVetInfo(
        user.id, 
        vetData.name, 
        vetData.address, 
        vetData.phone
      );
      if (error) {
        setVetError('Fehler beim Speichern der Tierarzt-Informationen!');
      } else {
        setVetSaveMsg('Tierarzt-Informationen erfolgreich gespeichert!');
        setEditVet(false);
      }
    } catch {
      setVetError('Fehler beim Speichern der Tierarzt-Informationen!');
    } finally {
      setVetLoading(false);
      setTimeout(() => setVetSaveMsg(null), 4000);
    }
  };

  // Notfallkontakt speichern
  const handleSaveEmergency = async () => {
    if (!user) return;
    setEmergencyLoading(true);
    setEmergencySaveMsg(null);
    setEmergencyError(null);
    try {
      const { error } = await ownerPreferencesService.saveEmergencyContact(
        user.id, 
        emergencyData.name, 
        emergencyData.phone
      );
      if (error) {
        setEmergencyError('Fehler beim Speichern des Notfallkontakts!');
      } else {
        setEmergencySaveMsg('Notfallkontakt erfolgreich gespeichert!');
        setEditEmergency(false);
      }
    } catch {
      setEmergencyError('Fehler beim Speichern des Notfallkontakts!');
    } finally {
      setEmergencyLoading(false);
      setTimeout(() => setEmergencySaveMsg(null), 4000);
    }
  };

  // handleOtherWishKeyDown für das Wünsche-Input (Enter: hinzufügen, Escape: leeren)
  const handleOtherWishKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOtherWish();
    } else if (e.key === 'Escape') {
      setNewOtherWish('');
      setOtherWishError(null);
    }
  };

  // Edit-Modus aktivieren: lokale Kopie der aktuellen Werte
  const handleEditPrefs = () => {
    setEditPrefs(true);
    setEditServices(services);
    setEditOtherWishes(otherWishes);
    setEditNewOtherWish('');
    setEditOtherWishError(null);
  };

  // Edit-Modus abbrechen: zurücksetzen
  const handleCancelEditPrefs = () => {
    setEditPrefs(false);
    setEditServices([]);
    setEditOtherWishes([]);
    setEditNewOtherWish('');
    setEditOtherWishError(null);
  };

  // Checkbox-Änderung im Edit-Modus
  const handleEditServiceToggle = (service: string) => {
    setEditServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  // Wünsche hinzufügen/entfernen im Edit-Modus
  const handleEditAddOtherWish = () => {
    const trimmed = editNewOtherWish.trim();
    if (!trimmed) return;
    const exists = editOtherWishes.some(w => w.trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setEditOtherWishError('Dieser Wunsch existiert bereits!');
      return;
    }
    setEditOtherWishes((prev) => [...prev, trimmed]);
    setEditNewOtherWish('');
    setEditOtherWishError(null);
  };
  const handleEditRemoveOtherWish = (idx: number) => {
    setEditOtherWishes((prev) => prev.filter((_, i) => i !== idx));
    setEditOtherWishError(null);
  };
  const handleEditOtherWishKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditAddOtherWish();
    } else if (e.key === 'Escape') {
      setEditNewOtherWish('');
      setEditOtherWishError(null);
    }
  };

  // Prüfen, ob Änderungen vorliegen
  const prefsChanged =
    JSON.stringify(editServices) !== JSON.stringify(services) ||
    JSON.stringify(editOtherWishes) !== JSON.stringify(otherWishes);

  // Speichern der Änderungen
  const handleSaveEditPrefs = async () => {
    if (!user) return;
    setPrefsLoading(true);
    setPrefsSaveMsg(null);
    setPrefsError(null);
    try {
      const { error } = await ownerPreferencesService.savePreferences(user.id, {
        services: editServices,
        otherServices: editOtherWishes.join(', '),
      });
      if (error) {
        setPrefsError('Fehler beim Speichern der Betreuungsvorlieben!');
      } else {
        setPrefsSaveMsg('Betreuungsvorlieben erfolgreich gespeichert!');
        setServices(editServices);
        setOtherWishes(editOtherWishes);
        setEditPrefs(false);
      }
    } catch {
      setPrefsError('Fehler beim Speichern der Betreuungsvorlieben!');
    } finally {
      setPrefsLoading(false);
      setTimeout(() => setPrefsSaveMsg(null), 4000);
    }
  };

  // Profilbild-Upload
  async function uploadProfilePhoto(file: File): Promise<string> {
    const { supabase } = await import('../lib/supabase/client');
    const fileExt = file.name.split('.').pop();
    const filePath = `profile-${user!.id}-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('profile-photos').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  const handleProfilePhotoUpload = async (file: File) => {
    if (!user) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const url = await uploadProfilePhoto(file);
      const { data, error } = await userService.updateUserProfile(user.id, { profilePhotoUrl: url });
      if (error) throw error;
      if (data && data[0]) updateProfileState(data[0]);
    } catch (e: any) {
      setAvatarError('Fehler beim Hochladen des Profilbilds!');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await userService.deleteUser(user.id);
      if (error) {
        console.error('Fehler beim Löschen des Kontos:', error);
        alert('Fehler beim Löschen des Kontos. Bitte versuchen Sie es erneut.');
        setIsDeleting(false);
        return;
      }

      // Nach erfolgreichem Löschen: Ausloggen und zur Startseite
      await signOut();
      navigate('/', { 
        replace: true,
        state: { 
          message: 'Ihr Konto wurde erfolgreich gelöscht. Alle Ihre Daten wurden aus der Datenbank entfernt.' 
        }
      });
    } catch (error) {
      console.error('Fehler beim Löschen des Kontos:', error);
      alert('Fehler beim Löschen des Kontos. Bitte versuchen Sie es erneut.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container-custom max-w-4xl">
        {/* Profil-Header */}
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
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) handleProfilePhotoUpload(e.target.files[0]);
                  }}
                  disabled={avatarUploading}
                />
                <Camera className="h-5 w-5 text-primary-600" />
              </label>
              {avatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full"><LoadingSpinner /></div>}
              {avatarError && <div className="absolute left-0 right-0 -bottom-8 text-xs text-red-500 text-center">{avatarError}</div>}
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Erste Spalte: Name und Tiere */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-4">{fullName}</h1>
                  
                  {/* Pet-Badges */}
                  <div className="flex flex-wrap gap-2">
                    {pets.map((pet) => (
                      <span key={pet.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-50 text-primary-700">
                        <PawPrint className="h-4 w-4 mr-1" />{pet.name} ({pet.type})
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Zweite Spalte: Kontaktdaten */}
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
                  
                  {/* Kontaktdaten */}
                  <div className="space-y-3">
                    {!editData ? (
                      <>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <div className="text-gray-700">
                            {userProfile?.street && (
                              <div>{userProfile.street}</div>
                            )}
                            <div>
                              {userProfile?.plz && userProfile?.city
                                ? `${userProfile.plz} ${userProfile.city}`
                                : userProfile?.plz
                                ? userProfile.plz
                                : userProfile?.city
                                ? userProfile.city
                                : '—'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">{userProfile?.phone_number || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-gray-700">{userProfile?.email || '—'}</span>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
                          <input
                            type="text"
                            className="input w-full"
                            value={ownerData.plz}
                            onChange={e => setOwnerData(d => ({ ...d, plz: e.target.value }))}
                            placeholder="PLZ"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Straße & Hausnummer</label>
                          <input
                            type="text"
                            className="input w-full"
                            value={ownerData.street}
                            onChange={e => setOwnerData(d => ({ ...d, street: e.target.value }))}
                            placeholder="Straße und Hausnummer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ort</label>
                          <input
                            type="text"
                            className="input w-full"
                            value={ownerData.location}
                            onChange={e => setOwnerData(d => ({ ...d, location: e.target.value }))}
                            placeholder="Ort"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Telefonnummer</label>
                          <input
                            type="tel"
                            className="input w-full"
                            value={ownerData.phoneNumber}
                            onChange={e => handlePhoneNumberChange(e.target.value, 'phoneNumber')}
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
                            value={ownerData.email}
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
                            onClick={handleSaveOwnerData}
                            disabled={!!emailError || !ownerData.email.trim()}
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

        {/* Tab Navigation */}
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
                <PawPrint className="h-4 w-4 inline mr-2" />
                Übersicht
              </button>
              <button
                onClick={() => setActiveTab('einstellungen')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'einstellungen'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Einstellungen
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'uebersicht' && (
          <>
            {/* Haustiere */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><PawPrint className="h-5 w-5" />Meine Tiere</h2>
              {petsLoading ? (
                <div className="text-gray-500">Tiere werden geladen ...</div>
              ) : petError ? (
                <div className="text-red-500">{petError}</div>
              ) : pets.length === 0 ? (
                <div className="text-gray-500 italic">Hier ist noch gähnende Leere…  Füge jetzt dein erstes Tier hinzu!</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {pets.map((pet) => (
                    <div key={pet.id} className="bg-white rounded-xl shadow-sm p-4 relative">
                      {editPet !== pet.id ? (
                        <>
                          {/* Edit-Button oben rechts */}
                          <button
                            type="button"
                            className="absolute top-4 right-4 text-gray-400 hover:text-primary-600 transition-colors"
                            aria-label="Tier bearbeiten"
                            onClick={() => handleEditPet(pet)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          
                          <div className="flex gap-4 items-center">
                            {pet.image ? (
                              <img src={pet.image} alt={pet.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary-100" />
                            ) : (
                              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-primary-100 flex items-center justify-center text-gray-400 text-2xl font-bold">
                                {pet.name ? pet.name.charAt(0) : <PawPrint className="h-8 w-8" />}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-lg">{pet.name}</div>
                              <div className="text-gray-600 text-sm">{pet.type} • {pet.breed}</div>
                              <div className="text-gray-500 text-sm">Alter: {pet.age} Jahre</div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <div>
                              <PhotoDropzone
                                photoUrl={editPetData.image}
                                onUpload={handleEditPetPhotoUpload}
                              />
                            </div>
                            <input
                              type="text"
                              className="input w-full"
                              placeholder="Name"
                              value={editPetData.name}
                              onChange={e => setEditPetData(p => ({ ...p, name: e.target.value }))}
                            />
                            <select
                              className="input w-full"
                              value={editPetData.type}
                              onChange={e => setEditPetData(p => ({ ...p, type: e.target.value, typeOther: '' }))}
                            >
                              <option value="">Art auswählen</option>
                              <option value="Hund">Hund</option>
                              <option value="Katze">Katze</option>
                              <option value="Vogel">Vogel</option>
                              <option value="Kaninchen">Kaninchen</option>
                              <option value="Andere">Andere</option>
                            </select>
                            {editPetData.type === 'Andere' && (
                              <input
                                type="text"
                                className="input w-full"
                                placeholder="Bitte Tierart angeben"
                                value={editPetData.typeOther}
                                onChange={e => setEditPetData(p => ({ ...p, typeOther: e.target.value }))}
                              />
                            )}
                            <input
                              type="text"
                              className="input w-full"
                              placeholder="Rasse"
                              value={editPetData.breed}
                              onChange={e => setEditPetData(p => ({ ...p, breed: e.target.value }))}
                            />
                            <input
                              type="number"
                              className="input w-full"
                              placeholder="Alter (Jahre)"
                              value={editPetData.age}
                              onChange={e => setEditPetData(p => ({ ...p, age: e.target.value }))}
                            />
                            {editPetData.type === 'Hund' && (
                              <div className="flex gap-4 items-center mt-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Geschlecht</label>
                                  <select
                                    className="input"
                                    value={editPetData.gender || ''}
                                    onChange={e => setEditPetData(p => ({ ...p, gender: e.target.value as 'Rüde' | 'Hündin' }))}
                                  >
                                    <option value="">Auswählen</option>
                                    <option value="Rüde">Rüde</option>
                                    <option value="Hündin">Hündin</option>
                                  </select>
                                </div>
                                <div className="flex items-center mt-6">
                                  <input
                                    type="checkbox"
                                    id="neutered-edit"
                                    checked={!!editPetData.neutered}
                                    onChange={e => setEditPetData(p => ({ ...p, neutered: e.target.checked }))}
                                    className="mr-2"
                                  />
                                  <label htmlFor="neutered-edit" className="text-sm">kastriert/sterilisiert</label>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                                onClick={handleSavePet}
                                disabled={!editPetData.name.trim()}
                              >
                                <Check className="h-4 w-4 inline mr-1" /> Speichern
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                                onClick={() => setEditPet(null)}
                              >
                                <X className="h-4 w-4 inline mr-1" /> Abbrechen
                              </button>
                            </div>
                          </div>
                          
                          {/* Delete-Button unten rechts */}
                          <button
                            type="button"
                            className="absolute bottom-4 right-4 text-red-400 hover:text-red-600 transition-colors"
                            aria-label="Tier löschen"
                            onClick={() => handleDeletePet(pet.id)}
                          >
                            <Trash className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                {!showAddPet ? (
                  <button
                    type="button"
                    className="flex items-center gap-2 text-primary-600 hover:underline text-sm"
                    onClick={() => setShowAddPet(true)}
                  >
                    <Plus className="h-4 w-4" /> Weiteres Tier hinzufügen
                  </button>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-4 mt-4 flex flex-col gap-2 max-w-md">
                    <input
                      type="text"
                      className="input"
                      placeholder="Name"
                      value={newPet.name}
                      onChange={e => setNewPet(p => ({ ...p, name: e.target.value }))}
                    />
                    <select
                      className="input"
                      value={newPet.type}
                      onChange={e => setNewPet(p => ({ ...p, type: e.target.value, typeOther: '' }))}
                    >
                      <option value="">Art auswählen</option>
                      <option value="Hund">Hund</option>
                      <option value="Katze">Katze</option>
                      <option value="Vogel">Vogel</option>
                      <option value="Kaninchen">Kaninchen</option>
                      <option value="Andere">Andere</option>
                    </select>
                    {newPet.type === 'Andere' && (
                      <input
                        type="text"
                        className="input mt-2"
                        placeholder="Bitte Tierart angeben"
                        value={newPet.typeOther}
                        onChange={e => setNewPet(p => ({ ...p, typeOther: e.target.value }))}
                      />
                    )}
                    <input
                      type="text"
                      className="input"
                      placeholder="Rasse"
                      value={newPet.breed}
                      onChange={e => setNewPet(p => ({ ...p, breed: e.target.value }))}
                    />
                    <input
                      type="number"
                      className="input"
                      placeholder="Alter (Jahre)"
                      value={newPet.age}
                      onChange={e => setNewPet(p => ({ ...p, age: e.target.value }))}
                    />
                    {newPet.type === 'Hund' && (
                      <div className="flex gap-4 items-center mt-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Geschlecht</label>
                          <select
                            className="input"
                            value={newPet.gender || ''}
                            onChange={e => setNewPet(p => ({ ...p, gender: e.target.value as 'Rüde' | 'Hündin' }))}
                          >
                            <option value="">Auswählen</option>
                            <option value="Rüde">Rüde</option>
                            <option value="Hündin">Hündin</option>
                          </select>
                        </div>
                        <div className="flex items-center mt-6">
                          <input
                            type="checkbox"
                            id="neutered-new"
                            checked={!!newPet.neutered}
                            onChange={e => setNewPet(p => ({ ...p, neutered: e.target.checked }))}
                            className="mr-2"
                          />
                          <label htmlFor="neutered-new" className="text-sm">kastriert/sterilisiert</label>
                        </div>
                      </div>
                    )}
                    <PhotoDropzone
                      photoUrl={newPet.image}
                      onUpload={handlePetPhotoUpload}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                        onClick={handleAddPet}
                        disabled={!newPet.name.trim() || !newPet.type.trim() || (newPet.type === 'Andere' && !newPet.typeOther.trim())}
                      >
                        <Check className="h-4 w-4 inline" /> Speichern
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                        onClick={() => { setShowAddPet(false); setNewPet({ name: '', type: '', typeOther: '', breed: '', age: '', image: '', gender: '', neutered: false }); }}
                      >
                        <X className="h-4 w-4 inline" /> Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kontakte */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Heart className="h-5 w-5" />Meine Betreuer</h2>
              {contactsLoading ? (
                <div className="text-gray-500">Betreuer werden geladen ...</div>
              ) : contactsError ? (
                <div className="text-red-500">{contactsError}</div>
              ) : contacts.length === 0 ? (
                <div className="text-gray-500">
                  Noch keine Betreuer gespeichert. 
                  <br />
                  <span className="text-sm">Verwenden Sie den "Als Betreuer speichern" Button in einem Chat, um Betreuer hier anzuzeigen.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {contacts.map((caregiver: any) => (
                    <div key={caregiver.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center relative min-h-[110px]">
                      {/* Betreuer entfernen Button oben rechts */}
                      <button
                        type="button"
                        className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Betreuer entfernen"
                        onClick={(e) => handleDeleteContact(caregiver, e)}
                        title="Betreuer entfernen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <img src={caregiver.avatar} alt={caregiver.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary-100" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg truncate">{caregiver.name}</div>
                        <div className="flex items-center text-gray-600 text-sm mt-1 mb-2 gap-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="truncate">{caregiver.location}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {caregiver.services.map((service: string) => (
                            <span key={service} className="inline-block bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'einstellungen' && (
          <>
            {/* Tierarzt-Informationen und Notfallkontakt */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tierarzt-Informationen */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Shield className="h-5 w-5" />Tierarzt-Informationen</h2>
                <div className="bg-white rounded-xl shadow-sm p-4 text-gray-600 relative">
                  {/* Edit-Button oben rechts */}
                  {!editVet && (
                    <button
                      type="button"
                      className="absolute top-4 right-4 text-gray-400 hover:text-primary-600 transition-colors"
                      aria-label="Tierarzt-Informationen bearbeiten"
                      onClick={() => setEditVet(true)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {vetLoading ? (
                    <div className="text-gray-500">Tierarzt-Informationen werden geladen ...</div>
                  ) : vetError ? (
                    <div className="text-red-500">{vetError}</div>
                  ) : !editVet ? (
                    <>
                      <div className="mb-2"><span className="font-medium">Name:</span> {vetData.name || '—'}</div>
                      <div className="mb-2"><span className="font-medium">Adresse:</span> {vetData.address || '—'}</div>
                      <div className="mb-2"><span className="font-medium">Telefon:</span> {vetData.phone || '—'}</div>
                      {vetSaveMsg && <div className="text-green-600 text-sm mt-2">{vetSaveMsg}</div>}
                    </>
                  ) : (
                    <>
                      <div className="mb-2">
                        <span className="font-medium">Name:</span>
                        <input type="text" className="input mt-1" value={vetData.name} onChange={e => setVetData(d => ({ ...d, name: e.target.value }))} />
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Adresse:</span>
                        <input type="text" className="input mt-1" value={vetData.address} onChange={e => setVetData(d => ({ ...d, address: e.target.value }))} />
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Telefon:</span>
                        <input 
                          type="tel" 
                          className="input mt-1" 
                          value={vetData.phone} 
                          onChange={e => setVetData(d => ({ ...d, phone: e.target.value }))}
                          placeholder="+49 123 456789"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm" onClick={handleSaveVet} disabled={vetLoading}>Speichern</button>
                        <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm" onClick={() => setEditVet(false)} disabled={vetLoading}>Abbrechen</button>
                      </div>
                      {vetSaveMsg && <div className="text-green-600 text-sm mt-2">{vetSaveMsg}</div>}
                    </>
                  )}
                </div>
              </div>

              {/* Notfallkontakt */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Phone className="h-5 w-5" />Notfallkontakt</h2>
                <div className="bg-white rounded-xl shadow-sm p-4 text-gray-600 relative">
                  {/* Edit-Button oben rechts */}
                  {!editEmergency && (
                    <button
                      type="button"
                      className="absolute top-4 right-4 text-gray-400 hover:text-primary-600 transition-colors"
                      aria-label="Notfallkontakt bearbeiten"
                      onClick={() => setEditEmergency(true)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {emergencyLoading ? (
                    <div className="text-gray-500">Notfallkontakt wird geladen ...</div>
                  ) : emergencyError ? (
                    <div className="text-red-500">{emergencyError}</div>
                  ) : !editEmergency ? (
                    <>
                      <div className="mb-2"><span className="font-medium">Name:</span> {emergencyData.name || '—'}</div>
                      <div><span className="font-medium">Telefon:</span> {emergencyData.phone || '—'}</div>
                      {emergencySaveMsg && <div className="text-green-600 text-sm mt-2">{emergencySaveMsg}</div>}
                    </>
                  ) : (
                    <>
                      <div className="mb-2">
                        <span className="font-medium">Name:</span>
                        <input type="text" className="input mt-1" value={emergencyData.name} onChange={e => setEmergencyData(d => ({ ...d, name: e.target.value }))} />
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Telefon:</span>
                        <input 
                          type="tel" 
                          className="input mt-1" 
                          value={emergencyData.phone} 
                          onChange={e => setEmergencyData(d => ({ ...d, phone: e.target.value }))}
                          placeholder="+49 123 456789"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm" onClick={handleSaveEmergency} disabled={emergencyLoading}>Speichern</button>
                        <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm" onClick={() => setEditEmergency(false)} disabled={emergencyLoading}>Abbrechen</button>
                      </div>
                      {emergencySaveMsg && <div className="text-green-600 text-sm mt-2">{emergencySaveMsg}</div>}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Betreuungsvorlieben */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Betreuungsvorlieben
              </h2>
              <div className="bg-white rounded-xl shadow-sm p-4 relative">
                {/* Edit-Button oben rechts */}
                {!editPrefs && (
                  <button
                    type="button"
                    className="absolute top-4 right-4 text-gray-400 hover:text-primary-600 transition-colors"
                    aria-label="Betreuungsvorlieben bearbeiten"
                    onClick={handleEditPrefs}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                )}
                {prefsLoading ? (
                  <div className="text-gray-500">Betreuungsvorlieben werden geladen ...</div>
                ) : prefsError ? (
                  <div className="text-red-500">{prefsError}</div>
                ) : !editPrefs ? (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Gewünschte Services</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ALL_SERVICES.map((service) => (
                          <label key={service} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={services.includes(service)}
                              disabled
                              className="h-4 w-4 text-primary-600 border-gray-300 rounded cursor-not-allowed"
                            />
                            <span className="text-gray-700">{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-3">Sonstige Wünsche</h3>
                      {otherWishes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {otherWishes.map((wish, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-50 text-primary-700"
                            >
                              {wish}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {prefsSaveMsg && <span className="text-green-600 text-sm mt-2">{prefsSaveMsg}</span>}
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Gewünschte Services</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ALL_SERVICES.map((service) => (
                          <label key={service} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editServices.includes(service)}
                              onChange={() => handleEditServiceToggle(service)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="text-gray-700">{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-3">Sonstige Wünsche</h3>
                      {editOtherWishes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {editOtherWishes.map((wish, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-50 text-primary-700"
                            >
                              {wish}
                              <button
                                type="button"
                                className="ml-2 text-primary-500 hover:text-primary-700"
                                onClick={() => handleEditRemoveOtherWish(idx)}
                                aria-label={`${wish} entfernen`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder="Neuen Wunsch eingeben..."
                          value={editNewOtherWish}
                          onChange={(e) => {
                            setEditNewOtherWish(e.target.value);
                            setEditOtherWishError(null);
                          }}
                          onKeyDown={handleEditOtherWishKeyDown}
                        />
                        <button
                          type="button"
                          className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50"
                          onClick={handleEditAddOtherWish}
                          disabled={!editNewOtherWish.trim()}
                          aria-label="Wunsch hinzufügen"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="p-2 text-gray-400 hover:text-gray-600"
                          onClick={() => {
                            setEditNewOtherWish('');
                            setEditOtherWishError(null);
                          }}
                          aria-label="Eingabe löschen"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {editOtherWishError && (
                        <p className="text-red-500 text-sm mt-1">{editOtherWishError}</p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                        onClick={handleSaveEditPrefs}
                        disabled={!prefsChanged || prefsLoading}
                      >
                        {prefsLoading ? 'Speichern...' : 'Speichern'}
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                        onClick={handleCancelEditPrefs}
                        disabled={prefsLoading}
                      >
                        Abbrechen
                      </button>
                      {prefsSaveMsg && <span className="text-green-600 text-sm mt-2">{prefsSaveMsg}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Informationen teilen */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informationen mit Betreuern teilen
              </h2>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <p className="text-gray-600 mb-6">
                  Wählen Sie aus, welche Informationen Sie mit Ihren Betreuern teilen möchten. 
                  Diese Einstellungen gelten für alle aktuellen und zukünftigen Betreuer-Kontakte.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">Telefonnummer</h4>
                      <p className="text-sm text-gray-500">Ermöglicht direkten Kontakt in Notfällen</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSettings.phoneNumber}
                        onChange={() => handleShareToggle('phoneNumber')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">E-Mail-Adresse</h4>
                      <p className="text-sm text-gray-500">Für schriftliche Kommunikation und Updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSettings.email}
                        onChange={() => handleShareToggle('email')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">Adresse</h4>
                      <p className="text-sm text-gray-500">PLZ und Ort für lokale Betreuung</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSettings.address}
                        onChange={() => handleShareToggle('address')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">Tierarzt-Informationen</h4>
                      <p className="text-sm text-gray-500">Wichtig für medizinische Notfälle</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSettings.vetInfo}
                        onChange={() => handleShareToggle('vetInfo')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">Notfallkontakt</h4>
                      <p className="text-sm text-gray-500">Alternative Ansprechperson in Notfällen</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSettings.emergencyContact}
                        onChange={() => handleShareToggle('emergencyContact')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div>
                      <h4 className="font-medium text-gray-900">Tier-Details</h4>
                      <p className="text-sm text-gray-500">Alter, Rasse und besondere Eigenschaften</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSettings.petDetails}
                        onChange={() => handleShareToggle('petDetails')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Betreuungsvorlieben</h4>
                      <p className="text-sm text-gray-500">Gewünschte Services und spezielle Wünsche</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareSettings.carePreferences}
                        onChange={() => handleShareToggle('carePreferences')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>

                {/* Status-Nachrichten */}
                {shareSettingsLoading && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm">Datenschutz-Einstellungen werden gespeichert...</p>
                  </div>
                )}
                {shareSettingsError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{shareSettingsError}</p>
                  </div>
                )}
                {shareSettingsSaveMsg && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">{shareSettingsSaveMsg}</p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Datenschutz-Hinweis</p>
                      <p className="text-blue-700 mt-1">
                        Ihre Daten werden nur mit den von Ihnen ausgewählten Betreuern geteilt und sind durch unsere Datenschutzrichtlinien geschützt. 
                        Sie können diese Einstellungen jederzeit ändern. Ihre freigegebenen Daten sind für gespeicherte Betreuer im deren Dashboard unter "Kunden" einsehbar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Konto löschen */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Konto löschen
              </h2>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
                <div className="bg-red-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800">Achtung - Irreversible Aktion</p>
                      <p className="text-red-700 mt-1">
                        Das Löschen Ihres Kontos ist endgültig und kann nicht rückgängig gemacht werden. 
                        Alle Ihre Daten, Haustier-Profile und Betreuungsverläufe werden endgültig entfernt.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Was wird gelöscht:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                    <li>Ihr Benutzerprofil und alle persönlichen Daten</li>
                    <li>Alle Haustier-Profile und deren Fotos</li>
                    <li>Betreuungsvorlieben und Einstellungen</li>
                    <li>Tierarzt- und Notfallkontaktinformationen</li>
                    <li>Kommunikationsverlauf mit Betreuern</li>
                    <li>Alle Bewertungen und Feedback</li>
                  </ul>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  {!showDeleteConfirmation ? (
                    <button
                      type="button"
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      onClick={() => setShowDeleteConfirmation(true)}
                    >
                      Konto löschen
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 font-medium mb-2">
                          Sind Sie sicher, dass Sie Ihr Konto löschen möchten?
                        </p>
                        <p className="text-yellow-700 text-sm">
                          Geben Sie zur Bestätigung "KONTO LÖSCHEN" in das Feld unten ein:
                        </p>
                      </div>
                      
                      <input
                        type="text"
                        className="input w-full max-w-xs"
                        placeholder="KONTO LÖSCHEN"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      />
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmationText !== 'KONTO LÖSCHEN' || isDeleting}
                        >
                          {isDeleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
                        </button>
                        <button
                          type="button"
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          onClick={() => {
                            setShowDeleteConfirmation(false);
                            setDeleteConfirmationText('');
                          }}
                          disabled={isDeleting}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Delete Caretaker Confirmation Modal */}
      {showDeleteCaretakerModal && caretakerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Betreuer entfernen</h2>
            </div>
            
            <p className="text-gray-700 mb-4 leading-relaxed">
              Möchten Sie <span className="font-medium">{caretakerToDelete.name}</span> wirklich entfernen?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Was passiert beim Entfernen:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Die Verbindung zwischen Ihnen wird gelöscht</li>
                    <li>Sie sehen sich nicht mehr in den jeweiligen Listen</li>
                    <li>Geteilte Kontaktdaten werden verborgen</li>
                    <li>Der Chat-Verlauf bleibt bestehen</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geben Sie zur Bestätigung "BETREUER ENTFERNEN" ein:
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="BETREUER ENTFERNEN"
                value={deleteCaretakerConfirmationText}
                onChange={(e) => setDeleteCaretakerConfirmationText(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteCaretakerConfirm}
                disabled={deleteCaretakerConfirmationText !== 'BETREUER ENTFERNEN'}
              >
                Endgültig entfernen
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={handleDeleteCaretakerCancel}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboardPage; 