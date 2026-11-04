import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";

import type { RequirednessVariant } from "../../lib/forms/field-state";
import {
	FIELD_ARG_TYPES,
	FIELD_COPY,
	FILE_COPY,
	requirednessFrom,
} from "../../lib/forms/story-copy";
import type { FileAsset } from "../file-input/file-input";
import {
	PhotoField,
	type PhotoFieldProps,
} from "./photo-field";

type PhotoFieldStoryArgs = Omit<
	PhotoFieldProps,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "Photos of the damage";
const JPEG = "image/jpeg";

const REMOTE: FileAsset = {
	uri: "https://picsum.photos/id/111/400/400.jpg",
	name: "front.jpg",
	size: 182_000,
	mimeType: JPEG,
};

const LOCAL: FileAsset = {
	uri: "file:///story/side.jpg",
	name: "side.jpg",
	size: 164_000,
	mimeType: JPEG,
};

const SLOW: FileAsset = {
	uri: "https://app.requestly.io/delay/5000/https://picsum.photos/id/133/400/400.jpg",
	name: "rear.jpg",
	size: 171_000,
	mimeType: JPEG,
};

const BROKEN: FileAsset = {
	uri: "https://example.com/missing-photo.jpg",
	name: "roof.jpg",
	size: 150_000,
	mimeType: JPEG,
};

const ControlledPhotoField = ({
	requiredness,
	...args
}: PhotoFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<PhotoField
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
		<ControlledPhotoField key={id} {...args} />
	),
	args: {
		label: LABEL,
		multiple: true,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		readonly: false,
		pending: false,
		copy: FIELD_COPY,
		fileCopy: FILE_COPY,
		value: [],
		onValueChange: () => {},
	},
	argTypes: FIELD_ARG_TYPES,
	parameters: {
		controls: {
			include: [
				"label",
				"multiple",
				"description",
				"errors",
				"requiredness",
				"disabled",
				"readonly",
				"pending",
			],
		},
	},
} satisfies Meta<PhotoFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPhotos: Story = {
	args: { value: [REMOTE, LOCAL, SLOW, BROKEN] },
};
