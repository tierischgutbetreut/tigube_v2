import { useState, useEffect } from 'react'

interface UserAvatarProps {
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    profile_photo_url: string | null
  } | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showOnline?: boolean
}

function UserAvatar({ user, size = 'md', className = '', showOnline = false }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false)

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false)
  }, [user?.id, user?.profile_photo_url])
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm', 
    lg: 'w-12 h-12 text-base'
  }

  // Handle case where user is null or undefined
  if (!user) {
    console.warn('UserAvatar: No user data provided')
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <div className="w-full h-full rounded-xl bg-gray-300 text-gray-600 flex items-center justify-center font-medium border-2 border-gray-200">
          ?
        </div>
      </div>
    )
  }

  const getInitials = () => {
    const firstName = user.first_name || ''
    const lastName = user.last_name || ''
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    return initials || '?'
  }

  const getDisplayName = () => {
    const firstName = user.first_name || ''
    const lastName = user.last_name || ''
    return `${firstName} ${lastName}`.trim() || 'Unbekannt'
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {user.profile_photo_url && !imageError ? (
        <img
          src={user.profile_photo_url}
          alt={getDisplayName()}
          className="w-full h-full rounded-xl object-cover border-2 border-gray-200"
          onError={() => {
            console.warn('Avatar image failed to load:', user.profile_photo_url, 'for user:', user.first_name, user.last_name)
            setImageError(true)
          }}
          onLoad={() => {
            if (import.meta.env.DEV) {
              console.log('Avatar image loaded successfully for:', user.first_name, user.last_name)
            }
          }}
        />
      ) : (
        <div className="w-full h-full rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-medium border-2 border-gray-200">
          {getInitials()}
        </div>
      )}
      {showOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
    </div>
  )
}

export default UserAvatar 