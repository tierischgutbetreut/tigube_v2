import React from 'react';
import { Building2, FileText, Hash } from 'lucide-react';

interface CommercialInfoInputProps {
  isCommercial: boolean;
  companyName: string;
  taxNumber: string;
  vatId: string;
  onIsCommercialChange: (value: boolean) => void;
  onCompanyNameChange: (value: string) => void;
  onTaxNumberChange: (value: string) => void;
  onVatIdChange: (value: string) => void;
  errors: {
    taxNumber?: string;
  };
}

function CommercialInfoInput({
  isCommercial,
  companyName,
  taxNumber,
  vatId,
  onIsCommercialChange,
  onCompanyNameChange,
  onTaxNumberChange,
  onVatIdChange,
  errors
}: CommercialInfoInputProps) {
  return (
    <div className="space-y-4">
      {/* Gewerblicher Betreuer Checkbox */}
      <div className="flex items-start space-x-3">
        <div className="flex items-center h-5">
          <input
            id="isCommercial"
            type="checkbox"
            checked={isCommercial}
            onChange={(e) => onIsCommercialChange(e.target.checked)}
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
          />
        </div>
        <div className="text-sm">
          <label htmlFor="isCommercial" className="font-medium text-gray-900">
            Gewerblicher Betreuer
          </label>
          <p className="text-gray-500">
            Ich biete Haustierbetreuung gewerblich an und habe eine Steuernummer
          </p>
        </div>
      </div>

      {/* Gewerbliche Felder - nur anzeigen wenn Checkbox aktiviert */}
      {isCommercial && (
        <div className="space-y-4 pl-7 border-l-2 border-primary-100">
          {/* Firmenname */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Firmenname <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
                className="input pl-10"
                placeholder="z.B. Müller's Haustierservice"
              />
            </div>
          </div>

          {/* Steuernummer */}
          <div>
            <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Steuernummer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="taxNumber"
                value={taxNumber}
                onChange={(e) => onTaxNumberChange(e.target.value)}
                className={`input pl-10 ${errors.taxNumber ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                placeholder="z.B. 123/456/78901"
                required
              />
            </div>
            {errors.taxNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.taxNumber}</p>
            )}
          </div>

          {/* USt-IdNr. */}
          <div>
            <label htmlFor="vatId" className="block text-sm font-medium text-gray-700 mb-1">
              USt-IdNr. <span className="text-gray-400">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="vatId"
                value={vatId}
                onChange={(e) => onVatIdChange(e.target.value)}
                className="input pl-10"
                placeholder="z.B. DE123456789"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Nur erforderlich wenn umsatzsteuerpflichtig
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommercialInfoInput; 