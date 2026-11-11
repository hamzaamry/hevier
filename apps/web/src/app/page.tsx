import { Afterglow } from '@/components/afterglow';
import { AfterglowDriver } from '@/components/afterglow-driver';
import { Faq } from '@/components/faq';
import { Footer } from '@/components/footer';
import { Free } from '@/components/free';
import { Get } from '@/components/get';
import { JsonLd } from '@/components/json-ld';
import { Moments } from '@/components/moments';
import { Nav } from '@/components/nav';
import { Privacy } from '@/components/privacy';
import { RevealRoot } from '@/components/reveal-root';
import { RunRecovery } from '@/components/run-recovery';
import { Science } from '@/components/science';
import { Sets } from '@/components/sets';
import { Week } from '@/components/week';
import { What } from '@/components/what';

export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Afterglow />
        <What />
        <Sets />
        <Week />
        <Science />
        <Moments />
        <Privacy />
        <Free />
        <RunRecovery />
        <Faq />
        <Get />
      </main>
      <Footer />
      <JsonLd />
      <RevealRoot />
      <AfterglowDriver />
    </>
  );
}
