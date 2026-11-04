import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import type { FileAsset } from "../file-input/file-input";
import {
	PhotoField,
	type PhotoFieldProps,
} from "./photo-field";

type Props = Omit<
	PhotoFieldProps,
	"errors" | "onValueChange" | "value"
>;

/**
 * The photo field bound to its TanStack Form field, whose value is the list of
 * staged photos.
 *
 * @example
 *   <form.AppField name="photos">
 *   	{field => (
 *   		<field.PhotoField
 *   			copy={fieldCopy}
 *   			label={m.profile_photos()}
 *   			fileCopy={fileCopy}
 *   			multiple
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFPhotoField = (props: Props): ReactNode => {
	const { field, ...state } =
		useConnectedField<readonly FileAsset[]>();
	return (
		<PhotoField
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
