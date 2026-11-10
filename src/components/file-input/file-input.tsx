import AddIcon from "@material-design-icons/svg/outlined/add.svg";
import AttachIcon from "@material-design-icons/svg/outlined/attach_file.svg";
import BrokenImageIcon from "@material-design-icons/svg/outlined/broken_image.svg";
import CloseIcon from "@material-design-icons/svg/outlined/close.svg";
import ImageIcon from "@material-design-icons/svg/outlined/image.svg";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
	createContext,
	useContext,
	useState,
	type ReactNode,
} from "react";
import {
	Image,
	Pressable,
	ScrollView,
	Text as NativeText,
	View,
} from "react-native";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import type { FieldState } from "../../lib/forms/field-state";
import type { FieldHandle } from "../../lib/forms/keyboard-sequence";
import { hapticTick } from "../../lib/haptics/haptics";
import { useBusyPhase } from "../../lib/wait/use-busy-phase";
import { Button } from "../button/button";
import { ErrorText } from "../error-text/error-text";
import { Field, type FieldCopy } from "../field/field";
import {
	controlEdge,
	fieldControl,
	fieldControlVariants,
	fieldGroup,
	fieldGroupCompounds,
	fieldGroupVariants,
} from "../field/field-shell";
import { Icon } from "../icon/icon";
import { Spinner } from "../spinner/spinner";

/**
 * The words a file input says of its own: the name a picked file without one
 * goes by, what it says when the picker is refused or fails, and what the button
 * that takes a staged file off is announced as, handed the file's name.
 *
 * @example
 *   const fileCopy: FileInputCopy = {
 *   	unnamed: m.file_unnamed(),
 *   	permissionDenied: m.file_permission_denied(),
 *   	failed: m.file_failed(),
 *   	removeLabel: m.file_remove,
 *   };
 */
export type FileInputCopy = Readonly<{
	unnamed: string;
	permissionDenied: string;
	failed: string;
	removeLabel: (
		inputs: Readonly<{ file: string }>,
	) => string;
}>;

/** One file a picker handed back, as this app carries it. */
export type FileAsset = Readonly<{
	uri: string;
	name: string;
	size: number | undefined;
	mimeType: string | undefined;
}>;

/** Which of the platform's pickers a trigger opens. */
export type FileSource = "documents" | "images";

/** What a `FileInput.Root` takes: the field's own state, plus the staged files. */
export type FileInputRootProps = FieldState &
	Readonly<{
		label: string;
		copy: FieldCopy;
		fileCopy: FileInputCopy;
		description?: string;
		errors?: unknown;
		handle?: FieldHandle;
		value: readonly FileAsset[];
		onValueChange: (files: readonly FileAsset[]) => void;
		multiple?: boolean;
		accept?: readonly string[];
		testID?: string;
		children: ReactNode;
	}>;

type PickOutcome =
	| Readonly<{
			status: "picked";
			files: readonly FileAsset[];
	  }>
	| Readonly<{ status: "cancelled" }>
	| Readonly<{ status: "failed" }>;

type FileInputContextValue = Readonly<{
	files: readonly FileAsset[];
	fileCopy: FileInputCopy;
	notice: string | undefined;
	pick: (source: FileSource) => Promise<void>;
	remove: (file: FileAsset) => void;
}>;

type TriggerProps = Readonly<{
	source?: FileSource;
	testID?: string;
}>;

type LabelledTriggerProps = TriggerProps &
	Readonly<{
		/** What the trigger says, such as "Choose a file" or "Choose an image". */
		label: string;
	}>;

type GroupProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type ItemProps = Readonly<{
	file: FileAsset;
	testID?: string;
	removeTestID?: string;
}>;

type ThumbnailProps = Readonly<{ file: FileAsset }>;

type StagedTestIDs = Readonly<{
	testID?: string;
	/** The id each staged file carries, handed its place in the run from 0. */
	itemTestID?: (index: number) => string;
	/** The id each staged file's remove button carries, handed its place in the run from 0. */
	removeTestID?: (index: number) => string;
}>;

type TilesProps = TriggerProps &
	StagedTestIDs &
	Readonly<{ addTestID?: string }>;

type NoticeProps = Readonly<{ testID?: string }>;

const FileInputContext = createContext<
	FileInputContextValue | undefined
>(undefined);

