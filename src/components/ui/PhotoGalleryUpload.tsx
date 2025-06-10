import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, Camera } from 'lucide-react';
import Button from './Button';

interface PhotoGalleryUploadProps {
  photos: (string | File)[];
  onPhotosChange: (photos: (string | File)[]) => void;
  maxPhotos?: number;
  uploading?: boolean;
  error?: string | null;
}

function PhotoGalleryUpload({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 10,
  uploading = false,
  error = null 
}: PhotoGalleryUploadProps) {
  const [draggedPhoto, setDraggedPhoto] = useState<number | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    const remainingSlots = maxPhotos - photos.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);
    onPhotosChange([...photos, ...filesToAdd]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: maxPhotos - photos.length,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading || photos.length >= maxPhotos,
  });

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const getPhotoUrl = (photo: string | File): string => {
    if (typeof photo === 'string') {
      return photo;
    }
    return URL.createObjectURL(photo);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {photos.length < maxPhotos && (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-25'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-2">
            {isDragActive ? (
              <Upload className="h-12 w-12 text-primary-500" />
            ) : (
              <Camera className="h-12 w-12 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isDragActive ? 'Fotos hier ablegen' : 'Fotos von deiner Betreuungsumgebung hinzufügen'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Bis zu {maxPhotos} Fotos • PNG, JPG, GIF bis 10MB
              </p>
            </div>
            {!isDragActive && (
              <Button variant="ghost" className="text-primary-600 border-primary-300 hover:bg-primary-50">
                <Upload className="h-4 w-4 mr-2" />
                Fotos auswählen
              </Button>
            )}
          </div>
          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full animate-pulse w-1/3"></div>
              </div>
              <p className="text-xs text-primary-600 mt-1">Wird hochgeladen...</p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Hochgeladene Fotos ({photos.length}/{maxPhotos})
            </h4>
            {photos.length >= maxPhotos && (
              <p className="text-xs text-amber-600">Maximum erreicht</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div 
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-primary-300 transition-colors group"
              >
                <img
                  src={getPhotoUrl(photo)}
                  alt={`Betreuungsumgebung ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay mit Lösch-Button */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <button
                    onClick={() => removePhoto(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg"
                    title="Foto entfernen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Typ-Indikator für File vs URL */}
                <div className="absolute top-2 left-2">
                  {typeof photo === 'string' ? (
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Gespeichert
                    </div>
                  ) : (
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Neu
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hilfstexte */}
      {photos.length === 0 && (
        <div className="text-center py-4">
          <Image className="h-16 w-16 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-2">
            Noch keine Fotos hinzugefügt
          </p>
          <p className="text-xs text-gray-400">
            Zeige deine Betreuungsumgebung! Tierbesitzer möchten sehen, wo ihre Lieblinge betreut werden.
          </p>
        </div>
      )}
      
      {photos.length > 0 && photos.length < maxPhotos && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-500">
            Du kannst noch {maxPhotos - photos.length} weitere Foto{maxPhotos - photos.length !== 1 ? 's' : ''} hinzufügen
          </p>
        </div>
      )}
    </div>
  );
}

export default PhotoGalleryUpload; 