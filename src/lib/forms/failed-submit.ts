import {
	useStore,
	type AnyFormApi,
} from "@tanstack/react-form";
import { useEffect, useRef } from "react";

/** Where a field sits on screen: its top in window points, or `undefined` where it could not be measured. */
export type FieldPlace = Readonly<{
	hidden: boolean;
	top: number | undefined;
}>;

/** A field a failed submit can move focus to. */
export type InvalidFocusEntry = Readonly<{
	name: string;
	place: (found: (place: FieldPlace) => void) => void;
	/** Moves focus into the field, and says whether it could. */
	focus: () => boolean;
}>;

type Placed = Readonly<{
	entry: InvalidFocusEntry;
	order: number;
	place: FieldPlace;
}>;

const registries = new WeakMap<
	AnyFormApi["store"],
	Set<InvalidFocusEntry>
>();

/**
 * Adds a field to its form's failed-submit registry, and returns the call that
 * takes it out again.
 *
 * @example
 *   useEffect(() => registerInvalidFocus(field.form, entry), [field]);
 */
export const registerInvalidFocus = (
	form: AnyFormApi,
	entry: InvalidFocusEntry,
): (() => void) => {
	const entries =
		registries.get(form.store) ??
		new Set<InvalidFocusEntry>();
	registries.set(form.store, entries);
	entries.add(entry);
	return () => {
		entries.delete(entry);
	};
};

const placeOf = (
	entry: InvalidFocusEntry,
): Promise<FieldPlace> =>
	new Promise(resolve => {
		entry.place(resolve);
	});

const invalid = (
	form: AnyFormApi,
	entry: InvalidFocusEntry,
): boolean =>
	(form.getFieldMeta(entry.name)?.errors.length ?? 0) > 0;

const visualOrder = (
	placed: readonly Placed[],
): readonly Placed[] => {
	const measured = placed.every(
		item => item.place.top !== undefined,
	);
	return [...placed].sort((a, b) =>
		measured
			? (a.place.top ?? 0) - (b.place.top ?? 0) ||
				a.order - b.order
			: a.order - b.order,
	);
};

/**
 * Focuses the first invalid field of a form in visual order, top to bottom,
 * with mount order where a field cannot be measured. Hidden fields and fields
 * that cannot take focus are passed over.
 *
 * @example
 *   await focusFirstInvalidField(form); // true when a field took focus
 */
export const focusFirstInvalidField = async (
	form: AnyFormApi,
): Promise<boolean> => {
	const entries = [
		...(registries.get(form.store) ?? []),
	].filter(entry => invalid(form, entry));
	const placed = await Promise.all(
		entries.map(async (entry, order) => ({
			entry,
			order,
			place: await placeOf(entry),
		})),
	);
	return visualOrder(
		placed.filter(item => !item.place.hidden),
	).some(item => item.entry.focus());
};

/**
 * Focuses the form's first invalid field once a submit attempt has settled
 * invalid and rendered, whether the client's validators or the server's field
 * errors failed it.
 *
 * @example
 *   const form = hook.useAppForm(options);
 *   useFailedSubmitFocus(form);
 */
export const useFailedSubmitFocus = (
	form: AnyFormApi,
): void => {
	const attempts = useStore(
		form.store,
		state => state.submissionAttempts,
	);
	const settled = useStore(
		form.store,
		state => !state.isSubmitting && !state.isValidating,
	);
	const handled = useRef(attempts);

	useEffect(() => {
		if (!settled || handled.current === attempts) {
			return;
		}
		handled.current = attempts;
		if (!form.state.isValid) {
			void focusFirstInvalidField(form);
		}
	}, [attempts, form, settled]);
};
