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
            <Paw className="h-8 w-8 text-primary-500 mr-2" />
            <span className="text-2xl font-bold">PetPal</span>
          </Link>
          <h1 className="text-3xl font-bold mb-4">
            {userType === 'owner' ? 'Join as a Pet Owner' : 'Become a Pet Caregiver'}
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            {userType === 'owner' 
              ? 'Create an account to find trusted caregivers for your furry friends.'
              : 'Create an account to offer your pet care services and connect with pet owners.'}
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
              Pet Owner
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
              Pet Caregiver
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
              Back
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
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => window.location.href = userType === 'owner' ? '/' : '/caregivers/dashboard'}
            >
              Complete Registration
            </Button>
          )}
        </div>
        
        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const stepLabels = {
  owner: ['Account Info', 'Pet Details', 'Preferences'],
  caregiver: ['Account Info', 'Services', 'Verification'],
};

function OwnerStep1() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Create Your Account</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            className="input"
            placeholder="Your first name"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            className="input"
            placeholder="Your last name"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          className="input"
          placeholder="your.email@example.com"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          className="input"
          placeholder="Create a secure password"
        />
        <p className="text-xs text-gray-500 mt-1">
          Must be at least 8 characters with a number and special character
        </p>
      </div>
      
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <input
          type="text"
          id="location"
          className="input"
          placeholder="Your city"
        />
      </div>
      
      <div className="flex items-start">
        <input
          type="checkbox"
          id="terms"
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
          I agree to the{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Privacy Policy
          </a>
        </label>
      </div>
    </div>
  );
}

function OwnerStep2() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Tell Us About Your Pet</h2>
      
      <div>
        <label htmlFor="petName" className="block text-sm font-medium text-gray-700 mb-1">
          Pet Name
        </label>
        <input
          type="text"
          id="petName"
          className="input"
          placeholder="Your pet's name"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="petType" className="block text-sm font-medium text-gray-700 mb-1">
            Pet Type
          </label>
          <select id="petType" className="input">
            <option value="">Select pet type</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="bird">Bird</option>
            <option value="rabbit">Rabbit</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="petBreed" className="block text-sm font-medium text-gray-700 mb-1">
            Breed
          </label>
          <input
            type="text"
            id="petBreed"
            className="input"
            placeholder="Pet's breed"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="petAge" className="block text-sm font-medium text-gray-700 mb-1">
            Age
          </label>
          <input
            type="number"
            id="petAge"
            className="input"
            placeholder="Years"
            min="0"
          />
        </div>
        <div>
          <label htmlFor="petWeight" className="block text-sm font-medium text-gray-700 mb-1">
            Weight (kg)
          </label>
          <input
            type="number"
            id="petWeight"
            className="input"
            placeholder="Weight in kg"
            min="0"
          />
        </div>
      </div>
      
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Pet Photo
        </span>
        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 flex justify-center">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
              >
                <span>Upload a photo</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="petDescription" className="block text-sm font-medium text-gray-700 mb-1">
          About Your Pet
        </label>
        <textarea
          id="petDescription"
          rows={4}
          className="input"
          placeholder="Tell us about your pet's personality, likes, dislikes, and any special needs"
        ></textarea>
      </div>
      
      <div className="pt-4">
        <Button
          variant="ghost"
          className="text-primary-600"
          onClick={() => {}}
          leftIcon={<Paw className="h-4 w-4" />}
        >
          Add Another Pet
        </Button>
      </div>
    </div>
  );
}

