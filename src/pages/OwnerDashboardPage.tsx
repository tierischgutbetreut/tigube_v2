import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { MapPin, Phone, PawPrint, Edit, Calendar, Shield, Heart, MessageCircle, Trash, Check, X, Plus, Upload, LogOut, Settings } from 'lucide-react';
import { mockPetOwners, mockBookings, mockCaregivers } from '../data/mockData';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ownerPreferencesService } from '../lib/supabase/db';
import { useDropzone } from 'react-dropzone';

// Für Demo: Immer Owner 1
const owner = mockPetOwners[0];
const bookings = mockBookings.filter(b => b.petOwnerId === owner.id);

const ALL_SERVICES = [
  'Gassi-Service',
  'Haustierbetreuung',
  'Übernachtung',
  'Kurzbesuche',
  'Haussitting',
  'Hundetagesbetreuung',
];

function PhotoDropzone({ photoUrl, onUpload }: {
  photoUrl?: string;
  onUpload: (file: File) => void;
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
  });
  return (
    <div {...getRootProps()} className={`mt-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white'}`}>
      <input {...getInputProps()} />
      {photoUrl ? (
        <img src={photoUrl} alt="Tierfoto" className="h-24 w-24 object-cover rounded-full mb-2" />
      ) : (
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
      )}
      <p className="text-sm text-gray-600 mb-1">{isDragActive ? 'Bild hier ablegen ...' : 'Bild hierher ziehen oder klicken, um hochzuladen'}</p>
      <p className="text-xs text-gray-500">PNG, JPG, GIF bis 10MB</p>
    </div>
  );
}

