import type { FC, ReactNode } from "react";
import type { SvgProps } from "react-native-svg";

import { suffixed } from "../../lib/test-id/test-id";
import { StatusMessage } from "../status-message/status-message";

/** What an `ErrorMessage` takes. */
export type ErrorMessageProps = Readonly<{
	title: string;
	body?: string;
	icon?: FC<SvgProps>;
	/** The way to ask again, such as "Try again". */
	retry?: Readonly<{ label: string; onPress: () => void }>;
	/** `testID` goes on the message, `${testID}-title` on its title, `${testID}-body` on its body and `${testID}-retry` on its retry button. */
	testID?: string;
}>;

/**
 * What a view shows when its content failed to arrive: an icon on an error
 * disc, a title, a body and the way to ask again.
 *
 * @example
 *   <ErrorMessage
 *   	icon={ErrorIcon}
 *   	title={m.error_generic_title()}
 *   	body={m.error_generic_body()}
 *   	retry={{ label: m.common_retry(), onPress: refetch }}
 *   />
 */
export const ErrorMessage = ({
	title,
	body,
	icon,
	retry,
	testID,
}: ErrorMessageProps): ReactNode => (
	<StatusMessage.Root testID={testID}>
		{icon === undefined ? null : (
			<StatusMessage.Icon svg={icon} tone="error" />
		)}
		<StatusMessage.Title testID={suffixed(testID, "title")}>
			{title}
		</StatusMessage.Title>
		{body === undefined ? null : (
			<StatusMessage.Body testID={suffixed(testID, "body")}>
				{body}
			</StatusMessage.Body>
		)}
		{retry === undefined ? null : (
			<StatusMessage.Action
				onPress={retry.onPress}
				testID={suffixed(testID, "retry")}>
				{retry.label}
			</StatusMessage.Action>
		)}
	</StatusMessage.Root>
);
