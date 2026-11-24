import { useEffect, useState } from 'preact/hooks';
import { today } from './core/dates';
import { derive } from './store/derive';
import { celebrate } from './store/actions';
import { useAppState } from './store/store';
import { Confetti, Toast } from './ui/common';
import { FoodScreen } from './ui/screens/Food';
import { Learn } from './ui/screens/Learn';
import { Onboarding } from './ui/screens/Onboarding';
import { PlanScreen } from './ui/screens/Plan';
import { ProgressScreen } from './ui/screens/Progress';
import { Rewards } from './ui/screens/Rewards';
import { Settings } from './ui/screens/Settings';
import { Today } from './ui/screens/Today';
import { Train } from './ui/screens/Train';

function useRoute(): string {
  const get = () => (location.hash.replace(/^#\/?/, '') || 'today').split('?')[0];
  const [r, setR] = useState(get());
  useEffect(() => {
    const f = () => { setR(get()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return r;
}

const TABS = [
  { id: 'today', ic: '🏠', label: 'Today' },
  { id: 'food', ic: '🍚', label: 'Food' },
  { id: 'train', ic: '💪', label: 'Train' },
  { id: 'progress', ic: '📈', label: 'Progress' },
  { id: 'more', ic: '⋯', label: 'More' },
];

function More() {
  const items = [['plan', '🎯', 'Plan & budget meals'], ['rewards', '🏅', 'Rewards & streaks'], ['learn', '📚', 'Why it works & sources'], ['settings', '⚙️', 'Settings & backup']];
  return (
    <div class="stack">
      <h1>More</h1>
      {items.map(([id, ic, l]) => <a key={id} class="card row" style="text-decoration:none;color:inherit" href={`#/${id}`}><span style="font-size:1.6rem">{ic}</span><b>{l}</b></a>)}
    </div>
  );
}

export function App() {
  const s = useAppState();
  const route = useRoute();
  const t = today();
  const d = derive(s, t);
  const [boom, setBoom] = useState(false);
  const [badgeMsg, setBadgeMsg] = useState<string | null>(null);

  // celebrate newly earned badges once
  const earned = d ? d.badges.filter((b) => b.earned && !s.celebrated.includes(b.id)) : [];
  useEffect(() => {
    if (!earned.length) return;
    // first render after onboarding shouldn't celebrate retroactively: only celebrate if the profile has existed > 0 logs
    earned.forEach((b) => celebrate(b.id));
    if (s.celebrated.length > 0 || Object.keys(s.days).length > 0) {
      setBoom(true);
      setBadgeMsg(`${earned[0].emoji} Badge unlocked: ${earned[0].name}!`);
      const tm = setTimeout(() => { setBoom(false); setBadgeMsg(null); }, 3200);
      return () => clearTimeout(tm);
    }
  }, [earned.map((b) => b.id).join(',')]);

  if (!s.profile || !d) {
    return <Onboarding onDone={() => { location.hash = '#/today'; }} />;
  }

  const active = ['plan', 'rewards', 'learn', 'settings', 'more'].includes(route) ? 'more' : route;
  let screen;
  switch (route) {
    case 'food': screen = <FoodScreen s={s} d={d} />; break;
    case 'train': screen = <Train s={s} d={d} />; break;
    case 'progress': screen = <ProgressScreen s={s} d={d} />; break;
    case 'plan': screen = <PlanScreen s={s} d={d} />; break;
    case 'rewards': screen = <Rewards d={d} />; break;
    case 'learn': screen = <Learn />; break;
    case 'settings': screen = <Settings s={s} d={d} />; break;
    case 'more': screen = <More />; break;
    default: screen = <Today s={s} d={d} />;
  }

  return (
    <>
      <Confetti show={boom} />
      <Toast msg={badgeMsg} />
      <main>{screen}</main>
      <p class="disclaimer">Not medical advice. Talk to a doctor before big changes.</p>
      <nav class="tabs" aria-label="Main">
        <div class="inner">
          {TABS.map((x) => <a key={x.id} href={`#/${x.id}`} class={active === x.id ? 'on' : ''} aria-current={active === x.id ? 'page' : undefined}><span class="ic">{x.ic}</span>{x.label}</a>)}
        </div>
      </nav>
    </>
  );
}
