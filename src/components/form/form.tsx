import {
	useStore,
	type AnyFormApi,
} from "@tanstack/react-form";
import type { ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { useLiveRegion } from "../../lib/a11y/live-region";
import {
	formContext,
	useFormContext,
} from "../../lib/forms/context";
import {
	useReportUnsavedChanges,
	whenDirty,
	type LeaveGuardPolicy,
} from "../../lib/forms/unsaved-changes";
import { normalizeFieldErrors } from "../../lib/forms/validation-helpers";
import { useBusyPhase } from "../../lib/wait/use-busy-phase";
import { Button } from "../button/button";
import { ErrorText } from "../error-text/error-text";

type RootProps = Readonly<{
	form: AnyFormApi;
	/** Whether the form counts as unsaved changes, for `useLeaveGuard`: `whenDirty` unless given, `never` for a filter or a search. */
	leaveGuard?: LeaveGuardPolicy;
	children: ReactNode;
}>;

type ErrorsProps = Readonly<{ testID?: string }>;

type SubmitProps = Readonly<{
	/** What the button is announced as once a submit has lasted, such as "Signing in". */
	busyLabel: string;
	testID?: string;
	children: ReactNode;
}>;

const Root = ({
	form,
	leaveGuard = whenDirty,
	children,
}: RootProps): ReactNode => {
	useReportUnsavedChanges(useStore(form.store, leaveGuard));
	return (
		<formContext.Provider value={form}>
			{children}
		</formContext.Provider>
	);
};

const Errors = ({ testID }: ErrorsProps): ReactNode => {
	const form = useFormContext();
	const errors = useStore(
		form.store,
		state => state.errors,
	);
	const lines = normalizeFieldErrors(errors);
	return lines.length === 0 ? null : (
		<ErrorText.Root testID={testID}>
			{lines.join("\n")}
		</ErrorText.Root>
	);
};

const Submit = ({
	busyLabel,
	testID,
	children,
}: SubmitProps): ReactNode => {
	const form = useFormContext();
	const submitting = useStore(
		form.store,
		state => state.isSubmitting,
	);
	const busy =
		useBusyPhase({ busy: submitting }) !== "fresh";
	const live = useLiveRegion(busy ? busyLabel : undefined);
	return (
		<View {...live} style={styles.submit}>
			<Button.Root
				busy={busy}
				busyLabel={busyLabel}
				onPress={() => {
					if (!submitting) {
						void form.handleSubmit();
					}
				}}
				testID={testID}>
				{children}
			</Button.Root>
		</View>
	);
};

const styles = StyleSheet.create({
	submit: { alignItems: "flex-start" },
});

type FormNamespace = Readonly<{
	Root: typeof Root;
	Errors: typeof Errors;
	Submit: typeof Submit;
}>;

/**
 * A form's own parts. `Root` hands the form from `useAppForm` to the parts
 * inside it, reports its unsaved changes under its `leaveGuard` policy, and
 * renders nothing of its own; `Errors` shows the form-level
 * errors, and `Submit` is the submit button, busy only once a submit has
 * lasted, per `useBusyPhase`, when it also announces `busyLabel`.
 *
 * @example
 *   <Form.Root form={form}>
 *   	<Form.Errors testID="login-error" />
 *   	<Form.Submit busyLabel={m.common_busy()} testID="login-submit">
 *   		<Button.Label>{m.login_submit()}</Button.Label>
 *   	</Form.Submit>
 *   </Form.Root>
 */
export const Form: FormNamespace = {
	Root,
	Errors,
	Submit,
};
