import { Checkbox, Flex, SegmentedControl } from '@mantine/core';
import { useLocalStorage } from 'usehooks-ts';
import { LCWO_LETTERS } from './Display';

export function StationPane() {
  const [progress, setProgress] = useLocalStorage('learning-progress', {
    training: 'kmur',
    letters: {},
    daily: [],
  });
  const [station, setStation] = useLocalStorage('station', 'test');

  let description = '';
  let controls = <></>;
  if (station === 'test') description = 'Practice sending with the keys.';
  if (station === 'copy') {
    description = 'Practice receiving copy.';
    const boxes = [];
    for (const letter of LCWO_LETTERS) {
      boxes.push(
        <Checkbox
          key={letter}
          label={letter}
          checked={progress.training.indexOf(letter) > -1}
          onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
            const loc = progress.training.indexOf(letter);
            console.log(evt.currentTarget.checked, loc);
            if (evt.currentTarget.checked && loc === -1) {
              progress.training += letter;
            } else if (!evt.currentTarget.checked) {
              progress.training =
                progress.training.slice(0, loc) +
                progress.training.slice(loc + 1);
            }
            setProgress(progress);
          }}
        />,
      );
    }
    controls = (
      <Flex gap="md" wrap="wrap">
        {' '}
        {boxes}{' '}
      </Flex>
    );
  }
  if (station === 'listen') description = 'Listen to text.';
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
