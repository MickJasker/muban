/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Ref } from '@vue/reactivity';
import type { ComponentFactory } from '../../Component.types';
import type { BindProps } from '../bindings/bindingDefinitions';

/*
 * This is the raw "definition" for refs, represented as a simple object.
 * Any helper functions must return this object
 */
export type ComponentRefItemElement = {
  type: 'element';
  ref: string;
  createRef: (parent: HTMLElement) => ElementRef<HTMLElement, BindProps>;
  isRequired?: boolean;
};
export type ComponentRefItemCollection = {
  type: 'collection';
  ref: string;
  createRef: (parent: HTMLElement) => CollectionRef<HTMLElement, BindProps>;
};
export type ComponentRefItemComponent<T extends ComponentFactory<Record<string, any>>> = {
  type: 'component';
  ref?: string;
  createRef: (parent: HTMLElement) => ComponentRef<T>;
  isRequired?: boolean;
};
export type ComponentRefItemComponentCollection<T extends ComponentFactory<Record<string, any>>> = {
  type: 'componentCollection';
  ref?: string;
  createRef: (parent: HTMLElement) => ComponentsRef<T>;
};

// combination of all of the above
export type ComponentRefItem =
  | string
  | ComponentRefItemElement
  | ComponentRefItemCollection
  | ComponentRefItemComponent<any>
  | ComponentRefItemComponentCollection<any>;

/**
 * These are the types that are returned from the refDefinition selector function,
 * and passed to the component's setup function, and is used for:
 * - applying bindings
 * - get access to the elements/components related to the ref
 */
export type ElementRef<T extends HTMLElement, P extends BindProps> = {
  getBindingDefinition: (
    props: P,
  ) => {
    ref: Ref<T | undefined>;
    type: 'element';
    props: P;
  };
  element: T | undefined;
  refreshRefs: () => void;
};

export type CollectionRef<T extends HTMLElement, P extends BindProps> = {
  getBindingDefinition: (
    props: BindProps,
  ) => {
    ref: Ref<Array<T>>;
    type: 'collection';
    props: P;
  };
  elements: Array<T>;
  // nested refs for each single individual element
  refs: Array<Omit<ElementRef<T, P>, 'refreshRefs'>>;
  refreshRefs: () => void;
};

export type ComponentRef<T extends ComponentFactory<any>> = {
  getBindingDefinition: (
    props: ComponentSetPropsParam<ReturnType<T>>,
  ) => {
    ref: Ref<ReturnType<T> | undefined>;
    type: 'component';
    props: ComponentSetPropsParam<ReturnType<T>>;
  };
  component: ReturnType<T> | undefined;
  refreshRefs: () => void;
};

export type ComponentsRef<T extends ComponentFactory<any>> = {
  getBindingDefinition: (
    props: ComponentSetPropsParam<ReturnType<T>>,
  ) => {
    ref: Ref<Array<ReturnType<T>>>;
    type: 'componentCollection';
    props: ComponentSetPropsParam<ReturnType<T>>;
  };
  components: Array<ReturnType<T>>;
  // nested refs for each single individual component
  refs: Array<Omit<ComponentRef<T>, 'refreshRefs'>>;
  refreshRefs: () => void;
};

export type AnyRef =
  | ElementRef<HTMLElement, BindProps>
  | CollectionRef<HTMLElement, BindProps>
  | ComponentRef<ComponentFactory<any>>
  | ComponentsRef<ComponentFactory<any>>;

// Turn the keys of an object into the types, or a Ref around that type
type RefOrValue<T> = {
  [P in keyof T]: T[P] | Ref<T[P]>;
};

/**
 * Extracts the props from a component if it is one
 * Otherwise just return the type itself.
 *
 * Partial is added because bindings are only meant to CHANGE things, not to SET things,
 * so all props that are REQUIRED are set by the TEMPLATE already
 */
export type ComponentSetPropsParam<T> = T extends { setProps(props: infer R): void }
  ? Partial<RefOrValue<R>>
  : RefOrValue<T>;

/**
 *  Extract the type of ref it is based on the return type of the selector function from the definition
 *  Fall back to just a normal Element ref if a string is passed
 */
export type TypedRef<T extends ComponentRefItem> = T extends {
  createRef: (parent: HTMLElement) => infer R;
}
  ? Exclude<R, undefined>
  : ElementRef<HTMLElement, BindProps>;

/**
 * Extract typings out of the refDefinition input,
 * so they can be used to type the refs passed in the setup function
 *
 * Attaches the 'self' ref to it, since it's always present
 */
export type TypedRefs<T extends Record<string, ComponentRefItem>> = {
  [P in keyof T]: TypedRef<T[P]>;
} & { self: ElementRef<HTMLElement, BindProps> };
