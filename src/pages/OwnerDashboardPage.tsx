import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { MapPin, Phone, PawPrint, Edit, Calendar, Shield, Heart, MessageCircle, Trash } from 'lucide-react';
import { mockPetOwners, mockBookings, mockCaregivers } from '../data/mockData';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ownerPreferencesService } from '../lib/supabase/db';

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

function OwnerDashboardPage() {
  // Demo: initiale Services (später aus DB laden)
  const [services, setServices] = useState<string[]>(['Gassi-Service', 'Haustierbetreuung', 'Übernachtung']);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [otherWishes, setOtherWishes] = useState<string[]>(['']);

  const handleServiceToggle = (service: string) => {
    setServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleOtherWishChange = (idx: number, value: string) => {
    setOtherWishes((prev) => prev.map((w, i) => (i === idx ? value : w)));
  };

  const handleAddOtherWish = () => {
    setOtherWishes((prev) => [...prev, '']);
  };

  const handleRemoveOtherWish = (idx: number) => {
    setOtherWishes((prev) => prev.filter((_, i) => i !== idx));
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

  // Enter-Speicher-Handler für Input-Felder
  const handleOtherWishKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  // Kontakte: Alle Betreuer, mit denen Buchungen existieren
  const contacts = mockBookings
    .filter((b) => b.petOwnerId === owner.id)
    .map((b) => mockCaregivers.find((c) => c.id === b.caregiverId))
    .filter(Boolean);

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="container-custom max-w-4xl">
        {/* Profil-Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-center gap-8 mb-8">
          <img
            src={owner.avatar}
            alt={owner.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-primary-100 shadow"
          />
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold mb-1">{owner.name}</h1>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" /> {owner.location}
                </div>
              </div>
              <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>
                Profil bearbeiten
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {owner.pets.map((pet) => (
                <span key={pet.id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-50 text-primary-700">
                  <PawPrint className="h-4 w-4 mr-1" />{pet.name} ({pet.type})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Haustiere */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><PawPrint className="h-5 w-5" />Meine Tiere</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {owner.pets.map((pet) => (
              <div key={pet.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center">
                <img src={pet.image} alt={pet.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary-100" />
                <div>
                  <div className="font-bold text-lg">{pet.name}</div>
                  <div className="text-gray-600 text-sm">{pet.type} • {pet.breed}</div>
                  <div className="text-gray-500 text-sm">Alter: {pet.age} Jahre</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kontakte */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Heart className="h-5 w-5" />Meine Kontakte</h2>
          {contacts.length === 0 ? (
            <div className="text-gray-500">Noch keine Kontakte.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contacts.map((caregiver: any) => (
                <div key={caregiver.id} className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-center">
                  <img src={caregiver.avatar} alt={caregiver.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary-100" />
                  <div className="flex-1">
                    <div className="font-bold text-lg">{caregiver.name}</div>
                    <div className="text-gray-600 text-sm flex items-center gap-2"><MapPin className="h-4 w-4" />{caregiver.location}</div>
                    <div className="text-gray-500 text-sm mt-1">{caregiver.services.join(', ')}</div>
                  </div>
                  <Button variant="ghost" leftIcon={<MessageCircle className="h-4 w-4" />}>Nachricht schreiben</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Betreuungswünsche als Checkboxen */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Shield className="h-5 w-5" />Meine Betreuungswünsche</h2>
          <div className="bg-white rounded-xl shadow-sm p-4 text-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {ALL_SERVICES.map((service) => (
                <label key={service} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-primary-600 border-gray-300 rounded"
                    checked={services.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                  />
                  <span>{service}</span>
                </label>
              ))}
            </div>
            {/* Sonstige Wünsche als Input-Liste */}
            <div className="mb-4">
              <label className="block font-medium mb-1">Sonstige Wünsche</label>
              <div className="space-y-2">
                {otherWishes.map((wish, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-lg p-2"
                      placeholder={`Wunsch ${idx + 1}`}
                      value={wish}
                      onChange={e => handleOtherWishChange(idx, e.target.value)}
                      onKeyDown={handleOtherWishKeyDown}
                    />
                    {otherWishes.length > 1 && (
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700 px-2"
                        onClick={() => handleRemoveOtherWish(idx)}
                        aria-label="Wunsch entfernen"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="mt-1 text-primary-600 hover:underline text-sm"
                  onClick={handleAddOtherWish}
                >
                  + Weiteren Wunsch hinzufügen
                </button>
              </div>
            </div>
            <Button variant="primary" onClick={handleSave} isLoading={saving}>
              Betreuungswünsche speichern
            </Button>
            {saveMsg && <div className="mt-2 text-sm text-primary-600">{saveMsg}</div>}
          </div>
        </div>

        {/* Tierarzt-Informationen */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Shield className="h-5 w-5" />Tierarzt-Informationen</h2>
          <div className="bg-white rounded-xl shadow-sm p-4 text-gray-600">
            <div className="mb-2"><span className="font-medium">Name:</span> Dr. med. vet. Sabine Müller</div>
            <div className="mb-2"><span className="font-medium">Adresse:</span> Tierklinik Berlin, Hauptstraße 123, 10115 Berlin</div>
            <div className="mb-2"><span className="font-medium">Telefon:</span> 030 12345678</div>
            {/* TODO: Editierfunktion und echte Datenanbindung */}
          </div>
        </div>

        {/* Notfallkontakt */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Phone className="h-5 w-5" />Notfallkontakt</h2>
          <div className="bg-white rounded-xl shadow-sm p-4 text-gray-600">
            <div className="mb-2"><span className="font-medium">Name:</span> Max Mustermann</div>
            <div><span className="font-medium">Telefon:</span> 0176 98765432</div>
            {/* TODO: Editierfunktion und echte Datenanbindung */}
          </div>
        </div>

        {/* Aktionen */}
        <div className="flex justify-end gap-4">
          <Button variant="primary" leftIcon={<Heart className="h-4 w-4" />}>Betreuer finden</Button>
          <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>Profil bearbeiten</Button>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboardPage; 