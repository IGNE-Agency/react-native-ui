import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import {
	RatingField,
	type RatingFieldProps,
} from "./rating-field";

type Props = Omit<
	RatingFieldProps,
	"errors" | "onValueChange" | "value"
>;

/**
 * The rating bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="rating">
 *   	{field => (
 *   		<field.RatingField
 *   			copy={fieldCopy}
 *   			label={m.review_rating()}
 *   			ratingLabel={m.rating_value}
 *   			unratedLabel={m.rating_unrated()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFRatingField = (props: Props): ReactNode => {
	const { field, ...state } = useConnectedField<
		number | undefined
	>();
	return (
		<RatingField
			{...props}
			{...state}
			onValueChange={value => {
				field.handleChange(value);
				field.handleBlur();
			}}
			value={field.state.value}
		/>
	);
};
