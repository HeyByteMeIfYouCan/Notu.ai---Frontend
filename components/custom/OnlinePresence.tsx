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
  maxAvatars = 4
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

    // Listen for presence updates
    const handlePresence = (data: { roomId: string; users: OnlineUserFromSocket[] | string[] }) => {
      if (data.roomId === roomId) {
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

  // Build the list of all users
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
        <div className="flex -space-x-1.5 items-center">
          {displayUsers.map((u) => (
            <Tooltip key={u.id}>
              <TooltipTrigger asChild>
                <div className="relative group cursor-pointer transition-transform hover:scale-110 hover:z-20">
                  {u.image ? (
                    <img
                      src={u.image}
                      alt={u.name || 'User'}
                      referrerPolicy="no-referrer"
                      className={`w-7 h-7 rounded-full border-2 bg-background object-cover ${
                        u.isOnline 
                          ? 'border-emerald-500 ring-1 ring-emerald-500/30' 
                          : 'border-border opacity-70'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 bg-background ${
                        u.isOnline
                          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                          : 'border-border text-muted-foreground bg-muted'
                      }`}
                    >
                      {(u.name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  {u.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full shadow-2xs" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl border bg-popover p-2 text-xs shadow-xl space-y-0.5">
                <p className="font-semibold text-foreground">{u.name || u.email || 'User'}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span>{u.isOwner ? '👑 Owner' : 'Kolaborator'}</span>
                  <span>•</span>
                  <span className={u.isOnline ? 'text-emerald-500 font-medium' : ''}>
                    {u.isOnline ? 'Online' : 'Offline'}
                  </span>
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
          {extraCount > 0 && (
            <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
              +{extraCount}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
