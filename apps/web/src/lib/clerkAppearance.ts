import type { Appearance } from "@clerk/types"

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "hsl(273, 100%, 71%)",
    colorBackground: "hsl(275, 85%, 4%)",
    colorInputBackground: "hsl(275, 80%, 10%)",
    colorInputText: "hsl(0, 0%, 98%)",
    colorText: "hsl(0, 0%, 98%)",
    colorTextSecondary: "hsl(275, 15%, 70%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorSuccess: "hsl(142, 76%, 45%)",
    colorTextOnPrimaryBackground: "hsl(275, 85%, 4%)",
    borderRadius: "12px",
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    // Card styling with glass effect
    card: "glass-card border-border/50 shadow-glow",
    // Form fields
    formFieldInput: "bg-input border-border focus:ring-ring",
    formFieldLabel: "text-foreground",
    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
    // Buttons
    formButtonPrimary: "btn-neon",
    // Social buttons - fix contrast and layout
    socialButtonsBlockButton: 
      "!bg-card border border-border hover:border-primary/50 !text-foreground",
    socialButtonsBlockButtonText: "!text-foreground font-medium",
    socialButtonsProviderIcon: "w-5 h-5",
    // Divider
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",
    // Footer
    footer: "hidden",
    footerActionLink: "text-primary hover:text-accent",
    // Header
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
    // Identity preview (shows email after entering)
    identityPreviewText: "text-foreground",
    identityPreviewEditButton: "text-primary hover:text-accent",
    // Alert/error messages
    alert: "bg-destructive/20 border-destructive/30 text-destructive",
    alertText: "text-destructive",
    // Form field errors
    formFieldErrorText: "text-destructive",
    formFieldSuccessText: "text-success",
    // UserButton dropdown menu
    userButtonPopoverCard: "!bg-card border border-border shadow-glow",
    userButtonPopoverMain: "!text-foreground",
    userButtonPopoverActions: "!text-foreground",
    userButtonPopoverActionButton: "!text-foreground hover:!bg-secondary",
    userButtonPopoverActionButtonText: "!text-foreground",
    userButtonPopoverActionButtonIcon: "!text-foreground",
    userButtonPopoverFooter: "hidden",
    // User preview in dropdown
    userPreviewMainIdentifier: "!text-foreground",
    userPreviewSecondaryIdentifier: "!text-muted-foreground",
    // Menu items
    menuButton: "!text-foreground hover:!bg-secondary",
    menuItem: "!text-foreground hover:!bg-secondary",
    menuList: "!bg-card border border-border",
  },
}

