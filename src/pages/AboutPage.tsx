import React from 'react';
import { Heart, Users, Shield, Award } from 'lucide-react';

function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Über tigube
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Wir verbinden liebevolle Tierbesitzer mit vertrauenswürdigen Betreuern 
              und schaffen eine Gemeinschaft, in der jedes Tier die beste Pflege erhält.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Unsere Mission
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Bei tigube glauben wir, dass jedes Tier die liebevolle Betreuung verdient, 
              die es braucht. Wir machen es einfach und sicher, qualifizierte Betreuer 
              zu finden, damit Sie beruhigt sein können, wenn Sie nicht da sind.
            </p>
          </div>

          {/* Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Liebe & Fürsorge</h3>
              <p className="text-gray-600">
                Jeder Betreuer wird sorgfältig ausgewählt und teilt unsere Leidenschaft für Tiere.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sicherheit</h3>
              <p className="text-gray-600">
                Alle Betreuer durchlaufen eine gründliche Überprüfung und Verifizierung.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Gemeinschaft</h3>
              <p className="text-gray-600">
                Wir bauen eine starke Gemeinschaft von Tierliebhabern auf, die sich gegenseitig unterstützen.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Qualität</h3>
              <p className="text-gray-600">
                Wir streben nach höchster Qualität in allem, was wir tun - für Sie und Ihre Tiere.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Unsere Geschichte
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  tigube entstand aus der persönlichen Erfahrung unserer Gründer, die selbst 
                  Tierbesitzer sind und die Herausforderung kannten, vertrauenswürdige Betreuung 
                  für ihre geliebten Vierbeiner zu finden.
                </p>
                <p>
                  2024 gegründet, haben wir es uns zur Aufgabe gemacht, eine Plattform zu schaffen, 
                  die nicht nur praktisch und sicher ist, sondern auch das Wohlbefinden der Tiere 
                  in den Mittelpunkt stellt.
                </p>
                <p>
                  Heute verbinden wir täglich Hunderte von Tierbesitzern mit qualifizierten 
                  Betreuern und schaffen dabei eine Gemeinschaft, die auf Vertrauen, Liebe 
                  und Fürsorge basiert.
                </p>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg p-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🐕🐱🐰</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Für alle Tiere da
                </h3>
                <p className="text-gray-600">
                  Egal ob Hund, Katze, Kaninchen oder exotische Tiere - 
                  bei uns finden Sie den passenden Betreuer für jeden Liebling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Unser Versprechen
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Wir arbeiten jeden Tag daran, tigube zu der vertrauenswürdigsten 
              Plattform für Tierbetreuung zu machen. Ihr Vertrauen ist unser 
              wertvollstes Gut.
            </p>
          </div>

          <div className="bg-primary-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Haben Sie Fragen oder Anregungen?
            </h3>
            <p className="text-gray-600 mb-6">
              Wir freuen uns über Ihr Feedback und sind immer da, um zu helfen.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a 
                href="mailto:info@tigube.de" 
                className="btn btn-primary"
              >
                Kontakt aufnehmen
              </a>
              <a 
                href="/kontakt" 
                className="btn btn-outline"
              >
                Kontaktformular
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;