const useFileInput = (): FileInputContextValue => {
	const value = useContext(FileInputContext);
	if (value === undefined) {
		throw new Error(
			"A file input part must be rendered inside FileInput.Root",
		);
	}
	return value;
};

const pickImages = async (
	multiple: boolean,
	unnamed: string,
): Promise<PickOutcome> => {
	try {
		const result =
			await ImagePicker.launchImageLibraryAsync({
				allowsMultipleSelection: multiple,
				mediaTypes: ["images"],
			});
		return result.canceled
			? { status: "cancelled" }
			: {
					status: "picked",
					files: result.assets.map(asset => ({
						uri: asset.uri,
						name: asset.fileName ?? unnamed,
						size: asset.fileSize,
						mimeType: asset.mimeType,
					})),
				};
	} catch {
		return { status: "failed" };
	}
};

const pickDocuments = async (
	multiple: boolean,
	accept: readonly string[] | undefined,
): Promise<PickOutcome> => {
	try {
		const result = await DocumentPicker.getDocumentAsync({
			multiple,
			type: accept === undefined ? undefined : [...accept],
		});
		return result.canceled
			? { status: "cancelled" }
			: {
					status: "picked",
					files: result.assets.map(asset => ({
						uri: asset.uri,
						name: asset.name,
						size: asset.size,
						mimeType: asset.mimeType,
					})),
				};
	} catch {
		return { status: "failed" };
	}
};

const Root = ({
	label,
	fileCopy,
	description,
	errors,
	handle,
	value,
	onValueChange,
	multiple = false,
	accept,
	children,
	...given
}: FileInputRootProps): ReactNode => {
	const [notice, setNotice] = useState<string | undefined>(
		undefined,
	);
	const [picking, setPicking] = useState(false);
	const pick = async (source: FileSource) => {
		setPicking(true);
		const outcome =
			source === "images"
				? await pickImages(multiple, fileCopy.unnamed)
				: await pickDocuments(multiple, accept);
		setPicking(false);
		if (outcome.status === "failed") {
			setNotice(fileCopy.failed);
			return;
		}
		setNotice(undefined);
		if (outcome.status === "picked") {
			onValueChange(
				multiple
					? [...value, ...outcome.files]
					: outcome.files.slice(0, 1),
			);
		}
	};
	return (
		<FileInputContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				files: value,
				fileCopy,
				notice,
				pick,
				remove: file =>
					onValueChange(
						value.filter(kept => kept.uri !== file.uri),
					),
			}}>
			<Field.Root
				{...given}
				description={description}
				errors={errors}
				filled={given.filled ?? value.length > 0}
				handle={handle}
				label={label}
				pending={given.pending === true || picking}>
				{children}
			</Field.Root>
		</FileInputContext.Provider>
	);
};

const Group = ({
	testID,
	children,
}: GroupProps): ReactNode => {
	const { accessibility, state } = Field.useControl();
	styles.useVariants(state);
	return (
		<FieldControl {...accessibility}>
			<Field.Group style={styles.box} testID={testID}>
				{children}
			</Field.Group>
		</FieldControl>
	);
};

const Trigger = ({
	source = "documents",
	label,
	testID,
}: LabelledTriggerProps): ReactNode => {
	const {
		accessibilityHint,
		accessibilityLabel,
		setControl,
		state,
	} = Field.useControl();
	const target = Field.useFocusTarget({ kind: "control" });
	const { pick } = useFileInput();
	const { theme } = useUnistyles();
	const locked = state.disabled || state.readonly;
	styles.useVariants(state);
	return (
		<Pressable
			accessibilityHint={accessibilityHint}
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			accessibilityState={{ disabled: locked }}
			accessible
			disabled={locked}
			onPress={() => {
				hapticTick();
				void pick(source);
			}}
			ref={node => {
				setControl(node);
				target(node);
			}}
			style={styles.trigger}
			testID={testID}>
			<Field.Inlay end="leading">
				<Icon.Root
					color={
						locked
							? theme.color.disabled.fg
							: theme.color.text
					}
					size="sm"
					svg={source === "images" ? ImageIcon : AttachIcon}
				/>
			</Field.Inlay>
			<NativeText aria-hidden style={styles.triggerLabel}>
				{label}
			</NativeText>
		</Pressable>
	);
};

