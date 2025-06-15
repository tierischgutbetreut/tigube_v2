import { User } from 'lucide-react'

interface ProfileLinkMessageProps {
  ownerId: string
  ownerName?: string
}

function ProfileLinkMessage({ ownerId, ownerName }: ProfileLinkMessageProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-2">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-green-600" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-green-800">
            {ownerName ? `${ownerName} hat dich` : 'Dieser Tierbesitzer hat dich'} als Betreuer gespeichert! 
            Du kannst nun die Kontaktdaten in deinem Dashboard unter "Kunden" einsehen.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProfileLinkMessage 