const isSubStateSymbol = Symbol();

export type SymbolWrapper = {
  [isSubStateSymbol]: boolean;
};

export default function createSubState<T extends object>(subState: T): T & SymbolWrapper {
  return {
    [isSubStateSymbol]: true,
    ...subState
  };
}