function OwnerStep3() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Care Preferences</h2>
      
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-3">
          What services are you looking for?
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['Dog Walking', 'Pet Sitting', 'Boarding', 'Drop-In Visits', 'House Sitting', 'Doggy Day Care'].map((service) => (
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
          Veterinarian Information
        </label>
        <textarea
          id="vetInfo"
          rows={3}
          className="input"
          placeholder="Veterinarian name, address, and contact information"
        ></textarea>
      </div>
      
      <div>
        <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
          Emergency Contact
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input
            type="text"
            id="emergencyContactName"
            className="input"
            placeholder="Contact name"
          />
          <input
            type="text"
            id="emergencyContactPhone"
            className="input"
            placeholder="Phone number"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="careInstructions" className="block text-sm font-medium text-gray-700 mb-1">
          Special Care Instructions
        </label>
        <textarea
          id="careInstructions"
          rows={4}
          className="input"
          placeholder="Any special instructions for caregivers (medications, feeding schedule, behavior notes, etc.)"
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
                You're almost done! After registration, you'll be able to search for caregivers, book services, and manage your pet's care.
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
      <h2 className="text-xl font-semibold mb-6">Create Your Caregiver Account</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            className="input"
            placeholder="Your first name"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            className="input"
            placeholder="Your last name"
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          className="input"
          placeholder="your.email@example.com"
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          className="input"
          placeholder="Create a secure password"
        />
        <p className="text-xs text-gray-500 mt-1">
          Must be at least 8 characters with a number and special character
        </p>
      </div>
      
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          className="input"
          placeholder="Your phone number"
        />
      </div>
      
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <input
          type="text"
          id="location"
          className="input"
          placeholder="Your city"
        />
      </div>
      
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          About You
        </label>
        <textarea
          id="bio"
          rows={4}
          className="input"
          placeholder="Tell pet owners about yourself, your experience with pets, and why you'd be a great caregiver"
        ></textarea>
      </div>
      
      <div className="flex items-start">
        <input
          type="checkbox"
          id="terms"
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
          I agree to the{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700">
            Privacy Policy
          </a>
        </label>
      </div>
    </div>
  );
}

function CaregiverStep2() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Your Services</h2>
      
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-3">
          What services do you offer?
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['Dog Walking', 'Pet Sitting', 'Boarding', 'Drop-In Visits', 'House Sitting', 'Doggy Day Care'].map((service) => (
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
          What pets do you care for?
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['Dogs', 'Cats', 'Birds', 'Rabbits', 'Fish', 'Small Animals'].map((pet) => (
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
          Set your rates
        </span>
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-2 items-center">
            <label htmlFor="rateWalking" className="text-gray-700">
              Dog Walking (per 30 min)
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
              Pet Sitting (per visit)
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
              Boarding (per night)
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
          Service Area
        </label>
        <input
          type="text"
          id="serviceArea"
          className="input"
          placeholder="How far are you willing to travel? (e.g., 5 km radius from Berlin Mitte)"
        />
      </div>
      
      <div>
        <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
          General Availability
        </label>
        <textarea
          id="availability"
          rows={3}
          className="input"
          placeholder="Describe your general availability (e.g., weekdays after 5pm, weekends, etc.)"
        ></textarea>
        <p className="text-xs text-gray-500 mt-1">
          You'll be able to set up a detailed calendar after registration
        </p>
      </div>
    </div>
  );
}

function CaregiverStep3() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Verification & Profile</h2>
      
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Profile Photo
        </span>
        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 flex justify-center">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="photo-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
              >
                <span>Upload a photo</span>
                <input id="photo-upload" name="photo-upload" type="file" className="sr-only" />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          A clear photo of your face helps build trust with pet owners
        </p>
      </div>
      
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Home Photos (for boarding/house sitting)
        </span>
        <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-6 flex justify-center">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="home-photos-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
              >
                <span>Upload photos</span>
                <input id="home-photos-upload" name="home-photos-upload" type="file" multiple className="sr-only" />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">Upload multiple photos of your home environment</p>
          </div>
        </div>
      </div>
      
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-3">
          Experience & Qualifications
        </span>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-gray-700">Pet First Aid Certified</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-gray-700">Professional Dog Trainer</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-gray-700">Veterinary Experience</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-gray-700">Animal Shelter Volunteer</span>
          </label>
        </div>
      </div>
      
      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
          Describe Your Experience
        </label>
        <textarea
          id="experience"
          rows={4}
          className="input"
          placeholder="Tell pet owners about your experience with animals, including any professional experience or personal pet ownership"
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
                Great job! After registration, your profile will be reviewed by our team. 
                Background checks help ensure trust and safety on our platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;