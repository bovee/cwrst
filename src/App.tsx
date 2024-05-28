import { Carousel } from '@mantine/carousel';
import { Button, Center, Container, Flex } from '@mantine/core';
import { useCallback, useEffect } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Keyer } from './keyer';
import { handleKeyedChar } from './learning';
import { useStateContext } from './state';
import { Display } from './Display';
import { Key } from './Key';
import { SettingsPane } from './Settings';
import { StationPane } from './Stations';

import styleClasses from './App.module.css';

function LetterKey(props: {
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

export default function App(props: { keyer: Keyer }) {
  const [station] = useLocalStorage('station', 'test');
  const { dispatch, state } = useStateContext();

  const { keyer } = props;

  const handleKeypress = useCallback(
    (letter: string) => {
      if (station === 'copy' || station === 'rxPractice') {
        dispatch({
          type: 'setCurrentGuess',
          guess: [letter.toLowerCase(), keyer.currentTime],
        });
      } else {
        keyer.keyLetter(letter);
      }
    },
    [dispatch, station, keyer],
  );

  useEffect(() => {
    const handleKeypressEvt = evt => {
      if (LETTERS.indexOf(evt.key) === -1) return;
      evt.stopImmediatePropagation();
      handleKeypress(evt.key);
    };

    keyer.attach((chr, primary) => {
      handleKeyedChar(chr, primary, station, keyer, state, dispatch);
    });

    window.addEventListener('keypress', handleKeypressEvt);
    return () => {
      keyer.detach();
      window.removeEventListener('keypress', handleKeypressEvt);
    };
  }, [dispatch, handleKeypress, keyer, state, station]);

  const keys = LETTERS.split('').map(letter => (
    <LetterKey key={letter} letter={letter} handleKeypress={handleKeypress} />
  ));

  return (
    <>
      <h1>CW RST</h1>
      <Container size="sm">
        <Center>
          <Display keyer={keyer} />
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
            <SettingsPane keyer={keyer} />
          </Carousel.Slide>
        </Carousel>
      </Container>
      <br />
      <Container size="sm">
        <Key keyer={keyer} />
      </Container>
    </>
  );
}
