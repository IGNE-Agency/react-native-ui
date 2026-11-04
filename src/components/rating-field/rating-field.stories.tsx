import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";

import type { RequirednessVariant } from "../../lib/forms/field-state";
import {
	FIELD_ARG_TYPES,
	FIELD_COPY,
	RATING_LABEL,
	requirednessFrom,
	UNRATED_LABEL,
} from "../../lib/forms/story-copy";
import {
	RatingField,
	type RatingFieldProps,
} from "./rating-field";

type RatingFieldStoryArgs = Omit<
	RatingFieldProps,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "How was your visit?";

const ControlledRatingField = ({
	requiredness,
	...args
}: RatingFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<RatingField
			{...args}
			onValueChange={next => {
				args.onValueChange(next);
				setValue(next);
			}}
			requiredness={requirednessFrom(requiredness)}
			value={value}
		/>
	);
};

const meta = {
	render: (args, { id }) => (
		<ControlledRatingField key={id} {...args} />
	),
	args: {
		label: LABEL,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		readonly: false,
		copy: FIELD_COPY,
		ratingLabel: RATING_LABEL,
		unratedLabel: UNRATED_LABEL,
		value: undefined,
		onValueChange: () => {},
	},
	argTypes: FIELD_ARG_TYPES,
	parameters: {
		controls: {
			include: [
				"label",
				"description",
				"errors",
				"requiredness",
				"disabled",
				"readonly",
			],
		},
	},
} satisfies Meta<RatingFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
