import React from 'react';

function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">DATENSCHUTZERKLÄRUNG</h1>
          
          <div className="space-y-8">
            {/* Einleitung */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Datenschutz auf einen Blick</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, 
                  wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert 
                  werden können.
                </p>
                <p>
                  [Platzhalter: Hier würden detaillierte Informationen zur Datenerhebung und -verarbeitung stehen]
                </p>
              </div>
            </section>

            {/* Datenerfassung */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Datenerfassung auf dieser Website</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-medium text-gray-800">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h3>
                <p>
                  Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie 
                  dem Impressum dieser Website entnehmen.
                </p>
                <p>
                  [Platzhalter: Weitere Details zur Datenerfassung und den verwendeten Tools]
                </p>
              </div>
            </section>

            {/* Ihre Rechte */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Ihre Rechte</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Sie haben jederzeit das Recht unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten 
                  personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten 
                  zu verlangen.
                </p>
                <p>
                  [Platzhalter: Vollständige Auflistung aller Betroffenenrechte nach DSGVO]
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Cookies</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Die Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner keinen Schaden 
                  an und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer 
                  zu machen.
                </p>
                <p>
                  [Platzhalter: Detaillierte Informationen zu verwendeten Cookies und deren Zweck]
                </p>
              </div>
            </section>

            {/* Kontaktformular */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Kontakt und Registrierung</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Wenn Sie sich auf unserer Plattform registrieren oder uns per Kontaktformular oder E-Mail Anfragen zukommen lassen, 
                  werden Ihre Angaben zum Zwecke der Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
                </p>
                <p>
                  [Platzhalter: Spezifische Informationen zur Datenverarbeitung bei Registrierung und Kontaktaufnahme]
                </p>
              </div>
            </section>

            {/* Externe Dienste */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Externe Dienste und Plugins</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Diese Website nutzt verschiedene externe Dienste zur Bereitstellung ihrer Funktionen. 
                  Informationen zu den verwendeten Diensten und deren Datenschutzbestimmungen finden Sie nachfolgend.
                </p>
                <p>
                  [Platzhalter: Liste aller verwendeten externen Dienste wie Google Maps, Analytics, etc.]
                </p>
              </div>
            </section>

            {/* Kontakt für Datenschutz */}
            <section className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Kontakt bei Datenschutzfragen</h2>
              <div className="text-gray-700">
                <p className="mb-2">
                  <strong>Verantwortlicher:</strong> tierisch gut betreut UG (haftungsbeschränkt)
                </p>
                <p className="mb-2">
                  <strong>E-Mail:</strong> info@tierischgutbetreut.de
                </p>
                <p>
                  Bei Fragen zum Datenschutz können Sie sich jederzeit an uns wenden.
                </p>
              </div>
            </section>

            {/* Stand der Erklärung */}
            <section className="text-sm text-gray-600 border-t pt-6">
              <p>
                <strong>Stand dieser Datenschutzerklärung:</strong> {new Date().toLocaleDateString('de-DE')}
              </p>
              <p className="mt-2">
                [Platzhalter: Diese Datenschutzerklärung wird regelmäßig überprüft und bei Bedarf aktualisiert]
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DatenschutzPage;