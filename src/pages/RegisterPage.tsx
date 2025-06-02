import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PawPrint as Paw, ChevronLeft, ChevronRight, Upload, Check } from 'lucide-react';
import Button from '../components/ui/Button';

function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'owner';
  
  const [userType, setUserType] = useState<'owner' | 'caregiver'>(initialType === 'caregiver' ? 'caregiver' : 'owner');
  const [step, setStep] = useState(1);
  
  const nextStep = () => {
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-3xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center mb-6">
            <img src="public\Image\Logos\tigube_logo_klein.png" alt="tigube Logo" className="h-10 w-auto mr-2" />
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
        
        {/* User Type Toggle */}
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
                userType === 'caregiver'
                  ? 'bg-primary-500 text-white'
                  : 'bg-transparent text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setUserType('caregiver')}
            >
              Betreuer
            </button>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                    step === stepNumber
                      ? 'bg-primary-500 text-white'
                      : step > stepNumber
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > stepNumber ? <Check className="h-5 w-5" /> : stepNumber}
                </div>
                <span
                  className={`text-sm mt-2 ${
                    step >= stepNumber ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {stepLabels[userType][stepNumber - 1]}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-3">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-full" />
            <div
              className="absolute top-0 left-0 h-1 bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Form Steps */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-8 animate-fade-in">
          {userType === 'owner' ? (
            <>
              {step === 1 && <OwnerStep1 />}
              {step === 2 && <OwnerStep2 />}
              {step === 3 && <OwnerStep3 />}
            </>
          ) : (
            <>
              {step === 1 && <CaregiverStep1 />}
              {step === 2 && <CaregiverStep2 />}
              {step === 3 && <CaregiverStep3 />}
            </>
          )}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={prevStep}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Zurück
            </Button>
          ) : (
            <div />
          )}
          
          {step < 3 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Weiter
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => window.location.href = userType === 'owner' ? '/' : '/caregivers/dashboard'}
            >
              Registrierung abschließen
            </Button>
          )}
        </div>
        
        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Bereits registriert?{' '}
            <Link to="/anmelden" className="text-primary-600 hover:text-primary-700 font-medium">
              Jetzt anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const stepLabels = {
  owner: ['Kontoinformationen', 'Tierdetails', 'Betreuungswünsche'],
  caregiver: ['Kontoinformationen', 'Leistungen', 'Verifizierung'],
};

function OwnerStep1() {
  return (
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
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Passwort
        </label>
        <input
          type="password"
          id="password"
          className="input"
          placeholder="Sicheres Passwort erstellen"
        />
        <p className="text-xs text-gray-500 mt-1">
          Mindestens 8 Zeichen, eine Zahl und ein Sonderzeichen
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
            PLZ
          </label>
          <input
            type="text"
            id="postalCode"
            className="input"
            placeholder="Deine Postleitzahl"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Ort
          </label>
          <input
            type="text"
            id="location"
            className="input"
            placeholder="Deine Stadt"
          />
        </div>
      </div>
      <div className="flex items-start">
        <input
          type="checkbox"
          id="terms"
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
          Ich akzeptiere die{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Nutzungsbedingungen
          </a>{' '}
          und{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Datenschutzbestimmungen
          </a>
        </label>
      </div>
    </div>
  );
}

function OwnerStep2() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Erzähle uns von deinem Tier</h2>
      <div>
        <label htmlFor="petName" className="block text-sm font-medium text-gray-700 mb-1">
          Name des Tieres
        </label>
        <input
          type="text"
          id="petName"
          className="input"
          placeholder="Name deines Tieres"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="petType" className="block text-sm font-medium text-gray-700 mb-1">
            Tierart
          </label>
          <select id="petType" className="input">
            <option value="">Tierart auswählen</option>
            <option value="dog">Hund</option>
            <option value="cat">Katze</option>
            <option value="bird">Vogel</option>
            <option value="rabbit">Kaninchen</option>
            <option value="other">Andere</option>
          </select>
        </div>
        <div>
          <label htmlFor="petBreed" className="block text-sm font-medium text-gray-700 mb-1">
            Rasse
          </label>
          <input
            type="text"
            id="petBreed"
            className="input"
            placeholder="Rasse des Tieres"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="petAge" className="block text-sm font-medium text-gray-700 mb-1">
            Alter
          </label>
          <input
            type="number"
            id="petAge"
            className="input"
            placeholder="Jahre"
            min="0"
          />
        </div>
        <div>
          <label htmlFor="petWeight" className="block text-sm font-medium text-gray-700 mb-1">
            Gewicht (kg)
          </label>
          <input
            type="number"
            id="petWeight"
            className="input"
            placeholder="Gewicht in kg"
            min="0"
          />
        </div>
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Tierfoto
        </span>
        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 flex justify-center">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
              >
                <span>Foto hochladen</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" />
              </label>
              <p className="pl-1">oder per Drag & Drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF bis 10MB</p>
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="petDescription" className="block text-sm font-medium text-gray-700 mb-1">
          Über dein Tier
        </label>
        <textarea
          id="petDescription"
          rows={4}
          className="input"
          placeholder="Beschreibe das Wesen, Vorlieben, Abneigungen und besondere Bedürfnisse deines Tieres"
        ></textarea>
      </div>
      <div className="pt-4">
        <Button
          variant="ghost"
          className="text-primary-600"
          onClick={() => {}}
          leftIcon={<Paw className="h-4 w-4" />}
        >
          Weiteres Tier hinzufügen
        </Button>
      </div>
    </div>
  );
}

function OwnerStep3() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Betreuungswünsche</h2>
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
              />
              <span className="ml-3 text-gray-700">{service}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="vetInfo" className="block text-sm font-medium text-gray-700 mb-1">
          Tierarztinformationen
        </label>
        <textarea
          id="vetInfo"
          rows={3}
          className="input"
          placeholder="Name, Adresse und Kontaktdaten des Tierarztes"
        ></textarea>
      </div>
      <div>
        <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
          Notfallkontakt
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input
            type="text"
            id="emergencyContactName"
            className="input"
            placeholder="Name des Kontakts"
          />
          <input
            type="text"
            id="emergencyContactPhone"
            className="input"
            placeholder="Telefonnummer"
          />
        </div>
      </div>
      <div>
        <label htmlFor="careInstructions" className="block text-sm font-medium text-gray-700 mb-1">
          Besondere Hinweise zur Betreuung
        </label>
        <textarea
          id="careInstructions"
          rows={4}
          className="input"
          placeholder="Besondere Hinweise für Betreuer (Medikamente, Fütterungszeiten, Verhalten, etc.)"
        ></textarea>
      </div>
      <div className="pt-4">
        <div className="bg-primary-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-primary-800">
                Fast geschafft! Nach der Registrierung kannst du Betreuer suchen, Leistungen buchen und die Betreuung deines Tieres verwalten.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaregiverStep1() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Betreuer-Konto erstellen</h2>
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
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Passwort
        </label>
        <input
          type="password"
          id="password"
          className="input"
          placeholder="Sicheres Passwort erstellen"
        />
        <p className="text-xs text-gray-500 mt-1">
          Mindestens 8 Zeichen, eine Zahl und ein Sonderzeichen
        </p>
      </div>
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Telefonnummer
        </label>
        <input
          type="tel"
          id="phoneNumber"
          className="input"
          placeholder="Deine Telefonnummer"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
            PLZ
          </label>
          <input
            type="text"
            id="postalCode"
            className="input"
            placeholder="Deine Postleitzahl"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Ort
          </label>
          <input
            type="text"
            id="location"
            className="input"
            placeholder="Deine Stadt"
          />
        </div>
      </div>
      <div className="flex items-start">
        <input
          type="checkbox"
          id="terms"
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
          Ich akzeptiere die{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Nutzungsbedingungen
          </a>{' '}
          und{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Datenschutzbestimmungen
          </a>
        </label>
      </div>
    </div>
  );
}

function CaregiverStep2() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Deine Leistungen</h2>
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-3">
          Welche Leistungen bietest du an?
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {["Gassi-Service", "Haustierbetreuung", "Übernachtung", "Kurzbesuche", "Haussitting", "Hundetagesbetreuung"].map((service) => (
            <label key={service} className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">{service}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-3">
          Welche Tiere betreust du?
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["Hunde", "Katzen", "Vögel", "Kaninchen", "Fische", "Kleintiere"].map((pet) => (
            <label key={pet} className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">{pet}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-3">
          Lege deine Preise fest
        </span>
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-2 items-center">
            <label htmlFor="rateWalking" className="text-gray-700">
              Gassi-Service (pro 30 Min)
            </label>
            <div className="relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">€</span>
              </div>
              <input
                type="number"
                id="rateWalking"
                className="input pl-7"
                placeholder="15"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 items-center">
            <label htmlFor="rateSitting" className="text-gray-700">
              Haustierbetreuung (pro Besuch)
            </label>
            <div className="relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">€</span>
              </div>
              <input
                type="number"
                id="rateSitting"
                className="input pl-7"
                placeholder="25"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 items-center">
            <label htmlFor="rateBoarding" className="text-gray-700">
              Übernachtung (pro Nacht)
            </label>
            <div className="relative rounded-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">€</span>
              </div>
              <input
                type="number"
                id="rateBoarding"
                className="input pl-7"
                placeholder="35"
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700 mb-1">
          Einsatzgebiet (Km)
        </label>
        <input
          type="number"
          id="serviceArea"
          className="input"
          placeholder="5"
          min="1"
        />
      </div>
      <div>
        <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
          Allgemeine Verfügbarkeit
        </label>
        <textarea
          id="availability"
          rows={3}
          className="input"
          placeholder="Beschreibe deine generelle Verfügbarkeit (z.B. werktags ab 17 Uhr, Wochenenden, etc.)"
        ></textarea>
        <p className="text-xs text-gray-500 mt-1">
          Nach der Registrierung kannst du einen detaillierten Kalender anlegen
        </p>
      </div>
    </div>
  );
}

function CaregiverStep3() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Verifizierung & Profil</h2>
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Profilfoto
        </span>
        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 flex justify-center">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="photo-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
              >
                <span>Foto hochladen</span>
                <input id="photo-upload" name="photo-upload" type="file" className="sr-only" />
              </label>
              <p className="pl-1">oder per Drag & Drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF bis 10MB</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Ein klares Foto von dir schafft Vertrauen bei Tierbesitzern
        </p>
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Fotos von deinem Zuhause (für Übernachtung/Haussitting)
        </span>
        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 flex justify-center">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="home-photos-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
              >
                <span>Fotos hochladen</span>
                <input id="home-photos-upload" name="home-photos-upload" type="file" multiple className="sr-only" />
              </label>
              <p className="pl-1">oder per Drag & Drop</p>
            </div>
            <p className="text-xs text-gray-500">Lade mehrere Fotos deiner Wohnumgebung hoch</p>
          </div>
        </div>
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-3">
          Erfahrung & Qualifikationen
        </span>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-gray-700">Erste-Hilfe am Tier zertifiziert</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-gray-700">Professioneller Hundetrainer</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-gray-700">Tierarzterfahrung</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-gray-700">Tierheim-Erfahrung</span>
          </label>
          
          {/* Eingabefeld für eigene Qualifikationen */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Eigene Qualifikation hinzufügen..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Hinzufügen
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Füge weitere Qualifikationen oder Erfahrungen hinzu, die für die Tierbetreuung relevant sind
            </p>
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
          Beschreibe deine Erfahrung
        </label>
        <textarea
          id="experience"
          rows={4}
          className="input"
          placeholder="Erzähle den Tierbesitzern von deiner Erfahrung mit Tieren, inkl. beruflicher Erfahrung oder eigenen Tieren"
        ></textarea>
      </div>
      <div className="pt-4">
        <div className="bg-primary-50 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-primary-800">
                Geschafft! Nach der Registrierung wird dein Profil von unserem Team geprüft. Hintergrundprüfungen sorgen für Vertrauen und Sicherheit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;