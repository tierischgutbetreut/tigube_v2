import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../lib/auth/AuthContext';
import { ownerPublicService } from '../lib/supabase/ownerPublicService';
import type { PublicOwnerProfile } from '../lib/supabase/types';
import { 
  PawPrint, 
  MapPin, 
  Phone, 
  Mail, 
  Shield, 
  Heart,
  Calendar,
  ArrowLeft,
  Lock,
  AlertTriangle,
  Camera
} from 'lucide-react';
import Button from '../components/ui/Button';

function OwnerPublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<PublicOwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Rate Limiting: Verhindert zu häufige Profile-Zugriffe
  const checkRateLimit = (): boolean => {
    const key = `profile_access_${userId}`;
    const now = Date.now();
    const lastAccess = localStorage.getItem(key);
    
    if (lastAccess) {
      const timeDiff = now - parseInt(lastAccess);
      // Erlaubt maximal einen Zugriff alle 30 Sekunden pro Profil
      if (timeDiff < 30000) {
        return false; // Rate limit exceeded
      }
    }
    
    localStorage.setItem(key, now.toString());
    return true; // Access allowed
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId || !user) {
        setError('Benutzer nicht gefunden');
        setLoading(false);
        return;
      }

      // Rate Limiting Check
      if (!checkRateLimit()) {
        setError('Zu viele Zugriffe auf dieses Profil. Bitte warten Sie 30 Sekunden.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setUnauthorized(false);

      try {
        const { data, error: profileError } = await ownerPublicService.getPublicOwnerProfile(userId, user.id);
        
        if (profileError) {
          if (profileError === 'UNAUTHORIZED') {
            setUnauthorized(true);
          } else {
            setError(profileError);
          }
          setProfile(null);
        } else if (data) {
          setProfile(data);
        } else {
          setError('Profil nicht gefunden');
        }
      } catch (e) {
        console.error('Exception beim Laden des Profils:', e);
        setError('Unbekannter Fehler beim Laden des Profils');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, user]);

  // SEO-Optimierung: Meta-Tags dynamisch setzen
  useEffect(() => {
    if (profile) {
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Tierbesitzer';
      const petNames = profile.pets?.map(pet => pet.name).join(', ') || '';
      const description = `Tierbesitzer-Profil von ${fullName}${petNames ? ` mit ${petNames}` : ''} auf tigube - Professionelle Tierbetreuung finden`;
      
      // Dynamische Meta-Tags setzen
      document.title = `${fullName} - Tierbesitzer-Profil | tigube`;
      
      // Meta Description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);

      // Open Graph Tags für Social Media
      const setMetaProperty = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      setMetaProperty('og:title', `${fullName} - Tierbesitzer-Profil | tigube`);
      setMetaProperty('og:description', description);
      setMetaProperty('og:type', 'profile');
      setMetaProperty('og:url', window.location.href);
      if (profile.profile_photo_url) {
        setMetaProperty('og:image', profile.profile_photo_url);
      }

      // Twitter Card Tags
      const setMetaName = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      setMetaName('twitter:card', 'summary');
      setMetaName('twitter:title', `${fullName} - Tierbesitzer-Profil | tigube`);
      setMetaName('twitter:description', description);
      if (profile.profile_photo_url) {
        setMetaName('twitter:image', profile.profile_photo_url);
      }
    }

    // Cleanup: Standard-Meta-Tags bei Component Unmount
    return () => {
      document.title = 'tigube - Professionelle Tierbetreuung finden';
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'tigube - Die Plattform für professionelle Tierbetreuung. Finden Sie vertrauensvolle Betreuer für Ihre Haustiere.');
      }
    };
  }, [profile]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Profil wird geladen...</p>
        </div>
      </div>
    );
  }

  // Unauthorized Access - Humorvolle Fehlermeldung 😄
  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <PawPrint className="mx-auto h-24 w-24 text-gray-300" />
            <Lock className="absolute -top-2 -right-2 h-12 w-12 text-primary-500 bg-white rounded-full p-2 shadow-lg" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔒 Pssst... das ist privat!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            Du bist nicht berechtigt, dieses Profil zu sehen. 
            Nur Betreuer, die bereits von diesem Tierbesitzer kontaktiert wurden, haben Zugriff! 🐕
          </p>
          
          <div className="bg-primary-50 rounded-lg p-6 mb-8 text-left">
            <div className="flex items-start">
              <Heart className="h-6 w-6 text-primary-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-primary-800 mb-2">
                  Wie bekomme ich Zugriff?
                </h3>
                <ul className="text-sm text-primary-700 space-y-1">
                  <li>• Warte darauf, dass der Tierbesitzer dich kontaktiert</li>
                  <li>• Profile sind nur für bestehende Chat-Partner sichtbar</li>
                  <li>• Erstelle ein attraktives Betreuer-Profil, damit Besitzer dich finden</li>
                </ul>
              </div>
            </div>
          </div>
          
                      <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">
                Noch kein Betreuer? Werde Teil unserer Community!
              </p>
              <Button
                onClick={() => navigate('/registrieren?type=caretaker')}
                variant="outline"
                className="flex items-center justify-center gap-2 mx-auto"
              >
                <Heart className="h-4 w-4" />
                Betreuer werden
              </Button>
            </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Etwas ist schief gelaufen
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>
              Erneut versuchen
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main Profile Content
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Profil nicht gefunden</p>
      </div>
    );
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unbekannter Benutzer';
  const avatarUrl = profile.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=f3f4f6&color=374151`;

  return (
    <div className="bg-gray-50 min-h-screen py-6 sm:py-10">
      <div className="container-custom max-w-4xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
            <button
              onClick={() => navigate('/')}
              className="hover:text-primary-600 transition-colors"
            >
              Home
            </button>
            <span>/</span>
            <button
              onClick={() => navigate('/suche')}
              className="hover:text-primary-600 transition-colors"
            >
              Betreuer suchen
            </button>
            <span>/</span>
            <span className="text-gray-900">Tierbesitzer-Profil</span>
          </nav>
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
        </div>

        {/* Profil-Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <div className="relative w-32 h-32 mx-auto lg:mx-0 flex-shrink-0">
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-100 shadow"
                loading="lazy"
              />
              <div className="absolute bottom-2 right-2 bg-primary-500 rounded-full p-2 shadow">
                <Camera className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <div className="flex-1 w-full text-center lg:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{fullName}</h1>
              
              {/* Haustier-Badges */}
              {profile.pets && profile.pets.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
                  {profile.pets.map((pet) => (
                    <span 
                      key={pet.id} 
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-50 text-primary-700"
                    >
                      <PawPrint className="h-4 w-4 mr-1" />
                      {pet.name} ({pet.type})
                    </span>
                  ))}
                </div>
              )}

              {/* Datenschutz-Hinweis */}
              <div className="bg-blue-50 rounded-lg p-4 text-left">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Geteilte Informationen</p>
                    <p className="text-blue-700 mt-1">
                      Nur freigegebene Daten werden angezeigt. Der Tierbesitzer kann jederzeit 
                      kontrollieren, welche Informationen sichtbar sind.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kontaktdaten */}
        {(profile.phone_number || profile.email || profile.plz || profile.city) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Kontaktdaten
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{profile.phone_number}</span>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{profile.email}</span>
                </div>
              )}
              {(profile.plz || profile.city) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    {profile.plz && profile.city
                      ? `${profile.plz} ${profile.city}`
                      : profile.plz || profile.city}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Haustiere */}
        {profile.pets && profile.pets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Haustiere
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {profile.pets.map((pet) => (
                <div key={pet.id} className="flex gap-4 items-center">
                  {pet.photo_url ? (
                    <img 
                      src={pet.photo_url} 
                      alt={pet.name} 
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary-100" 
                      loading="lazy"
                      onError={(e) => {
                        // Fallback wenn Bild nicht laden kann
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  {/* Fallback Avatar - wird angezeigt wenn kein Bild oder Fehler beim Laden */}
                  <div 
                    className="w-20 h-20 rounded-full bg-gray-100 border-2 border-primary-100 flex items-center justify-center text-gray-400 text-2xl font-bold"
                    style={{ display: pet.photo_url ? 'none' : 'flex' }}
                  >
                    {pet.name ? pet.name.charAt(0) : <PawPrint className="h-8 w-8" />}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{pet.name}</div>
                    <div className="text-gray-600 text-sm">
                      {pet.type}
                      {pet.breed && ` • ${pet.breed}`}
                    </div>
                    {pet.age && (
                      <div className="text-gray-500 text-sm">Alter: {pet.age} Jahre</div>
                    )}
                    {pet.gender && (
                      <div className="text-gray-500 text-sm">
                        Geschlecht: {pet.gender === 'Rüde' ? 'Rüde' : pet.gender === 'Hündin' ? 'Hündin' : pet.gender}
                        {pet.neutered && ' (kastriert)'}
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Veterinärinformationen */}
        {profile.vet_info && typeof profile.vet_info === 'string' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tierarzt-Informationen
            </h2>
            <div className="text-gray-700 bg-gray-50 rounded-lg p-4">
              {profile.vet_info.split('\n').map((line: string, index: number) => (
                <p key={index} className="mb-1 last:mb-0">{line || '\u00A0'}</p>
              ))}
            </div>
          </div>
        )}

        {/* Veterinärinformationen - Objekt-Format */}
        {profile.vet_info && typeof profile.vet_info === 'object' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tierarzt-Informationen
            </h2>
            <div className="space-y-2 text-gray-700">
              {profile.vet_info.name && (
                <div><span className="font-medium">Name:</span> {profile.vet_info.name}</div>
              )}
              {profile.vet_info.address && (
                <div><span className="font-medium">Adresse:</span> {profile.vet_info.address}</div>
              )}
              {profile.vet_info.phone && (
                <div><span className="font-medium">Telefon:</span> {profile.vet_info.phone}</div>
              )}
            </div>
          </div>
        )}

        {/* Notfallkontakt */}
        {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Notfallkontakt
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.emergency_contact_name && (
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{profile.emergency_contact_name}</span>
                </div>
              )}
              {profile.emergency_contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{profile.emergency_contact_phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Betreuungshinweise */}
        {profile.care_instructions && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Betreuungshinweise
            </h2>
            <div className="text-gray-700 bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
              {profile.care_instructions.split('\n').map((line: string, index: number) => (
                <p key={index} className="mb-1 last:mb-0">{line || '\u00A0'}</p>
              ))}
            </div>
          </div>
        )}

        {/* Kontakt-Aufruf */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Interesse an einer Zusammenarbeit?</h2>
          <p className="text-gray-600 mb-4">
            Kontaktiere {profile.first_name || 'den Tierbesitzer'} über die Nachrichtenfunktion!
          </p>
          <Button
            onClick={() => navigate('/nachrichten')}
            className="flex items-center justify-center gap-2 mx-auto"
          >
            <Mail className="h-4 w-4" />
            Nachricht senden
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OwnerPublicProfilePage; 