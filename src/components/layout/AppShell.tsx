import { ReactNode } from "react";
import BottomBar from "../ui/BottomBar";

/**
 * Main layout wrapper that provides:
 * - Decorative background blob
 * - Content container
 * - Bottom navigation bar
 *
 * Update the BottomBar navigation to match your app's routes.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="app-blob" aria-hidden="true" />
      <div className="app-content">{children}</div>
      <BottomBar />
    </div>
  );
}
