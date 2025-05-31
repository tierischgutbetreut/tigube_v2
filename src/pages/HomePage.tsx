import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, Shield, Heart, Dog, Cat, Rabbit } from 'lucide-react';
import Button from '../components/ui/Button';

function HomePage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?location=${encodeURIComponent(location)}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Find the Perfect Care for Your Furry Friend
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-xl">
                Connect with trusted local caregivers who'll treat your pet like family. Book dog walking, pet sitting, and more in minutes.
              </p>
              
              {/* Search Form */}
              <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-sm rounded-xl p-2 max-w-md">
                <div className="flex">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your location"
                      className="block w-full bg-transparent border-0 pl-10 py-3 text-white placeholder-white/70 focus:ring-0"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex-shrink-0 bg-white text-primary-600 hover:bg-white/90 px-5 py-3 rounded-lg font-medium transition-colors ml-2"
                  >
                    <Search className="w-5 h-5" />
                    <span className="sr-only">Search</span>
                  </button>
                </div>
              </form>
              
              <div className="flex flex-wrap items-center gap-4 text-sm mt-6">
                <span className="flex items-center">
                  <Shield className="mr-1 h-4 w-4" /> Verified Caregivers
                </span>
                <span className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" /> Book in Minutes
                </span>
                <span className="flex items-center">
                  <Heart className="mr-1 h-4 w-4" /> 100% Love Guarantee
                </span>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <img
                src="https://images.pexels.com/photos/6975370/pexels-photo-6975370.jpeg"
                alt="Pet caregiver with a dog"
                className="rounded-xl shadow-xl animate-fade-in"
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 animate-slide-up">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-primary-100 p-3">
                    <Heart className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Trusted Caregivers</p>
                    <p className="text-sm text-gray-600">Background checked & verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="fill-white h-12 w-full">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C108.56,18.62,177.92,36.89,260,55.47Z"></path>
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Services For Your Pet</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whatever your pet needs, we have trusted caregivers ready to help. Book the perfect service for your furry friend.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ServiceCard
              icon={<Dog className="h-8 w-8 text-primary-500" />}
              title="Dog Walking"
              description="Regular walks to keep your dog happy and healthy. Scheduled visits with photo updates."
              price="From €15/walk"
            />
            <ServiceCard
              icon={<Cat className="h-8 w-8 text-primary-500" />}
              title="Pet Sitting"
              description="In-home pet sitting for when you're away. Feeding, playtime, and lots of love."
              price="From €25/visit"
            />
            <ServiceCard
              icon={<Home className="h-8 w-8 text-primary-500" />}
              title="Boarding"
              description="Overnight care in a caregiver's loving home. Your pet gets 24/7 attention and care."
              price="From €35/night"
            />
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => navigate('/search')}
            >
              Find a Caregiver Near You
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How PetPal Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Finding the perfect caregiver for your pet is easy with PetPal. Just follow these simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Search for Caregivers"
              description="Browse profiles of verified caregivers in your area. Filter by service, price, and availability."
            />
            <StepCard
              number="2"
              title="Book & Pay Securely"
              description="Schedule and pay for services through our secure platform. All bookings are confirmed instantly."
            />
            <StepCard
              number="3"
              title="Enjoy Peace of Mind"
              description="Receive updates during the service. Your pet gets the care they deserve, and you get peace of mind."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Pet Parents Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Thousands of pet owners trust PetPal for their pet care needs. Here's what some of them have to say.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Maria was amazing with my anxious rescue dog! She sent photos during every walk and followed all my instructions perfectly."
              author="Laura S."
              location="Berlin"
              imageSrc="https://images.pexels.com/photos/3680219/pexels-photo-3680219.jpeg?auto=compress&cs=tinysrgb&w=100"
              rating={5}
            />
            <TestimonialCard
              quote="Finding a trustworthy cat sitter used to be so stressful. Thanks to PetPal, I can travel worry-free knowing my cats are in good hands."
              author="Michael T."
              location="Munich"
              imageSrc="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100"
              rating={5}
            />
            <TestimonialCard
              quote="Our caregiver Thomas treats our dog like his own. The booking process is seamless, and the peace of mind is priceless."
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
                <h2 className="text-3xl font-bold mb-4">Ready to Find the Perfect Pet Caregiver?</h2>
                <p className="text-gray-600 mb-8 max-w-xl">
                  Join thousands of happy pet parents who trust PetPal for their pet care needs. 
                  Create your free account today and start connecting with loving caregivers in your area.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate('/register')}
                  >
                    Sign Up as Pet Owner
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => navigate('/register?type=caregiver')}
                  >
                    Become a Caregiver
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-2 relative hidden lg:block">
                <img 
                  src="https://images.pexels.com/photos/2123773/pexels-photo-2123773.jpeg?auto=compress&cs=tinysrgb"
                  alt="Happy dog with caregiver" 
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