import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Stethoscope, Users, Heart, PawPrint, Trash2, AlertTriangle } from 'lucide-react';
import Accordion, { AccordionItem } from './Accordion';
import type { ShareSettings } from '../../lib/supabase/db';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  age?: string;
  gender?: string;
  neutered?: boolean;
  description?: string;
  photoUrl?: string;
}

interface ClientData {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  plz?: string;
  vetName?: string;
  vetAddress?: string;
  vetPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  pets?: Pet[];
  services?: string[];
  otherWishes?: string[];
  shareSettings: ShareSettings;
}

interface ClientDetailsAccordionProps {
  clients: ClientData[];
  className?: string;
  onDeleteClient?: (clientId: string) => void;
}

function ClientDetailsAccordion({ clients, className, onDeleteClient }: ClientDetailsAccordionProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientData | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const handleDeleteClick = (client: ClientData, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete && deleteConfirmationText === 'KUNDEN ENTFERNEN' && onDeleteClient) {
      onDeleteClient(clientToDelete.id);
      setShowDeleteModal(false);
      setClientToDelete(null);
      setDeleteConfirmationText('');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setClientToDelete(null);
    setDeleteConfirmationText('');
  };
  const createClientContent = (client: ClientData) => {
    // Robuste Boolean-Konvertierung für ShareSettings
    const toBool = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      if (typeof value === 'number') return value === 1;
      return Boolean(value);
    };
    
    // Normalisiere ShareSettings zu echten Boolean-Werten
    const shareSettings = {
      phoneNumber: toBool(client.shareSettings.phoneNumber),
      email: toBool(client.shareSettings.email),
      address: toBool(client.shareSettings.address),
      vetInfo: toBool(client.shareSettings.vetInfo),
      emergencyContact: toBool(client.shareSettings.emergencyContact),
      petDetails: toBool(client.shareSettings.petDetails),
      carePreferences: toBool(client.shareSettings.carePreferences)
    };

    return (
      <div className="space-y-6">
        {/* Kontaktinformationen */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Kontaktinformationen
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Kontakt Box (Telefon + E-Mail) */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <div className="flex gap-3 items-start">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm mb-1">Kontakt</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {shareSettings.phoneNumber && client.phoneNumber ? (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="font-medium text-gray-800 truncate">{client.phoneNumber}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0 text-gray-400" />
                        <span className="text-gray-400 italic text-xs">nicht freigegeben</span>
                      </div>
                    )}
                    {shareSettings.email && client.email ? (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="font-medium text-gray-800 truncate">{client.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 flex-shrink-0 text-gray-400" />
                        <span className="text-gray-400 italic text-xs">nicht freigegeben</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Adresse Box */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <div className="flex gap-3 items-start">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm mb-1">Adresse</div>
                  <div className="text-xs text-gray-600">
                    {shareSettings.address && (client.address || client.city || client.plz) ? (
                      <div className="space-y-0.5">
                        {client.address && (
                          <div className="font-medium text-gray-800">{client.address}</div>
                        )}
                        {(client.plz || client.city) && (
                          <div className="text-gray-600">
                            {[client.plz, client.city].filter(Boolean).join(' ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">nicht freigegeben</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kontakte: Tierarzt & Notfall */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Kontakte
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Tierarzt Box */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <div className="flex gap-3 items-start">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm mb-1">Tierarzt</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {shareSettings.vetInfo && (client.vetName || client.vetAddress || client.vetPhone) ? (
                      <>
                        {client.vetName && (
                          <div className="font-medium text-gray-800">{client.vetName}</div>
                        )}
                        {client.vetAddress && (
                          <div className="truncate">{client.vetAddress}</div>
                        )}
                        {client.vetPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{client.vetPhone}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 italic text-xs">nicht freigegeben</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notfallkontakt Box */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
              <div className="flex gap-3 items-start">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm mb-1">Notfallkontakt</div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    {shareSettings.emergencyContact && (client.emergencyContactName || client.emergencyContactPhone) ? (
                      <>
                        {client.emergencyContactName && (
                          <div className="font-medium text-gray-800 truncate">{client.emergencyContactName}</div>
                        )}
                        {client.emergencyContactPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{client.emergencyContactPhone}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 italic text-xs">nicht freigegeben</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Haustiere */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <PawPrint className="h-4 w-4" />
            Haustiere
          </h4>
          {shareSettings.petDetails && client.pets && client.pets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {client.pets.map((pet) => (
                <div key={pet.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                  <div className="flex gap-3 items-start">
                    {/* Tier-Bild */}
                    {pet.photoUrl ? (
                      <img
                        src={pet.photoUrl}
                        alt={pet.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <PawPrint className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Tier-Informationen */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm mb-1 truncate">{pet.name}</div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div className="truncate">{pet.type} {pet.breed && `(${pet.breed})`}</div>
                        {pet.age && <div>Alter: {pet.age}</div>}
                        {pet.gender && <div>Geschlecht: {pet.gender}</div>}
                        {pet.neutered !== undefined && (
                          <div>Kastriert: {pet.neutered ? 'Ja' : 'Nein'}</div>
                        )}
                        {pet.description && (
                          <div className="mt-1 text-gray-500 text-xs overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {pet.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 italic">nicht freigegeben</span>
          )}
        </div>

        {/* Betreuungsvorlieben */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Betreuungsvorlieben
          </h4>
          {shareSettings.carePreferences ? (
            <div className="space-y-3">
              {client.services && client.services.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500 block mb-2">Gewünschte Services:</span>
                  <div className="flex flex-wrap gap-2">
                    {client.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {client.otherWishes && client.otherWishes.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500 block mb-2">Sonstige Wünsche:</span>
                  <div className="flex flex-wrap gap-2">
                    {client.otherWishes.map((wish, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                      >
                        {wish}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {(!client.services || client.services.length === 0) && 
               (!client.otherWishes || client.otherWishes.length === 0) && (
                <span className="text-gray-500 italic">Keine Vorlieben angegeben</span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 italic">nicht freigegeben</span>
          )}
        </div>
      </div>
    );
  };

  const createClientTitle = (client: ClientData) => {
    // Robuste Boolean-Konvertierung für ShareSettings
    const toBool = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      if (typeof value === 'number') return value === 1;
      return Boolean(value);
    };
    
    // Normalisiere ShareSettings zu echten Boolean-Werten
    const shareSettings = {
      phoneNumber: toBool(client.shareSettings.phoneNumber),
      email: toBool(client.shareSettings.email),
      address: toBool(client.shareSettings.address),
      vetInfo: toBool(client.shareSettings.vetInfo),
      emergencyContact: toBool(client.shareSettings.emergencyContact),
      petDetails: toBool(client.shareSettings.petDetails),
      carePreferences: toBool(client.shareSettings.carePreferences)
    };
    
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="font-medium">{client.name}</span>
          <div className="flex flex-wrap gap-2">
            {/* Haustier-Badges */}
            {shareSettings.petDetails && client.pets && client.pets.length > 0 && client.pets.map((pet) => (
              <span
                key={pet.id}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-50 text-primary-700 rounded-full"
              >
                <PawPrint className="h-3 w-3 mr-1" />
                {pet.name} ({pet.type})
              </span>
            ))}
            {/* Service-Badges */}
            {shareSettings.carePreferences && client.services && client.services.length > 0 && client.services.slice(0, 2).map((service, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full"
              >
                {service}
              </span>
            ))}
            {/* Weitere Services Indikator */}
            {shareSettings.carePreferences && client.services && client.services.length > 2 && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                +{client.services.length - 2} weitere
              </span>
            )}
          </div>
        </div>
        {/* Delete Button */}
        {onDeleteClient && (
          <button
            onClick={(e) => handleDeleteClick(client, e)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Kunden entfernen"
            aria-label="Kunden entfernen"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  const accordionItems: AccordionItem[] = clients.map((client) => ({
    id: client.id,
    title: createClientTitle(client),
    badge: client.pets && client.pets.length > 0 ? `${client.pets.length} ${client.pets.length === 1 ? 'Tier' : 'Tiere'}` : undefined,
    content: createClientContent(client)
  }));

  return (
    <>
      <Accordion 
        items={accordionItems} 
        allowMultiple={true} 
        className={className}
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && clientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Kunden entfernen</h2>
            </div>
            
            <p className="text-gray-700 mb-4 leading-relaxed">
              Möchten Sie <span className="font-medium">{clientToDelete.name}</span> wirklich entfernen?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Was passiert beim Entfernen:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Die Verbindung zwischen Ihnen wird gelöscht</li>
                    <li>Sie sehen sich nicht mehr in den jeweiligen Listen</li>
                    <li>Geteilte Kontaktdaten werden verborgen</li>
                    <li>Der Chat-Verlauf bleibt bestehen</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geben Sie zur Bestätigung "KUNDEN ENTFERNEN" ein:
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="KUNDEN ENTFERNEN"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmationText !== 'KUNDEN ENTFERNEN'}
              >
                Endgültig entfernen
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                onClick={handleDeleteCancel}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ClientDetailsAccordion;
export type { ClientData }; 