const Item = ({
	file,
	testID,
	removeTestID,
}: ItemProps): ReactNode => {
	const { fileCopy, remove } = useFileInput();
	const { state } = Field.useControl();
	return (
		<View style={styles.item} testID={testID}>
			<View style={styles.itemName}>
				<NativeText
					numberOfLines={1}
					style={[
						styles.itemText,
						state.disabled ? styles.itemTextDisabled : null,
					]}>
					{file.name}
				</NativeText>
			</View>
			{state.disabled || state.readonly ? null : (
				<Button.Root
					iconOnly
					label={fileCopy.removeLabel({ file: file.name })}
					onPress={() => remove(file)}
					size="sm"
					testID={removeTestID}
					tier="ghost"
					tone="neutral">
					<Button.Icon svg={CloseIcon} />
				</Button.Root>
			)}
		</View>
	);
};

const List = ({
	testID,
	itemTestID,
	removeTestID,
}: StagedTestIDs): ReactNode => {
	const { files } = useFileInput();
	return files.length === 0 ? null : (
		<View style={styles.list} testID={testID}>
			{files.map((file, index) => (
				<Item
					file={file}
					key={file.uri}
					removeTestID={removeTestID?.(index)}
					testID={itemTestID?.(index)}
				/>
			))}
		</View>
	);
};

const AddTile = ({
	source = "images",
	testID,
}: TriggerProps): ReactNode => {
	const {
		accessibilityHint,
		accessibilityLabel,
		setControl,
		state,
	} = Field.useControl();
	const target = Field.useFocusTarget({ kind: "control" });
	const { pick } = useFileInput();
	const { theme } = useUnistyles();
	const locked = state.disabled || state.readonly;
	styles.useVariants(state);
	return (
		<Pressable
			accessibilityHint={accessibilityHint}
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			accessibilityState={{ disabled: locked }}
			accessible
			disabled={locked}
			onPress={() => {
				hapticTick();
				void pick(source);
			}}
			ref={node => {
				setControl(node);
				target(node);
			}}
			style={styles.addTile}
			testID={testID}>
			<Icon.Root
				color={
					locked
						? theme.color.disabled.fg
						: theme.color.text
				}
				size="lg"
				svg={AddIcon}
			/>
		</Pressable>
	);
};

type ThumbnailLoad = "loading" | "loaded" | "failed";

const Thumbnail = ({ file }: ThumbnailProps): ReactNode => {
	const { theme } = useUnistyles();
	const [load, setLoad] =
		useState<ThumbnailLoad>("loading");
	const phase = useBusyPhase({ busy: load === "loading" });
	const busy = phase !== "fresh";
	return (
		<View
			accessibilityLabel={file.name}
			accessibilityRole="image"
			accessibilityState={busy ? { busy } : undefined}
			accessible
			style={styles.thumbnail}>
			{load === "failed" ? (
				<Icon.Root
					color={theme.color.textMuted}
					size="lg"
					svg={BrokenImageIcon}
				/>
			) : (
				<Image
					onError={() => setLoad("failed")}
					onLoad={() => setLoad("loaded")}
					source={{ uri: file.uri }}
					style={styles.thumbnailImage}
				/>
			)}
			{busy && load !== "failed" ? (
				<View style={styles.thumbnailWait}>
					<Spinner.Indicator size="sm" />
				</View>
			) : null}
		</View>
	);
};

const Tile = ({
	file,
	testID,
	removeTestID,
}: ItemProps): ReactNode => {
	const { fileCopy, remove } = useFileInput();
	const { state } = Field.useControl();
	const { theme } = useUnistyles();
	return (
		<View style={styles.tile} testID={testID}>
			<Thumbnail file={file} />
			{state.disabled || state.readonly ? null : (
				<Pressable
					accessibilityLabel={fileCopy.removeLabel({
						file: file.name,
					})}
					accessibilityRole="button"
					hitSlop={theme.unit[6]}
					onPress={() => {
						hapticTick();
						remove(file);
					}}
					style={styles.tileRemove}
					testID={removeTestID}>
					<Icon.Root
						color={theme.color.neutral.bg}
						size="sm"
						svg={CloseIcon}
					/>
				</Pressable>
			)}
		</View>
	);
};

