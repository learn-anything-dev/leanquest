import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import './fonts';
import './styles.css';
import './layout.css';
import './desktop.css';
import './typography.css';
import './today.css';

registerSW({ immediate: true });
render(<App />, document.getElementById('app')!);
