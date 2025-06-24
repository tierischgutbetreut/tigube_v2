import React, { useState } from 'react';
import { Lightbulb, X, Send } from 'lucide-react';
import Button from './Button';

interface FeedbackFormData {
  name: string;
  title: string;
  description: string;
}

interface FeedbackMetadata {
  url: string;
  userAgent: string;
  timestamp: string;
  viewport: {
    width: number;
    height: number;
  };
  referrer: string;
}

function FeedbackForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>({
    name: '',
    title: '',
    description: ''
  });

  const getBrowserName = (userAgent: string): string => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unbekannt';
  };

  const collectMetadata = (): FeedbackMetadata => {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      referrer: document.referrer
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Bitte geben Sie Ihren Namen ein.');
      return;
    }
    
    if (!formData.title.trim()) {
      alert('Bitte geben Sie einen Titel ein.');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Bitte geben Sie eine Beschreibung ein.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const metadata = collectMetadata();
      
      // Format data for Notion API compatibility
      const payload = {
        properties: {
          "Ich bin eine Headline": {
            title: [
              {
                text: {
                  content: formData.title
                }
              }
            ]
          },
          "Aufgabenbezeichnung": {
            rich_text: [
              {
                text: {
                  content: `👤 Name: ${formData.name}\n\n📝 Beschreibung:\n${formData.description}\n\n🔗 Seite: ${metadata.url}\n\n🌐 Browser: ${getBrowserName(metadata.userAgent)}\n\n📱 Auflösung: ${metadata.viewport.width}x${metadata.viewport.height}\n\n⏰ Zeitpunkt: ${new Date(metadata.timestamp).toLocaleString('de-DE')}`
                }
              }
            ]
          },
          "Name": {
            rich_text: [
              {
                text: {
                  content: formData.name
                }
              }
            ]
          },
          "URL": {
            url: metadata.url
          },
          "Browser": {
            rich_text: [
              {
                text: {
                  content: `${getBrowserName(metadata.userAgent)} (${metadata.userAgent})`
                }
              }
            ]
          },
          "Viewport": {
            rich_text: [
              {
                text: {
                  content: `${metadata.viewport.width} × ${metadata.viewport.height} Pixel`
                }
              }
            ]
          },
          "Timestamp": {
            rich_text: [
              {
                text: {
                  content: `${new Date(metadata.timestamp).toLocaleString('de-DE')} (${metadata.timestamp})`
                }
              }
            ]
          }
        }
      };

      console.log('Sending Notion-formatted payload:', payload);

      // Try multiple webhook endpoints
      const webhookUrls = [
        'https://auto.macario.dev/webhook/29178425-3791-4ebb-be17-d07b9ad52f66',
        'https://webhook-test.com/29178425-3791-4ebb-be17-d07b9ad52f66'
      ];

      let success = false;
      let lastError: Error | null = null;

      for (const webhookUrl of webhookUrls) {
        try {
          console.log(`Trying webhook: ${webhookUrl}`);
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            success = true;
            console.log(`Successfully sent to ${webhookUrl}`);
            break;
          } else {
            console.warn(`Webhook ${webhookUrl} responded with status ${response.status}`);
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          console.warn(`Failed to reach webhook ${webhookUrl}:`, error);
          lastError = error as Error;
        }
      }

      if (success) {
        // Reset form and show success message
        setFormData({ name: '', title: '', description: '' });
        setIsSuccess(true);
        // Auto-close after 3 seconds
        setTimeout(() => {
          setIsSuccess(false);
          setIsOpen(false);
        }, 3000);
      } else {
        // All webhooks failed, log for manual collection
        console.group('📝 FEEDBACK SUBMISSION FAILED - MANUAL COLLECTION:');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Feedback Data:', payload);
        console.log('Last Error:', lastError);
        console.groupEnd();
        
        alert(`Webhook-Fehler: Das Feedback wurde in der Browser-Konsole gespeichert.\n\nBitte informieren Sie den Administrator über diesen Fehler und öffnen Sie die Browser-Konsole (F12) für Details.`);
      }
    } catch (error) {
      console.error('Network error submitting feedback:', error);
      
      // Fallback: Log feedback for manual collection
      const metadata = collectMetadata();
      const payload = {
        formData,
        metadata
      };
      
      console.group('📝 FEEDBACK SUBMISSION FAILED - NETWORK ERROR - MANUAL COLLECTION:');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Feedback Data:', payload);
      console.log('Error:', error);
      console.groupEnd();
      
      alert(`Netzwerkfehler: Das Feedback wurde in der Browser-Konsole gespeichert.\n\nBitte informieren Sie den Administrator und öffnen Sie die Browser-Konsole (F12) für Details.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FeedbackFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      {/* Feedback Button - Fixed position on right side */}
      <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-l-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
          title="Feedback geben"
        >
          <Lightbulb size={20} />
          <span className="text-sm font-medium">Feedback</span>
        </button>
      </div>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Lightbulb className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  Feedback senden
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Success Message */}
            {isSuccess && (
              <div className="p-4 bg-green-50 border-l-4 border-green-400">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700 font-medium">
                      Feedback erfolgreich gesendet!
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Vielen Dank für Ihr Feedback. Dieses Fenster schließt sich automatisch.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            {!isSuccess && (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="feedback-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="feedback-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ihr Name"
                  required
                />
              </div>

              {/* Title Field */}
              <div>
                <label htmlFor="feedback-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  id="feedback-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Kurzer Titel für Ihr Feedback"
                  required
                />
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="feedback-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="feedback-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Beschreiben Sie Ihr Feedback, Vorschläge oder gefundene Probleme..."
                  required
                />
              </div>

              {/* Required fields notice */}
              <div className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Pflichtfelder
              </div>

              {/* Info about metadata */}
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-600">
                  <strong>Hinweis:</strong> Zusammen mit Ihrem Feedback werden automatisch technische Informationen gesammelt (URL der aktuellen Seite, Browser-Informationen, Bildschirmauflösung), um bei der Fehlerbehebung zu helfen.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Senden...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Senden
                    </>
                  )}
                </Button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default FeedbackForm; 