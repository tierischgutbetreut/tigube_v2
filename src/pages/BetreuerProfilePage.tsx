import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Clock, Shield, Calendar, MessageCircle, Heart, HeartOff } from 'lucide-react';
import Button from '../components/ui/Button';
import { mockCaregivers, mockReviews } from '../data/mockData';
import { formatCurrency } from '../lib/utils';

function BetreuerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Find caregiver data
  const caregiver = mockCaregivers.find(c => c.id === id);
  
  // Find reviews for this caregiver
  const caregiverReviews = mockReviews.filter(r => r.caregiverId === id);
  
  if (!caregiver) {
    return (
      <div className="container-custom py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Betreuer nicht gefunden</h1>
        <p className="mb-8">Der gesuchte Betreuer existiert nicht oder wurde entfernt.</p>
        <Link to="/search" className="btn btn-primary">
          Zurück zur Suche
        </Link>
      </div>
    );
  }

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
                  src={caregiver.avatar} 
                  alt={caregiver.name}
                  className="w-full aspect-square object-cover"
                />
                {caregiver.verified && (
                  <div className="absolute top-4 right-4 bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                    <Shield className="h-3 w-3 mr-1" /> Verifiziert
                  </div>
                )}
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="md:w-2/3 lg:w-3/4">
              <div className="flex flex-wrap justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{caregiver.name}</h1>
                  <p className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-4 w-4 mr-1" /> {caregiver.location}
                  </p>
                </div>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFavorite ? (
                    <Heart className="h-6 w-6 fill-primary-500 text-primary-500" />
                  ) : (
                    <HeartOff className="h-6 w-6" />
                  )}
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-accent-500 fill-accent-500 mr-1" />
                  <span className="font-medium">{caregiver.rating}</span>
                  <span className="text-gray-500 text-sm ml-1">({caregiver.reviewCount} Bewertungen)</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-1" /> 
                  Antwortet in {caregiver.responseTime}
                </div>
                <div className="badge badge-primary">
                  {formatCurrency(caregiver.hourlyRate)}/hr
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {caregiver.services.map(service => (
                  <span
                    key={service}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                  >
                    {service}
                  </span>
                ))}
              </div>
              
              <p className="text-gray-700 mb-6">{caregiver.bio}</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => window.location.href = `/booking/${caregiver.id}`}
                >
                  Jetzt buchen
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  leftIcon={<MessageCircle className="h-4 w-4" />}
                >
                  Kontakt
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  leftIcon={<Calendar className="h-4 w-4" />}
                >
                  Verfügbarkeit prüfen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Tabs */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* About Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Über {caregiver.name}</h2>
              <p className="text-gray-700 mb-6">
                Hallo! Ich bin {caregiver.name}, leidenschaftlicher Tierliebhaber aus {caregiver.location}. Ich habe umfassende Erfahrung in der Betreuung aller Arten von Haustieren, von energiegeladenen Hunden bis zu unabhängigen Katzen und sogar Kleintieren.
              </p>
              <p className="text-gray-700 mb-6">
                Meine Herangehensweise an die Tierbetreuung basiert auf Respekt, Liebe und dem Verständnis für die individuellen Bedürfnisse jedes Tieres. Ich biete eine persönliche Betreuung, die Ihr Tier glücklich, gesund und sicher hält, während Sie abwesend sind.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Fähigkeiten & Qualifikationen</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary-500 mt-0.5 mr-2" />
                      <span>Erste-Hilfe am Tier zertifiziert</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary-500 mt-0.5 mr-2" />
                      <span>Medikamentengabe</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary-500 mt-0.5 mr-2" />
                      <span>Grundlegende Kommandos</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary-500 mt-0.5 mr-2" />
                      <span>Seniorenbetreuung für Tiere</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Weitere Informationen</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary-500 mt-0.5 mr-2" />
                      <span>Eigener Transport vorhanden</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary-500 mt-0.5 mr-2" />
                      <span>Kann Updates mit Fotos senden</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary-500 mt-0.5 mr-2" />
                      <span>Hintergrund überprüft</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-primary-500 mt-0.5 mr-2" />
                      <span>Nichtraucherhaushalt</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Bewertungen ({caregiverReviews.length})</h2>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-accent-500 fill-accent-500 mr-1" />
                  <span className="font-medium">{caregiver.rating}</span>
                </div>
              </div>
              
              {caregiverReviews.length > 0 ? (
                <div className="space-y-6">
                  {caregiverReviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Noch keine Bewertungen</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Services & Rates */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Leistungen & Preise</h2>
              <div className="space-y-4">
                {caregiver.services.map(service => (
                  <div key={service} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium">{service}</span>
                    <span className="text-primary-600 font-semibold">
                      {formatCurrency(servicePrice(service, caregiver.hourlyRate))}
                      <span className="text-gray-500 text-sm font-normal">
                        {serviceUnit(service)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Availability Calendar Placeholder */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Verfügbarkeit</h2>
              <div className="text-gray-700 mb-4">
                <p>Prüfe die Verfügbarkeit von {caregiver.name} und buche deinen Wunschtermin.</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center h-64">
                <p className="text-gray-500 text-center">Kalender Platzhalter</p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                leftIcon={<Calendar className="h-4 w-4" />}
              >
                Gesamten Kalender anzeigen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Review {
  id: string;
  caregiverId: string;
  petOwnerId: string;
  bookingId: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  const date = new Date(review.date);
  const formattedDate = date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <div className="border-b border-gray-100 pb-6">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <img
            src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100"
            alt="Pet Owner"
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <p className="font-medium">Tierbesitzer</p>
            <p className="text-sm text-gray-500">{formattedDate}</p>
          </div>
        </div>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? 'text-accent-500 fill-accent-500'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="text-gray-700">{review.comment}</p>
    </div>
  );
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// Helper functions
function servicePrice(service: string, baseRate: number): number {
  switch (service) {
    case 'Dog Walking':
      return baseRate;
    case 'Pet Sitting':
      return baseRate * 1.2;
    case 'Boarding':
      return baseRate * 8;
    case 'Drop-In Visits':
      return baseRate * 0.8;
    case 'House Sitting':
      return baseRate * 10;
    case 'Doggy Day Care':
      return baseRate * 6;
    default:
      return baseRate;
  }
}

function serviceUnit(service: string): string {
  switch (service) {
    case 'Dog Walking':
      return '/30 min';
    case 'Pet Sitting':
      return '/visit';
    case 'Boarding':
      return '/night';
    case 'Drop-In Visits':
      return '/visit';
    case 'House Sitting':
      return '/night';
    case 'Doggy Day Care':
      return '/day';
    default:
      return '/hr';
  }
}

export default BetreuerProfilePage;