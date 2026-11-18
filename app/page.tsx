import Image from 'next/image';
import Countdown from '@/components/Countdown';
import RegistrationForm from '@/components/form/RegistrationForm';
import { Calendar, Clock, MapPin, Sparkle } from '@/components/Icons';
import Splash from '@/components/Splash';
import WaterBackground from '@/components/WaterBackground';
import { LOCKUP } from '@/lib/brand-layers';
import { EVENT, venueEn } from '@/lib/config';

export default function Home() {
  return (
    <>
      <WaterBackground />
      <Splash />
      <main className="page">
        <header className="hero">
          {/* the logo is the page title */}
          <h1 className="hero-logo">
            <span className="hero-lockup">
              <Image
                src={LOCKUP.src}
                alt="MWSS RO Water Efficiency Program"
                width={LOCKUP.width}
                height={LOCKUP.height}
                sizes="(max-width: 640px) 240px, 360px"
                priority
              />
            </span>
          </h1>

          <p className="launch-badge">
            <Sparkle width={16} height={16} />
            <span>Official Launch</span>
            <Sparkle width={16} height={16} />
          </p>

          <ul className="event-chips" aria-label="Event details">
            <li>
              <Calendar />
              {EVENT.dateEn}
            </li>
            <li>
              <Clock />
              {EVENT.time}
            </li>
            <li className={EVENT.venue ? undefined : 'is-tba'}>
              <MapPin />
              {venueEn()}
            </li>
          </ul>

          <Countdown />
        </header>

        <RegistrationForm />

        <footer className="page-foot">
          <p>
            Metropolitan Waterworks and Sewerage System – Regulatory Office
            <span>Water Efficiency Program · Official Launch · 2026</span>
          </p>
        </footer>
      </main>
    </>
  );
}
