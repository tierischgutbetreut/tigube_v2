import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Phone, Mail, MessageCircle } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Wie funktioniert TiGube?',
    answer: 'TiGube verbindet Tierbesitzer mit vertrauenswürdigen Tierbetreuern in ihrer Nähe. Sie können Profile durchsuchen, Bewertungen lesen und direkt Kontakt aufnehmen, um die beste Betreuung für Ihr Tier zu finden.',
    category: 'Allgemein'
  },
  {
    id: '2',
    question: 'Ist die Registrierung kostenlos?',
    answer: 'Ja, die Registrierung auf TiGube ist völlig kostenlos. Sie zahlen nur für die tatsächlich gebuchten Betreuungsleistungen.',
    category: 'Kosten'
  },
  {
    id: '3',
    question: 'Wie werden die Betreuer überprüft?',
    answer: 'Alle Betreuer durchlaufen einen Verifizierungsprozess, der Identitätsprüfung, Referenzen und ein persönliches Gespräch umfasst. Zusätzlich sammeln wir Bewertungen von anderen Tierbesitzern.',
    category: 'Sicherheit'
  },
  {
    id: '4',
    question: 'Was passiert, wenn mein Tier krank wird?',
    answer: 'Unsere Betreuer sind angewiesen, Sie sofort zu kontaktieren und bei Bedarf einen Tierarzt aufzusuchen. Wir haben auch eine 24/7 Notfall-Hotline für dringende Fälle.',
    category: 'Notfall'
  },
  {
    id: '5',
    question: 'Wie kann ich Betreuer werden?',
    answer: 'Registrieren Sie sich als Betreuer, füllen Sie Ihr Profil aus und durchlaufen Sie unseren Verifizierungsprozess. Nach erfolgreicher Prüfung können Sie Ihre Dienste anbieten.',
    category: 'Betreuer'
  },
  {
    id: '6',
    question: 'Welche Tiere können betreut werden?',
    answer: 'Wir vermitteln Betreuung für Hunde, Katzen, Kleintiere wie Kaninchen und Meerschweinchen, Vögel und nach Absprache auch für andere Haustiere.',
    category: 'Tiere'
  },
  {
    id: '7',
    question: 'Wie funktioniert die Bezahlung?',
    answer: 'Die Bezahlung erfolgt sicher über unsere Plattform. Sie zahlen erst nach erfolgreich abgeschlossener Betreuung. Wir akzeptieren alle gängigen Zahlungsmethoden.',
    category: 'Kosten'
  },
  {
    id: '8',
    question: 'Was ist, wenn ich mit der Betreuung unzufrieden bin?',
    answer: 'Kontaktieren Sie uns umgehend. Wir nehmen alle Beschwerden ernst und arbeiten an einer Lösung. In berechtigten Fällen erstatten wir auch Kosten zurück.',
    category: 'Support'
  },
  {
    id: '9',
    question: 'Kann ich mehrere Tiere gleichzeitig betreuen lassen?',
    answer: 'Ja, viele unserer Betreuer können mehrere Tiere gleichzeitig betreuen. Geben Sie dies bei Ihrer Anfrage an und besprechen Sie die Details mit dem Betreuer.',
    category: 'Betreuung'
  },
  {
    id: '10',
    question: 'Wie weit im Voraus sollte ich buchen?',
    answer: 'Wir empfehlen, mindestens 1-2 Wochen im Voraus zu buchen, besonders in Ferienzeiten. Für Notfälle versuchen wir auch kurzfristige Vermittlungen.',
    category: 'Buchung'
  }
];

const categories = ['Alle', 'Allgemein', 'Kosten', 'Sicherheit', 'Betreuer', 'Betreuung', 'Buchung', 'Tiere', 'Notfall', 'Support'];

function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Alle' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Hilfe & FAQ
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Finden Sie schnell Antworten auf Ihre Fragen rund um TiGube
            </p>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filter */}
          <div className="mb-12">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Durchsuchen Sie unsere FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQ.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Keine Ergebnisse gefunden. Versuchen Sie andere Suchbegriffe.
                </p>
              </div>
            ) : (
              filteredFAQ.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {item.question}
                      </h3>
                      <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                        {item.category}
                      </span>
                    </div>
                    {openItems.includes(item.id) ? (
                      <ChevronUp className="h-5 w-5 text-gray-500 ml-4" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500 ml-4" />
                    )}
                  </button>
                  
                  {openItems.includes(item.id) && (
                    <div className="px-6 pb-4">
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-gray-700 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Weitere Fragen?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Konnten wir Ihre Frage nicht beantworten? Kontaktieren Sie uns gerne direkt!
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <a
                href="/kontakt"
                className="flex items-center justify-center space-x-3 p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors group"
              >
                <MessageCircle className="h-6 w-6 text-primary-600 group-hover:text-primary-700" />
                <span className="font-medium text-primary-700 group-hover:text-primary-800">
                  Kontaktformular
                </span>
              </a>
              
              <a
                href="mailto:info@tigube.de"
                className="flex items-center justify-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <Mail className="h-6 w-6 text-green-600 group-hover:text-green-700" />
                <span className="font-medium text-green-700 group-hover:text-green-800">
                  E-Mail senden
                </span>
              </a>
              
              <a
                href="tel:+4977329885091"
                className="flex items-center justify-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <Phone className="h-6 w-6 text-blue-600 group-hover:text-blue-700" />
                <span className="font-medium text-blue-700 group-hover:text-blue-800">
                  Anrufen
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpPage;