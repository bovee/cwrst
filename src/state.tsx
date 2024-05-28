import {
  createContext,
  useContext,
  useReducer,
  Dispatch,
  ReactNode,
} from 'react';

import { Keyer, MORSE_MAP } from './keyer';
import { completeLesson, startCopyTraining } from './learning';

export interface State {
  copyMode: string;
  currentGuess: [string, number];
  currentLesson: CurrentLesson;
  currentMessage: string;
  displayText: ReactNode[];
  listeningText: [string, number];
  progress: Progress;
}

export interface Action {
  type: string;
  dispatch?: Dispatch<Action>;
  displayUpdate?: { chr: string; color: string };
  guess?: [string, number];
  keyer?: Keyer;
  lesson?: CurrentLesson;
  message?: string;
  mode?: string;
  pos?: number;
  progress?: Progress;
  trainLetter?: [string, boolean];
}

export interface CurrentLesson {
  [letter: string]: CurrentLessonLetter;
}
interface CurrentLessonLetter {
  total: number;
  correct: number;
  correctTimes: number[];
  wrongGuesses: string[];
}

export interface Progress {
  training: string;
  letters: {
    [letter: string]: {
      recentSpeed: number[];
      wrongGuesses: string[];
      totals: number[];
      corrects: number[];
      wrongs: number[];
    };
  };
  daily: [string, number][];
}

export function initialState(): State {
  const displayText = Array.from({ length: 32 }, (_: number, i: number) => (
    <span key={i}>&nbsp;</span>
  ));
  const copyMode = localStorage.getItem('copy-mode') || '5x5';
  const progress = JSON.parse(
    localStorage.getItem('learning-progress') ||
      '{"training":"kmur","letters":{},"daily":[]}',
  );
  return {
    copyMode,
    currentGuess: ['', 0],
    currentLesson: {},
    currentMessage: '',
    displayText,
    listeningText: ['', 0],
    progress,
  };
}

export const StateContext = createContext({
  state: null,
  dispatch: null,
});

export function useStateContext() {
  return useContext(StateContext);
}

export function StateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(stateReducer, initialState());

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
}

export function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'completeLesson':
      completeLesson(state);
      break;
    case 'setCopyMode':
      state.copyMode = action.mode;
      localStorage.setItem('copy-mode', action.mode);
      break
    case 'setCurrentGuess':
      state.currentGuess = action.guess;
      break;
    case 'setCurrentLesson':
      state.currentLesson = action.lesson;
      break;
    case 'setCurrentMessage':
      state.currentMessage = action.message;
      break;
    case 'setListeningText':
      state.listeningText = [action.message, action.pos || 0];
      break;
    case 'setProgress':
      state.progress = action.progress;
      localStorage.setItem(
        'learning-progress',
        JSON.stringify(action.progress),
      );
      break;
    case 'startCopyTraining':
      startCopyTraining(action.keyer, state);
      break;
    case 'listenNextSection': {
      const [text] = state.listeningText;
      let [, pos] = state.listeningText;
      while (
        !(text.charAt(pos).toLowerCase() in MORSE_MAP) &&
        text.charAt(pos) !== ''
      )
        pos++;
      if (text.charAt(pos) === '') break;
      let endPos = pos;
      while (text.charAt(endPos).toLowerCase() in MORSE_MAP) endPos++;
      state.currentMessage = text.slice(pos, endPos).toLowerCase();
      action.keyer.keyPartnerMessage(state.currentMessage);
      state.listeningText[1] = endPos;
      break;
    }
    case 'listenPreviousSection': {
      const [text] = state.listeningText;
      let [, pos] = state.listeningText;
      while (
        !(text.charAt(pos).toLowerCase() in MORSE_MAP) &&
        text.charAt(pos) !== ''
      )
        pos--;
      if (text.charAt(pos) === '') break;
      let startPos = pos;
      while (startPos && text.charAt(startPos).toLowerCase() in MORSE_MAP)
        startPos--;
      state.currentMessage = text.slice(startPos, pos + 1).toLowerCase();
      action.keyer.keyPartnerMessage(state.currentMessage);
      state.listeningText[1] = startPos;
      break;
    }
    case 'updateDisplay': {
      const { color } = action.displayUpdate;
      let { chr } = action.displayUpdate;
      if (chr === ' ') chr = '\xa0';
      state.displayText.shift();
      state.displayText.push(
        <span key={Math.random()} style={{ color }}>
          {chr}
        </span>,
      );
      break;
    }
    default:
  }
  return { ...state };
}
