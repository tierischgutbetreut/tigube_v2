// Mock data for the pet care platform

export const mockCaregivers = [
  {
    id: '1',
    name: 'Maria Schmidt',
    avatar: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Berlin, Germany',
    rating: 4.9,
    reviewCount: 124,
    hourlyRate: 15,
    services: ['Dog Walking', 'Pet Sitting', 'Boarding'],
    bio: 'Animal lover with 5+ years of experience. I have two dogs of my own and love spending time with all kinds of pets.',
    responseTime: 'under 1 hour',
    verified: true,
  },
  {
    id: '2',
    name: 'Thomas Weber',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Berlin, Germany',
    rating: 4.8,
    reviewCount: 87,
    hourlyRate: 18,
    services: ['Dog Walking', 'House Sitting', 'Drop-In Visits'],
    bio: 'Professional dog trainer with a passion for animal care. I believe every pet deserves personalized attention and care.',
    responseTime: 'under 30 minutes',
    verified: true,
  },
  {
    id: '3',
    name: 'Sophie Müller',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Munich, Germany',
    rating: 4.7,
    reviewCount: 56,
    hourlyRate: 14,
    services: ['Cat Sitting', 'Pet Sitting', 'Drop-In Visits'],
    bio: 'Cat specialist with experience caring for all types of felines. I provide calm, attentive care for your furry friends.',
    responseTime: '1-2 hours',
    verified: true,
  },
  {
    id: '4',
    name: 'Max Fischer',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Hamburg, Germany',
    rating: 4.9,
    reviewCount: 112,
    hourlyRate: 20,
    services: ['Dog Walking', 'Boarding', 'Doggy Day Care'],
    bio: 'Experienced dog walker and trainer. I have a large fenced yard perfect for dog play and exercise sessions.',
    responseTime: 'under 1 hour',
    verified: true,
  },
  {
    id: '5',
    name: 'Emma Schneider',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Frankfurt, Germany',
    rating: 4.6,
    reviewCount: 43,
    hourlyRate: 13,
    services: ['Small Animal Care', 'Pet Sitting', 'Drop-In Visits'],
    bio: 'Specialized in small animals like rabbits, guinea pigs, and hamsters. I also care for cats and small dogs.',
    responseTime: '2-3 hours',
    verified: false,
  },
  {
    id: '6',
    name: 'Julian Becker',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Cologne, Germany',
    rating: 4.8,
    reviewCount: 67,
    hourlyRate: 16,
    services: ['Dog Walking', 'Pet Sitting', 'House Sitting'],
    bio: 'Animal science student with flexible schedule. I love all animals and will treat yours with the utmost care and attention.',
    responseTime: 'under 1 hour',
    verified: true,
  }
];

export const mockPetOwners = [
  {
    id: '1',
    name: 'Laura Hoffmann',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Berlin, Germany',
    pets: [
      {
        id: 'p1',
        name: 'Bruno',
        type: 'Dog',
        breed: 'German Shepherd',
        age: 3,
        image: 'https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=600'
      }
    ]
  },
  {
    id: '2',
    name: 'Michael Schmidt',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Munich, Germany',
    pets: [
      {
        id: 'p2',
        name: 'Milo',
        type: 'Cat',
        breed: 'Siamese',
        age: 2,
        image: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=600'
      },
      {
        id: 'p3',
        name: 'Luna',
        type: 'Cat',
        breed: 'Domestic Shorthair',
        age: 1,
        image: 'https://images.pexels.com/photos/320014/pexels-photo-320014.jpeg?auto=compress&cs=tinysrgb&w=600'
      }
    ]
  }
];

export const mockBookings = [
  {
    id: 'b1',
    caregiverId: '1',
    petOwnerId: '2',
    petIds: ['p2', 'p3'],
    service: 'Cat Sitting',
    status: 'confirmed',
    startDate: '2023-08-15T14:00:00',
    endDate: '2023-08-15T16:00:00',
    totalPrice: 30,
    location: 'Pet owner\'s home',
    notes: 'Please feed both cats and clean their litter boxes. Milo needs medication at 3pm.'
  },
  {
    id: 'b2',
    caregiverId: '2',
    petOwnerId: '1',
    petIds: ['p1'],
    service: 'Dog Walking',
    status: 'completed',
    startDate: '2023-08-10T09:00:00',
    endDate: '2023-08-10T10:00:00',
    totalPrice: 18,
    location: 'Local park',
    notes: 'Bruno needs to be on leash at all times. He loves playing with the ball in the park.'
  }
];

export const mockReviews = [
  {
    id: 'r1',
    caregiverId: '1',
    petOwnerId: '2',
    bookingId: 'b1',
    rating: 5,
    comment: 'Maria was amazing with my cats! She followed all instructions perfectly and sent me updates throughout the visit. Will definitely book again!',
    date: '2023-08-15T18:30:00'
  },
  {
    id: 'r2',
    caregiverId: '2',
    petOwnerId: '1',
    bookingId: 'b2',
    rating: 4,
    comment: 'Thomas did a great job walking Bruno. He was on time and Bruno came back happy and tired. Would recommend!',
    date: '2023-08-10T12:15:00'
  }
];