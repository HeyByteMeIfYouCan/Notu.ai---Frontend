"use client"

import React, { useEffect, useState } from "react"
import { getSocket, getPresence, authenticateSocket } from "@/lib/socket"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/use-auth"

interface OnlineUser {
  id: string
  name?: string
  email?: string
  image?: string
}

interface OnlineUserFromSocket {
  id: string
  name?: string
  image?: string
  socketId?: string
}

interface OnlinePresenceProps {
  resourceType: 'meeting' | 'board'
  resourceId: string
  currentUserId?: string
  collaborators?: Array<{
    user: {
      _id: string
      name?: string
      email?: string
      image?: string
    }
    role?: string
  }>
  owner?: {
    _id: string
    name?: string
    image?: string
  }
  maxAvatars?: number
}

export function OnlinePresence({
  resourceType,
  resourceId,
  currentUserId,
  collaborators = [],
  owner,
  maxAvatars = 5
}: OnlinePresenceProps) {
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (!resourceId) return

    const socket = getSocket()
    const roomId = `${resourceType}_${resourceId}`
    
    // Authenticate socket with user info for presence tracking
    if (user) {
      authenticateSocket({ id: user.id, name: user.name, image: user.image })
    }

    // Join the room
    if (resourceType === 'meeting') {
      socket.emit('join_meeting', resourceId)
    } else {
      socket.emit('join_board', resourceId)
    }

    // Listen for presence updates - backend sends array of user objects with id field
    const handlePresence = (data: { roomId: string; users: OnlineUserFromSocket[] | string[] }) => {
      if (data.roomId === roomId) {
        // Handle both formats: array of objects or array of strings
        const userIds = (data.users || []).map(u => 
          typeof u === 'string' ? u : (u.id || '')
        ).filter(Boolean)
        setOnlineUserIds(userIds)
      }
    }

    socket.on('presence_update', handlePresence)

    // Request current presence asynchronously
    getPresence(roomId).then((users) => {
      if (users && users.length > 0) {
        const userIds = users.map(u => 
          typeof u === 'string' ? u : (u.id || '')
        ).filter(Boolean)
        setOnlineUserIds(userIds)
      }
    })

    return () => {
      socket.off('presence_update', handlePresence)
      if (resourceType === 'meeting') {
        socket.emit('leave_meeting', resourceId)
      } else {
        socket.emit('leave_board', resourceId)
      }
    }
  }, [resourceId, resourceType, user])

  // Build the list of all users (owner + collaborators) with online status
  const allUsers: Array<OnlineUser & { isOnline: boolean; isOwner: boolean }> = []

  if (owner) {
    allUsers.push({
      id: owner._id,
      name: owner.name,
      image: owner.image,
      isOnline: onlineUserIds.includes(owner._id),
      isOwner: true
    })
  }

  collaborators.forEach(col => {
    if (col.user && !allUsers.find(u => u.id === col.user._id)) {
      allUsers.push({
        id: col.user._id,
        name: col.user.name,
        email: col.user.email,
        image: col.user.image,
        isOnline: onlineUserIds.includes(col.user._id),
        isOwner: false
      })
    }
  })

  // Sort: online first, then by name
  allUsers.sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1
    if (!a.isOnline && b.isOnline) return 1
    if (a.isOwner && !b.isOwner) return -1
    if (!a.isOwner && b.isOwner) return 1
    return (a.name || '').localeCompare(b.name || '')
  })

  const onlineCount = allUsers.filter(u => u.isOnline).length
  const displayUsers = allUsers.slice(0, maxAvatars)
  const extraCount = allUsers.length - maxAvatars

  if (allUsers.length === 0) return null

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {displayUsers.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || 'User'}
                      className={`w-8 h-8 rounded-full border-2 ${
                        user.isOnline ? 'border-green-400' : 'border-gray-200'
                      } ${user.id === currentUserId ? 'ring-2 ring-purple-400' : ''}`}
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        user.isOnline
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-gray-100 text-gray-600'
                      } ${user.id === currentUserId ? 'ring-2 ring-purple-400' : ''}`}
                    >
                      {(user.name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  {/* Online indicator dot */}
                  {user.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{user.name || user.email || 'User'}</p>
                <p className="text-xs text-muted-foreground">
                  {user.isOwner ? 'Owner' : 'Collaborator'}
                  {user.isOnline ? ' • Online' : ' • Offline'}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
          {extraCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                  +{extraCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{extraCount} more users</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {onlineCount > 0 && (
          <span className="text-xs text-green-600 font-medium">
            {onlineCount} online
          </span>
        )}
      </div>
    </TooltipProvider>
  )
}
