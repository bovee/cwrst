import { Button } from '@mantine/core';
import { useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Keyer } from './keyer';
import { msg } from './messages';

export function Key(props: { keyer: Keyer }) {
  const isMobile = 'ontouchstart' in document.documentElement;
  const [keyType] = useLocalStorage('key-type', 'straight');
  const [mobileStart, setMobileStart] = useState(isMobile);

  if (keyType === 'straight') {
    return (
      <Button
        fullWidth
        onMouseDown={() => {
          if (!isMobile) props.keyer.straightKeyDown();
        }}
        onMouseUp={() => {
          if (!isMobile) props.keyer.straightKeyUp();
        }}
        onClick={() => {
          if (mobileStart) {
            props.keyer.audio.start();
            setMobileStart(false);
          }
        }}
        onTouchStart={() => {
          if (isMobile && !mobileStart) props.keyer.straightKeyDown();
        }}
        onTouchEnd={() => {
          if (isMobile && !mobileStart) props.keyer.straightKeyUp();
        }}
        size="lg"
      >
        {mobileStart ? `${msg('CLICK_TO')} ${msg('ENABLE')}` : ''}
      </Button>
    );
  }
  const ditKey = (
    <Button
      fullWidth
      color="cyan"
      size="lg"
      onMouseDown={() => {
        if (!isMobile) props.keyer.paddleDown(true, false);
      }}
      onMouseUp={() => {
        if (!isMobile) props.keyer.paddleUp();
      }}
      onClick={() => {
        if (mobileStart) {
          props.keyer.audio.start();
          setMobileStart(false);
        }
      }}
      onTouchStart={() => {
        if (isMobile && !mobileStart) props.keyer.paddleDown(true, false);
      }}
      onTouchEnd={() => {
        if (isMobile && !mobileStart) props.keyer.paddleUp();
      }}
    >
      {mobileStart
        ? keyType === 'paddle'
          ? msg('CLICK_TO')
          : msg('ENABLE')
        : '•'}
    </Button>
  );
  return (
    <Button.Group>
      {keyType === 'paddle' ? ditKey : ''}
      <Button
        fullWidth
        size="lg"
        onMouseDown={() => {
          if (!isMobile) props.keyer.paddleDown(false, true);
        }}
        onMouseUp={() => {
          if (!isMobile) props.keyer.paddleUp();
        }}
        onClick={() => {
          if (mobileStart) {
            props.keyer.audio.start();
            setMobileStart(false);
          }
        }}
        onTouchStart={() => {
          if (isMobile && !mobileStart) props.keyer.paddleDown(false, true);
        }}
        onTouchEnd={() => {
          if (isMobile && !mobileStart) props.keyer.paddleUp();
        }}
      >
        {mobileStart
          ? keyType === 'reverse'
            ? msg('CLICK_TO')
            : msg('ENABLE')
          : '–'}
      </Button>
      {keyType === 'reverse' ? ditKey : ''}
    </Button.Group>
  );
}
