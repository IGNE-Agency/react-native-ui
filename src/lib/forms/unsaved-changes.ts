import type { AnyFormState } from "@tanstack/react-form";
import { useEffect, useSyncExternalStore } from "react";

/**
 * Decides from a form's live state whether that form counts as unsaved changes.
 *
 * @example
 *   const unlessEmpty: LeaveGuardPolicy = state => whenDirty(state) && state.values.note !== "";
 */
export type LeaveGuardPolicy = (
	state: AnyFormState,
) => boolean;

/**
 * The default policy: a form counts once it is changed from its defaults, except while it submits.
 *
 * @example
 *   <Form.Root form={form} leaveGuard={whenDirty}>
 */
export const whenDirty: LeaveGuardPolicy = state =>
	state.isDirty &&
	!state.isDefaultValue &&
	!state.isSubmitting;

/**
 * The policy for a form that never counts, such as a filter or a search.
 *
 * @example
 *   <Form.Root form={filters} leaveGuard={never}>
 */
export const never: LeaveGuardPolicy = () => false;

const createRegistry = () => {
	let reporting = 0;
	const listeners = new Set<() => void>();
	const publish = () => {
		for (const listener of listeners) {
			listener();
		}
	};

	return {
		subscribe: (listener: () => void) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		unsaved: () => reporting > 0,
		report: () => {
			reporting += 1;
			publish();
			return () => {
				reporting -= 1;
				publish();
			};
		},
	};
};

const registry = createRegistry();

/**
 * Whether any mounted form reports unsaved changes under its `leaveGuard` policy.
 *
 * @example
 *   const unsaved = useUnsavedChanges();
 */
export const useUnsavedChanges = (): boolean =>
	useSyncExternalStore(
		registry.subscribe,
		registry.unsaved,
	);

/**
 * Reports unsaved changes for as long as `unsaved` holds and the caller is mounted.
 *
 * @example
 *   useReportUnsavedChanges(useStore(form.store, whenDirty));
 */
export const useReportUnsavedChanges = (
	unsaved: boolean,
): void => {
	useEffect(
		() => (unsaved ? registry.report() : undefined),
		[unsaved],
	);
};
