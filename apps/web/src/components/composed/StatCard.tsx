"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// StatCard - Radix-style compound component for stats display
// ============================================================================

interface StatCardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

function StatCard({ children, className, ...props }: StatCardProps) {
  return (
    <article
      className={cn("glass-card p-4 animate-fade-up", className)}
      {...props}
    >
      {children}
    </article>
  )
}

// ============================================================================
// StatCard.Row - Horizontal layout container
// ============================================================================

interface StatCardRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function StatCardRow({ children, className, ...props }: StatCardRowProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {children}
    </div>
  )
}

// ============================================================================
// StatCard.Icon - Icon container with background
// ============================================================================

interface StatCardIconProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  bgColor?: string
}

function StatCardIcon({
  children,
  className,
  bgColor,
  ...props
}: StatCardIconProps) {
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
        bgColor,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ============================================================================
// StatCard.Content - Content container
// ============================================================================

interface StatCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function StatCardContent({
  children,
  className,
  ...props
}: StatCardContentProps) {
  return (
    <div className={cn("flex-1 min-w-0", className)} {...props}>
      {children}
    </div>
  )
}

// ============================================================================
// StatCard.Label - Small label text
// ============================================================================

interface StatCardLabelProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

function StatCardLabel({ children, className, ...props }: StatCardLabelProps) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)} {...props}>
      {children}
    </p>
  )
}

// ============================================================================
// StatCard.Value - Large value text
// ============================================================================

interface StatCardValueProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

function StatCardValue({ children, className, ...props }: StatCardValueProps) {
  return (
    <p
      className={cn(
        "text-xl font-bold text-foreground leading-tight",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

// ============================================================================
// StatCard.Unit - Small unit text (e.g., "mg/dL")
// ============================================================================

interface StatCardUnitProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

function StatCardUnit({ children, className, ...props }: StatCardUnitProps) {
  return (
    <span
      className={cn("text-xs font-normal text-muted-foreground ml-1", className)}
      {...props}
    >
      {children}
    </span>
  )
}

// ============================================================================
// Attach sub-components
// ============================================================================

StatCard.Row = StatCardRow
StatCard.Icon = StatCardIcon
StatCard.Content = StatCardContent
StatCard.Label = StatCardLabel
StatCard.Value = StatCardValue
StatCard.Unit = StatCardUnit

export { StatCard }

