import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>
  onTypingStart?: () => void
  onTypingStop?: () => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
}

function MessageInput({ 
  onSendMessage,
  onTypingStart,
  onTypingStop, 
  isLoading = false, 
  disabled = false,
  placeholder = "Nachricht schreiben..." 
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isSending || disabled) return

    setIsSending(true)
    
    try {
      await onSendMessage(trimmedMessage)
      setMessage('')
      onTypingStop?.()
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onTypingStop?.()
      handleSubmit(e as any)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Trigger typing start when user starts typing
    if (e.target.value.length > 0 && onTypingStart) {
      onTypingStart()
    } else if (e.target.value.length === 0 && onTypingStop) {
      onTypingStop()
    }
  }

  const isSubmitDisabled = !message.trim() || isSending || disabled || isLoading

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* File Upload Button (placeholder for future feature) */}
        <button
          type="button"
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          disabled={disabled}
          aria-label="Datei anhängen"
          title="Datei anhängen (demnächst verfügbar)"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={onTypingStop}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px] max-h-32"
            rows={1}
            style={{ overflow: 'hidden' }}
          />
          
          {/* Emoji Button (placeholder for future feature) */}
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            disabled={disabled}
            aria-label="Emoji hinzufügen"
            title="Emoji hinzufügen (demnächst verfügbar)"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="flex-shrink-0 p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Nachricht senden"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>

      {/* Typing Indicator Area (placeholder for future real-time feature) */}
      <div className="mt-2 h-4">
        {/* Future: Show "User is typing..." indicator */}
      </div>
    </div>
  )
}

export default MessageInput 