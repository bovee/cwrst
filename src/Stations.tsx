import { SegmentedControl, Slider } from '@mantine/core';
import { useLocalStorage } from 'usehooks-ts';

const LCWO_LETTERS = 'kmuresnaptlwi.jz=foy,vg5/q92h38b?47c1d60x';
const HOLECEK_DROID_LETTERS =
  'etimansorkdugwhpxbflvczjqy1234567890.,:?\'-/()"=+@';
const FINLEY_LETTERS = 'kmrsuaptlowi.njef0y,vg5/q9zh38b?427c1d6x';

export function StationPane() {
  let [station, setStation] = useLocalStorage('station', 'test');

  let description = '';
  if (station === 'test') description = 'Practice sending with the keys.';
  if (station === 'copy') description = 'Practice receiving copy.';
  if (station === 'listen') description = 'Listen to text.';
  if (station === 'txPractice') description = 'Initiate a QSO.';
  if (station === 'rxPractice') description = 'Respond to a QSO.';

  const marks = LCWO_LETTERS.split('').map((letter, ix) => ({
    value: ix,
    label: letter,
  }));

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
      <Slider
        defaultValue={0}
        max={40}
        label={val => marks.find(mark => mark.value === val)!.label}
        marks={marks}
      />
    </>
  );
}
