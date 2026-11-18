import type { Metadata } from 'next';
import CheckInDesk from '@/components/checkin/CheckInDesk';
import LoginForm from '@/components/dashboard/LoginForm';
import WaterBackground from '@/components/WaterBackground';
import { dashboardConfigured, sessionRole } from '@/lib/auth';
import '../dashboard/dashboard.css';
import './checkin.css';

export const metadata: Metadata = {
  title: 'Check-in desk · WEP Official Launch · MWSS RO',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CheckInPage() {
  const role = await sessionRole();
  if (!role) {
    return (
      <>
        <WaterBackground />
        <main className="login-page">
          <LoginForm configured={dashboardConfigured()} area="checkin" />
        </main>
      </>
    );
  }
  return <CheckInDesk isAdmin={role === 'admin'} />;
}
