"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { Doc } from "@murphy/backend/convex/_generated/dataModel"

// ============================================================================
// Types
// ============================================================================

type DialogMode = "add" | "edit" | null

interface DialogState {
  mode: DialogMode
  record?: Doc<"glucoseRecords">
}

interface GlucoseDialogContextValue {
  /** Current dialog state */
  state: DialogState
  /** Whether the dialog is open */
  isOpen: boolean
  /** Open the add dialog */
  openAddDialog: () => void
  /** Open the edit dialog with a record */
  openEditDialog: (record: Doc<"glucoseRecords">) => void
  /** Close the dialog */
  closeDialog: () => void
}

// ============================================================================
// Context
// ============================================================================

const GlucoseDialogContext = createContext<GlucoseDialogContextValue | null>(
  null
)

// ============================================================================
// Provider
// ============================================================================

interface GlucoseDialogProviderProps {
  children: ReactNode
}

export function GlucoseDialogProvider({
  children,
}: GlucoseDialogProviderProps) {
  const [state, setState] = useState<DialogState>({ mode: null })

  const openAddDialog = useCallback(() => {
    setState({ mode: "add" })
  }, [])

  const openEditDialog = useCallback((record: Doc<"glucoseRecords">) => {
    setState({ mode: "edit", record })
  }, [])

  const closeDialog = useCallback(() => {
    setState({ mode: null })
  }, [])

  const isOpen = state.mode !== null

  return (
    <GlucoseDialogContext.Provider
      value={{
        state,
        isOpen,
        openAddDialog,
        openEditDialog,
        closeDialog,
      }}
    >
      {children}
    </GlucoseDialogContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useGlucoseDialog(): GlucoseDialogContextValue {
  const context = useContext(GlucoseDialogContext)
  if (!context) {
    throw new Error(
      "useGlucoseDialog must be used within a GlucoseDialogProvider"
    )
  }
  return context
}

