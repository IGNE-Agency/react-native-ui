import { useFieldContext } from "./context";
import type { FieldHandle } from "./keyboard-sequence";

/**
 * A control's props with everything the form layer owns taken out — the submit
 * key included, which `next`, `onSubmit` and the form's own values settle — and
 * the knobs a call site adds: which field the keyboard's next key moves to, and
 * what its go key does.
 */
export type ConnectedProps<TProps> = Omit<
	TProps,
	| "value"
	| "onChangeText"
	| "onBlur"
	| "errors"
	| "returnKeyType"
	| "submitBehavior"
	| "onSubmitEditing"
> &
	Readonly<{
		next?: FieldHandle;
		onSubmit?: () => void;
	}>;

/** What `useConnectedField` reads off its field. */
export type ConnectedField<TValue> = Readonly<{
	field: ReturnType<typeof useFieldContext<TValue>>;
	errors: unknown;
}>;

/**
 * What a connector reads off its field: the field itself and its errors as the
 * validators returned them.
 *
 * @example
 *   const { field, ...state } = useConnectedField<string>();
 */
export const useConnectedField = <
	TValue,
>(): ConnectedField<TValue> => {
	const field = useFieldContext<TValue>();
	return {
		field,
		errors: field.state.meta.errors,
	};
};
