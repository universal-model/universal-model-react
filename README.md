# Universal Model for React

[![version][version-badge]][package]
[![Downloads][Downloads]][package]
[![build][build]][circleci]
[![MIT License][license-badge]][license]
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Funiversal-model%2Funiversal-model-react.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Funiversal-model%2Funiversal-model-react?ref=badge_shield)

Universal model is a model which can be used with any of following UI frameworks:

- Angular 2+ [universal-model-angular]
- React 16.8+
- Svelte 3+ [universal-model-svelte]
- Vue.js 3+ [universal-model-vue]

If you want to use multiple UI frameworks at the same time, you can use single model
with [universal-model] library

## Install

    npm install --save universal-model-react

## Prerequisites for universal-model-react

     "react": "^16.8.0"

## Clean UI Architecture

![alt text](https://github.com/universal-model/universal-model-vue/raw/master/images/mvc.png 'MVC')

- Model-View-Controller (https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)
- User triggers actions by using view or controller
- Actions are part of model and they manipulate state that is stored
- Actions can use services to interact with external (backend) systems
- State changes trigger view updates
- Selectors select and calculate a transformed version of state that causes view updates
- Views contain NO business logic
- There can be multiple interchangeable views that use same part of model
- A new view can be created to represent model differently without any changes to model
- View technology can be changed without changes to the model

## Clean UI Code directory layout
UI application is divided into UI components. Common UI components should be put into common directory. Each component
can consist of subcomponents. Each component has a view and optionally controller and model. Model consists of actions, state
and selectors. In large scale apps, model can contain sub-store. Application has one store which is composed of each components'
state (or sub-stores)

    - src
      |
      |- common
      |  |- component1
      |  |- component2
      |  . |- component2_1
      |  . 
      |  . 
      |  .
      |- componentA
      |- componentB
      |  |- componentB_1
      |  |- componentB_2
      |- componentC
      |  |- view
      |  .
      |  .
      |- componentN
      |  |- controller
      |  |- model
      |  |  |- actions
      |  |  |- services
      |  |  |- state
      |  |- view
      |- store

## API

### Common API (Angular/React/Svelte/Vue)
    createSubState(subState);
    const store = createStore(initialState, combineSelectors(selectors))
    
    const { componentAState } = store.getState();
    const { selector1, selector2 } = store.getSelectors();
    const [{ componentAState }, { selector1, selector2 }] = store.getStateAndSelectors();
    
### React specific API
    useState([componentAState]);
    useSelectors([selector1, selector2]);
    useStateAndSelectors([componentAState], [selector1, selector2]);
    
[Detailed API documentation](https://github.com/universal-model/universal-model-react/blob/master/docs/API.md)

## API Examples
**Create initial states**

    const initialComponentAState = {
      prop1: 0,
      prop2: 0
    };
    
**Create selectors**

When using foreign state inside selectors, prefer creating foreign state selectors and accessing foreign
state through them instead of directly accessing foreign state inside selector. This will ensure  better
encapsulation of component state.

    const createComponentASelectors = <T extends State>() => ({
      selector1: (state: State) => state.componentAState.prop1  + state.componentAState.prop2
      selector2: (state: State) => {
        const { componentBSelector1, componentBSelector2 } = createComponentBSelectors<State>();
        return state.componentAState.prop1 + componentBSelector1(state) + componentBSelector2(state);
      }
    });
    
**Create and export store in store.ts:**

combineSelectors() checks if there are duplicate keys in selectors and will throw an error telling which key was duplicated.
By using combineSelectors you can keep your selector names short and only namespace them if needed.
    
    const initialState = {
      componentAState: createSubState(initialComponentAState),
      componentBState: createSubState(initialComponentBState)
    };
    
    export type State = typeof initialState;
    
    const componentAStateSelectors = createComponentAStateSelectors<State>();
    const componentBStateSelectors = createComponentBStateSelectors<State>();
    
    const selectors = combineSelectors<State, typeof componentAStateSelectors, typeof componentBStateSelectors>(
      componentAStateSelectors,
      componentBStateSelectors
    );
    
    export default createStore<State, typeof selectors>(initialState, selectors);
    
in large projects you should have sub-stores for components and these sub-store are combined 
together to a single store in store.js:

**componentBSubStore.js**

    const initialComponentsBState = { 
      componentBState: createSubState(initialComponentBState),
      componentB_1State: createSubState(initialComponentB_1State),
      componentB_2State: createSubState(initialComponentB_2State) 
    };
    
    const componentBStateSelectors = createComponentBStateSelectors<State>();
    const componentB_1StateSelectors = createComponentB_1StateSelectors<State>();
     const componentB_2StateSelectors = createComponentB_2StateSelectors<State>();
    
    const componentsBSelectors = combineSelectors<State, typeof componentBStateSelectors, typeof componentB_1StateSelectors, typeof componentB_2StateSelectors>(
      componentBStateSelectors,
      componentB_1StateSelectors,
      componentB_2StateSelectors
    );
    
**store.js**

    const initialState = {
      ...initialComponentsAState,
      ...intialComponentsBState,
      .
      ...initialComponentsNState
    };
          
    export type State = typeof initialState;
        
    const selectors = combineSelectors<State, typeof componentsAStateSelectors, typeof componentsBStateSelectors, ... typeof componentsNStateSelectors>(
      componentsAStateSelectors,
      componentsBStateSelectors,
      .
      componentsNStateSelectors
    );
        
    export default createStore<State, typeof selectors>(initialState, selectors);

**Access store in Actions**

Don't modify other component's state directly inside action, but instead 
call other component's action. This will ensure encapsulation of component's own state.

    export default function changeComponentAAndBState(newAValue, newBValue) {
      const { componentAState } = store.getState();
      componentAState.prop1 = newAValue;
      
      // BAD
      const { componentBState } = store.getState();
      componentBState.prop1 = newBValue;
      
      // GOOD
      changeComponentBState(newBValue);
    }

**Use actions, state and selectors in Views (React functional components)**

Class-based components are not currently supported.

Components should use only their own state and access other components' states using selectors
provided by those components. This will ensure encapsulation of each component's state.
    
    const View = () => {
      const [{ componentAState }, { selector1, selector2 }] = store.getStateAndSelectors();
      store.useStateAndSelectors([componentAState], [selector1, selector2]);
      
      // NOTE! Get the value of a selector using it's 'value' property!
      console.log(selector1.value);
    }

# Example

## View
App.tsx

    import * as React from 'react';
    import HeaderView from '@/header/view/HeaderView';
    import TodoListView from '@/todolist/view/TodoListView';
    
    const App = () => (
      <div>
        <HeaderView />
        <TodoListView />
      </div>
    );
    
    export default App;
    
HeaderView.tsx

    import * as React from 'react';
    import store from '@/store/store';
    import changeUserName from '@/header/model/actions/changeUserName';
    
    const HeaderView = () => {
      const { headerText } = store.getSelectors();
      store.useSelectors([headerText]);
    
      return (
        <div>
          <h1>{headerText.value}</h1>
          <label>User name:</label>
          <input onChange={({ target: { value } }) => changeUserName(value)} />
        </div>
      );
    };
    
    export default HeaderView;

TodoListView.tsx

    import * as React from 'react';
    import { useEffect } from 'react';
    import store from '@/store/store';
    import { Todo } from '@/todolist/model/state/initialTodoListState';
    import removeTodo from '@/todolist/model/actions/removeTodo';
    import fetchTodos from '@/todolist/model/actions/fetchTodos';
    import todoListController from '@/todolist/controller/todoListController';
    import toggleIsDoneTodo from '@/todolist/model/actions/toggleIsDoneTodo';
    import toggleShouldShowOnlyUnDoneTodos from '@/todolist/model/actions/toggleShouldShowOnlyUnDoneTodos';

    const TodoListView = () => {
      const [{ todosState }, { shownTodos, userName }] = store.getStateAndSelectors();
      store.useStateAndSelectors([todosState], [shownTodos, userName]);

      useEffect(() => {
        // noinspection JSIgnoredPromiseFromCall
        fetchTodos();
        document.addEventListener('keydown', todoListController.handleKeyDown);
        return () => document.removeEventListener('keydown', todoListController.handleKeyDown);
      }, []);

      let todoListContent;

      if (todosState.isFetchingTodos) {
        todoListContent = <div>Fetching todos...</div>;
      } else if (todosState.hasTodosFetchFailure) {
        todoListContent = <div>Failed to fetch todos</div>;
      } else {
        const todoListItems = shownTodos.value.map((todo: Todo, index: number) => (
          <li key={todo.id}>
            <input
              id={todo.name}
              type="checkbox"
              defaultChecked={todo.isDone}
              onChange={() => toggleIsDoneTodo(todo)}
            />
            <label>{userName.value}: {todo.name}</label>
            <button onClick={() => removeTodo(todo)}>Remove</button>
          </li>
        ));

        todoListContent = <ul>{todoListItems}</ul>;
      }

      return (
        <div>
          <input
            id="shouldShowOnlyDoneTodos"
            type="checkbox"
            defaultChecked={todosState.shouldShowOnlyUnDoneTodos}
            onChange={toggleShouldShowOnlyUnDoneTodos}
          />
          <label>Show only undone todos</label>
          {todoListContent}
        </div>
      );
    };

    export default TodoListView;

## Controller

todoListController.ts

    import addTodo from "@/todolist/model/actions/addTodo";
    import removeAllTodos from "@/todolist/model/actions/removeAllTodos";

    export default {
      handleKeyDown(keyboardEvent: KeyboardEvent): void {
        if (keyboardEvent.code === 'KeyA' && keyboardEvent.ctrlKey) {
          keyboardEvent.stopPropagation();
          keyboardEvent.preventDefault();
          addTodo();
        } else if (keyboardEvent.code === 'KeyR' && keyboardEvent.ctrlKey) {
           keyboardEvent.stopPropagation();
           keyboardEvent.preventDefault();
          removeAllTodos();
        }
      }
    };
    
## Model

### Store

store.ts

    import { combineSelectors, createStore, createSubState } from 'universal-model-react';
    import initialHeaderState from '@/header/model/state/initialHeaderState';
    import initialTodoListState from '@/todolist/model/state/initialTodoListState';
    import createTodoListStateSelectors from '@/todolist/model/state/createTodoListStateSelectors';
    import createHeaderStateSelectors from '@/header/model/state/createHeaderStateSelectors';
    
    const initialState = {
      headerState: createSubState(initialHeaderState),
      todosState: createSubState(initialTodoListState)
    };
    
    export type State = typeof initialState;
    
    const headerStateSelectors =  createHeaderStateSelectors<State>();
    const todoListStateSelectors = createTodoListStateSelectors<State>();
    
    const selectors = combineSelectors<State, typeof headerStateSelectors, typeof todoListStateSelectors>(
     headerStateSelectors,
     todoListStateSelectors 
    );
    
    export default createStore<State, typeof selectors>(initialState, selectors);

### State

#### Initial state
initialHeaderState.ts

    export default {
      userName: 'John'
    };

initialTodoListState.ts

    export interface Todo {
      id: number,
      name: string;
      isDone: boolean;
    }

    export default {
      todos: [] as Todo[],
      shouldShowOnlyUnDoneTodos: false,
      isFetchingTodos: false,
      hasTodosFetchFailure: false
    };

#### State selectors

createHeaderStateStateSelectors.ts

    import { State } from '@/store/store';
    
    const createHeaderStateSelectors = <T extends State>() => ({
      userName: (state: T) => state.headerState.userName,
      headerText: (state: T) => {
        const {
          todoCount: selectTodoCount,
          unDoneTodoCount: selectUnDoneTodoCount
        } = createTodoListStateSelectors<T>();
      
        return `${state.headerState.userName} (${selectUnDoneTodoCount(state)}/${selectTodoCount(state)})`;
      }
    });
    
    export default createHeaderStateSelectors;


createTodoListStateSelectors.ts

    import { State } from '@/store/store';
    import { Todo } from '@/todolist/model/state/initialTodoListState';

    const createTodoListStateSelectors = <T extends State>() => ({
      shownTodos: (state: T) =>
        state.todosState.todos.filter(
          (todo: Todo) =>
            (state.todosState.shouldShowOnlyUnDoneTodos && !todo.isDone) ||
            !state.todosState.shouldShowOnlyUnDoneTodos
        ),
       todoCount: (state: T) => state.todosState.todos.length,
       unDoneTodoCount: (state: T) => state.todosState.todos.filter((todo: Todo) => !todo.isDone).length
    });

    export default createTodoListStateSelectors;

### Service

ITodoService.ts

    import { Todo } from '@/todolist/model/state/initialTodoListState';

    export interface ITodoService {
      tryFetchTodos(): Promise<Todo[]>;
    }

FakeTodoService.ts

    import { ITodoService } from '@/todolist/model/service/ITodoService';
    import { Todo } from '@/todolist/model/state/initialTodoListState';
    import Constants from '@/Constants';
    
    export default class FakeTodoService implements ITodoService {
      tryFetchTodos(): Promise<Todo[]> {
        return new Promise<Todo[]>((resolve: (todo: Todo[]) => void, reject: () => void) => {
          setTimeout(() => {
            if (Math.random() < 0.95) {
              resolve([
                { id: 1, name: 'first todo', isDone: true },
                { id: 2, name: 'second todo', isDone: false }
              ]);
            } else {
              reject();
            }
          }, Constants.FAKE_SERVICE_LATENCY_IN_MILLIS);
        });
      }
    }

todoService.ts

    import FakeTodoService from "@/todolist/model/services/FakeTodoService";

    export default new FakeTodoService();

### Actions

changeUserName.ts

    import store from '@/store/store';
    
    export default function changeUserName(newUserName: string): void {
      const { headerState } = store.getState();
      headerState.userName = newUserName;
    }

addTodo.ts

    import store from '@/store/store';
    
    let id = 3;
    
    export default function addTodo(): void {
      const { todosState } = store.getState();
      todosState.todos.push({ id, name: 'new todo', isDone: false });
      id++;
    }

removeTodo.ts

    import store from '@/store/store';
    import { Todo } from '@/todolist/model/state/initialTodoListState';

    export default function removeTodo(todoToRemove: Todo): void {
      const { todosState } = store.getState();
      todosState.todos = todosState.todos.filter((todo: Todo) => todo !== todoToRemove);
    }

removeAllTodos.ts

    import store from '@/store/store';

    export default function removeAllTodos(): void {
      const { todosState } = store.getState();
      todosState.todos = [];
    }

toggleIsDoneTodo.ts

    import { Todo } from '@/todolist/model/state/initialTodoListState';

    export default function toggleIsDoneTodo(todo: Todo): void {
      todo.isDone = !todo.isDone;
    }

toggleShouldShowOnlyUnDoneTodos.ts

    import store from '@/store/store';

    export default function toggleShouldShowOnlyUnDoneTodos(): void {
      const { todosState } = store.getState();
      todosState.shouldShowOnlyUnDoneTodos = !todosState.shouldShowOnlyUnDoneTodos;
    }

fetchTodos.ts

    import store from '@/store/store';
    import todoService from '@/todolist/model/services/todoService';

    export default async function fetchTodos(): Promise<void> {
      const { todosState } = store.getState();

      todosState.isFetchingTodos = true;
      todosState.hasTodosFetchFailure = false;

      try {
        todosState.todos = await todoService.tryFetchTodos();
      } catch (error) {
        todosState.hasTodosFetchFailure = true;
      }

      todosState.isFetchingTodos = false;
    }

### Full Examples

https://github.com/universal-model/universal-model-react-todo-app

https://github.com/universal-model/universal-model-react-todos-and-notes-app

### Dependency injection
If you would like to use dependency injection (noicejs) in your app, check out this [example],
where DI is used to create services.

### License

MIT License

[license-badge]: https://img.shields.io/badge/license-MIT-green
[license]: https://github.com/universal-model/universal-model-react/blob/master/LICENSE
[version-badge]: https://img.shields.io/npm/v/universal-model-react.svg?style=flat-square
[package]: https://www.npmjs.com/package/universal-model-react
[Downloads]: https://img.shields.io/npm/dm/universal-model-react
[build]: https://img.shields.io/circleci/project/github/universal-model/universal-model-react/master.svg?style=flat-square
[circleci]: https://circleci.com/gh/universal-model/universal-model-react/tree/master
[example]: https://github.com/universal-model/react-todo-app-with-dependency-injection
[universal-model]: https://github.com/universal-model/universal-model
[universal-model-angular]: https://github.com/universal-model/universal-model-angular
[universal-model-svelte]: https://github.com/universal-model/universal-model-svelte
[universal-model-vue]: https://github.com/universal-model/universal-model-vue
