// Clerk's sign-in, sign-up, account menu and profile pop-up read the site's theme tokens
// (the --raay-* copies in globals.css), so they follow light and dark mode instead of rendering white.
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--raay-accent)",
    colorPrimaryForeground: "var(--raay-accent-ink)",
    colorBackground: "var(--raay-surface)",
    colorForeground: "var(--raay-ink)",
    colorMuted: "var(--raay-surface-2)",
    colorMutedForeground: "var(--raay-ink-2)",
    colorInput: "var(--raay-bg)",
    colorInputForeground: "var(--raay-ink)",
    colorBorder: "var(--raay-border)",
    colorNeutral: "var(--raay-ink)",
    colorRing: "var(--raay-accent)",
    colorDanger: "var(--raay-critical)",
    colorSuccess: "var(--raay-good)",
    colorModalBackdrop: "rgba(0, 0, 0, 0.6)",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    // Match Raay's cards and outlined buttons.
    cardBox: { border: "1px solid var(--raay-border)" },
    socialButtonsBlockButton: { border: "1px solid var(--raay-border)", backgroundColor: "var(--raay-bg)" },
  },
  captcha: { theme: "auto" as const },
};
