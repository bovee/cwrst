import { Dispatch } from 'react';
import { Button, Group } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { Keyer } from './keyer';
import { notify } from './personas';
import { Action, CurrentLesson, State } from './state';

export const LCWO_LETTERS = 'kmuresnaptlwi.jz=foy,vg5/q92h38b?47c1d60x';
const FINLEY_LETTERS = 'kmrsuaptlowi.njef0y,vg5/q9zh38b?427c1d6x';

export function handleKeyedChar(chr, primary, station, keyer, state, dispatch) {
  if (!chr) return;

  let color = primary ? 'black' : 'grey';
  switch (station) {
    case 'copy':
      if (primary) {
        if (chr === ' ') return;
        if (!state.currentMessage) {
          dispatch({
            type: 'startCopyTraining',
            keyer,
          });
          return;
        }
        dispatch({ type: 'setCurrentMessage', message: '' });
        return;
      }

      // the keyer sends an extra space at the end
      if (!state.currentMessage && chr === ' ') {
        dispatch({ type: 'completeLesson', dispatch });
        popSuccessModal(state, dispatch);
      }

      if (state.currentMessage && state.currentMessage[0] !== chr)
        throw new Error(
          `Callback with wrong letter ${chr}; expected ${state.currentMessage[0]}`,
        );
      if (state.currentMessage)
        dispatch({
          type: 'setCurrentMessage',
          message: state.currentMessage.slice(1),
        });

      if (chr !== ' ') {
        const [score, lesson] = gradeGuess(chr, keyer, state);
        dispatch({ type: 'setCurrentLesson', lesson });
        if (score === 1) color = 'blue';
        if (score === -1) color = 'red';
      }

      dispatch({ type: 'setCurrentGuess', guess: ['', 0] });
      dispatch({ type: 'updateDisplay', displayUpdate: { chr, color } });
      break;
    case 'listen':
      if (!primary) {
        if (!state.currentMessage && chr === ' ') {
          dispatch({ type: 'listenNextSection', keyer });
        } else if (state.currentMessage)
          dispatch({
            type: 'setCurrentMessage',
            message: state.currentMessage.slice(1),
          });
        dispatch({ type: 'updateDisplay', displayUpdate: { chr, color } });
        return;
      }
      if (chr === ' ') return;
      if (chr === 'i') {
        dispatch({ type: 'listenPreviousSection', keyer });
      } else {
        dispatch({ type: 'listenNextSection', keyer });
      }
      dispatch({ type: 'updateDisplay', displayUpdate: { chr, color } });
      break;
    default:
      dispatch({ type: 'updateDisplay', displayUpdate: { chr, color } });
  }
}

// Combined from Chapter 4 of https://www.mikeandkey.org/docs/The_Art_and_Skill_of_Radio_Telegraphy-3rd-edition.pdf
// and http://www.4sqrp.com/resource/w0xi/w0xi-100/most_common.html
// and https://www.hamradioqrp.com/2016/11/get-used-to-common-stuff.html
const COMMON_WORDS: string[] = '* + . / 359 479 489 559 579 589 599 73 = ? a about age agn alinco all am an and ant any ar are as at be beam been before bk bt but by can clear cloudy cold collins come cool could cq cw digital dipole do dont dx efhw elecraft es every fb first fog for from g5rv ga ge gm go great had hail has have he heathkit her hi him his hot hour how hr hw hw? i icom if in into inv is it its jt65 just kn know knwd like little lsb made man may me mean men more must my name no not now nr ocf of oh om on one only or other our out over people pse psk psk31 pwr qrl qrm qrn qrp qrq qrs qrz qsb qsy qth r rain really rig right rst rtu said say shall she should sk sleet sloper snow so some ssb such sunny swr temp tentec test that thats the their them then there these they think this time tnx to tu two uh up upon us usb v vertical very warm was we well were what when where which who will windom windy with work would wx yaesu yeah you your yrs'.split(' ');

