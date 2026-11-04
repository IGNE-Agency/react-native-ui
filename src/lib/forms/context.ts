import { createFormHookContexts } from "@tanstack/react-form";

type FormHookContexts = ReturnType<
	typeof createFormHookContexts
>;

const contexts: FormHookContexts = createFormHookContexts();

/**
 * The contexts the form hook is built on, kept apart from it so a connector can
 * read its field without importing the hook that registers it.
 *
 * @example
 *   const field = useFieldContext<string>();
 */
export const fieldContext: FormHookContexts["fieldContext"] =
	contexts.fieldContext;

/** The form-level context the form hook is built on. */
export const formContext: FormHookContexts["formContext"] =
	contexts.formContext;

/** The field a connector is rendered for, read from `fieldContext`. */
export const useFieldContext: FormHookContexts["useFieldContext"] =
	contexts.useFieldContext;

/** The form a form component is rendered inside, read from `formContext`. */
export const useFormContext: FormHookContexts["useFormContext"] =
	contexts.useFormContext;
