import { Carousel } from '@mantine/carousel';
import { Button, Center, Container, Flex } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Audio } from './audio';
import { Keyer } from './keyer';
import { msg } from './messages';
import { Display } from './Display';
import { SettingsPane } from './Settings';
import { StationPane } from './Stations';

import styleClasses from './App.module.css';

function Key(props: {
  letter: string;
  handleKeypress: (letter: string) => void;
}) {
  return (
    <Button onClick={() => props.handleKeypress(props.letter)}>
      {props.letter}
    </Button>
  );
}

const LETTERS: string = 'abcdefghijklmnopqrstuvwxyz0123456789.,?=/';

export default function App(props: { audio: Audio; keyer: Keyer }) {
  const [mobileStart, setMobileStart] = useState(
    'ontouchstart' in document.documentElement,
  );
  const [station] = useLocalStorage('station', 'test');
  const [currentGuess, setCurrentGuess] = useState(['', 0]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [keyType] = useLocalStorage('key-type', 'straight');

  const handleKeypress = useCallback(
    letter => {
      if (station === 'copy' || station === 'rxPractice') {
        setCurrentGuess([letter.toLowerCase(), props.keyer.currentTime]);
      } else {
        props.keyer.keyLetter(letter);
      }
    },
    [station, props.keyer],
  );

  useEffect(() => {
    const handleKeypressEvt = evt => {
      if (LETTERS.indexOf(evt.key) === -1) return;
      evt.stopImmediatePropagation();
      handleKeypress(evt.key);
    };

    window.addEventListener('keypress', handleKeypressEvt);
    return () => {
      window.removeEventListener('keypress', handleKeypressEvt);
    };
  }, [currentGuess, handleKeypress]);

  const keys = LETTERS.split('').map(letter => (
    <Key key={letter} letter={letter} handleKeypress={handleKeypress} />
  ));

  let key;
  if (keyType === 'straight') {
    key = (
      <Button
        fullWidth
        onMouseDown={() => props.keyer.straightKeyDown()}
        onMouseUp={() => props.keyer.straightKeyUp()}
        onClick={() => {
          if (mobileStart) {
            props.audio.start();
            setMobileStart(false);
          }
        }}
        onTouchStart={() => {
          if (!mobileStart) props.keyer.straightKeyDown();
        }}
        onTouchEnd={() => {
          if (!mobileStart) props.keyer.straightKeyUp();
        }}
        size="lg"
      >
        {mobileStart ? `${msg('CLICK_TO')} ${msg('ENABLE')}` : ''}
      </Button>
    );
  } else {
    const ditKey = (
      <Button
        fullWidth
        color="cyan"
        size="lg"
        onMouseDown={() => props.keyer.paddleDown(true, false)}
        onMouseUp={() => props.keyer.paddleUp()}
        onClick={() => {
          if (mobileStart) {
            props.audio.start();
            setMobileStart(false);
          }
        }}
        onTouchStart={() => {
          if (!mobileStart) props.keyer.paddleDown(true, false);
        }}
        onTouchEnd={() => {
          if (!mobileStart) props.keyer.paddleUp();
        }}
      >
        {mobileStart
          ? keyType === 'paddle'
            ? msg('CLICK_TO')
            : msg('ENABLE')
          : '•'}
      </Button>
    );
    key = (
      <Button.Group>
        {keyType === 'paddle' ? ditKey : ''}
        <Button
          fullWidth
          size="lg"
          onMouseDown={() => props.keyer.paddleDown(false, true)}
          onMouseUp={() => props.keyer.paddleUp()}
          onClick={() => {
            if (mobileStart) {
              props.audio.start();
              setMobileStart(false);
            }
          }}
          onTouchStart={() => {
            if (!mobileStart) props.keyer.paddleDown(false, true);
          }}
          onTouchEnd={() => {
            if (!mobileStart) props.keyer.paddleUp();
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

  return (
    <>
      <h1>CW RST</h1>
      <Container size="sm">
        <Center>
          <Display
            audio={props.audio}
            keyer={props.keyer}
            currentGuess={currentGuess}
            currentMessage={currentMessage}
            setCurrentGuess={setCurrentGuess}
            setCurrentMessage={setCurrentMessage}
          />
        </Center>
      </Container>
      <br />
      <Container size="sm">
        <Carousel draggable={false} initialSlide={1} classNames={styleClasses}>
          <Carousel.Slide>
            <StationPane />
          </Carousel.Slide>
          <Carousel.Slide>
            <Center>
              <Flex gap="md" wrap="wrap">
                {keys}
              </Flex>
            </Center>
          </Carousel.Slide>
          <Carousel.Slide>
            <SettingsPane audio={props.audio} keyer={props.keyer} />
          </Carousel.Slide>
        </Carousel>
      </Container>
      <br />
      <Container size="sm">{key}</Container>
    </>
  );
}
