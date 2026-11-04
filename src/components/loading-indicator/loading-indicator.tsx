import type { ReactNode } from "react";

import { suffixed } from "../../lib/test-id/test-id";
import { useBusyPhase } from "../../lib/wait/use-busy-phase";
import { Spinner } from "../spinner/spinner";

/** What a `LoadingIndicator` takes. */
export type LoadingIndicatorProps = Readonly<{
	/** What the wait says and is announced as, such as "Loading". */
	label: string;
	size?: "sm" | "md";
	/** Whether it shows at once rather than after `useBusyPhase`'s delay. */
	immediate?: boolean;
	/** `testID` goes on the indicator and `${testID}-label` on its label. */
	testID?: string;
}>;

/**
 * A spinner with its label, announced once. It shows nothing until the wait
 * has lasted long enough to be worth showing, unless it is `immediate`.
 *
 * @example
 *   <LoadingIndicator label={m.items_loading()} />
 */
export const LoadingIndicator = ({
	label,
	size = "md",
	immediate = false,
	testID,
}: LoadingIndicatorProps): ReactNode => {
	const phase = useBusyPhase({ busy: true });

	if (!immediate && phase === "fresh") {
		return null;
	}

	return (
		<Spinner.Root label={label} testID={testID}>
			<Spinner.Indicator size={size} />
			<Spinner.Label testID={suffixed(testID, "label")}>
				{label}
			</Spinner.Label>
		</Spinner.Root>
	);
};
