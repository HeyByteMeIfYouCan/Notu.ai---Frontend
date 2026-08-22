"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle, IconLoader2 } from '@tabler/icons-react'

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface Notification {
  id: string
  type: NotificationType
  title: string
  description?: string
  duration?: number
  createdAt: number
}

interface NotificationContextValue {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotificationQueue() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotificationQueue must be used within a NotificationQueueProvider')
  }
  return context
}

// Helper to create notifications easier
export function useNotify() {
  const { addNotification, removeNotification } = useNotificationQueue()

  return {
    success: (title: string, description?: string, duration = 4000) => 
      addNotification({ type: 'success', title, description, duration }),
    error: (title: string, description?: string, duration = 5000) => 
      addNotification({ type: 'error', title, description, duration }),
    warning: (title: string, description?: string, duration = 4000) => 
      addNotification({ type: 'warning', title, description, duration }),
    info: (title: string, description?: string, duration = 4000) => 
      addNotification({ type: 'info', title, description, duration }),
    loading: (title: string, description?: string) => 
      addNotification({ type: 'loading', title, description, duration: 0 }),
    dismiss: (id: string) => removeNotification(id),
  }
}

const MAX_VISIBLE = 5
const DEFAULT_DURATION = 4000

function getIcon(type: NotificationType) {
  switch (type) {
    case 'success':
      return <IconCheck className="h-5 w-5 text-green-500" />
    case 'error':
      return <IconX className="h-5 w-5 text-red-500" />
    case 'warning':
      return <IconAlertTriangle className="h-5 w-5 text-amber-500" />
    case 'info':
      return <IconInfoCircle className="h-5 w-5 text-blue-500" />
    case 'loading':
      return <IconLoader2 className="h-5 w-5 text-primary animate-spin" />
  }
}

function getBorderColor(type: NotificationType) {
  switch (type) {
    case 'success': return 'border-l-green-500'
    case 'error': return 'border-l-red-500'
    case 'warning': return 'border-l-amber-500'
    case 'info': return 'border-l-blue-500'
    case 'loading': return 'border-l-primary'
  }
}

function NotificationItem({ 
  notification, 
  onRemove, 
  index 
}: { 
  notification: Notification
  onRemove: () => void
  index: number
}) {
  const [progress, setProgress] = useState(100)
  const startTimeRef = useRef(Date.now())
  const duration = notification.duration || DEFAULT_DURATION

  useEffect(() => {
    if (duration === 0) return // Loading notifications don't auto-dismiss

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
        onRemove()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [duration, onRemove])

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        delay: index * 0.05 
      }}
      className={`
        relative overflow-hidden
        bg-white dark:bg-gray-900 
        rounded-lg shadow-lg border border-border/50
        border-l-4 ${getBorderColor(notification.type)}
        min-w-[320px] max-w-[400px]
        pointer-events-auto
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{notification.title}</p>
          {notification.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.description}</p>
          )}
        </div>
        <button 
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 -m-1 rounded"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
      
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
          <motion.div 
            className={`h-full ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              notification.type === 'warning' ? 'bg-amber-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      )}
    </motion.div>
  )
}

export function NotificationQueueProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const idCounter = useRef(0)

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = `notification-${++idCounter.current}`
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
    }
    
    setNotifications(prev => {
      // Add to the end (queue behavior - newest at bottom)
      const updated = [...prev, newNotification]
      // Keep only last MAX_VISIBLE * 2 to prevent memory issues
      return updated.slice(-MAX_VISIBLE * 2)
    })
    
    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Only show last MAX_VISIBLE notifications
  const visibleNotifications = notifications.slice(-MAX_VISIBLE)

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      
      {/* Notification container - fixed at bottom right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {visibleNotifications.map((notification, index) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={() => removeNotification(notification.id)}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}
