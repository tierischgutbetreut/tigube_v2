import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, MapPin, Clock, Shield, Heart, Dog, Cat, Rabbit, Calendar, Briefcase, PawPrint, CheckCircle, X } from 'lucide-react';
import Button from '../components/ui/Button';

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMessage, setShowMessage] = useState(!!location.state?.message);
  const [formLocation, setFormLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [service, setService] = useState('Hundebetreuung');
  const [petType, setPetType] = useState('Hund');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (petType) queryParams.append('petType', petType);
    if (service) queryParams.append('service', service);
    if (formLocation) queryParams.append('location', formLocation);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    navigate(`/suche?${queryParams.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Success Message */}
      {showMessage && location.state?.message && (
        <div className="bg-green-50 border border-green-200 px-4 py-3 relative">
          <div className="flex items-center justify-between container-custom">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">{location.state.message}</span>
            </div>
            <button
              onClick={() => setShowMessage(false)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-white py-16 md:py-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Linke Seite: Text */}
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Liebevolle Betreuung für <span className="text-primary-600">Ihr Haustier</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-xl">
                Finden Sie vertrauensvolle und erfahrene Tierbetreuer in Ihrer Nähe. Ihr Liebling verdient die beste Pflege, wenn Sie nicht da sind.
              </p>
              <form onSubmit={handleSearch} className="bg-white rounded-xl p-4 shadow-md grid grid-cols-1 md:grid-cols-4 gap-4 max-w-xl">

                <div className="flex flex-col md:col-span-2">
                  <label htmlFor="service" className="text-sm font-medium text-gray-700 mb-1">Ich suche</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      id="service"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                    >
                      <option value="Hundebetreuung">Hundebetreuung</option>
                      <option value="Hundetagesbetreuung">Hundetagesbetreuung</option>
                      <option value="Katzenbetreuung">Katzenbetreuung</option>
                      <option value="Gassi-Service">Gassi-Service</option>
                      <option value="Hausbesuche">Hausbesuche</option>
                      <option value="Haussitting">Haussitting</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col md:col-span-2">
                  <label htmlFor="location" className="text-sm font-medium text-gray-700 mb-1">PLZ oder Ort</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="location"
                      type="text"
                      placeholder="Dein Wohnort"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col md:col-span-2">
                  <label htmlFor="startDate" className="text-sm font-medium text-gray-700 mb-1">Von</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="startDate"
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col md:col-span-2">
                  <label htmlFor="endDate" className="text-sm font-medium text-gray-700 mb-1">Bis</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="endDate"
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="md:col-span-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-md transition-colors flex items-center justify-center gap-2 mt-auto"
                >
                  <Search className="w-5 h-5" /> Finde einen Tiersitter
                </button>
              </form>
              <div className="mt-4">
                {/* Demo-Button entfernt */}
              </div>
              <div className="flex gap-4 mt-2">
              </div>
            </div>
            {/* Rechte Seite: Bild mit Overlay */}
            <div className="relative flex justify-center items-center">
              <div className="absolute inset-0 bg-primary-50 rounded-3xl scale-95 z-0" />
              <img
                src="https://images.pexels.com/photos/7210349/pexels-photo-7210349.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Frau mit Hund auf dem Arm"
                className="relative rounded-2xl shadow-xl w-full max-w-md object-cover z-10"
              />
              {/* Overlay-Badge */}
              <div className="absolute top-6 right-6 bg-white/90 rounded-xl shadow px-4 py-2 flex items-center gap-2 z-20">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.385-2.46a1 1 0 00-1.175 0l-3.385 2.46c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.045 9.394c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z"/></svg>
                <span className="font-bold text-gray-900 text-lg">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">So funktioniert tigube</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
            Die passende Betreuung für dein Tier zu finden, ist mit tigube ganz einfach.
            Egal ob du erstmal nur stöbern oder direkt Kontakt aufnehmen willst – folge einfach diesen drei Schritten:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Betreuer entdecken – kostenlos"
              description="Durchstöbere Profile von verifizierten Tierbetreuern in deiner Nähe – ganz ohne Anmeldung.
Filtere nach Service, Preis und Verfügbarkeit – und finde passende Angebote."
            />
            <StepCard
              number="2"
              title="Kontakt aufnehmen & Inserat veröffentlichen"
              description="Du willst mit einem Betreuer schreiben oder ein Jobangebot veröffentlichen?
Dann aktiviere tigube Premium ab 4,90 € und nutze alle Funktionen: Chat, Bilder hochladen, Bewertungen lesen & schreiben – ganz einfach."
            />
            <StepCard
              number="3"
              title="Entspannt zurücklehnen"
              description="Sobald dein Tier in Betreuung ist, kannst du dich entspannt zurücklehnen.
Dank Profil-Bewertungen und sicheren Abläufen bekommst du genau die Fürsorge, die du dir wünschst – verlässlich & tiergerecht."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Das sagen unsere Kunden</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tausende Tierbesitzer vertrauen tigube. Das sagen einige von ihnen:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Maria war großartig mit meinem ängstlichen Hund aus dem Tierschutz! Sie hat bei jedem Spaziergang Fotos geschickt und alle Anweisungen perfekt befolgt."
              author="Laura S."
              location="Berlin"
              imageSrc="https://images.pexels.com/photos/3680219/pexels-photo-3680219.jpeg?auto=compress&cs=tinysrgb&w=100"
              rating={5}
            />
            <TestimonialCard
              quote="Einen vertrauenswürdigen Katzensitter zu finden war früher so stressig. Dank tigube kann ich jetzt sorgenfrei reisen, weil meine Katzen in guten Händen sind."
              author="Michael T."
              location="München"
              imageSrc="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100"
              rating={5}
            />
            <TestimonialCard
              quote="Unser Betreuer Thomas behandelt unseren Hund wie seinen eigenen. Die Buchung ist unkompliziert und das gute Gefühl unbezahlbar."
              author="Sophie K."
              location="Hamburg"
              imageSrc="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-50">
        <div className="container-custom">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-5">
              <div className="lg:col-span-3 p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-4">Bereit, den perfekten Tierbetreuer zu finden?</h2>
                <p className="text-gray-600 mb-8 max-w-xl">
                  Schließe dich tausenden glücklichen Tierbesitzern an, die tigube vertrauen. Erstelle jetzt kostenlos dein Konto und finde liebevolle Betreuer in deiner Nähe.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate('/registrieren')}
                  >
                    Als Tierbesitzer registrieren
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => navigate('/registrieren?type=caretaker')}
                  >
                    Betreuer werden
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-2 relative hidden lg:block">
                <img 
                  src="https://images.pexels.com/photos/2123773/pexels-photo-2123773.jpeg?auto=compress&cs=tinysrgb"
                  alt="Happy dog with caretaker" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  price: string;
}

function ServiceCard({ icon, title, description, price }: ServiceCardProps) {
  return (
    <div className="card p-6 hover:translate-y-[-4px] transition-all duration-300">
      <div className="rounded-full bg-primary-50 p-4 inline-flex mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <p className="text-primary-600 font-medium">{price}</p>
    </div>
  );
}

function Home(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="rounded-full bg-primary-500 text-white w-12 h-12 flex items-center justify-center font-bold text-xl mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

interface TestimonialCardProps {
  quote: string;
  author: string;
  location: string;
  imageSrc: string;
  rating: number;
}

function TestimonialCard({ quote, author, location, imageSrc, rating }: TestimonialCardProps) {
  return (
    <div className="card p-6">
      <div className="flex space-x-1 mb-4">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-5 w-5 text-accent-500 fill-accent-500" />
        ))}
      </div>
      <p className="text-gray-700 mb-6">{quote}</p>
      <div className="flex items-center">
        <img
          src={imageSrc}
          alt={author}
          className="w-12 h-12 rounded-full mr-4 object-cover"
        />
        <div>
          <p className="font-medium">{author}</p>
          <p className="text-sm text-gray-600">{location}</p>
        </div>
      </div>
    </div>
  );
}

function Star(props: React.SVGProps<SVGSVGElement>) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default HomePage;