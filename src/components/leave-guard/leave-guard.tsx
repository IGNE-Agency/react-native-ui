import { useState, type ReactNode } from "react";

import type { ToneName } from "../../lib/tone/tone";
import { ConfirmSheet } from "../confirm-sheet/confirm-sheet";

type Held = Readonly<{
	proceed: () => void;
	agreed: boolean;
}>;

/** A screen's or a sheet's guard against being left: whether it blocks, the leave it holds, and the answers to it. */
export type LeaveGuard = Readonly<{
	/** Whether leaving is blocked now: `when`, except while a leave that was agreed to goes through. */
	blocking: boolean;
	/** Whether a held leave is waiting for an answer. */
	asking: boolean;
	/** Hands the guard a leave that was blocked, with what lets it through. */
	hold: (proceed: () => void) => void;
	/** Agrees to the held leave, which goes through once the question has gone. */
	agree: () => void;
	/** Lets the held leave through if it was agreed to, and otherwise stays. */
	settle: () => void;
}>;

/**
 * Guards a screen or a sheet against being left while `when`, such as a form
 * with unsaved changes, without knowing the router: an adapter or `Sheet.Root`
 * hands it the leaves it blocks.
 *
 * @example
 *   const guard = useLeaveGuard(form.state.isDirty && !form.state.isSubmitting);
 */
export const useLeaveGuard = (
	when: boolean,
): LeaveGuard => {
	const [held, setHeld] = useState<Held | undefined>(
		undefined,
	);
	const [leaving, setLeaving] = useState(false);

	if (leaving && !when) {
		setLeaving(false);
	}

	return {
		blocking: when && !leaving,
		asking: held !== undefined,
		hold: proceed => setHeld({ proceed, agreed: false }),
		agree: () =>
			setHeld(current =>
				current === undefined
					? undefined
					: { ...current, agreed: true },
			),
		settle: () => {
			if (held?.agreed === true) {
				setLeaving(true);
				held.proceed();
			}
			setHeld(undefined);
		},
	};
};

/** What a `LeaveGuardSheet` takes: the guard it answers for and the question's copy. */
export type LeaveGuardSheetProps = Readonly<{
	guard: LeaveGuard;
	title: string;
	body?: string;
	/** What leaving anyway is labelled, such as "Discard changes". */
	confirmLabel: string;
	/** What staying is labelled, such as "Keep editing". */
	cancelLabel: string;
	/** The leave button's tone; `error` unless given, since leaving loses the changes. */
	tone?: ToneName;
	/** `testID` goes on the sheet, with `ConfirmSheet`'s suffixes: `${testID}-title`, `${testID}-body`, `${testID}-confirm` and `${testID}-cancel`. */
	testID?: string;
}>;

/**
 * The question a guarded screen or sheet asks when it is left: a `ConfirmSheet`,
 * stacked over a guarded sheet, that lets the held leave through or stays.
 *
 * @example
 *   <LeaveGuardSheet
 *   	guard={guard}
 *   	title={m.edit_leave_title()}
 *   	confirmLabel={m.edit_leave_discard()}
 *   	cancelLabel={m.edit_leave_stay()}
 *   />
 */
export const LeaveGuardSheet = ({
	guard,
	title,
	body,
	confirmLabel,
	cancelLabel,
	tone = "error",
	testID,
}: LeaveGuardSheetProps): ReactNode => (
	<ConfirmSheet
		body={body}
		cancelLabel={cancelLabel}
		confirmLabel={confirmLabel}
		onClose={guard.settle}
		onConfirm={guard.agree}
		open={guard.asking}
		testID={testID}
		title={title}
		tone={tone}
	/>
);
