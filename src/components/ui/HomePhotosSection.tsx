import React, { useState } from 'react';
import { Home, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Button from './Button';
import { cn } from '../../lib/utils';

interface HomePhotosSectionProps {
  homePhotos: string[];
  caretakerName: string;
}

interface PhotoModalProps {
  photos: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  caretakerName: string;
}

function PhotoModal({ photos, initialIndex, isOpen, onClose, caretakerName }: PhotoModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen) return null;

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-full">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Main Image */}
        <img
          src={photos[currentIndex]}
          alt={`${caretakerName} Umgebungsbild ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800&h=600&fit=crop&crop=center';
          }}
        />

        {/* Image Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  );
}

function HomePhotosSection({ homePhotos, caretakerName }: HomePhotosSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const openModal = (index: number) => {
    setSelectedPhotoIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  if (!homePhotos || homePhotos.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Home className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Umgebungsbilder</h2>
        </div>
        <div className="text-center py-8">
          <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Keine Umgebungsbilder hinterlegt.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Home className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Umgebungsbilder</h2>
          <span className="text-sm text-gray-500">({homePhotos.length})</span>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {homePhotos.map((photo, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group hover:shadow-lg transition-shadow"
              onClick={() => openModal(index)}
            >
              <img
                src={photo}
                alt={`${caretakerName} Umgebungsbild ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=400&fit=crop&crop=center';
                }}
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-white bg-opacity-90 rounded-full p-2">
                    <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more photos message if many photos */}
        {homePhotos.length > 8 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Klicken Sie auf ein Bild, um alle {homePhotos.length} Fotos zu durchsuchen
            </p>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      <PhotoModal
        photos={homePhotos}
        initialIndex={selectedPhotoIndex}
        isOpen={modalOpen}
        onClose={closeModal}
        caretakerName={caretakerName}
      />
    </>
  );
}

export default HomePhotosSection; 