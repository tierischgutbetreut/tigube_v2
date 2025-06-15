import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { ownerCaretakerService } from '../../lib/supabase/db'
import { sendMessage } from '../../lib/supabase/chatService'

interface SaveCaretakerButtonProps {
  ownerId: string
  caretakerId: string
  conversationId: string
  onSaved?: () => void
  onRemoved?: () => void
}

function SaveCaretakerButton({ ownerId, caretakerId, conversationId, onSaved, onRemoved }: SaveCaretakerButtonProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Prüfen ob der Betreuer bereits gespeichert ist
  useEffect(() => {
    const checkSavedStatus = async () => {
      const { isSaved } = await ownerCaretakerService.isCaretakerSaved(ownerId, caretakerId)
      setIsSaved(isSaved)
    }
    checkSavedStatus()
  }, [ownerId, caretakerId])

  const handleToggle = async () => {
    setIsLoading(true)
    
    try {
      if (isSaved) {
        // Betreuer entfernen
        const { error } = await ownerCaretakerService.removeCaretaker(ownerId, caretakerId)
        if (error) throw new Error(error)
        
        setIsSaved(false)
        onRemoved?.()
      } else {
        // Betreuer speichern
        const { error } = await ownerCaretakerService.saveCaretaker(ownerId, caretakerId)
        if (error) throw new Error(error)
        
        // Benachrichtigung im Chat senden ohne Profil-Link
        await sendMessage({
          conversation_id: conversationId,
          content: `Ich habe dich als Betreuer gespeichert. Du kannst nun meine Kontaktdaten in deinem Dashboard unter "Kunden" einsehen.`,
          message_type: 'system'
        })
        
        setIsSaved(true)
        onSaved?.()
      }
    } catch (error) {
      console.error('Fehler beim Speichern/Entfernen des Betreuers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${isSaved 
          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' 
          : 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title={isSaved ? 'Betreuer entfernen' : 'Als Betreuer speichern'}
    >
      <Heart 
        className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} 
      />
      {isSaved ? (
        <span className="hidden sm:inline">Betreuer entfernen</span>
      ) : (
        <>
          <span className="hidden sm:inline">Als Betreuer speichern</span>
        </>
      )}
    </button>
  )
}

export default SaveCaretakerButton 