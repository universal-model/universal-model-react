import { Ref, UnwrapRef, reactive, watch, StopHandle, ComputedRef, computed } from '@pksilen/reactive-js';
import { useEffect, useState } from 'react';
import { SubStateFlagWrapper } from './createSubState';

export type SubState = Omit<object, '__isSubState__'> & SubStateFlagWrapper;
export type State = { [key: string]: SubState };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StateGetter = () => any;

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

  useStateAndSelectors(subStates: Array<SubState | StateGetter>, selectors: ComputedRef[]): void {
    const [view, updateView] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];
      this.watchSubStatesAndFunctionsAndSelectors(subStates, stopWatches, view, updateView);
      this.watchSubStatesAndFunctionsAndSelectors(selectors, stopWatches, view, updateView);
      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }

  watchSubStatesAndFunctionsAndSelectors(
    subStatesOrFunctionsOrSelectors: Array<SubState | StateGetter> | ComputedRef[],
    stopWatches: StopHandle[],
    view: {},
    updateView: (newState: {}) => void
  ): void {
    subStatesOrFunctionsOrSelectors.forEach(
      (subStateOrFunctionOrSelector: SubState | StateGetter | ComputedRef) => {
        if (
          !('effect' in subStateOrFunctionOrSelector) &&
          typeof subStateOrFunctionOrSelector !== 'function' &&
          !subStateOrFunctionOrSelector.__isSubState__
        ) {
          throw new Error('useState: One of given subStates is not subState');
        }

        stopWatches.push(
          this.watch(
            typeof subStateOrFunctionOrSelector === 'function'
              ? computed(subStateOrFunctionOrSelector)
              : subStateOrFunctionOrSelector,
            view,
            updateView
          )
        );
      }
    );
  }

  watch(
    subStatesOrSelectors: SubState | StateGetter | ComputedRef,
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

  useState(subStates: Array<SubState | StateGetter>): void {
    const [view, updateView] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];
      this.watchSubStatesAndFunctionsAndSelectors(subStates, stopWatches, view, updateView);
      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }

  useSelectors(selectors: ComputedRef[]): void {
    const [view, updateView] = useState({});

    useEffect(() => {
      const stopWatches = [] as StopHandle[];
      this.watchSubStatesAndFunctionsAndSelectors(selectors, stopWatches, view, updateView);
      return () => stopWatches.forEach((stopWatch: StopHandle) => stopWatch());
    }, []);
  }
}
