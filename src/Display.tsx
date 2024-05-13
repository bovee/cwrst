import { Button, Card, Group, Indicator } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Audio } from './audio';
import { Keyer } from './keyer';
import { PERSONAS } from './data';

export const LCWO_LETTERS = 'kmuresnaptlwi.jz=foy,vg5/q92h38b?47c1d60x';
const FINLEY_LETTERS = 'kmrsuaptlowi.njef0y,vg5/q9zh38b?427c1d6x';

export function Display(props: {
  audio: Audio;
  keyer: Keyer;
  currentGuess: [string, number];
  currentMessage: string;
  setCurrentGuess: ([string, number]) => void;
  setCurrentMessage: (msg: string) => void;
}) {
  const display = Array.from({ length: 32 }, (_: number, i: number) => (
    <span key={i}>&nbsp;</span>
  ));
  const [scrollText, setScrollText] = useState(display);
  const [rxGain, setRxGain] = useState(10);
  const [currentLesson, setCurrentLesson] = useState({});
  const [progress, setProgress] = useLocalStorage('learning-progress', {
    training: 'kmur',
    letters: {},
    daily: [],
  });
  const [station] = useLocalStorage('station', 'test');

  const {
    audio,
    currentGuess,
    currentMessage,
    keyer,
    setCurrentGuess,
    setCurrentMessage,
  } = props;

  const updateDisplay = useCallback(
    (chr, color) => {
      if (chr === ' ') chr = '\xa0';
      scrollText.shift();
      scrollText.push(
        <span key={Math.random()} style={{ color: color }}>
          {chr}
        </span>,
      );
      setScrollText(scrollText);
    },
    [scrollText],
  );

  const startTraining = useCallback(() => {
    let testMessage = '';

    for (let i = 0; i < 25; i++) {
      if (i && i % 5 === 0) testMessage += ' ';
      testMessage += progress.training.charAt(
        Math.floor(Math.random() * progress.training.length),
      );
    }

    setCurrentMessage(testMessage);
    keyer.keyPartnerMessage(testMessage);
  }, [keyer, progress, setCurrentMessage]);

  const gradeGuess = useCallback(
    (chr: string): number => {
      let score = 0;
      if (!(chr in currentLesson))
        currentLesson[chr] = {
          total: 0,
          correct: 0,
          correctTimes: [],
          wrongGuesses: [],
        };
      currentLesson[chr].total += 1;
      if (currentGuess[0] && currentGuess[0] === chr) {
        currentLesson[chr].correct += 1;
        const delay = Math.round(1000 * (keyer.currentTime - currentGuess[1]));
        currentLesson[chr].correctTimes.push(delay);
        score = 1;
      } else if (currentGuess[0] && currentGuess[0] !== chr) {
        score = -1;
        currentLesson[chr].wrongGuesses.push(currentGuess[0]);
      } else {
        score = 0;
      }
      setCurrentLesson(currentLesson);
      return score;
    },
    [currentGuess, currentLesson, setCurrentLesson, keyer],
  );

  const updateProgress = useCallback((): number => {
    // update daily progress
    const today = new Date().toISOString().slice(0, 10);
    if (
      !progress.daily.length ||
      progress.daily[progress.daily.length - 1][0] !== today
    )
      progress.daily.push([today, 0]);
    progress.daily[progress.daily.length - 1][1] += 1;

    // update per-letter progress
    let correct = 0;
    let total = 0;
    for (const [letter, data] of Object.entries(currentLesson)) {
      correct += data.correct;
      total += data.total;
      if (!(letter in progress.letters))
        progress.letters[letter] = {
          recentSpeed: [],
          wrongGuesses: [],
          totals: [],
          corrects: [],
          wrongs: [],
        };
      for (const time of data.correctTimes) {
        progress.letters[letter].recentSpeed.push(time);
        if (progress.letters[letter].recentSpeed.length > 20)
          progress.letters[letter].recentSpeed.shift();
      }
      for (const guess of data.wrongGuesses) {
        progress.letters[letter].wrongGuesses.push(guess);
        if (progress.letters[letter].wrongGuesses.length > 20)
          progress.letters[letter].wrongGuesses.shift();
      }

      // per-lesson statistics
      progress.letters[letter].totals.push(data.total);
      if (progress.letters[letter].totals.length > 10)
        progress.letters[letter].totals.shift();
      progress.letters[letter].corrects.push(data.correct);
      if (progress.letters[letter].corrects.length > 10)
        progress.letters[letter].corrects.shift();
      progress.letters[letter].wrongs.push(data.wrongGuesses.length);
      if (progress.letters[letter].wrongs.length > 10)
        progress.letters[letter].wrongs.shift();
    }

    const perCorrect = correct / total;
    setProgress(progress);
    setCurrentLesson({});
    return perCorrect;
  }, [currentLesson, progress, setCurrentLesson, setProgress]);

  useEffect(() => {
    keyer.attach((chr, primary) => {
      if (!chr) return;

      let color = primary ? 'black' : 'grey';
      switch (station) {
        case 'copy':
          if (primary) {
            if (chr === ' ') return;
            if (!currentMessage) {
              startTraining();
              return;
            }
            setCurrentMessage('');
            return;
          }

          // the keyer sends an extra space at the end
          if (!currentMessage && chr === ' ') {
            const perCorrect = updateProgress();
            let extraButton = <span />;
            if (perCorrect > 0.9) {
              const currentLetters = new Set(progress.training);
              for (const letter of LCWO_LETTERS) {
                if (!currentLetters.has(letter)) {
                  extraButton = (
                    <Button
                      size="compact-xs"
                      onClick={() => {
                        progress.training += letter;
                        // TODO: this should also close the notification?
                        setProgress(progress);
                      }}
                    >
                      Add the letter {letter.toUpperCase()}
                    </Button>
                  );
                  break;
                }
              }
            }
            notifications.show({
              icon: PERSONAS.elmer.icon,
              styles: { icon: { fontSize: '32px' } },
              color: 'transparent',
              radius: 'lg',
              title: PERSONAS.elmer.name,
              autoClose: false,
              message: (
                <Group gap="xl">
                  You did it! {Math.round(100 * perCorrect)}% right.
                  {extraButton}
                </Group>
              ),
            });
          }

          if (currentMessage && currentMessage[0] !== chr)
            throw new Error(
              `Callback with wrong letter ${chr}; expected ${currentMessage[0]}`,
            );
          if (currentMessage) setCurrentMessage(currentMessage.slice(1));

          if (chr !== ' ') {
            const score = gradeGuess(chr);
            if (score === 1) color = 'blue';
            if (score === -1) color = 'red';
          }

          setCurrentGuess(['', 0]);
          updateDisplay(chr, color);
          break;
        default:
          updateDisplay(chr, color);
      }
    });

    const intervalId = setInterval(() => {
      setRxGain(audio.getActualVolume());
    }, 100);

    return () => {
      keyer.detach();
      clearInterval(intervalId);
    };
  }, [
    audio,
    currentGuess,
    currentLesson,
    currentMessage,
    gradeGuess,
    keyer,
    progress,
    setCurrentGuess,
    setCurrentLesson,
    setCurrentMessage,
    setProgress,
    startTraining,
    station,
    updateProgress,
    updateDisplay,
  ]);

  return (
    <>
      <Indicator
        inline
        size={16}
        offset={7}
        position="bottom-end"
        color={`rgb(${25 * rxGain}, 0, 0)`}
        withBorder
      >
        <Card padding="lg" withBorder>
          <Group gap="0" style={{ fontFamily: 'monospace' }}>
            {scrollText}
          </Group>
        </Card>
      </Indicator>
    </>
  );
}
