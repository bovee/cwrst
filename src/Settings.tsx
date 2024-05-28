import {
  useMantineColorScheme,
  Container,
  MantineColorScheme,
  NativeSelect,
  Slider,
  Text,
} from '@mantine/core';
import { useLocalStorage } from 'usehooks-ts';

import { Keyer } from './keyer';
import { msg } from './messages';

export function SettingsPane(props: { keyer: Keyer }) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [keyType, setKeyType] = useLocalStorage('key-type', 'straight');

  return (
    <div>
      <br />
      <Container size="sm">
        <Text size="sm">{msg('COLOR_SCHEME')}</Text>
        <NativeSelect
          value={colorScheme}
          onChange={evt =>
            setColorScheme(evt.currentTarget.value as MantineColorScheme)
          }
          data={[
            { label: msg('COLOR_SCHEME_LIGHT'), value: 'light' },
            { label: msg('COLOR_SCHEME_DARK'), value: 'dark' },
            { label: msg('COLOR_SCHEME_AUTO'), value: 'auto' },
          ]}
        />
        <Text size="sm">{msg('VOLUME')}</Text>
        <Slider
          min={1}
          max={10}
          step={1}
          label={(v: number) => `${v}`}
          defaultValue={props.keyer.audio.volume}
          onChangeEnd={val => (props.keyer.audio.volume = val)}
        />
        <Text size="sm">{msg('KEY')}</Text>
        <NativeSelect
          value={keyType}
          onChange={evt => setKeyType(evt.currentTarget.value)}
          data={[
            { label: msg('KEY_STRAIGHT'), value: 'straight' },
            { label: msg('KEY_PADDLE'), value: 'paddle' },
            { label: msg('KEY_REVERSE'), value: 'reverse' },
          ]}
        />
        <Text size="sm">{msg('WORDS_PER_MINUTE')}</Text>
        <Slider
          min={1}
          max={50}
          step={1}
          label={(v: number) => `${v}`}
          defaultValue={props.keyer.wpm}
          onChangeEnd={val => (props.keyer.wpm = val)}
        />
        <Text size="sm">{msg('FARNSWORTH_WPM')}</Text>
        <Slider
          min={1}
          max={50}
          step={1}
          label={(v: number) => `${v}`}
          defaultValue={props.keyer.farnsworth}
          onChangeEnd={val => (props.keyer.farnsworth = val)}
        />
      </Container>
    </div>
  );
}
