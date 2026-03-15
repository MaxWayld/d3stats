import DashboardShell from "@/components/DashboardShell";
import KeyboardShortcutsProvider from "@/components/KeyboardShortcutsProvider";
import ShortcutsModal from "@/components/ShortcutsModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <KeyboardShortcutsProvider>
        {children}
      </KeyboardShortcutsProvider>
      <ShortcutsModal />
    </DashboardShell>
  );
}
