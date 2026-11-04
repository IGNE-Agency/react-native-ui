import { useEffect } from "react";
import { AccessibilityInfo, Platform } from "react-native";

import { useBusyPhase } from "../wait/use-busy-phase";

/** The props that make a node a polite live region. */
export type LiveRegionProps = Readonly<{
	accessibilityLiveRegion: "polite";
}>;

type LiveRegionOptions = Readonly<{
	/** Holds the announcement back until the wait it names has lasted, per `useBusyPhase`. */
	late?: boolean;
}>;

const POLITE: LiveRegionProps = {
	accessibilityLiveRegion: "polite",
};

const announce = (text: string) =>
	AccessibilityInfo.announceForAccessibilityWithOptions(
		text,
		{ queue: true },
	);

/**
 * A polite live region on both platforms: spread the result onto the node, and
 * on iOS `announcement` is queued for the screen reader when it appears or changes.
 *
 * @example
 *   const live = useLiveRegion(loadingLabel, { late: true });
 *   <View {...live}>…</View>
 */
export const useLiveRegion = (
	announcement: string | undefined,
	{ late = false }: LiveRegionOptions = {},
): LiveRegionProps => {
	const phase = useBusyPhase({ busy: late });
	const said =
		late && phase === "fresh" ? undefined : announcement;

	useEffect(() => {
		if (
			Platform.OS !== "ios" ||
			said === undefined ||
			said === ""
		) {
			return undefined;
		}
		announce(said);
		return undefined;
	}, [said]);

	return POLITE;
};
