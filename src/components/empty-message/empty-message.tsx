import type { FC, ReactNode } from "react";
import type { SvgProps } from "react-native-svg";

import { suffixed } from "../../lib/test-id/test-id";
import { StatusMessage } from "../status-message/status-message";

/** What an `EmptyMessage` takes. */
export type EmptyMessageProps = Readonly<{
	title: string;
	body?: string;
	icon?: FC<SvgProps>;
	/** A way on from the empty view, such as "Add an item". */
	action?: Readonly<{ label: string; onPress: () => void }>;
	/** `testID` goes on the message, `${testID}-title` on its title, `${testID}-body` on its body and `${testID}-action` on its action. */
	testID?: string;
}>;

/**
 * What a view shows when its content arrived and holds nothing: an icon on a
 * neutral disc, a title, a body and a way on.
 *
 * @example
 *   <EmptyMessage
 *   	icon={InboxIcon}
 *   	title={m.home_empty_title()}
 *   	body={m.home_empty_body()}
 *   />
 */
export const EmptyMessage = ({
	title,
	body,
	icon,
	action,
	testID,
}: EmptyMessageProps): ReactNode => (
	<StatusMessage.Root testID={testID}>
		{icon === undefined ? null : (
			<StatusMessage.Icon svg={icon} tone="neutral" />
		)}
		<StatusMessage.Title testID={suffixed(testID, "title")}>
			{title}
		</StatusMessage.Title>
		{body === undefined ? null : (
			<StatusMessage.Body testID={suffixed(testID, "body")}>
				{body}
			</StatusMessage.Body>
		)}
		{action === undefined ? null : (
			<StatusMessage.Action
				onPress={action.onPress}
				testID={suffixed(testID, "action")}>
				{action.label}
			</StatusMessage.Action>
		)}
	</StatusMessage.Root>
);
