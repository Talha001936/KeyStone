// app/(guest)/layout.jsx
import { GuestNavbar } from "@/components/guest/GuestNavbar";
import { GuestFooter } from "@/components/guest/GuestFooter";

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GuestNavbar />
      <main className="flex-1">{children}</main>
      <GuestFooter />
    </div>
  );
}