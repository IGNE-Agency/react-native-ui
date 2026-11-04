import type { ReactNode } from "react";

import { suffixed } from "../../lib/test-id/test-id";
import {
	FileInput,
	type FileInputRootProps,
	type FileSource,
} from "../file-input/file-input";

/** What a `FileField` takes: a `FileInput.Root` without its parts, plus which picker it opens. */
export type FileFieldProps = Omit<
	FileInputRootProps,
	"children" | "testID"
> &
	Readonly<{
		source?: FileSource;
		/** What the picker's trigger says, such as "Choose a file". */
		chooseLabel: string;
		/** `testID` goes on the picker's trigger, `${testID}-files` on the staged files, `${testID}-file-${index}` on each from 0, `${testID}-file-${index}-remove` on its remove button, `${testID}-notice` on what a refused or failed pick says and `${testID}-error` on the error. */
		testID?: string;
	}>;

/**
 * A file field, assembled: label, description, the platform's picker, the staged
 * files and the error.
 *
 * @example
 *   <FileField
 *   	chooseLabel={m.file_choose_image()}
 *   	copy={fieldCopy}
 *   	fileCopy={fileCopy}
 *   	label={m.profile_photos()}
 *   	multiple
 *   	onValueChange={setPhotos}
 *   	source="images"
 *   	value={photos}
 *   />
 */
export const FileField = ({
	source,
	chooseLabel,
	testID,
	...props
}: FileFieldProps): ReactNode => (
	<FileInput.Root {...props}>
		<FileInput.Label />
		<FileInput.Group>
			<FileInput.Trigger
				label={chooseLabel}
				source={source}
				testID={testID}
			/>
			<FileInput.Pending />
		</FileInput.Group>
		<FileInput.List
			itemTestID={
				testID === undefined
					? undefined
					: index => `${testID}-file-${index}`
			}
			removeTestID={
				testID === undefined
					? undefined
					: index => `${testID}-file-${index}-remove`
			}
			testID={suffixed(testID, "files")}
		/>
		<FileInput.Description />
		<FileInput.Notice testID={suffixed(testID, "notice")} />
		<FileInput.Error testID={suffixed(testID, "error")} />
	</FileInput.Root>
);
