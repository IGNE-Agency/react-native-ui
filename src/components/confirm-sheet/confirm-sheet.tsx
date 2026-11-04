import {
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import {
	BackHandler,
	Text as NativeText,
	View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { suffixed } from "../../lib/test-id/test-id";
import type { ToneName } from "../../lib/tone/tone";
import { Button } from "../button/button";
import { Sheet, type SheetStops } from "../sheet/sheet";

/** What a `ConfirmSheet` takes: whether it is asking, its copy, and what each answer does. */
export type ConfirmSheetProps = Readonly<{
	/** Whether the sheet is asking. Turning it off sends the sheet away. */
	open: boolean;
	title: string;
	body?: string;
	confirmLabel: string;
	cancelLabel: string;
	/** The confirmed action. While a promise it returns is pending the confirm button waits and the sheet cannot be dismissed; once it resolves the sheet goes, and if it rejects the sheet stays. */
	onConfirm: () => void | Promise<unknown>;
	/** Called once the sheet has gone, whichever way it was sent away. */
	onClose: () => void;
	/** What the confirm button is announced as while the action is pending, such as "Deleting". */
	busyLabel?: string;
	/** The confirm button's tone, such as `error` for an action that destroys something. */
	tone?: ToneName;
	/** `testID` goes on the sheet, `${testID}-title` on its title, `${testID}-body` on its body, `${testID}-confirm` on the confirm button and `${testID}-cancel` on the cancel button. */
	testID?: string;
}>;

/**
 * A modal sheet that asks before an action: a title, a body, and a confirm and
 * a cancel button. It takes focus as it opens, and stays while the action runs.
 *
 * @example
 *   <ConfirmSheet
 *   	open={asking}
 *   	title={m.item_delete_title()}
 *   	body={m.item_delete_body()}
 *   	confirmLabel={m.item_delete()}
 *   	cancelLabel={m.common_cancel()}
 *   	busyLabel={m.item_deleting()}
 *   	tone="error"
 *   	onConfirm={() => remove.mutateAsync(id)}
 *   	onClose={() => setAsking(false)}
 *   />
 */
export const ConfirmSheet = ({
	open,
	title,
	body,
	confirmLabel,
	cancelLabel,
	onConfirm,
	onClose,
	busyLabel,
	tone = "brand",
	testID,
}: ConfirmSheetProps): ReactNode => {
	const [shown, setShown] = useState(open);
	const [busy, setBusy] = useState(false);
	const stops = useRef<SheetStops>(null);

	const confirm = async () => {
		setBusy(true);
		try {
			await onConfirm();
		} catch {
			setBusy(false);
			return;
		}
		stops.current?.close();
	};

	if (open && !shown) {
		setShown(true);
	}

	useEffect(() => {
		if (!open) {
			stops.current?.close();
		}
	}, [open]);

	useEffect(() => {
		if (!busy) {
			return undefined;
		}
		const subscription = BackHandler.addEventListener(
			"hardwareBackPress",
			() => true,
		);
		return () => subscription.remove();
	}, [busy]);

	if (!shown) {
		return null;
	}

	return (
		<Sheet.Root
			dismissable={!busy}
			fitsContent
			modal
			onIndexChange={index => {
				if (index === -1) {
					setShown(false);
					setBusy(false);
					onClose();
				}
			}}
			snapPoints={["100%"]}
			stops={stops}
			testID={testID}>
			<Sheet.Content>
				<Sheet.Header>
					<Sheet.Title testID={suffixed(testID, "title")}>
						{title}
					</Sheet.Title>
				</Sheet.Header>
				{body === undefined ? null : (
					<NativeText
						style={styles.body}
						testID={suffixed(testID, "body")}>
						{body}
					</NativeText>
				)}
				<View style={styles.actions}>
					<Button.Root
						busy={busy}
						busyLabel={busyLabel}
						onPress={() => void confirm()}
						testID={suffixed(testID, "confirm")}
						tone={tone}>
						<Button.Label>{confirmLabel}</Button.Label>
					</Button.Root>
					<Button.Root
						disabled={busy}
						onPress={() => stops.current?.close()}
						testID={suffixed(testID, "cancel")}
						tier="tonal"
						tone="neutral">
						<Button.Label>{cancelLabel}</Button.Label>
					</Button.Root>
				</View>
			</Sheet.Content>
		</Sheet.Root>
	);
};

const styles = StyleSheet.create(theme => ({
	body: {
		...theme.font.body.medium,
		color: theme.color.text,
	},
	actions: { gap: theme.unit[4] },
}));
