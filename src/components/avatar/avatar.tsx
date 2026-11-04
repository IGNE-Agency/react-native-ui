import PersonIcon from "@material-design-icons/svg/outlined/person.svg";
import type { ReactNode } from "react";
import { Text as NativeText, View } from "react-native";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { Icon } from "../icon/icon";

type RootProps = Readonly<{
	name?: string;
	testID?: string;
}>;

const LETTERS = 2;

type Tone = "brand" | 1 | 2 | 3 | 4;

const TONES: readonly Tone[] = ["brand", 1, 2, 3, 4];

const toneOf = (name: string): Tone => {
	let hash = 0;
	for (const character of name) {
		hash =
			(hash + (character.codePointAt(0) ?? 0)) %
			TONES.length;
	}
	return TONES[hash] ?? "brand";
};

const initialsOf = (name: string): string =>
	name
		.split(/\s+/u)
		.filter(part => part !== "")
		.slice(0, LETTERS)
		.map(part => (Array.from(part)[0] ?? "").toUpperCase())
		.join("");

const Root = ({ name, testID }: RootProps): ReactNode => {
	const { theme } = useUnistyles();
	const initials =
		name === undefined ? "" : initialsOf(name);
	styles.useVariants({
		tone: name === undefined ? "brand" : toneOf(name),
	});

	return (
		<View style={styles.frame} testID={testID}>
			{initials === "" ? (
				<Icon.Root
					color={theme.color.onPrimaryContainer}
					size="md"
					svg={PersonIcon}
				/>
			) : (
				<NativeText style={styles.initials}>
					{initials}
				</NativeText>
			)}
		</View>
	);
};

const styles = StyleSheet.create(theme => ({
	frame: {
		alignItems: "center",
		backgroundColor: theme.color.primaryContainer,
		borderRadius: theme.radius.circle,
		height: theme.unit[28],
		justifyContent: "center",
		width: theme.unit[28],
		variants: {
			tone: {
				brand: {},
				1: { backgroundColor: theme.color.identity[1].bg },
				2: { backgroundColor: theme.color.identity[2].bg },
				3: { backgroundColor: theme.color.identity[3].bg },
				4: { backgroundColor: theme.color.identity[4].bg },
			},
		},
	},
	initials: {
		...theme.font.label.smallStrong,
		color: theme.color.onPrimaryContainer,
		variants: {
			tone: {
				brand: {},
				1: { color: theme.color.identity[1].fg },
				2: { color: theme.color.identity[2].fg },
				3: { color: theme.color.identity[3].fg },
				4: { color: theme.color.identity[4].fg },
			},
		},
	},
}));

type AvatarNamespace = Readonly<{
	Root: typeof Root;
}>;

/**
 * The person a row is about, as the initials of their name on a disc in the
 * tone their name hashes to, the brand tint or one of the identity tones, falling
 * back to a figure on the brand tint where there is no name.
 *
 * @example
 *   <Avatar.Root name={user.name} />
 */
export const Avatar: AvatarNamespace = { Root };
