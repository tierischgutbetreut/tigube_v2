interface NotificationBadgeProps {
  count: number
  className?: string
}

function NotificationBadge({ count, className = '' }: NotificationBadgeProps) {
  if (count === 0) return null

  return (
    <span className={`
      inline-flex items-center justify-center 
      min-w-[18px] h-[18px] 
      text-xs font-bold text-white 
      bg-red-500 rounded-full 
      px-1
      ${className}
    `}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default NotificationBadge 