# API Documentation

## Common API (Angular/React/Svelte/Vue)

### createSubState
    
    export default function createSubState<T extends InitialState>(
      initialState: T & AllowedInitialStateProperties<T>
    ): SubState
    
Creates a sub state object from initial state object.<br/>
This function adds a readonly \_\_isSubState\_\_ property to the initial state object.<br/>
Initial state may not contain key __isSubState\__, if it contains, an error will be thrown.<br/>
Initial state must be an object with following property value types allowed: number, boolean, string, undefined, null,
Function, object, Array<any>, Map, Set, WeakMap, WeakSet
    
### combineSelectors

    combineSelectors<T extends State, U1 extends SelectorsBase<T>, ... Un extends SelectorsBase<T>>(
      selectorsObject1: Selectors<T, U1>,
      ...
      selectorsObject2: Selectors<T, Un>
    ): Selectors<T, U1> & ... Selectors<T, Un>;
    
combines objects of selectors to a single object containing all selectors.<br/>
It also checks for duplicate selector keys and throws an error if a duplicate key is found.

### createStore

    createStore<T extends State, U extends SelectorsBase<T>>(
      initialState: T,
      selectors: Selectors<T, U>
    ): Store<T, U>
    
creates a store containing initialState and selectors

### Store::getState
   
    class Store<T extends State, U extends SelectorsBase<T>> {
        getState(): ReactiveState<T>
    }
    
gets state from the store

### Store::getSelectors
   
    class Store<T extends State, U extends SelectorsBase<T>> {
      getSelectors(): ComputedSelectors<T, U>
    }

gets selectors from the store
    
### Store::getStateAndSelectors
    
    class Store<T extends State, U extends SelectorsBase<T>> {
      getStateAndSelectors(): [ReactiveState<T>, ComputedSelectors<T, U>]
    }

gets state and selectors from the store

## React specific API

### Store::useState 
    
    useState(subStates: Array<SubState | StateGetter>): void
    
makes React functional component to use given sub-state(s) and/or state from state getter(s) and makes changes to given sub-state(s) or state getters to update the view.<br/>
**NOTE!** If you call only getState() and forget to call useState(), your view won't be reactive and does not update.

### Store::useSelectors

    useSelectors(selectors: ComputedRef[]): void 
    
makes React functional component to use given selectors and makes changes to given selectors to update the view.<br/>
**NOTE!** If you call only getSelectors() and forget to call useSelectors(), your view won't be reactive and does not update.

### Store::useStateAndSelectors

    useStateAndSelectors(subStates: SubState[], selectors: ComputedRef[]): void
    
makes React functional component to use given sub-state(s) and selectors and makes changes to given sub-state(s)
and selectors to update the view.<br/>
**NOTE!** If you call only getStateAndSelectors() and forget to call useStateAndSelectors(), your view won't be reactive and does not update.
