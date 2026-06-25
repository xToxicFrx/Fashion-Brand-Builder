import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import { Sidebar } from '@/components/Common/Sidebar';
import { Header } from '@/components/Common/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}
