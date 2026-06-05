"use client"

import { 
  LayoutDashboard, 
  Package, 
  Upload, 
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Pill
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ViewType } from '@/app/page'

const navigationItems = [
  { id: 'dashboard' as const, label: 'Página principal', icon: LayoutDashboard },
  { id: 'catalog' as const, label: 'Catálogo', icon: Package },
  { id: 'upload' as const, label: 'Carga Masiva', icon: Upload },
  { id: 'egress' as const, label: 'Venta Rápida', icon: ShoppingCart },
]

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  alertCount: number
}

export function Sidebar({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  alertCount,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Pill className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-base font-semibold text-foreground">Gestión de Stock</span>
              <span className="text-xs text-muted-foreground">Control de inventario</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          const showBadge = item.id === 'dashboard' && alertCount > 0

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {showBadge && (
                    <Badge 
                      variant="destructive" 
                      className="h-5 min-w-5 px-1.5 text-xs"
                    >
                      {alertCount}
                    </Badge>
                  )}
                </>
              )}
              {isCollapsed && showBadge && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full justify-center"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Contraer</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
