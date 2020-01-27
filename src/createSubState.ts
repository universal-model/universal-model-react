export type SubStateFlagWrapper = {
  __isSubState__: boolean;
};

export default function createSubState<T extends Omit<object, '__isSubState__'>>(
  subState: T
): T & SubStateFlagWrapper {
  return {
    __isSubState__: true,
    ...subState
  };
}
