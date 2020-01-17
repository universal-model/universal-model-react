import { useCallback, useState } from 'react';

export default function useForceUpdate(): () => void {
  const [value, setValue] = useState<{}>({});

  return useCallback((): void => {
    setValue({});
  }, [value]);
}
