import type { ReactNode } from "react";

import { suffixed } from "../../lib/test-id/test-id";
import {
	FileInput,
	type FileInputRootProps,
} from "../file-input/file-input";

/** What a `PhotoField` takes: a `FileInput.Root` without its parts, and without the file kinds a picture cannot be. */
export type PhotoFieldProps = Omit<
	FileInputRootProps,
	"accept" | "children" | "testID"
> &
	Readonly<{
		/** `testID` goes on the tile that adds a photo, `${testID}-photos` on the row of tiles, `${testID}-photo-${index}` on each photo from 0, `${testID}-photo-${index}-remove` on its remove button, `${testID}-notice` on what a refused or failed pick says and `${testID}-error` on the error. */
		testID?: string;
	}>;

/**
 * A photo field, assembled: label, a row of tiles that opens with the one that
 * adds a photo, then a thumbnail per photo added, with description and error
 * under it.
 *
 * @example
 *   <PhotoField
 *   	copy={fieldCopy}
 *   	fileCopy={fileCopy}
 *   	label={m.profile_photos()}
 *   	multiple
 *   	onValueChange={setPhotos}
 *   	value={photos}
 *   />
 */
export const PhotoField = ({
	testID,
	...props
}: PhotoFieldProps): ReactNode => (
	<FileInput.Root {...props}>
		<FileInput.Label />
		<FileInput.Tiles
			addTestID={testID}
			itemTestID={
				testID === undefined
					? undefined
					: index => `${testID}-photo-${index}`
			}
			removeTestID={
				testID === undefined
					? undefined
					: index => `${testID}-photo-${index}-remove`
			}
			source="images"
			testID={suffixed(testID, "photos")}
		/>
		<FileInput.Description />
		<FileInput.Notice testID={suffixed(testID, "notice")} />
		<FileInput.Error testID={suffixed(testID, "error")} />
	</FileInput.Root>
);
