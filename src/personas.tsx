import { notifications } from '@mantine/notifications';
import { ReactNode } from 'react';

export const PERSONAS = {
  elmer: {
    name: 'Elmer',
    call: 'E78R',
    icon: '👴',
    wpm: 0,
    farnsworth: 0,
  },
  techie: {
    name: 'Techie',
    call: 'AK6QRA',
    icon: '\uD83D\uDC68\uD83C\uDFFF\u200D\uD83D\uDCBB',
  },
  frank: {
    name: 'Frank',
    call: 'WB2XEJ',
    icon: 'U0001f9d4',
  },
  astro: {
    name: 'Astro',
    icon: '\uD83D\uDC69\u200D\uD83D\uDE80',
  },
  zara: {
    name: 'Zara',
    call: 'KA2XNY',
    icon: '\uD83E\uDDD5\uD83C\uDFFD',
  },
  captain: {
    name: 'Captain',
    call: 'KH6XSP',
    icon: '\uD83D\uDC69\uD83C\uDFFB\u200D\u2708\uFE0F',
  },
};

export function notify(who: string, message: ReactNode) {
  notifications.show({
    icon: PERSONAS[who].icon,
    styles: { icon: { fontSize: '32px' } },
    color: 'transparent',
    radius: 'lg',
    title: PERSONAS[who].name,
    autoClose: false,
    message,
  });
}
