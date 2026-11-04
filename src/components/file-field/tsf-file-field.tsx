import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import type { FileAsset } from "../file-input/file-input";
import {
	FileField,
	type FileFieldProps,
} from "./file-field";

type Props = Omit<
	FileFieldProps,
	"errors" | "onValueChange" | "value"
>;

/**
 * The file field bound to its TanStack Form field, whose value is the list of
 * staged files.
 *
 * @example
 *   <form.AppField name="attachments">
 *   	{field => (
 *   		<field.FileField
 *   			copy={fieldCopy}
 *   			label={m.support_attachments()}
 *   			chooseLabel={m.file_choose()}
 *   			fileCopy={fileCopy}
 *   			multiple
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFFileField = (props: Props): ReactNode => {
	const { field, ...state } =
		useConnectedField<readonly FileAsset[]>();
	return (
		<FileField
			{...props}
			{...state}
			onValueChange={files => {
				field.handleChange(files);
				field.handleBlur();
			}}
			value={field.state.value}
		/>
	);
};
