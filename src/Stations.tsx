import {
  Button,
  Checkbox,
  FileInput,
  Flex,
  NativeSelect,
  SegmentedControl,
} from '@mantine/core';
import { useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { LCWO_LETTERS } from './learning';
import { useStateContext } from './state';

export function StationPane() {
  const { state, dispatch } = useStateContext();
  const [station, setStation] = useLocalStorage('station', 'test');
  const [textFile, setTextFile] = useState(null);

  let description = '';
  let controls = <></>;
  if (station === 'test') description = 'Practice sending with the keys.';
  if (station === 'copy') {
    description = 'Practice receiving copy.';
    const boxes = Array.from(LCWO_LETTERS).map(letter => (
      <Checkbox
        key={letter}
        label={letter}
        checked={state.progress.training.indexOf(letter) > -1}
        onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
          const loc = state.progress.training.indexOf(letter);
          if (evt.currentTarget.checked && loc === -1) {
            state.progress.training += letter;
          } else if (!evt.currentTarget.checked && loc > -1) {
            state.progress.training =
              state.progress.training.slice(0, loc) +
              state.progress.training.slice(loc + 1);
          }
          dispatch({ type: 'setProgress', progress: state.progress });
        }}
      />
    ));
    controls = (
      <Flex gap="md" wrap="wrap">
        {boxes}
        <br />
        <NativeSelect
          value={state.copyMode}
          onChange={evt => dispatch({ type: 'setCopyMode', mode: evt.currentTarget.value })}
          data={[
            { label: '5x5', value: '5x5' },
            { label: 'Common Words', value: 'common-words' },
          ]}
        />
      </Flex>
    );
  }
  if (station === 'listen') {
    description = 'Listen to text.';
    controls = (
      <>
        <FileInput
          accept="text/plain"
          label="Upload a text file to read."
          value={textFile}
          onChange={file => {
            setTextFile(file);
            file
              .text()
              .then(text =>
                dispatch({ type: 'setListeningText', message: text }),
              );
          }}
        />
        <Button
          onClick={() => {
            fetch('./amontillado.txt')
              .then(resp => resp.text())
              .then(text =>
                dispatch({ type: 'setListeningText', message: text }),
              );
          }}
        >
          Montillado
        </Button>
        <Button
          onClick={() => {
            // dispatch({type: 'setListeningText', message: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'});
            dispatch({ type: 'setListeningText', message: 'ABC\nDEF\n' });
          }}
        >
          ABCs
        </Button>
      </>
    );
  }
  if (station === 'txPractice') description = 'Initiate a QSO.';
  if (station === 'rxPractice') description = 'Respond to a QSO.';

  return (
    <>
      <SegmentedControl
        value={station}
        onChange={setStation}
        radius="lg"
        data={[
          { value: 'test', label: 'Test' },
          { value: 'copy', label: 'Copy' },
          { value: 'listen', label: 'Listen' },
          { value: 'txPractice', label: 'QSO send' },
          { value: 'rxPractice', label: 'QSO receive' },
        ]}
      />
      <br />
      {description}
      {controls}
    </>
  );
}
