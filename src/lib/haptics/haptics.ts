import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * The tick a form control gives back when a press changes its value. It is
 * fire-and-forget: a device without a haptic engine, an owner who turned system
 * feedback off, or a build without the native module gives nothing back.
 *
 * @example
 *   <Pressable onPress={() => { hapticTick(); select(value); }} />;
 */
export const hapticTick = (): void => {
	const tick =
		Platform.OS === "android"
			? Haptics.performAndroidHapticsAsync(
					Haptics.AndroidHaptics.Context_Click,
				)
			: Haptics.selectionAsync();
	void tick.catch(() => undefined);
};