function OwnerDashboardPage() {
  // Demo: initiale Services (später aus DB laden)
  const [services, setServices] = useState<string[]>(['Gassi-Service', 'Haustierbetreuung', 'Übernachtung']);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [otherWishes, setOtherWishes] = useState<string[]>([]);
  const [newOtherWish, setNewOtherWish] = useState('');
  const [otherWishError, setOtherWishError] = useState<string | null>(null);
  // Favoriten-State für Kontakte (Demo, lokal)
  const [favoriteContacts, setFavoriteContacts] = useState<string[]>([]);
  const [pets, setPets] = useState(owner.pets);
  const [showAddPet, setShowAddPet] = useState(false);
  const [newPet, setNewPet] = useState({ name: '', type: '', typeOther: '', breed: '', age: '', image: '' });
  const [activeTab, setActiveTab] = useState<'uebersicht' | 'einstellungen'>('uebersicht');
  const [editData, setEditData] = useState(false);
  const [ownerData, setOwnerData] = useState({
    phoneNumber: owner.phoneNumber || '',
    email: owner.email || '',
    plz: owner.plz || '',
    location: owner.location || ''
  });
  const [editVet, setEditVet] = useState(false);
  const [vetData, setVetData] = useState({
    name: 'Dr. med. vet. Sabine Müller',
    address: 'Tierklinik Berlin, Hauptstraße 123, 10115 Berlin',
    phone: '030 12345678'
  });
  const [editEmergency, setEditEmergency] = useState(false);
  const [emergencyData, setEmergencyData] = useState({
    name: 'Max Mustermann',
    phone: '0176 98765432'
  });
  const [editPet, setEditPet] = useState<string | null>(null);
  const [editPetData, setEditPetData] = useState({ name: '', type: '', typeOther: '', breed: '', age: '', image: '' });
  const [contacts, setContacts] = useState(() => 
    mockBookings
      .filter((b) => b.petOwnerId === owner.id)
      .map((b) => mockCaregivers.find((c) => c.id === b.caregiverId))
      .filter((caregiver): caregiver is typeof caregiver & object => Boolean(caregiver))
  );
  const [shareSettings, setShareSettings] = useState({
    phoneNumber: true,
    email: false,
    address: true,
    vetInfo: true,
    emergencyContact: false,
    petDetails: true,
    carePreferences: true
  });

  const handleServiceToggle = (service: string) => {
    setServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleAddOtherWish = () => {
    const trimmed = newOtherWish.trim();
    if (!trimmed) return;
    const exists = otherWishes.some(w => w.trim().toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setOtherWishError('Dieser Wunsch existiert bereits!');
      return;
    }
    setOtherWishes((prev) => [...prev, trimmed]);
    setNewOtherWish('');
    setOtherWishError(null);
  };

  const handleRemoveOtherWish = (idx: number) => {
    setOtherWishes((prev) => prev.filter((_, i) => i !== idx));
    setOtherWishError(null);
  };

  const handleOtherWishKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOtherWish();
    } else if (e.key === 'Escape') {
      setNewOtherWish('');
      setOtherWishError(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    // TODO: User-ID dynamisch holen
    try {
      // await ownerPreferencesService.savePreferences(userId, { services, otherWishes });
      setSaveMsg('Erfolgreich gespeichert!');
    } catch (e) {
      setSaveMsg('Fehler beim Speichern!');
    } finally {
      setSaving(false);
    }
  };

  const toggleFavorite = (caregiverId: string) => {
    setFavoriteContacts((prev) =>
      prev.includes(caregiverId)
        ? prev.filter((id) => id !== caregiverId)
        : [...prev, caregiverId]
    );
  };

  const handleAddPet = () => {
    if (!newPet.name.trim() || !newPet.type.trim() || (newPet.type === 'Andere' && !newPet.typeOther.trim())) return;
    const typeValue = newPet.type === 'Andere' ? newPet.typeOther : newPet.type;
    setPets(prev => [...prev, { ...newPet, type: typeValue, id: Date.now().toString(), age: Number(newPet.age) }]);
    setNewPet({ name: '', type: '', typeOther: '', breed: '', age: '', image: '' });
    setShowAddPet(false);
  };

  const handlePetPhotoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setNewPet(p => ({ ...p, image: url }));
  };

  const handleEditPet = (pet: any) => {
    setEditPet(pet.id);
    setEditPetData({
      name: pet.name,
      type: pet.type,
      typeOther: '',
      breed: pet.breed,
      age: pet.age.toString(),
      image: pet.image
    });
  };

  const handleSavePet = () => {
    if (!editPetData.name.trim()) return;
    setPets(prev => prev.map(pet => 
      pet.id === editPet 
        ? { ...pet, ...editPetData, age: Number(editPetData.age) }
        : pet
    ));
    setEditPet(null);
    setEditPetData({ name: '', type: '', typeOther: '', breed: '', age: '', image: '' });
  };

  const handleDeletePet = (petId: string) => {
    setPets(prev => prev.filter(pet => pet.id !== petId));
    setEditPet(null);
  };

  const handleEditPetPhotoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setEditPetData(p => ({ ...p, image: url }));
  };

  const handleDeleteContact = (caregiverId: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== caregiverId));
    setFavoriteContacts(prev => prev.filter(id => id !== caregiverId));
  };

  const handleShareToggle = (setting: keyof typeof shareSettings) => {
    setShareSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container-custom max-w-4xl">
        {/* Profil-Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <img
              src={owner.avatar}
              alt={owner.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary-100 shadow mx-auto lg:mx-0"
            />
            
            <div className="flex-1 w-full">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Erste Spalte: Name und Tiere */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-4">{owner.name}</h1>
                  
                  {/* Pet-Badges */}
                  <div className="flex flex-wrap gap-2">
                    {owner.pets.map((pet) => (
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
                          <span className="text-gray-700">{ownerData.plz && ownerData.location ? `${ownerData.plz} ${ownerData.location}` : (ownerData.location || '—')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">{ownerData.phoneNumber || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-gray-700">{ownerData.email || '—'}</span>
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
                            type="text"
                            className="input w-full"
                            value={ownerData.phoneNumber}
                            onChange={e => setOwnerData(d => ({ ...d, phoneNumber: e.target.value }))}
                            placeholder="Telefonnummer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                          <input
                            type="email"
                            className="input w-full"
                            value={ownerData.email}
                            onChange={e => setOwnerData(d => ({ ...d, email: e.target.value }))}
                            placeholder="E-Mail"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
                            onClick={() => setEditData(false)}
                          >
                            Speichern
                          </button>
                          <button
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                            onClick={() => setEditData(false)}
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
                          <img src={pet.image} alt={pet.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary-100" />
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
                        onClick={() => { setShowAddPet(false); setNewPet({ name: '', type: '', typeOther: '', breed: '', age: '', image: '' }); }}
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
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Heart className="h-5 w-5" />Meine Betreuer/in</h2>
              {contacts.length === 0 ? (
                <div className="text-gray-500">Noch keine Kontakte.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {contacts.map((caregiver: any) => (
                    <div key={caregiver.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center relative min-h-[110px]">
                      {/* Favoriten-Herz oben rechts */}
                      <button
                        type="button"
                        className="absolute top-4 right-4 text-primary-500 hover:text-primary-700 transition-colors z-10"
                        aria-label={favoriteContacts.includes(caregiver.id) ? 'Favorit entfernen' : 'Als Favorit markieren'}
                        onClick={() => toggleFavorite(caregiver.id)}
                      >
                        <Heart className="h-7 w-7" fill={favoriteContacts.includes(caregiver.id) ? 'currentColor' : 'none'} />
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
                      {/* Chat und Löschen Icons */}
                      <div className="flex flex-col gap-2 ml-2">
                        <button
                          type="button"
                          className="text-gray-400 hover:text-primary-600 transition-colors"
                          aria-label="Chat öffnen"
                        >
                          <MessageCircle className="h-6 w-6" />
                        </button>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          aria-label="Kontakt löschen"
                          onClick={() => handleDeleteContact(caregiver.id)}
                        >
                          <Trash className="h-5 w-5" />
                        </button>
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
                  <button
                    type="button"
                    className="absolute top-4 right-4 text-gray-400 hover:text-primary-600 transition-colors"
                    aria-label="Tierarzt-Informationen bearbeiten"
                    onClick={() => setEditVet(true)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  {!editVet ? (
                    <>
                      <div className="mb-2"><span className="font-medium">Name:</span> {vetData.name}</div>
                      <div className="mb-2"><span className="font-medium">Adresse:</span> {vetData.address}</div>
                      <div className="mb-2"><span className="font-medium">Telefon:</span> {vetData.phone}</div>
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
                        <input type="text" className="input mt-1" value={vetData.phone} onChange={e => setVetData(d => ({ ...d, phone: e.target.value }))} />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm" onClick={() => setEditVet(false)}>Speichern</button>
                        <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm" onClick={() => setEditVet(false)}>Abbrechen</button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notfallkontakt */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Phone className="h-5 w-5" />Notfallkontakt</h2>
                <div className="bg-white rounded-xl shadow-sm p-4 text-gray-600 relative">
                  {/* Edit-Button oben rechts */}
                  <button
                    type="button"
                    className="absolute top-4 right-4 text-gray-400 hover:text-primary-600 transition-colors"
                    aria-label="Notfallkontakt bearbeiten"
                    onClick={() => setEditEmergency(true)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  {!editEmergency ? (
                    <>
                      <div className="mb-2"><span className="font-medium">Name:</span> {emergencyData.name}</div>
                      <div><span className="font-medium">Telefon:</span> {emergencyData.phone}</div>
                    </>
                  ) : (
                    <>
                      <div className="mb-2">
                        <span className="font-medium">Name:</span>
                        <input type="text" className="input mt-1" value={emergencyData.name} onChange={e => setEmergencyData(d => ({ ...d, name: e.target.value }))} />
                      </div>
                      <div className="mb-2">
                        <span className="font-medium">Telefon:</span>
                        <input type="text" className="input mt-1" value={emergencyData.phone} onChange={e => setEmergencyData(d => ({ ...d, phone: e.target.value }))} />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm" onClick={() => setEditEmergency(false)}>Speichern</button>
                        <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm" onClick={() => setEditEmergency(false)}>Abbrechen</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Betreuungsvorlieben */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Betreuungsvorlieben
              </h2>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Gewünschte Services</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ALL_SERVICES.map((service) => (
                      <label key={service} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={services.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
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
                          <button
                            type="button"
                            className="ml-2 text-primary-500 hover:text-primary-700"
                            onClick={() => handleRemoveOtherWish(idx)}
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
                      value={newOtherWish}
                      onChange={(e) => {
                        setNewOtherWish(e.target.value);
                        setOtherWishError(null);
                      }}
                      onKeyDown={handleOtherWishKeyDown}
                    />
                    <button
                      type="button"
                      className="p-2 text-green-600 hover:text-green-700 disabled:opacity-50"
                      onClick={handleAddOtherWish}
                      disabled={!newOtherWish.trim()}
                      aria-label="Wunsch hinzufügen"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-600"
                      onClick={() => {
                        setNewOtherWish('');
                        setOtherWishError(null);
                      }}
                      aria-label="Eingabe löschen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {otherWishError && (
                    <p className="text-red-500 text-sm mt-1">{otherWishError}</p>
                  )}
                </div>
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

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Datenschutz-Hinweis</p>
                      <p className="text-blue-700 mt-1">
                        Ihre Daten werden nur mit den von Ihnen ausgewählten Betreuern geteilt und sind durch unsere Datenschutzrichtlinien geschützt. 
                        Sie können diese Einstellungen jederzeit ändern.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboardPage; 