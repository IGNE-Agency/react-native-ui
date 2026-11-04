import type { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

import StorybookUIRoot from "../.rnstorybook";

/**
 * The example app is the Storybook UI. Gesture Handler 3's `GestureDetector`
 * throws outside a `GestureHandlerRootView`, and the kit's pages read the safe
 * area and the keyboard, so those three providers wrap it.
 */
export const App = (): ReactNode => (
	<GestureHandlerRootView style={styles.root}>
		<SafeAreaProvider>
			<KeyboardProvider>
				<StorybookUIRoot />
			</KeyboardProvider>
		</SafeAreaProvider>
	</GestureHandlerRootView>
);

const styles = StyleSheet.create({ root: { flex: 1 } });
