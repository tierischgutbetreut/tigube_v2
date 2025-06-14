import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Shield, Calendar, MessageCircle, Heart, HeartOff, ArrowLeft, Verified, ChevronRight, CheckCircle, Edit3 } from 'lucide-react';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AvailabilityDisplay from '../components/ui/AvailabilityDisplay';
import { ReviewForm } from '../components/ui/ReviewForm';
import { caretakerSearchService } from '../lib/supabase/db';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../lib/auth/AuthContext';
import { getOrCreateConversation } from '../lib/supabase/chatService';
import useFeatureAccess from '../hooks/useFeatureAccess';

interface Caretaker {
  id: string | null;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  services: any[]; // Json[] von Supabase - kann string[] oder andere Typen enthalten
  bio: string;
  responseTime: string;
  verified: boolean;
  experienceYears?: number;
  fullBio?: string;
  qualifications: string[];
  availability?: any;
  phone?: string | null;
  email?: string | null;
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
  const { checkFeature, trackUsage, isBetaActive } = useFeatureAccess();
  const [isFavorite, setIsFavorite] = useState(false);
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
          setCaretaker(data);
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
  }, [id]);

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
      // Feature Gate Check: Contact Request Limit
      // Beta users get unlimited access
      if (!isBetaActive) {
        const accessCheck = await checkFeature('contact_request', caretaker.id);
        
        if (!accessCheck.allowed) {
          // Show upgrade prompt
          console.log('Feature blocked:', accessCheck.reason);
          setIsContactLoading(false);
          // TODO: Implement modal for upgrade prompt
          navigate('/mitgliedschaften?feature=contact_request');
          return;
        }
        
        // Track feature usage
        await trackUsage('contact_request', caretaker.id);
      }

      // Erstelle oder finde bestehende Konversation
      const { data: conversation, error } = await getOrCreateConversation({
        owner_id: user.id,
        caretaker_id: caretaker.id
      });

      if (error) {
        console.error('Fehler beim Erstellen der Konversation:', error);
        // TODO: Toast-Benachrichtigung anzeigen
        return;
      }

      if (conversation) {
        // Navigiere zum Chat
        navigate(`/nachrichten/${conversation.id}`);
      }
    } catch (error) {
      console.error('Unerwarteter Fehler beim Kontaktieren:', error);
      // TODO: Toast-Benachrichtigung anzeigen
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
                {caretaker.verified && (
                  <div className="absolute top-4 right-4 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                    <Verified className="h-3 w-3 mr-1" /> Verifiziert
                  </div>
                )}
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
                    {/* Herz-Icon neben dem Namen, rechts */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="p-1 focus:ring-0 focus:ring-offset-0"
                    >
                      {isFavorite ? (
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
                  .map(service => (
                    <div key={service} className="flex justify-between items-center">
                      <span className="text-gray-800 font-medium">{service}</span>
                      <span className="text-lg font-semibold text-primary-600">
                        {caretaker.hourlyRate > 0 ? `${formatCurrency(caretaker.hourlyRate)} €/hr` : 'Auf Anfrage'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

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