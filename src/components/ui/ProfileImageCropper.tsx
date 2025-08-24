import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, X, Check, RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Button from './Button';

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface ProfileImageCropperProps {
  photoUrl?: string;
  onImageSave: (croppedImageUrl: string) => Promise<void>;
  uploading?: boolean;
  error?: string | null;
  className?: string;
}

function ProfileImageCropper({ 
  photoUrl, 
  onImageSave, 
  uploading = false, 
  error = null,
  className = ""
}: ProfileImageCropperProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(photoUrl || null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update selectedImage when photoUrl changes
  useEffect(() => {
    let objectUrlToRevoke: string | null = null;
    if (!photoUrl) {
      setSelectedImage(null);
      return;
    }

    // Für Remote-URLs: erst als Blob laden, um Canvas-CORS-Probleme zu vermeiden
    if (/^https?:\/\//i.test(photoUrl)) {
      fetch(photoUrl, { mode: 'cors' })
        .then(async (resp) => {
          const blob = await resp.blob();
          const localUrl = URL.createObjectURL(blob);
          objectUrlToRevoke = localUrl;
          setSelectedImage(localUrl);
        })
        .catch(() => {
          // Fallback: nutze Original-URL, falls Fetch fehlschlägt
          setSelectedImage(photoUrl);
        });
    } else {
      setSelectedImage(photoUrl);
    }

    return () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [photoUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setIsEditing(true);
        // Reset crop settings
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading || isSaving,
  });

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async (): Promise<string> => {
    if (!selectedImage || !croppedAreaPixels) {
      throw new Error('Kein Bild oder Crop-Bereich verfügbar');
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas-Kontext nicht verfügbar'));
        return;
      }

      const image = new Image();
      // Verhindere Canvas-Tainting bei Remote-Images
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        try {
          // Set canvas size to match crop area
          canvas.width = croppedAreaPixels.width;
          canvas.height = croppedAreaPixels.height;

          // Apply rotation if needed
          if (rotation !== 0) {
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
          }

          // Draw the cropped image
          ctx.drawImage(
            image,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
          );

          // Convert to blob and resolve
          try {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  resolve(url);
                } else {
                  reject(new Error('Fehler beim Erstellen des Bildes'));
                }
              },
              'image/jpeg',
              0.9
            );
          } catch (e) {
            reject(e as Error);
          }
        } catch (e) {
          reject(e as Error);
        }
      };
      
      image.onerror = () => {
        reject(new Error('Fehler beim Laden des Bildes'));
      };
      
      image.src = selectedImage;
    });
  }, [selectedImage, croppedAreaPixels, rotation]);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    
    setIsSaving(true);
    try {
      const croppedImageUrl = await createCroppedImage();
      await onImageSave(croppedImageUrl);
      setIsEditing(false);
    } catch (err) {
      console.error('Fehler beim Speichern des Bildes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (!photoUrl) {
      setSelectedImage(null);
    } else {
      setSelectedImage(photoUrl);
    }
    // Reset crop settings
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 1));
  };

  const displayImage = selectedImage || photoUrl;

  if (isEditing && selectedImage) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Crop Editor */}
        <div className="relative">
          <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden">
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1} // Square aspect ratio for profile photos
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              showGrid={true}
              cropShape="rect"
              objectFit="contain"
              style={{
                cropAreaStyle: {
                  borderRadius: '12px',
                  border: '2px solid #3b82f6',
                }
              }}
            />
          </div>
          
          {/* Crop Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 rounded-full px-4 py-2 flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-white hover:text-primary-300 transition-colors"
              title="Verkleinern"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <div className="w-20 mx-2">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            <button
              onClick={handleZoomIn}
              className="p-2 text-white hover:text-primary-300 transition-colors"
              title="Vergrößern"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-600 mx-2"></div>
            
            <button
              onClick={handleRotate}
              className="p-2 text-white hover:text-primary-300 transition-colors"
              title="Drehen"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleReset}
              className="p-2 text-white hover:text-primary-300 transition-colors"
              title="Zurücksetzen"
            >
              <Move className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            🖱️ Ziehe das Bild zum Positionieren • 🔍 Zoom mit Mausrad oder Schieberegler
          </p>
                     <p className="text-xs text-gray-500">
             Das Bild wird automatisch auf ein quadratisches Profilbild zugeschnitten
           </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="min-w-[100px]"
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!croppedAreaPixels || isSaving}
            isLoading={isSaving}
            leftIcon={<Check className="h-4 w-4" />}
            className="min-w-[100px]"
          >
            Speichern
          </Button>
        </div>

        {error && (
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Image Display */}
      {displayImage && (
        <div className="flex justify-center mb-4">
          <div className="relative">
                         <img
               src={displayImage}
               alt="Profilbild"
               className="h-32 w-32 object-cover rounded-xl border-4 border-gray-200 shadow-sm"
             />
            <button
              onClick={() => setIsEditing(true)}
              className="absolute bottom-0 right-0 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-2 shadow-lg transition-colors"
              title="Bild bearbeiten"
              disabled={uploading}
            >
              <Move className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-25'
        } ${(uploading || isSaving) ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-2">
          {isDragActive ? (
            <Upload className="h-12 w-12 text-primary-500" />
          ) : (
            <Upload className="h-12 w-12 text-gray-400" />
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isDragActive 
                ? 'Profilbild hier ablegen' 
                : displayImage 
                  ? 'Neues Profilbild hochladen'
                  : 'Profilbild hochladen'
              }
            </p>
                         <p className="text-xs text-gray-500 mt-1">
               PNG, JPG bis 10MB • Wird quadratisch zugeschnitten
             </p>
          </div>
          
          {!isDragActive && (
            <Button 
              variant="ghost" 
              className="text-primary-600 border-primary-300 hover:bg-primary-50"
              onClick={(e) => {
                e.stopPropagation();
                // Trigger the dropzone input directly
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (input) input.click();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Datei auswählen
            </Button>
          )}
        </div>

        {(uploading || isSaving) && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full animate-pulse w-1/3"></div>
            </div>
            <p className="text-xs text-primary-600 mt-1">
              {uploading ? 'Wird hochgeladen...' : 'Wird bearbeitet...'}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Tips */}
      {!displayImage && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-500">
            💡 Tipp: Nach dem Upload kannst du dein Bild zuschneiden und positionieren
          </p>
        </div>
      )}
    </div>
  );
}

export default ProfileImageCropper; 