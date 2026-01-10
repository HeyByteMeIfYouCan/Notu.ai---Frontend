"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { IconSearch, IconList, IconLayoutGrid } from "@tabler/icons-react"

type Controls = ReturnType<typeof import("@/hooks/use-list-params").default>

type TypeOption = { value: string; label: string }

export default function ListToolbar({ 
  controls, 
  typeOptions, 
  hideType,
  gridCols,
  setGridCols
}: { 
  controls: Controls; 
  typeOptions?: TypeOption[]; 
  hideType?: boolean;
  gridCols?: 1 | 2;
  setGridCols?: (cols: 1 | 2) => void;
}) {
  const defaultTypes: TypeOption[] = [
    { value: 'all', label: 'Semua Jenis' },
    { value: 'online', label: 'Online' },
    { value: 'realtime', label: 'Realtime' },
    { value: 'upload', label: 'Upload' },
  ]
  const types = typeOptions || defaultTypes
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="relative flex-1">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search Notes.."
          className="pl-10 pr-4 bg-background-2 border border-[var(--border)] text-[var(--foreground)]"
          value={controls.searchInput}
          onChange={(e) => controls.setSearchInput(e.target.value)}
        />
      </div>

      <Select value={controls.filter} onValueChange={(v: any) => controls.setFilter(v)}>
        <SelectTrigger className="w-[180px] bg-background-2 border-border text-[var(--foreground)]">
          <SelectValue placeholder="Semua Meeting" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Meeting</SelectItem>
          <SelectItem value="mine">Meeting Saya</SelectItem>
          <SelectItem value="shared">Dibagikan ke Saya</SelectItem>
        </SelectContent>
      </Select>

      <Select value={String(controls.pageSize)} onValueChange={(val: any) => { controls.setPageSize(parseInt(val, 10)) }}>
        <SelectTrigger className="w-[120px] bg-background-2 border-border text-[var(--foreground)]">
          <SelectValue placeholder="Per halaman" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="5">5 / halaman</SelectItem>
          <SelectItem value="10">10 / halaman</SelectItem>
          <SelectItem value="20">20 / halaman</SelectItem>
          <SelectItem value="50">50 / halaman</SelectItem>
        </SelectContent>
      </Select>

      {!hideType && (
        <Select value={controls.type} onValueChange={(val: any) => controls.setType(val)}>
          <SelectTrigger className="w-[180px] bg-background-2 border-border text-[var(--foreground)]">
            <SelectValue placeholder="Semua Jenis" />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {gridCols !== undefined && setGridCols && (
        <div className="flex items-center rounded-md border bg-muted p-1">
          <Button 
            variant={gridCols === 1 ? "default" : "ghost"} 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setGridCols(1)}
          >
            <IconList className="h-4 w-4" />
          </Button>
          <Button 
            variant={gridCols === 2 ? "default" : "ghost"} 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setGridCols(2)}
          >
            <IconLayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
