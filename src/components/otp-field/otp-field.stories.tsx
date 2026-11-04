import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import type { ComponentProps, ReactNode } from "react";

import type { RequirednessVariant } from "../../lib/forms/field-state";
import {
	FIELD_ARG_TYPES,
	FIELD_COPY,
	requirednessFrom,
} from "../../lib/forms/story-copy";
import { OtpField } from "./otp-field";

type OtpFieldStoryArgs = Omit<
	ComponentProps<typeof OtpField.Root>,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "Verification code";
const DIGITS = 6;

const StoryOtpField = ({
	requiredness,
	...args
}: OtpFieldStoryArgs): ReactNode => (
	<OtpField.Root
		{...args}
		requiredness={requirednessFrom(requiredness)}
	/>
);

const meta = {
	render: (args, { id }) => (
		<StoryOtpField
			key={`${id}-${args.numberOfDigits}`}
			{...args}
		/>
	),
	args: {
		label: LABEL,
		numberOfDigits: DIGITS,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		copy: FIELD_COPY,
		onChangeText: () => {},
	},
	argTypes: {
		...FIELD_ARG_TYPES,
		numberOfDigits: {
			control: { type: "range", min: 4, max: 8, step: 1 },
		},
	},
	parameters: {
		controls: {
			include: [
				"label",
				"numberOfDigits",
				"description",
				"errors",
				"requiredness",
				"disabled",
			],
		},
	},
} satisfies Meta<OtpFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