export function startCopyTraining(keyer: Keyer, state: State) {
  let testMessage = '';

  switch (state.copyMode) {
    case '5x5': 
      for (let i = 0; i < 25; i++) {
        if (i && i % 5 === 0) testMessage += ' ';
        testMessage += state.progress.training.charAt(
          Math.floor(Math.random() * state.progress.training.length),
        );
      }
      break;
    case 'common-words':
      // filter to words containing the current training characters
      const chars = new Set(state.progress.training);
      const words = COMMON_WORDS.filter(word => {
        for (const char of word) {
          if (!chars.has(char)) return false;
        }
        return true;
      });
      // TODO: notify the user that there aren't any valid words to test
      if (!words.length) break;

      for (let i = 0; i < 5; i++) {
        testMessage += words[Math.floor(Math.random() * words.length)] + ' ';
      }
      break;
  }

  keyer.keyPartnerMessage(testMessage);
  state.currentMessage = testMessage;
}

export function gradeGuess(
  chr: string,
  keyer: Keyer,
  state: State,
): [number, CurrentLesson] {
  let score = 0;
  if (!(chr in state.currentLesson))
    state.currentLesson[chr] = {
      total: 0,
      correct: 0,
      correctTimes: [],
      wrongGuesses: [],
    };
  state.currentLesson[chr].total += 1;
  if (state.currentGuess[0] && state.currentGuess[0] === chr) {
    state.currentLesson[chr].correct += 1;
    const delay = Math.round(
      1000 * (keyer.currentTime - state.currentGuess[1]),
    );
    state.currentLesson[chr].correctTimes.push(delay);
    score = 1;
  } else if (state.currentGuess[0] && state.currentGuess[0] !== chr) {
    score = -1;
    state.currentLesson[chr].wrongGuesses.push(state.currentGuess[0]);
  } else {
    score = 0;
  }
  return [score, state.currentLesson];
}

export function completeLesson(state: State) {
  // update daily progress
  const today = new Date().toISOString().slice(0, 10);
  if (
    !state.progress.daily.length ||
    state.progress.daily[state.progress.daily.length - 1][0] !== today
  )
    state.progress.daily.push([today, 0]);
  state.progress.daily[state.progress.daily.length - 1][1] += 1;

  // update per-letter progress
  for (const [letter, data] of Object.entries(state.currentLesson)) {
    if (!(letter in state.progress.letters))
      state.progress.letters[letter] = {
        recentSpeed: [],
        wrongGuesses: [],
        totals: [],
        corrects: [],
        wrongs: [],
      };
    for (const time of data.correctTimes) {
      state.progress.letters[letter].recentSpeed.push(time);
      if (state.progress.letters[letter].recentSpeed.length > 20)
        state.progress.letters[letter].recentSpeed.shift();
    }
    for (const guess of data.wrongGuesses) {
      state.progress.letters[letter].wrongGuesses.push(guess);
      if (state.progress.letters[letter].wrongGuesses.length > 20)
        state.progress.letters[letter].wrongGuesses.shift();
    }

    // per-lesson statistics
    state.progress.letters[letter].totals.push(data.total);
    if (state.progress.letters[letter].totals.length > 10)
      state.progress.letters[letter].totals.shift();
    state.progress.letters[letter].corrects.push(data.correct);
    if (state.progress.letters[letter].corrects.length > 10)
      state.progress.letters[letter].corrects.shift();
    state.progress.letters[letter].wrongs.push(data.wrongGuesses.length);
    if (state.progress.letters[letter].wrongs.length > 10)
      state.progress.letters[letter].wrongs.shift();
  }

  state.currentLesson = {};
}

export function popSuccessModal(state: State, dispatch: Dispatch<Action>) {
  let correct = 0;
  let total = 0;
  for (const [, data] of Object.entries(state.currentLesson)) {
    correct += data.correct;
    total += data.total;
  }
  const perCorrect = correct / total;
  let extraButton = <span />;
  let notificationId: string;
  if (perCorrect > 0.9) {
    const currentLetters = new Set(state.progress.training);
    for (const letter of LCWO_LETTERS) {
      if (!currentLetters.has(letter)) {
        extraButton = (
          <Button
            size="compact-xs"
            onClick={() => {
              state.progress.training += letter;
              dispatch({
                type: 'setProgress',
                progress: state.progress,
              });
              notifications.hide(notificationId);
            }}
          >
            Add the letter {letter.toUpperCase()}
          </Button>
        );
        break;
      }
    }
  }
  notify(
    'elmer',
    <Group gap="xl">
      You did it! {Math.round(100 * perCorrect)}% right.
      {extraButton}
    </Group>,
  );
}
