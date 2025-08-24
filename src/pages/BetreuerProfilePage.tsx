import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Shield, Calendar, MessageCircle, Heart, HeartOff, ArrowLeft, Verified, ChevronRight, CheckCircle, Edit3, Briefcase, Globe } from 'lucide-react';
import { DE, GB, FR, ES, IT, PT, NL, RU, PL, TR, AE } from 'country-flag-icons/react/3x2';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AvailabilityDisplay from '../components/ui/AvailabilityDisplay';
import { ReviewForm } from '../components/ui/ReviewForm';
import { caretakerSearchService, ownerCaretakerService } from '../lib/supabase/db';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../lib/auth/AuthContext';
import { getOrCreateConversation } from '../lib/supabase/chatService';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useShortTermAvailability } from '../contexts/ShortTermAvailabilityContext';
import HomePhotosSection from '../components/ui/HomePhotosSection';

interface Caretaker {
  id: string | null;
  userId?: string; // users.id des Betreuers für Chat/Conversations
  name: string;
  avatar: string;
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  prices?: Record<string, number | string>; // Service-spezifische Preise
  services: any[]; // Json[] von Supabase - kann string[] oder andere Typen enthalten
  bio: string;
  responseTime: string;
  verified: boolean;
  isCommercial?: boolean;
  experienceYears?: number;
  fullBio?: string;
  qualifications: string[];
  languages?: string[]; // Sprachen die der Betreuer spricht
  availability?: any;
  phone?: string | null;
  email?: string | null;
  home_photos?: string[]; // Umgebungsbilder aus dem caretaker-home-photos Bucket
  short_term_available?: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  user_id: string | null;
  users?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

function BetreuerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { checkFeature, canSendContactRequest, trackUsage, subscription } = useFeatureAccess();
  const { shortTermAvailable } = useShortTermAvailability();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [caretaker, setCaretaker] = useState<Caretaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isContactLoading, setIsContactLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  useEffect(() => {
    const fetchCaretaker = async () => {
      if (!id) {
        setError('Keine Betreuer-ID angegeben');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await caretakerSearchService.getCaretakerById(id);
        
        if (fetchError) {
          setError('Fehler beim Laden des Betreuer-Profils');
          setCaretaker(null);
        } else if (!data) {
          setError('Betreuer nicht gefunden');
          setCaretaker(null);
        } else {
          // Override short_term_available with context value if this is the current user's profile
          const updatedData = {
            ...data,
            short_term_available: user && data.userId === user.id ? shortTermAvailable : data.short_term_available
          };
          setCaretaker(updatedData);
        }
      } catch (err) {
        console.error('Error fetching caretaker:', err);
        setError('Unerwarteter Fehler beim Laden des Profils');
        setCaretaker(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCaretaker();
  }, [id, user, shortTermAvailable]);

  // Update caretaker's short_term_available when context changes
  useEffect(() => {
    if (caretaker && user && caretaker.userId === user.id) {
      setCaretaker(prev => prev ? {
        ...prev,
        short_term_available: shortTermAvailable
      } : null);
    }
  }, [shortTermAvailable, caretaker?.userId, user?.id]);

  // Lade Favoriten-Status wenn User eingeloggt ist
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!user || !id) return;
      
      try {
        const { isFavorite: favoriteStatus } = await ownerCaretakerService.isFavorite(user.id, id);
        setIsFavorite(favoriteStatus);
      } catch (error) {
        console.error('Error fetching favorite status:', error);
      }
    };

    fetchFavoriteStatus();
  }, [user, id]);

  // Bewertungen von echter DB laden
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      
      setReviewsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            user_id,
            users(first_name, last_name)
          `)
          .eq('caretaker_id', id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setReviews(data);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  // Funktion zum Abkürzen des Nachnamens
  const formatCaretakerName = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length <= 1) return name;
    
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    
    if (lastName && lastName.length > 0) {
      return `${firstName} ${lastName.charAt(0)}.`;
    }
    
    return name;
  };

  // Kontakt-Button Handler mit Feature Gate
  const handleContactClick = async () => {
    if (!isAuthenticated || !user) {
      // Umleitung zur Login-Seite mit return URL
      navigate(`/anmelden?redirect=${encodeURIComponent(`/betreuer/${id}`)}&action=contact&caretaker=${encodeURIComponent(caretaker?.name || '')}`);
      return;
    }

    if (!caretaker?.id) {
      console.error('Caretaker ID fehlt');
      return;
    }

    setIsContactLoading(true);

    try {
      // Feature Gate Check: Kontaktanfrage (Premium = immer erlaubt, Free = Limit prüfen)
      const allowed = await canSendContactRequest();

      if (!allowed) {
        setIsContactLoading(false);
        navigate('/mitgliedschaften?feature=contact_request');
        return;
      }

      // Track feature usage (nur für Free relevant, Premium ist unbegrenzt ok)
      await trackUsage('contact_request');

      // Erstelle oder finde bestehende Konversation
      const { data: conversation, error } = await getOrCreateConversation({
        owner_id: user.id,
        caretaker_id: caretaker.userId || ''
      });

      if (conversation && !error) {
        // Navigiere direkt in die Konversation
        navigate(`/nachrichten/${conversation.id}`);
      } else {
        console.warn('Konversation konnte nicht erstellt/gefunden werden. Öffne Nachrichtenübersicht.', error);
        // Fallback: Öffne Nachrichten-Übersicht, damit der Chatbereich erreichbar ist
        navigate('/nachrichten');
      }
    } catch (error) {
      console.error('Unerwarteter Fehler beim Kontaktieren:', error);
      // Fallback auch bei Fehler: Nachrichtenübersicht öffnen
      navigate('/nachrichten');
    } finally {
      setIsContactLoading(false);
    }
  };

  // Review Submit Handler
  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user || !caretaker?.id) {
      console.error('User or caretaker ID missing');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          caretaker_id: caretaker.id,
          rating,
          comment: comment || null
        });

      if (error) {
        console.error('Error submitting review:', error);
        // TODO: Show error toast
        return;
      }

      // Refresh reviews list
      const { data: newReviews, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          user_id,
          users(first_name, last_name)
        `)
        .eq('caretaker_id', caretaker.id)
        .order('created_at', { ascending: false });

      if (!fetchError && newReviews) {
        setReviews(newReviews);
      }

      setShowReviewForm(false);
      // TODO: Show success toast
    } catch (error) {
      console.error('Unexpected error submitting review:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Favoriten Toggle Handler
  const handleFavoriteToggle = async () => {
    if (!isAuthenticated || !user) {
      // Umleitung zur Login-Seite mit return URL
      navigate(`/anmelden?redirect=${encodeURIComponent(`/betreuer/${id}`)}&action=favorite&caretaker=${encodeURIComponent(caretaker?.name || '')}`);
      return;
    }

    if (!caretaker?.id) {
      console.error('Caretaker ID fehlt');
      return;
    }

    setIsFavoriteLoading(true);

    try {
      const { isFavorite: newFavoriteStatus, error } = await ownerCaretakerService.toggleFavorite(user.id, caretaker.id);
      
      if (error) {
        console.error('Fehler beim Aktualisieren der Favoriten:', error);
        // TODO: Toast-Benachrichtigung anzeigen
        return;
      }

      setIsFavorite(newFavoriteStatus);
      // TODO: Success Toast anzeigen
    } catch (error) {
      console.error('Unerwarteter Fehler beim Favorisieren:', error);
      // TODO: Toast-Benachrichtigung anzeigen
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !caretaker) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {error || 'Betreuer nicht gefunden'}
        </h1>
        <p className="mb-8">
          {error || 'Der gesuchte Betreuer existiert nicht oder wurde entfernt.'}
        </p>
        <Link to="/suche" className="btn btn-primary">
          <Button variant="primary">Zurück zur Suche</Button>
        </Link>
      </div>
    );
  }

  const displayName = formatCaretakerName(caretaker.name);

  // Sprach-zu-Code Mapping
  const getLanguageFlag = (language: string) => {
    const languageMap: Record<string, any> = {
      'Deutsch': DE,
      'Englisch': GB,
      'English': GB,
      'Französisch': FR,
      'Français': FR,
      'Spanisch': ES,
      'Español': ES,
      'Italienisch': IT,
      'Italiano': IT,
      'Portugiesisch': PT,
      'Português': PT,
      'Niederländisch': NL,
      'Nederlands': NL,
      'Russisch': RU,
      'Русский': RU,
      'Polnisch': PL,
      'Polski': PL,
      'Türkisch': TR,
      'Türkçe': TR,
      'Arabisch': AE,
      'العربية': AE
    };
    
    return languageMap[language] || null; // Fallback für unbekannte Sprachen
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Profile Image */}
            <div className="md:w-1/3 lg:w-1/4">
              <div className="relative rounded-xl overflow-hidden shadow-md">
                <img 
                  src={caretaker.avatar} 
                  alt={displayName}
                  className="w-full aspect-square object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=f3f4f6&color=374151`;
                  }}
                />

              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
                    {caretaker.verified && (
                      <span className="bg-primary-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center">
                        <Verified className="h-2.5 w-2.5 mr-1" /> Verifiziert
                      </span>
                    )}
                    {caretaker.isCommercial && (
                      <span className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md flex items-center">
                        <Briefcase className="h-2.5 w-2.5 mr-1" /> Pro
                      </span>
                    )}
                    {caretaker.short_term_available && (
                      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center">
                        <Clock className="h-2.5 w-2.5 mr-1" /> Kurzfristig Verfügbar
                      </span>
                    )}
                    {/* Herz-Icon neben dem Namen, rechts */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFavoriteToggle}
                      className="p-1 focus:ring-0 focus:ring-offset-0"
                      disabled={isFavoriteLoading}
                      title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                    >
                      {isFavoriteLoading ? (
                        <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                      ) : isFavorite ? (
                        <Heart className="h-5 w-5 text-primary-500 fill-primary-500" />
                      ) : (
                        <Heart className="h-5 w-5 text-primary-500 hover:text-primary-600" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{caretaker.location}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 mr-1" />
                      <span className="font-semibold text-lg">
                        {caretaker.rating > 0 ? caretaker.rating.toFixed(1) : '—'}
                      </span>
                      <span className="text-gray-600 ml-1">
                        ({caretaker.reviewCount} {caretaker.reviewCount === 1 ? 'Bewertung' : 'Bewertungen'})
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {caretaker.hourlyRate > 0 ? `ab ${formatCurrency(caretaker.hourlyRate)}/Std` : 'Preis auf Anfrage'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Services */}
              <div className="flex flex-wrap gap-2 mb-6">
                {caretaker.services
                  .filter(service => typeof service === 'string')
                  .map(service => (
                    <span
                      key={service}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {service}
                    </span>
                  ))}
              </div>
              
              <p className="text-gray-700 mb-6">{caretaker.bio}</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  size="lg"
                  leftIcon={<MessageCircle className="h-4 w-4" />}
                  onClick={handleContactClick}
                  isLoading={isContactLoading}
                  disabled={isContactLoading}
                >
                  {isAuthenticated ? 'Nachricht senden' : 'Kontakt aufnehmen'}
                </Button>
                
                {/* Review Button - only for authenticated owners */}
                {isAuthenticated && user && (
                  <Button 
                    variant="secondary" 
                    size="lg"
                    leftIcon={<Edit3 className="h-4 w-4" />}
                    onClick={() => setShowReviewForm(true)}
                    disabled={showReviewForm}
                  >
                    Bewertung schreiben
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Tabs */}
      <div className="container-custom py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Über {displayName}</h2>
              <p className="text-gray-700 leading-relaxed">{caretaker.fullBio || caretaker.bio}</p>
            </div>

            {/* Verfügbarkeit */}
            <AvailabilityDisplay availability={caretaker.availability} />

            {/* Umgebungsbilder */}
            <HomePhotosSection homePhotos={caretaker.home_photos || []} caretakerName={displayName} />

            {/* Reviews */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">
                Bewertungen ({reviews.length})
              </h2>

              {/* Review Form */}
              {showReviewForm && caretaker && (
                <div className="mb-6">
                  <ReviewForm
                    caretakerId={caretaker.id || ''}
                    caretakerName={displayName}
                    onSubmit={handleReviewSubmit}
                    onCancel={() => setShowReviewForm(false)}
                    isLoading={isSubmittingReview}
                  />
                </div>
              )}

              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Noch keine Bewertungen vorhanden.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leistungen & Preise */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-6">Leistungen & Preise</h2>
              <div className="space-y-6">
                {caretaker.services
                  .filter(service => typeof service === 'string')
                  .map(service => {
                    // Suche Service-spezifischen Preis
                    const servicePrice = caretaker.prices && caretaker.prices[service];
                    
                    // Prüfe ob ein gültiger Preis vorhanden ist (nicht leer, nicht null, nicht undefined)
                    const hasValidPrice = servicePrice && 
                      servicePrice !== '' && 
                      servicePrice !== null && 
                      servicePrice !== undefined &&
                      (typeof servicePrice === 'number' ? servicePrice > 0 : parseFloat(servicePrice) > 0);
                    
                    const displayPrice = hasValidPrice
                      ? (typeof servicePrice === 'string' ? `${servicePrice}€` : `${servicePrice}€`)
                      : 'Preis auf Anfrage';
                    
                    return (
                      <div key={service} className="flex justify-between items-center">
                        <span className="text-gray-800 font-medium">{service}</span>
                        <span className="text-lg font-semibold text-primary-600">
                          {displayPrice}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Sprachen */}
            {caretaker.languages && caretaker.languages.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-6 flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-primary-600" />
                  Sprachen
                </h2>
                <div className="flex flex-wrap gap-3">
                  {caretaker.languages.map((language, index) => {
                    const FlagComponent = getLanguageFlag(language);
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"
                      >
                        {FlagComponent && (
                          <FlagComponent 
                            className="w-5 h-4 rounded-sm border border-gray-300 shadow-sm" 
                            title={language}
                          />
                        )}
                        <span className="text-gray-700 font-medium">{language}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fähigkeiten & Qualifikationen */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-6">Fähigkeiten & Qualifikationen</h2>
              <div className="space-y-3">
                {caretaker.qualifications && caretaker.qualifications.length > 0 ? (
                  caretaker.qualifications.map((qualification, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary-500" />
                      <span className="text-gray-700">{qualification}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">Keine Qualifikationen hinterlegt.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  // Nachname abkürzen für Reviewer
  const formatReviewerName = (firstName: string | null, lastName: string | null) => {
    if (!firstName && !lastName) {
      // Verwende Test-Namen basierend auf der Review-ID für Konsistenz
      const testNames = ['Maria S.', 'Thomas K.', 'Anna M.', 'Stefan L.', 'Julia H.'];
      const nameIndex = parseInt(review.id.substring(0, 1), 16) % testNames.length;
      return testNames[nameIndex] || 'Tierbesitzer';
    }
    if (!lastName) return firstName || 'Anonymer Nutzer';
    if (!firstName) return `${lastName.charAt(0)}.`;
    
    return `${firstName} ${lastName.charAt(0)}.`;
  };

  const reviewerName = formatReviewerName(
    review.users?.first_name || null,
    review.users?.last_name || null
  );

  return (
    <div className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < review.rating
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="ml-2 text-sm font-medium text-gray-900">
            {reviewerName}
          </span>
        </div>
        <span className="text-sm text-gray-600">
          {new Date(review.created_at || '').toLocaleDateString('de-DE')}
        </span>
      </div>
      <p className="text-gray-700">{review.comment || ''}</p>
    </div>
  );
}

export default BetreuerProfilePage;