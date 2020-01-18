import { Ref, UnwrapRef, ComputedRef, reactive, computed, watch, StopHandle } from 'vue';
import { useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type State = { [key: string]: any };

export type SelectorsBase<T extends State> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (state: T) => any;
};

export type Selectors<T extends State, U extends SelectorsBase<T>> = {
  [K in keyof U]: (state: T) => ReturnType<U[K]>;
};

type ComputedSelectors<T extends State, U extends SelectorsBase<T>> = {
  [K in keyof U]: ComputedRef<ReturnType<U[K]>>;
};

type ReactiveState<T> = T extends Ref ? T : UnwrapRef<T>;

export default class Store<T extends State, U extends SelectorsBase<T>> {
  private readonly reactiveState: ReactiveState<T>;
  private readonly reactiveSelectors: ComputedSelectors<T, U>;

  constructor(initialState: T, selectors?: Selectors<T, U>) {
    this.reactiveState = reactive(initialState);
    this.reactiveSelectors = {} as ComputedSelectors<T, U>;
    if (selectors) {
      Object.keys(selectors).forEach(
        (key: keyof U) =>
          (this.reactiveSelectors[key] = computed(() =>
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            selectors[key](this.reactiveState)
          ))
      );
    }
  }

  getState(): ReactiveState<T> {
    return this.reactiveState;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStateAndSelectorsForView(keys: any[]): [ReactiveState<T>, ComputedSelectors<T, U>] {
    const [, update] = useState({});
    const stopWatches = [] as StopHandle[];

    useEffect(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      keys.forEach((key: any) => {
        stopWatches.push(
          watch(
            () => this.reactiveState[key],
            () => {
              update({});
            }
          )
        );
      });

      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);

    return [this.reactiveState, this.reactiveSelectors];
  }
}
