import { useStore } from "@tanstack/react-form";
import { useRef } from "react";
import type { TextInputProps as RNTextInputProps } from "react-native";

import { useFieldContext } from "./context";
import { valuesCompleteExcept } from "./field-state";

type Focusable = Readonly<{ focus: () => void }>;

/** A field's control, reachable from the field before it in the sequence. */
export type FieldHandle = Readonly<{
	focus: () => void;
	attach: (control: Focusable | null) => void;
}>;

/** The keyboard's own submit key, and what pressing it does. */
export type KeyboardSequence = Readonly<{
	returnKeyType: RNTextInputProps["returnKeyType"];
	submitBehavior: RNTextInputProps["submitBehavior"];
	onSubmitEditing: (() => void) | undefined;
}>;

type SequenceOptions = Readonly<{
	next?: FieldHandle;
	onSubmit?: () => void;
	submittable?: boolean;
}>;

/**
 * A handle a field hands to the field before it, so the keyboard's next key
 * moves entry along without the screen holding a ref.
 *
 * @example
 *   const password = useFieldHandle();
 *   <field.EmailField label={m.login_email()} next={password} />;
 */
export const useFieldHandle = (): FieldHandle => {
	const control = useRef<Focusable | null>(null);
	return {
		focus: () => control.current?.focus(),
		attach: next => {
			control.current = next;
		},
	};
};

/**
 * The submit-key props for one field: a next key where another field follows, a
 * go key that submits where the form waits on nothing else, and a done key that
 * dismisses the keyboard where it does.
 *
 * @example
 *   keyboardSequence({ onSubmit, submittable: false }); // a done key
 */
export const keyboardSequence = ({
	next,
	onSubmit,
	submittable = true,
}: SequenceOptions): KeyboardSequence => {
	if (next !== undefined) {
		return {
			returnKeyType: "next",
			submitBehavior: "submit",
			onSubmitEditing: () => next.focus(),
		};
	}
	if (onSubmit === undefined) {
		return {
			returnKeyType: undefined,
			submitBehavior: undefined,
			onSubmitEditing: undefined,
		};
	}
	return submittable
		? {
				returnKeyType: "go",
				submitBehavior: "blurAndSubmit",
				onSubmitEditing: onSubmit,
			}
		: {
				returnKeyType: "done",
				submitBehavior: "blurAndSubmit",
				onSubmitEditing: undefined,
			};
};

/**
 * The same submit-key props for a connected field, with the go key held back
 * until its own value is all the form still waits on.
 *
 * @example
 *   const submitKey = useKeyboardSequence({ next, onSubmit });
 */
export const useKeyboardSequence = ({
	next,
	onSubmit,
}: SequenceOptions): KeyboardSequence => {
	const { form, name } = useFieldContext();
	const submits =
		next === undefined && onSubmit !== undefined;
	const submittable = useStore(
		form.store,
		state =>
			submits &&
			valuesCompleteExcept(
				form.options.validators,
				state.values,
				name,
			),
	);
	return keyboardSequence({ next, onSubmit, submittable });
};
