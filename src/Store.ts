import { Ref, UnwrapRef, reactive, watch, StopHandle, ComputedRef, computed } from '@pksilen/reactive-js';
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

export type ReactiveState<T extends State> = T extends Ref ? T : UnwrapRef<T>;

export default class Store<T extends State, U extends SelectorsBase<T>> {
  private readonly reactiveState: ReactiveState<T>;
  private readonly reactiveSelectors: ComputedSelectors<T, U>;
  private viewToNeedsUpdateMap = new Map();

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

  useStateAndSelectors(subStates: SubState[], selectors: ComputedRef[]): void {
    const [view, updateView] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];
      this.watchSubStatesAndSelectors(subStates, stopWatches, view, updateView);
      this.watchSubStatesAndSelectors(selectors, stopWatches, view, updateView);
      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }

  watchSubStatesAndSelectors(
    subStatesOrSelectors: SubState[] | ComputedRef[],
    stopWatches: StopHandle[],
    view: {},
    updateView: (newState: {}) => void
  ): void {
    subStatesOrSelectors.forEach((subState: SubState | ComputedRef) => {
      if (!('effect' in subState) && !subState.__isSubState__) {
        throw new Error('useState: One of given subStates is not subState');
      }

      stopWatches.push(this.watch(subStatesOrSelectors, view, updateView));
    });
  }

  watch(
    subStatesOrSelectors: SubState[] | ComputedRef[],
    view: {},
    updateView: (newState: {}) => void
  ): StopHandle {
    return watch(
      () => subStatesOrSelectors,
      () => {
        if (!this.viewToNeedsUpdateMap.get(view)) {
          setTimeout(() => {
            this.viewToNeedsUpdateMap.delete(view);
            updateView({});
          }, 0);
        }

        this.viewToNeedsUpdateMap.set(view, true);
      },
      {
        deep: true,
        flush: 'sync'
      }
    );
  }

  useState(subStates: SubState[]): void {
    const [view, updateView] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];
      this.watchSubStatesAndSelectors(subStates, stopWatches, view, updateView);
      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }

  useSelectors(selectors: ComputedRef[]): void {
    const [view, updateView] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];
      this.watchSubStatesAndSelectors(selectors, stopWatches, view, updateView);
      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }
}
