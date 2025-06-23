import { useState, useEffect } from 'react'
import { Bell, BellOff, Settings } from 'lucide-react'
import { notificationManager } from '../../lib/notifications/NotificationManager'

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const [settings, setSettings] = useState({
    permission: 'default' as NotificationPermission,
    notificationsEnabled: true,
    browserSupport: true
  })

  useEffect(() => {
    if (isOpen) {
      setSettings(notificationManager.getSettings())
    }
  }, [isOpen])

  const handleRequestPermission = async () => {
    const permission = await notificationManager.requestPermission()
    setSettings(prev => ({ ...prev, permission }))
  }

  const handleToggleNotifications = () => {
    const newNotificationsEnabled = !settings.notificationsEnabled
    notificationManager.setNotificationsEnabled(newNotificationsEnabled)
    setSettings(prev => ({ ...prev, notificationsEnabled: newNotificationsEnabled }))
  }

  const testNotification = () => {
    notificationManager.showChatNotification(
      'Test',
      'Dies ist eine Test-Benachrichtigung',
      'test-conversation',
      () => {
        console.log('Test notification clicked')
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Benachrichtigungseinstellungen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Schließen</span>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Browser Support Info */}
          {!settings.browserSupport && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Ihr Browser unterstützt keine Push-Benachrichtigungen.
              </p>
            </div>
          )}

          {/* Permission Status */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Browser-Berechtigung</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Status: {
                  settings.permission === 'granted' ? 'Erlaubt' :
                  settings.permission === 'denied' ? 'Verweigert' :
                  'Nicht angefragt'
                }
              </span>
              {settings.permission !== 'granted' && (
                <button
                  onClick={handleRequestPermission}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Berechtigung anfragen
                </button>
              )}
            </div>
          </div>

          {/* Notification Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {settings.notificationsEnabled ? (
                <Bell className="w-4 h-4 text-blue-600" />
              ) : (
                <BellOff className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-900">
                Push-Benachrichtigungen
              </span>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Test Button */}
          {settings.permission === 'granted' && (
            <button
              onClick={testNotification}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
            >
              Test-Benachrichtigung senden
            </button>
          )}

          {/* Info Text */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              Benachrichtigungen werden nur angezeigt, wenn die Seite nicht aktiv ist.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings 