import type { ReactNode } from "react";

import { suffixed } from "../../lib/test-id/test-id";
import {
	RatingInput,
	type RatingInputRootProps,
} from "../rating-input/rating-input";

/** What a `RatingField` takes: a `RatingInput.Root` without its parts. */
export type RatingFieldProps = Omit<
	RatingInputRootProps,
	"children" | "testID"
> &
	Readonly<{
		/** `testID` goes on the row of stars, `${testID}-${rating}` on each star from 1 to 5 and `${testID}-error` on the error. */
		testID?: string;
	}>;

/**
 * A rating field, assembled: label, description, the row of five stars and the
 * error.
 *
 * @example
 *   <RatingField
 *   	copy={fieldCopy}
 *   	label={m.review_rating()}
 *   	ratingLabel={m.rating_value}
 *   	unratedLabel={m.rating_unrated()}
 *   	onValueChange={setRating}
 *   	value={rating}
 *   />
 */
export const RatingField = ({
	testID,
	...props
}: RatingFieldProps): ReactNode => (
	<RatingInput.Root {...props}>
		<RatingInput.Label />
		<RatingInput.Stars
			starTestID={
				testID === undefined
					? undefined
					: rating => `${testID}-${rating}`
			}
			testID={testID}
		/>
		<RatingInput.Description />
		<RatingInput.Error testID={suffixed(testID, "error")} />
	</RatingInput.Root>
);
