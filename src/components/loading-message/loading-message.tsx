import type { ReactNode } from "react";

import { suffixed } from "../../lib/test-id/test-id";
import { useBusyPhase } from "../../lib/wait/use-busy-phase";
import { StatusMessage } from "../status-message/status-message";

/** What a `LoadingMessage` takes. */
export type LoadingMessageProps = Readonly<{
	/** What the wait says and is announced as, such as "Loading your items". */
	title: string;
	/** `testID` goes on the message and `${testID}-title` on its title. */
	testID?: string;
}>;

/**
 * A view's wait for its first content: a spinner and its title, announced once
 * and shown only once the wait has lasted long enough to be worth showing.
 *
 * @example
 *   <LoadingMessage title={m.items_loading()} />
 */
export const LoadingMessage = ({
	title,
	testID,
}: LoadingMessageProps): ReactNode => {
	const phase = useBusyPhase({ busy: true });

	if (phase === "fresh") {
		return null;
	}

	return (
		<StatusMessage.Root
			announcement={title}
			busy
			testID={testID}>
			<StatusMessage.Spinner />
			<StatusMessage.Body
				testID={suffixed(testID, "title")}>
				{title}
			</StatusMessage.Body>
		</StatusMessage.Root>
	);
};
