import React from 'react';

function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">IMPRESSUM</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Linke Spalte */}
            <div>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  tierisch gut betreut UG
                </h2>
                <p className="text-gray-600 text-sm mb-2">(haftungsbeschränkt)</p>
                
                <div className="space-y-2 text-gray-700">
                  <p className="font-medium">Geschäftsführung</p>
                  <p>Tamara Pfaff & Gabriel Haaga</p>
                  <p>Iznangerstr. 32</p>
                  <p>78345 Moos</p>
                </div>
              </div>
              
              <div className="space-y-2 text-gray-700">
                <p>+49 (0) 7732 - 988 50 91</p>
                <p>+49 (0) 176 - 724 045 61 (T. Pfaff)</p>
                <p>+49 (0) 175 - 468 59 77 (G. Haaga)</p>
              </div>
              
              <div className="mt-6">
                <p className="text-gray-700">info@tierischgutbetreut.de</p>
              </div>
              
              <div className="mt-6">
                <p className="text-gray-700">
                  <span className="font-medium">Umsatzsteuer-ID</span> | DE355611953
                </p>
              </div>
            </div>
            
            {/* Rechte Spalte */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">AUFSICHTSBEHÖRDEN</h2>
              
              <div className="space-y-6">
                <div>
                  <p className="font-medium text-gray-800">Veterinäramt Konstanz</p>
                  <p className="text-gray-700">Otto-Blesch-Str. 51, 78315 Radolfzell am Bodensee</p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-800">Städtisches Finanzamt</p>
                  <p className="text-gray-700">Alpenstraße 9, 78224 Singen a.Htwl.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImpressumPage;