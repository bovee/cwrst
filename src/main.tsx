import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/notifications/styles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  localStorageColorSchemeManager,
  Button,
  Group,
  MantineProvider,
} from '@mantine/core';
import { StateProvider } from './state';
import { Notifications } from '@mantine/notifications';

import App from './App';
import { Audio } from './audio';
import { Keyer } from './keyer';
import { notify } from './personas';

if (new URLSearchParams(document.location.search).has('clearLocalStorage'))
  window.localStorage.clear();

const volume = parseFloat(localStorage.getItem('volume') || '1');
const wpm = parseInt(localStorage.getItem('wpm') || '25');
const farnsworth = parseInt(localStorage.getItem('farnsworth') || '5');

const audio = new Audio(volume);
const keyer = new Keyer(audio, wpm, farnsworth);

declare global {
  interface Window {
    keyer: Keyer;
  }
}
window.keyer = keyer;

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'colorscheme',
});

notify(
  'elmer',
  <Group gap="xl">
    Welcome! I&apos;m here to help you learn morse code.
    <Button size="compact-xs" onClick={() => console.log('Tour')}>
      Take a tour
    </Button>
  </Group>,
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <MantineProvider colorSchemeManager={colorSchemeManager}>
    <StateProvider>
      <Notifications />
      <React.StrictMode>
        <App keyer={keyer} />
      </React.StrictMode>
    </StateProvider>
  </MantineProvider>,
);
