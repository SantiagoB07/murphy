"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// DataCard - Radix-style compound component for data display cards
// ============================================================================

interface DataCardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  /** Status styling variant */
  variant?: "default" | "success" | "warning" | "error" | "info"
}

const variantStyles = {
  default: "bg-card border-border/50",
  success: "bg-success/10 border-success/30",
  warning: "bg-warning/10 border-warning/30",
  error: "bg-destructive/10 border-destructive/30",
  info: "bg-primary/10 border-primary/30",
}

function DataCard({
  children,
  className,
  variant = "default",
  ...props
}: DataCardProps) {
  return (
    <article
      className={cn(
        "glass-card p-4 border transition-all",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </article>
  )
}

// ============================================================================
// DataCard.Header - Header section with title and actions
// ============================================================================

interface DataCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function DataCardHeader({
  children,
  className,
  ...props
}: DataCardHeaderProps) {
  return (
    <div
      className={cn("flex items-start justify-between gap-3", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================================================
// DataCard.Title - Title text
// ============================================================================

interface DataCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  as?: "h2" | "h3" | "h4"
}

function DataCardTitle({
  children,
  className,
  as: Component = "h3",
  ...props
}: DataCardTitleProps) {
  return (
    <Component
      className={cn("font-semibold text-foreground leading-tight", className)}
      {...props}
    >
      {children}
    </Component>
  )
}

// ============================================================================
// DataCard.Description - Description text
// ============================================================================

interface DataCardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

function DataCardDescription({
  children,
  className,
  ...props
}: DataCardDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  )
}

// ============================================================================
// DataCard.Content - Main content area
// ============================================================================

interface DataCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function DataCardContent({
  children,
  className,
  ...props
}: DataCardContentProps) {
  return (
    <div className={cn("mt-3", className)} {...props}>
      {children}
    </div>
  )
}

// ============================================================================
// DataCard.Actions - Actions container (buttons, icons)
// ============================================================================

interface DataCardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function DataCardActions({
  children,
  className,
  ...props
}: DataCardActionsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {children}
    </div>
  )
}

// ============================================================================
// DataCard.Badge - Status badge
// ============================================================================

interface DataCardBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "error"
}

const badgeStyles = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  error: "bg-destructive/20 text-destructive",
}

function DataCardBadge({
  children,
  className,
  variant = "default",
  ...props
}: DataCardBadgeProps) {
  return (
    <span
      className={cn(
        "text-xs font-medium px-2 py-0.5 rounded-full",
        badgeStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// ============================================================================
// DataCard.Timestamp - Time display
// ============================================================================

interface DataCardTimestampProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  icon?: React.ReactNode
}

function DataCardTimestamp({
  children,
  className,
  icon,
  ...props
}: DataCardTimestampProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/50",
        className
      )}
      {...props}
    >
      {icon}
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  )
}

// ============================================================================
// Attach sub-components
// ============================================================================

DataCard.Header = DataCardHeader
DataCard.Title = DataCardTitle
DataCard.Description = DataCardDescription
DataCard.Content = DataCardContent
DataCard.Actions = DataCardActions
DataCard.Badge = DataCardBadge
DataCard.Timestamp = DataCardTimestamp

export { DataCard }

