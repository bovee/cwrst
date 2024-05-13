import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import '@mantine/notifications/styles.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { localStorageColorSchemeManager, Button, Group, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { notifications } from '@mantine/notifications';

import App from './App';
import { Audio } from './audio';
import { Keyer } from './keyer';
import { PERSONAS } from './data';

const volume = parseFloat(localStorage.getItem('volume') || '1');
const wpm = parseInt(localStorage.getItem('wpm') || '25');
const farnsworth = parseInt(localStorage.getItem('farnsworth') || '5');

const audio = new Audio(volume);
const keyer = new Keyer(audio, wpm, farnsworth);
window.keyer = keyer;

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'colorscheme',
});

notifications.show({
  icon: PERSONAS.elmer.icon,
  styles: { icon: { fontSize: '32px' } },
  color: 'transparent',
  radius: 'lg',
  title: PERSONAS.elmer.name,
  autoClose: false,
  message: (<Group gap="xl">
            Welcome! I'm here to help you learn morse code.
              <Button size="compact-xs" onClick={() => console.log('Tour')}>Take a tour</Button>
            </Group>),
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <MantineProvider colorSchemeManager={colorSchemeManager}>
    <Notifications />
    <React.StrictMode>
      <App audio={audio} keyer={keyer} />
    </React.StrictMode>
  </MantineProvider>,
);
