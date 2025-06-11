/**
 * NotificationManager - Handle browser notifications and sounds
 */
export class NotificationManager {
  private permission: NotificationPermission = 'default'
  private soundEnabled = true
  private notificationsEnabled = true

  constructor() {
    this.permission = Notification.permission
    this.loadSettings()
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return 'denied'
    }

    const permission = await Notification.requestPermission()
    this.permission = permission
    this.saveSettings()
    return permission
  }

  /**
   * Show a chat message notification
   */
  showChatNotification(
    senderName: string,
    message: string,
    conversationId: string,
    onNotificationClick?: () => void
  ) {
    if (!this.canShowNotification()) {
      return
    }

    // Truncate long messages
    const truncatedMessage = message.length > 50 
      ? `${message.substring(0, 50)}...` 
      : message

    const notification = new Notification(`Neue Nachricht von ${senderName}`, {
      body: truncatedMessage,
      icon: '/Image/Logos/tigube_logo_klein.png',
      tag: conversationId, // Prevent multiple notifications from same conversation
      badge: '/Image/Logos/tigube_logo_klein.png',
      requireInteraction: false,
      silent: !this.soundEnabled
    })

    // Handle notification click
    notification.onclick = () => {
      window.focus()
      onNotificationClick?.()
      notification.close()
    }

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close()
    }, 5000)

    return notification
  }

  /**
   * Show typing notification
   */
  showTypingNotification(senderName: string, conversationId: string) {
    if (!this.canShowNotification()) {
      return
    }

    const notification = new Notification(`${senderName} schreibt...`, {
      icon: '/Image/Logos/tigube_logo_klein.png',
      tag: `typing-${conversationId}`,
      silent: true, // No sound for typing notifications
      requireInteraction: false
    })

    // Auto-close after 3 seconds
    setTimeout(() => {
      notification.close()
    }, 3000)

    return notification
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    if (!this.soundEnabled) {
      return
    }

    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log('Could not play notification sound:', error)
    }
  }

  /**
   * Play typing sound
   */
  playTypingSound() {
    if (!this.soundEnabled) {
      return
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 400
      oscillator.type = 'square'
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.log('Could not play typing sound:', error)
    }
  }

  /**
   * Check if notifications can be shown
   */
  private canShowNotification(): boolean {
    return (
      'Notification' in window &&
      this.permission === 'granted' &&
      this.notificationsEnabled &&
      document.visibilityState === 'hidden' // Only show when page is not visible
    )
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings() {
    try {
      const settings = localStorage.getItem('tigube_notification_settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        this.soundEnabled = parsed.soundEnabled ?? true
        this.notificationsEnabled = parsed.notificationsEnabled ?? true
      }
    } catch (error) {
      console.warn('Failed to load notification settings:', error)
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings() {
    try {
      const settings = {
        soundEnabled: this.soundEnabled,
        notificationsEnabled: this.notificationsEnabled,
        permission: this.permission
      }
      localStorage.setItem('tigube_notification_settings', JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to save notification settings:', error)
    }
  }

  /**
   * Enable/disable sound notifications
   */
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled
    this.saveSettings()
  }

  /**
   * Enable/disable browser notifications
   */
  setNotificationsEnabled(enabled: boolean) {
    this.notificationsEnabled = enabled
    this.saveSettings()
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      permission: this.permission,
      soundEnabled: this.soundEnabled,
      notificationsEnabled: this.notificationsEnabled,
      browserSupport: 'Notification' in window
    }
  }

  /**
   * Clear all notifications for a conversation
   */
  clearNotifications(conversationId: string) {
    // Note: There's no direct way to clear specific notifications in the browser
    // This is a placeholder for potential future functionality
    console.log(`Clearing notifications for conversation: ${conversationId}`)
  }
}

// Create singleton instance
export const notificationManager = new NotificationManager() 