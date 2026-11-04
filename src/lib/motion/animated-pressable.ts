import type { ComponentProps } from "react";
import { Pressable } from "react-native";
import { createAnimatedComponent } from "react-native-reanimated";
// The library's index leaves this type out, and `createAnimatedComponent` is
// overloaded, so its return type cannot be named through `ReturnType`.
import type { AnimatedComponentType } from "react-native-reanimated/lib/typescript/createAnimatedComponent";

type AnimatedPressableComponent = AnimatedComponentType<
	Readonly<ComponentProps<typeof Pressable>>,
	typeof Pressable
>;

/**
 * `Pressable`, animatable. The animation library ships an animated view, text,
 * image and both lists, and no pressable, so a control that both presses and
 * eases has to make its own.
 *
 * @example
 *   <AnimatedPressable style={[styles.segment, fill]} />;
 */
export const AnimatedPressable: AnimatedPressableComponent =
	createAnimatedComponent(Pressable);
