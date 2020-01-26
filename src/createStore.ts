import Store, { Selectors, SelectorsBase, State } from './Store';

export default function createStore<T extends State, U extends SelectorsBase<T>>(
  initialState: T,
  selectors: Selectors<T, U>
): Store<T, U> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries(initialState).forEach(([, subState]: [string, any]) => {
    if (!Object.getOwnPropertySymbols(subState)[0]) {
      throw new Error('useState: One of given subStates is not subState');
    }
  });

  return new Store(initialState, selectors);
}
