import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";

import type { RequirednessVariant } from "../../lib/forms/field-state";
import {
	CHOOSE_FILE_LABEL,
	FIELD_ARG_TYPES,
	FIELD_COPY,
	FILE_COPY,
	requirednessFrom,
} from "../../lib/forms/story-copy";
import type { FileAsset } from "../file-input/file-input";
import {
	FileField,
	type FileFieldProps,
} from "./file-field";

type FileFieldStoryArgs = Omit<
	FileFieldProps,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "Attachments";
const PDF = "application/pdf";

const LOCAL: FileAsset = {
	uri: "file:///story/contract.pdf",
	name: "contract.pdf",
	size: 248_000,
	mimeType: PDF,
};

const REMOTE: FileAsset = {
	uri: "https://example.com/invoice-2026-10.pdf",
	name: "invoice-2026-10.pdf",
	size: 91_500,
	mimeType: PDF,
};

const ControlledFileField = ({
	requiredness,
	...args
}: FileFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<FileField
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
		<ControlledFileField key={id} {...args} />
	),
	args: {
		label: LABEL,
		chooseLabel: CHOOSE_FILE_LABEL,
		source: "documents",
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
	argTypes: {
		...FIELD_ARG_TYPES,
		source: {
			control: "radio",
			options: ["documents", "images"],
		},
	},
	parameters: {
		controls: {
			include: [
				"label",
				"chooseLabel",
				"source",
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
} satisfies Meta<FileFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFiles: Story = {
	args: { value: [LOCAL, REMOTE] },
};