const Tiles = ({
	source = "images",
	testID,
	addTestID,
	itemTestID,
	removeTestID,
}: TilesProps): ReactNode => {
	const { files } = useFileInput();
	const { accessibility } = Field.useControl();
	return (
		<FieldControl {...accessibility}>
			<ScrollView
				contentContainerStyle={styles.tiles}
				horizontal
				showsHorizontalScrollIndicator={false}
				testID={testID}>
				<AddTile source={source} testID={addTestID} />
				{files.map((file, index) => (
					<Tile
						file={file}
						key={file.uri}
						removeTestID={removeTestID?.(index)}
						testID={itemTestID?.(index)}
					/>
				))}
			</ScrollView>
		</FieldControl>
	);
};

const Notice = ({ testID }: NoticeProps): ReactNode => {
	const { notice } = useFileInput();
	return notice === undefined ? null : (
		<ErrorText.Root testID={testID}>
			{notice}
		</ErrorText.Root>
	);
};

const styles = StyleSheet.create(theme => ({
	box: {
		...fieldGroup(theme),
		variants: { ...fieldGroupVariants(theme) },
		compoundVariants: [...fieldGroupCompounds(theme)],
	},
	trigger: {
		alignItems: "center",
		alignSelf: "stretch",
		flex: 1,
		flexDirection: "row",
	},
	triggerLabel: {
		...fieldControl(theme),
		variants: { ...fieldControlVariants(theme) },
	},
	tiles: {
		alignItems: "center",
		gap: theme.unit[4],
		paddingVertical: theme.unit[2],
	},
	addTile: {
		...controlEdge(theme).resting,
		alignItems: "center",
		justifyContent: "center",
		height: theme.unit[32],
		width: theme.unit[32],
		borderRadius: theme.radius.md,
		backgroundColor: theme.color.surfaceHighest,
		variants: { ...fieldGroupVariants(theme) },
		compoundVariants: [...fieldGroupCompounds(theme)],
	},
	tile: {
		height: theme.unit[32],
		width: theme.unit[32],
	},
	thumbnail: {
		alignItems: "center",
		justifyContent: "center",
		height: theme.unit[32],
		width: theme.unit[32],
		borderRadius: theme.radius.md,
		backgroundColor: theme.color.surfaceHighest,
		overflow: "hidden",
	},
	thumbnailImage: {
		height: theme.unit[32],
		width: theme.unit[32],
	},
	thumbnailWait: {
		alignItems: "center",
		justifyContent: "center",
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	tileRemove: {
		alignItems: "center",
		justifyContent: "center",
		position: "absolute",
		top: theme.unit[2],
		right: theme.unit[2],
		height: theme.unit[12],
		width: theme.unit[12],
		borderRadius: theme.radius.full,
		backgroundColor: theme.color.neutral.fg,
	},
	list: { gap: theme.unit[2] },
	item: {
		alignItems: "center",
		flexDirection: "row",
		gap: theme.unit[4],
		minHeight: theme.unit[22],
	},
	itemName: { flex: 1 },
	itemText: {
		...theme.font.body.medium,
		color: theme.color.text,
	},
	itemTextDisabled: { color: theme.color.disabled.fg },
}));

type FileInputNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Field.Label;
	Description: typeof Field.Description;
	Error: typeof Field.Error;
	Pending: typeof Field.Pending;
	Group: typeof Group;
	Trigger: typeof Trigger;
	List: typeof List;
	Item: typeof Item;
	Tiles: typeof Tiles;
	Tile: typeof Tile;
	Notice: typeof Notice;
}>;

/**
 * The parts of a file field: our frame, label, description and error around the
 * platform's own picker, with the staged files listed under it. `Root` holds the
 * files, so no part below it takes them again.
 *
 * @example
 *   <FileInput.Root
 *   	copy={fieldCopy}
 *   	fileCopy={fileCopy}
 *   	label={m.profile_photos()}
 *   	multiple
 *   	onValueChange={setPhotos}
 *   	value={photos}>
 *   	<FileInput.Label />
 *   	<FileInput.Group>
 *   		<FileInput.Trigger label={m.file_choose_image()} source="images" />
 *   		<FileInput.Pending />
 *   	</FileInput.Group>
 *   	<FileInput.List />
 *   	<FileInput.Notice />
 *   	<FileInput.Error />
 *   </FileInput.Root>
 */
export const FileInput: FileInputNamespace = {
	Root,
	Label: Field.Label,
	Description: Field.Description,
	Error: Field.Error,
	Pending: Field.Pending,
	Group,
	Trigger,
	List,
	Item,
	Tiles,
	Tile,
	Notice,
};
