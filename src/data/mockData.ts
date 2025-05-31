// Mock data for the pet care platform

export const mockCaregivers = [
  {
    id: '1',
    name: 'Maria Schmidt',
    avatar: 'https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Berlin',
    rating: 4.9,
    reviewCount: 124,
    hourlyRate: 15,
    services: ['Gassi-Service', 'Haustierbetreuung', 'Übernachtung'],
    bio: 'Tierliebhaberin mit über 5 Jahren Erfahrung. Ich habe zwei eigene Hunde und verbringe gerne Zeit mit allen Arten von Tieren.',
    responseTime: 'unter 1 Stunde',
    verified: true,
  },
  {
    id: '2',
    name: 'Thomas Weber',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Berlin',
    rating: 4.8,
    reviewCount: 87,
    hourlyRate: 18,
    services: ['Gassi-Service', 'Haussitting', 'Kurzbesuche'],
    bio: 'Professioneller Hundetrainer mit Leidenschaft für Tierbetreuung. Ich finde, jedes Tier verdient individuelle Aufmerksamkeit und Fürsorge.',
    responseTime: 'unter 30 Minuten',
    verified: true,
  },
  {
    id: '3',
    name: 'Sophie Müller',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'München',
    rating: 4.7,
    reviewCount: 56,
    hourlyRate: 14,
    services: ['Katzenbetreuung', 'Haustierbetreuung', 'Kurzbesuche'],
    bio: 'Katzenspezialistin mit Erfahrung in der Betreuung aller Arten von Samtpfoten. Ich biete ruhige, aufmerksame Pflege für Ihre Lieblinge.',
    responseTime: '1-2 Stunden',
    verified: true,
  },
  {
    id: '4',
    name: 'Max Fischer',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Hamburg',
    rating: 4.9,
    reviewCount: 112,
    hourlyRate: 20,
    services: ['Gassi-Service', 'Übernachtung', 'Hundetagesbetreuung'],
    bio: 'Erfahrener Hundesitter und Trainer. Ich habe einen großen, eingezäunten Garten – perfekt für Spiel und Auslauf.',
    responseTime: 'unter 1 Stunde',
    verified: true,
  },
  {
    id: '5',
    name: 'Emma Schneider',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Frankfurt',
    rating: 4.6,
    reviewCount: 43,
    hourlyRate: 13,
    services: ['Kleintierbetreuung', 'Haustierbetreuung', 'Kurzbesuche'],
    bio: 'Spezialisiert auf Kleintiere wie Kaninchen, Meerschweinchen und Hamster. Ich betreue auch Katzen und kleine Hunde.',
    responseTime: '2-3 Stunden',
    verified: false,
  },
  {
    id: '6',
    name: 'Julian Becker',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Köln',
    rating: 4.8,
    reviewCount: 67,
    hourlyRate: 16,
    services: ['Gassi-Service', 'Haustierbetreuung', 'Haussitting'],
    bio: 'Student der Tierwissenschaften mit flexiblem Zeitplan. Ich liebe alle Tiere und behandle Ihres mit größter Sorgfalt.',
    responseTime: 'unter 1 Stunde',
    verified: true,
  }
];

export const mockPetOwners = [
  {
    id: '1',
    name: 'Laura Hoffmann',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'Berlin',
    pets: [
      {
        id: 'p1',
        name: 'Bruno',
        type: 'Hund',
        breed: 'Deutscher Schäferhund',
        age: 3,
        image: 'https://images.pexels.com/photos/2607544/pexels-photo-2607544.jpeg?auto=compress&cs=tinysrgb&w=600'
      }
    ]
  },
  {
    id: '2',
    name: 'Michael Schmidt',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600',
    location: 'München',
    pets: [
      {
        id: 'p2',
        name: 'Milo',
        type: 'Katze',
        breed: 'Siamkatze',
        age: 2,
        image: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=600'
      },
      {
        id: 'p3',
        name: 'Luna',
        type: 'Katze',
        breed: 'Hauskatze',
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
    service: 'Katzenbetreuung',
    status: 'bestätigt',
    startDate: '2023-08-15T14:00:00',
    endDate: '2023-08-15T16:00:00',
    totalPrice: 30,
    location: 'Beim Tierbesitzer zu Hause',
    notes: 'Bitte beide Katzen füttern und die Katzentoiletten reinigen. Milo benötigt um 15 Uhr Medikamente.'
  },
  {
    id: 'b2',
    caregiverId: '2',
    petOwnerId: '1',
    petIds: ['p1'],
    service: 'Gassi-Service',
    status: 'abgeschlossen',
    startDate: '2023-08-10T09:00:00',
    endDate: '2023-08-10T10:00:00',
    totalPrice: 18,
    location: 'Im Park',
    notes: 'Bruno muss immer an der Leine bleiben. Er spielt gerne mit dem Ball im Park.'
  }
];

export const mockReviews = [
  {
    id: 'r1',
    caregiverId: '1',
    petOwnerId: '2',
    bookingId: 'b1',
    rating: 5,
    comment: 'Maria war großartig mit meinen Katzen! Sie hat alle Anweisungen perfekt befolgt und mir während des Besuchs Updates geschickt. Ich buche definitiv wieder!',
    date: '2023-08-15T18:30:00'
  },
  {
    id: 'r2',
    caregiverId: '2',
    petOwnerId: '1',
    bookingId: 'b2',
    rating: 4,
    comment: 'Thomas hat einen tollen Job beim Gassi gehen mit Bruno gemacht. Er war pünktlich und Bruno kam glücklich und müde zurück. Empfehlenswert!',
    date: '2023-08-10T12:15:00'
  }
];