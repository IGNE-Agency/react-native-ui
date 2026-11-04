import type { ReactNode } from "react";

import { suffixed } from "../../lib/test-id/test-id";
import { Refresh, useRefresh } from "../refresh/refresh";
import {
	ScrollArea,
	type ScrollAreaProps,
} from "../scroll-area/scroll-area";

/** What a `PullToRefresh` takes: a scroll area's own props, and the refresh it asks for. */
export type PullToRefreshProps = Omit<
	ScrollAreaProps,
	"gesture" | "onScroll" | "scrollEventThrottle" | "testID"
> &
	Readonly<{
		/** Whether the asked-for refresh is still out. */
		busy: boolean;
		onRefresh: () => void;
		/** `testID` goes on the scroll area and `${testID}-indicator` on the pull's indicator. */
		testID?: string;
	}>;

/**
 * A scroll area that asks for fresh content when pulled down from its top,
 * with the indicator above it.
 *
 * @example
 *   <PullToRefresh
 *   	busy={refreshing}
 *   	onRefresh={refresh}
 *   	contentContainerStyle={styles.list}>
 *   	{rows}
 *   </PullToRefresh>
 */
export const PullToRefresh = ({
	busy,
	onRefresh,
	testID,
	children,
	...area
}: PullToRefreshProps): ReactNode => {
	const pull = useRefresh({ busy, onRefresh });

	return (
		<Refresh.Root pull={pull}>
			<Refresh.Indicator
				testID={suffixed(testID, "indicator")}
			/>
			<ScrollArea.Root
				{...area}
				{...pull.scroll}
				gesture={pull.gesture}
				testID={testID}>
				{children}
			</ScrollArea.Root>
		</Refresh.Root>
	);
};
