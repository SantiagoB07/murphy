"use client"

import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, useAction, useMutation } from "convex/react"
import { Mail, UserPlus, Trash2, Clock, Loader2, Users } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { api } from "@murphy/backend/convex/_generated/api"
import type { Id } from "@murphy/backend/convex/_generated/dataModel"

type InviteFormValues = {
  email: string
}

interface CoadminSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CoadminSheet({ open, onOpenChange }: CoadminSheetProps) {
  const t = useTranslations("Configuracion")
  const locale = useLocale()
  const [isInviting, setIsInviting] = useState(false)
  const [coadminToRevoke, setCoadminToRevoke] = useState<Id<"coadminProfiles"> | null>(null)
  const [invitationToRevoke, setInvitationToRevoke] = useState<string | null>(null)

  const inviteFormSchema = z.object({
    email: z.string().min(1, t("coadmin.validation.emailInvalid")).email(t("coadmin.validation.emailInvalid")),
  })

  // Queries and mutations
  const coadmins = useQuery(api.coadmins.getPatientCoadmins)
  const inviteCoadmin = useAction(api.coadmins.inviteCoadmin)
  const revokeCoadmin = useMutation(api.coadmins.revokeCoadminAccess)
  const revokeInvitation = useAction(api.coadmins.revokeInvitation)
  const pendingInvitations = useAction(api.coadmins.getPendingInvitations)

  const [invitations, setInvitations] = useState<Array<{
    id: string
    emailAddress: string
    status: string
    createdAt: number
    expiresAt: number
  }>>([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)

  // Load pending invitations when sheet opens
  const loadInvitations = async () => {
    if (!open) return
    setLoadingInvitations(true)
    try {
      const result = await pendingInvitations()
      setInvitations(result)
    } catch (error) {
      console.error("Error loading invitations:", error)
    } finally {
      setLoadingInvitations(false)
    }
  }

  // Load invitations when sheet opens
  useState(() => {
    if (open) {
      loadInvitations()
    }
  })

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: InviteFormValues) => {
    setIsInviting(true)
    try {
      await inviteCoadmin({ email: data.email })
      toast.success(t("coadmin.toast.inviteSentTitle"), {
        description: t("coadmin.toast.inviteSentMessage", { email: data.email }),
      })
      form.reset()
      loadInvitations()
    } catch (error) {
      console.error("Error sending invitation:", error)
      const message = error instanceof Error ? error.message : t("coadmin.toast.inviteErrorMessage")
      toast.error(t("coadmin.toast.inviteErrorTitle"), { description: message })
    } finally {
      setIsInviting(false)
    }
  }

  const handleRevokeCoadmin = async () => {
    if (!coadminToRevoke) return
    try {
      await revokeCoadmin({ coadminId: coadminToRevoke })
      toast.success(t("coadmin.toast.revokeSuccessTitle"), {
        description: t("coadmin.toast.revokeSuccessMessage"),
      })
    } catch (error) {
      console.error("Error revoking coadmin:", error)
      toast.error(t("coadmin.toast.inviteErrorTitle"), { description: t("coadmin.toast.revokeErrorMessage") })
    } finally {
      setCoadminToRevoke(null)
    }
  }

  const handleRevokeInvitation = async () => {
    if (!invitationToRevoke) return
    try {
      await revokeInvitation({ invitationId: invitationToRevoke })
      toast.success(t("coadmin.toast.cancelInvitationTitle"))
      loadInvitations()
    } catch (error) {
      console.error("Error revoking invitation:", error)
      toast.error(t("coadmin.toast.inviteErrorTitle"), { description: t("coadmin.toast.cancelInvitationErrorMessage") })
    } finally {
      setInvitationToRevoke(null)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t("coadmin.sheet.title")}
            </SheetTitle>
            <SheetDescription>
              {t("coadmin.sheet.description")}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Invite Form */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-foreground">{t("coadmin.invite.title")}</h3>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("coadmin.invite.emailLabel")}</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type="email"
                              placeholder={t("coadmin.invite.emailPlaceholder")}
                              {...field}
                              disabled={isInviting}
                            />
                            <Button type="submit" disabled={isInviting} size="icon">
                              {isInviting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <UserPlus className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t("coadmin.pending.title")}
                </h3>
                <div className="space-y-2">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{invitation.emailAddress}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("coadmin.pending.expires")} {formatDate(invitation.expiresAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setInvitationToRevoke(invitation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Coadmins */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-foreground">{t("coadmin.active.title")}</h3>
              {!coadmins ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : coadmins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t("coadmin.active.none")}</p>
                  <p className="text-xs mt-1">
                    {t("coadmin.active.inviteHint")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {coadmins.map((coadmin) => (
                    <div
                      key={coadmin._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {coadmin.fullName?.charAt(0).toUpperCase() || "C"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{coadmin.fullName}</p>
                          <p className="text-xs text-muted-foreground">{coadmin.phoneNumber}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setCoadminToRevoke(coadmin._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Revoke Coadmin Dialog */}
      <AlertDialog open={!!coadminToRevoke} onOpenChange={() => setCoadminToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("coadmin.dialogs.revokeAccessTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("coadmin.dialogs.revokeAccessDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("coadmin.dialogs.keepButton")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeCoadmin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("coadmin.dialogs.revokeButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Invitation Dialog */}
      <AlertDialog open={!!invitationToRevoke} onOpenChange={() => setInvitationToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("coadmin.dialogs.cancelInvitationTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("coadmin.dialogs.cancelInvitationDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("coadmin.dialogs.keepButton")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeInvitation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("coadmin.dialogs.cancelInvitationButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}




