import { useState, useEffect } from 'react';
import createSubState from '../createSubState';
import createStore from '../createStore';
import Store from '../Store';

jest.mock('react');
jest.useFakeTimers();

const object = {};

const initialState1 = {
  number: 1,
  boolean: true,
  string: 'test',
  undefined: undefined as number | undefined,
  null: null as number | null,
  array: [1],
  object: {
    value: 1
  },
  func: () => 1,
  map: new Map(),
  set: new Set(),
  weakMap: new WeakMap(),
  weakSet: new WeakSet()
};

const initialState = {
  state1: createSubState(initialState1)
};

type State = typeof initialState;

const selectors = {
  numberSelector: (state: State) => state.state1.number + 1,
  booleanSelector: (state: State) => !state.state1.boolean,
  stringSelector: (state: State) => state.state1.string + '1',
  undefinedSelector: (state: State) => (typeof state.state1.undefined === 'undefined' ? 1 : 2),
  nullSelector: (state: State) => (state.state1.null === null ? 1 : 2),
  arraySelector: (state: State) => [...state.state1.array, 2],
  objectSelector: (state: State) => state.state1.object.value + 1,
  funcSelector: (state: State) => state.state1.func() + 1,
  mapSelector: (state: State) => state.state1.map.get('a') + 1,
  setSelector: (state: State) => (state.state1.set.has('a') ? 3 : 1),
  weakMapSelector: (state: State) => state.state1.weakMap.get(object) + 1,
  weakSetSelector: (state: State) => (state.state1.weakSet.has(object) ? 3 : 1)
};

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
useEffect.mockImplementation((func: any) => func());

let store: Store<State, typeof selectors>;
let updateView: unknown;

beforeEach(() => {
  store = createStore<State, typeof selectors>(initialState, selectors);
  updateView = jest.fn();
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  useState.mockReturnValue([{}, updateView]);
});

describe('Store', () => {
  describe('useState', () => {
    it('should update component instance on state changes', () => {
      // GIVEN
      const { state1 } = store.getState();
      store.useState([state1]);

      // WHEN
      state1.number = 2;
      state1.boolean = false;
      state1.string = '';
      state1.undefined = 1;
      state1.null = 1;
      state1.array.push(2);
      state1.object.value = 2;
      state1.func = () => 2;
      state1.map.set('a', 1);
      state1.set.add(1);
      state1.weakMap.set(object, 1);
      state1.weakSet.add(object);
      jest.runAllTimers();

      // THEN
      expect(updateView).toHaveBeenCalledTimes(1);
    });

    it('should throw error if given sub-state is not a sub-state', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        store.useState([{}]);
      }).toThrowError('useState: One of given subStates is not subState');
    });
  });

  describe('useSelectors', () => {
    it('should update component instance on state changes', () => {
      // GIVEN
      const { state1 } = store.getState();

      const {
        numberSelector,
        booleanSelector,
        stringSelector,
        undefinedSelector,
        nullSelector,
        arraySelector,
        objectSelector,
        funcSelector,
        mapSelector,
        setSelector,
        weakMapSelector,
        weakSetSelector
      } = store.getSelectors();

      store.useSelectors([
        numberSelector,
        booleanSelector,
        stringSelector,
        undefinedSelector,
        nullSelector,
        arraySelector,
        objectSelector,
        funcSelector,
        mapSelector,
        setSelector,
        weakMapSelector,
        weakSetSelector
      ]);

      // WHEN
      state1.number = 2;
      state1.boolean = false;
      state1.string = 'foo';
      state1.undefined = 2;
      state1.null = 2;
      state1.array = [1];
      state1.object.value = 2;
      state1.func = () => 2;
      state1.map.set('a', 2);
      state1.set.add('a');
      state1.weakMap.set(object, 2);
      state1.weakSet.add(object);
      jest.runAllTimers();

      // THEN
      expect(numberSelector.value).toBe(3);
      expect(booleanSelector.value).toBe(true);
      expect(stringSelector.value).toBe('foo1');
      expect(undefinedSelector.value).toBe(2);
      expect(nullSelector.value).toBe(2);
      expect(arraySelector.value).toStrictEqual([1, 2]);
      expect(objectSelector.value).toBe(3);
      expect(funcSelector.value).toBe(3);
      expect(mapSelector.value).toBe(3);
      expect(setSelector.value).toBe(3);
      expect(weakMapSelector.value).toBe(3);
      expect(weakSetSelector.value).toBe(3);
      expect(updateView).toHaveBeenCalledTimes(1);
    });
  });

  describe('useStateAndSelectors', () => {
    it('should update component instance on state changes', () => {
      // GIVEN
      const [{ state1 }, { numberSelector }] = store.getStateAndSelectors();
      store.useStateAndSelectors([state1], [numberSelector]);

      // WHEN
      state1.number = 5;
      jest.runAllTimers();

      // THEN
      expect(numberSelector.value).toBe(6);
      expect(updateView).toHaveBeenCalledTimes(1);
    });
  });
});
