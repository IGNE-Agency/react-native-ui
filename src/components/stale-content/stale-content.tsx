import type { ReactNode } from "react";

import { suffixed } from "../../lib/test-id/test-id";
import type { BusyPhaseOptions } from "../../lib/wait/use-busy-phase";
import { Stale } from "../stale/stale";

/** What a `StaleContent` takes: the wait's timing, its copy and the way to ask again. */
export type StaleContentProps = BusyPhaseOptions &
	Readonly<{
		/** What the overlay says once the wait is slow, such as "Still updating…". */
		slowLabel: string;
		/** The button a stuck wait offers. Without it, a stuck wait keeps the overlay alone. */
		retry?: Readonly<{
			label: string;
			onPress: () => void;
		}>;
		/** `testID` goes on the content's frame, `${testID}-message` on the slow message and `${testID}-retry` on the retry button. */
		testID?: string;
		children: ReactNode;
	}>;

/**
 * Content kept on screen while a fresh copy is out: dimmed once the wait is
 * late, overlaid with `slowLabel` once slow, and offering `retry` once stuck.
 *
 * @example
 *   <StaleContent
 *   	busy={query.isFetching}
 *   	slowLabel={m.items_updating_slow()}
 *   	retry={{ label: m.common_retry(), onPress: query.refetch }}>
 *   	{list}
 *   </StaleContent>
 */
export const StaleContent = ({
	slowLabel,
	retry,
	testID,
	children,
	...wait
}: StaleContentProps): ReactNode => (
	<Stale.Root {...wait} testID={testID}>
		<Stale.Content>
			<Stale.Dim>{children}</Stale.Dim>
		</Stale.Content>
		<Stale.Overlay>
			<Stale.Message testID={suffixed(testID, "message")}>
				{slowLabel}
			</Stale.Message>
			{retry === undefined ? null : (
				<Stale.Retry
					onRetry={retry.onPress}
					testID={suffixed(testID, "retry")}>
					{retry.label}
				</Stale.Retry>
			)}
		</Stale.Overlay>
	</Stale.Root>
);
