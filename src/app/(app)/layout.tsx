import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#030914] text-white">
      <Sidebar />

      <main className="flex-1 pb-24 md:pb-0">
        {children}
      </main>
    </div>
  );
}