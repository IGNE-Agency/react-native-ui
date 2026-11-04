import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";

import {
	WheelPicker,
	type WheelPickerProps,
} from "../wheel-picker/wheel-picker";
import type { WheelItem } from "./wheel";

type WheelPickerStoryArgs = Omit<
	WheelPickerProps,
	"items" | "before" | "after"
> &
	Readonly<{ annotated: boolean; edges: boolean }>;

const LABEL = "Start time";
const INCREMENT = "Next";
const DECREMENT = "Previous";
const BEFORE = "First at 09:00";
const AFTER = "Last at 17:00";

const TIMES: readonly WheelItem[] = Array.from(
	{ length: 9 },
	(_, index) => {
		const label = `${String(9 + index).padStart(2, "0")}:00`;
		return { key: label, label };
	},
);

const ANNOTATED: readonly WheelItem[] = TIMES.map(
	(item, index) => {
		if (index === 3) {
			return {
				...item,
				annotations: [
					{ text: "Unavailable", tone: "error" },
				],
			};
		}
		if (index === 4) {
			return {
				...item,
				annotations: [
					{
						text: "Marked, with a longer note that shrinks",
					},
				],
				detail: "Read out only",
			};
		}
		return item;
	},
);

const ControlledWheelPicker = ({
	annotated,
	edges,
	...args
}: WheelPickerStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<WheelPicker
			{...args}
			after={edges ? AFTER : undefined}
			before={edges ? BEFORE : undefined}
			items={annotated ? ANNOTATED : TIMES}
			onChange={key => {
				args.onChange(key);
				setValue(key);
			}}
			value={value}
		/>
	);
};

const meta = {
	render: (args, { id }) => (
		<ControlledWheelPicker key={id} {...args} />
	),
	args: {
		annotated: false,
		edges: false,
		value: "12:00",
		onChange: () => {},
		accessibilityLabel: LABEL,
		incrementLabel: INCREMENT,
		decrementLabel: DECREMENT,
	},
	parameters: {
		controls: { include: ["annotated", "edges"] },
	},
} satisfies Meta<WheelPickerStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
