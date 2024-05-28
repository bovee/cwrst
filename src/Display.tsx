import { Card, Group, Indicator } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Keyer } from './keyer';
import { useStateContext } from './state';

export function Display(props: { keyer: Keyer }) {
  const [rxGain, setRxGain] = useState(10);
  const [station] = useLocalStorage('station', 'test');
  const { state, dispatch } = useStateContext();

  const { keyer } = props;

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRxGain(keyer.audio.getActualVolume());
    }, 100);

    return () => {
      keyer.detach();
      clearInterval(intervalId);
    };
  }, [dispatch, keyer, state, station]);

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
            {state.displayText}
          </Group>
        </Card>
      </Indicator>
    </>
  );
}
