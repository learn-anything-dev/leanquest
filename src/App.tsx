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

const ICONS: Record<string, string> = {
  today: 'M3 11l9-8 9 8M5 10v10h14V10',
  food: 'M7 3v8a2 2 0 0 0 2 2v8M11 3v8M5 3v8M17 3c-2 2-3 5-3 8h3v10',
  train: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  progress: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  plan: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  rewards: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  learn: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
};
const Icon = ({ name }: { name: string }) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[name]} /></svg>;

const TABS: { id: string; label: string; mode?: 'desk' | 'mob' }[] = [
  { id: 'today', label: 'Today' },
  { id: 'food', label: 'Food' },
  { id: 'train', label: 'Train' },
  { id: 'progress', label: 'Progress' },
  { id: 'plan', label: 'Plan', mode: 'desk' },
  { id: 'rewards', label: 'Rewards', mode: 'desk' },
  { id: 'learn', label: 'Learn', mode: 'desk' },
  { id: 'settings', label: 'Settings', mode: 'desk' },
  { id: 'more', label: 'More', mode: 'mob' },
];

function More() {
  const items = [['plan', 'Plan & budget meals'], ['rewards', 'Rewards & streaks'], ['learn', 'Why it works & sources'], ['settings', 'Settings & backup']];
  return (
    <div class="stack">
      <h1>More</h1>
      {items.map(([id, l]) => <a key={id} class="card link-card" href={`#/${id}`}><Icon name={id} /><b>{l}</b></a>)}
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
    earned.forEach((b) => celebrate(b.id));
    if (s.celebrated.length > 0 || Object.keys(s.days).length > 0) {
      setBoom(true);
      setBadgeMsg(`Badge unlocked: ${earned[0].name}`);
    }
  }, [earned.map((b) => b.id).join(',')]);
  useEffect(() => {
    if (!badgeMsg) return;
    const tm = setTimeout(() => { setBoom(false); setBadgeMsg(null); }, 3200);
    return () => clearTimeout(tm);
  }, [badgeMsg]);

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
      <nav class="tabs" aria-label="Main">
        <div class="inner">
          <a class="brand" href="#/today">LeanQuest</a>
          <div class="links">
            {TABS.map((x) => <a key={x.id} href={`#/${x.id}`} class={`${active === x.id ? 'on' : ''} ${route === x.id ? 'on-d' : ''} ${x.mode ?? ''}`} aria-current={route === x.id ? 'page' : undefined}><Icon name={x.id} /><span>{x.label}</span></a>)}
          </div>
        </div>
      </nav>
      <main class="page">{screen}</main>
      <p class="disclaimer">Not medical advice. Talk to a doctor before big changes.</p>
    </>
  );
}
