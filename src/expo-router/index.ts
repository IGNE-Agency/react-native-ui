import { usePreventRemove } from "expo-router";

import {
	useLeaveGuard,
	type LeaveGuard,
} from "../components/leave-guard/leave-guard";

/**
 * `useLeaveGuard` wired to expo-router: while `when`, which is
 * `useUnsavedChanges()` unless given, every way of leaving the screen (back, a
 * swipe, a navigation away) is held for the guard's sheet.
 *
 * @example
 *   const guard = useRouterLeaveGuard();
 *   <LeaveGuardSheet guard={guard} title={m.edit_leave_title()} confirmLabel={m.edit_leave_discard()} cancelLabel={m.edit_leave_stay()} />
 */
export const useRouterLeaveGuard = (
	when?: boolean,
): LeaveGuard => {
	const guard = useLeaveGuard(when);
	usePreventRemove(guard.blocking, ({ repeat }) =>
		guard.hold(repeat),
	);
	return guard;
};
