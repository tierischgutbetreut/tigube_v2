interface UserAvatarProps {
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    profile_photo_url: string | null
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm', 
    lg: 'w-12 h-12 text-base'
  }

  const getInitials = () => {
    const firstName = user.first_name || ''
    const lastName = user.last_name || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getDisplayName = () => {
    const firstName = user.first_name || ''
    const lastName = user.last_name || ''
    return `${firstName} ${lastName}`.trim() || 'Unbekannt'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {user.profile_photo_url ? (
        <img
          src={user.profile_photo_url}
          alt={getDisplayName()}
          className="w-full h-full rounded-full object-cover border-2 border-gray-200"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-medium border-2 border-gray-200">
          {getInitials() || '?'}
        </div>
      )}
    </div>
  )
}

export default UserAvatar 