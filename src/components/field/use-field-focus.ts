import { useState } from "react";
import type { TextInputProps as RNTextInputProps } from "react-native";

type FocusHandlers = Readonly<{
	onFocus?: RNTextInputProps["onFocus"];
	onBlur?: RNTextInputProps["onBlur"];
}>;

/** Whether focus is on a field's control, and the handlers that say so. */
export type FieldFocus = Readonly<{
	focused: boolean;
	handlers: Required<FocusHandlers>;
}>;

/**
 * A field's live focus. The caller's own handlers still run, so a control can
 * pass its props straight in.
 *
 * @example
 *   const focus = useFieldFocus({ onBlur });
 *   styles.useVariants({ ...state, focused: focus.focused });
 */
export const useFieldFocus = (
	handlers: FocusHandlers = {},
): FieldFocus => {
	const [focused, setFocused] = useState(false);
	return {
		focused,
		handlers: {
			onFocus: event => {
				setFocused(true);
				handlers.onFocus?.(event);
			},
			onBlur: event => {
				setFocused(false);
				handlers.onBlur?.(event);
			},
		},
	};
};
