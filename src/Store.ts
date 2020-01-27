import { Ref, UnwrapRef, reactive, watch, StopHandle, ComputedRef, computed } from 'vue';
import { useEffect, useState } from 'react';
import { SubStateFlagWrapper } from './createSubState';

export type SubState = Omit<object, '__isSubState__'> & SubStateFlagWrapper;
export type State = { [key: string]: SubState };

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

  getSelectors(): ComputedSelectors<T, U> {
    return this.reactiveSelectors;
  }

  getStateAndSelectors(): [ReactiveState<T>, ComputedSelectors<T, U>] {
    return [this.reactiveState, this.reactiveSelectors];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStateAndSelectors(subStates: SubState[], selectors: ComputedRef<any>[]): void {
    this.useState(subStates);
    this.useSelectors(selectors);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useState(subStates: SubState[]): void {
    const [, updateViewDueToStateChange] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subStates.forEach((subState: SubState) => {
        if (!subState.__isSubState__) {
          throw new Error('useState: One of given subStates is not subState');
        }

        stopWatches.push(
          watch(
            () => subState,
            () => updateViewDueToStateChange({}),
            {
              deep: true
            }
          )
        );
      });

      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelectors(selectors: ComputedRef<any>[]): void {
    const [, updateViewDueToSelectorChange] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectors.forEach((selector: any) => {
        stopWatches.push(
          watch(
            () => selector,
            () => updateViewDueToSelectorChange({}),
            {
              deep: true
            }
          )
        );
      });

      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }
}
