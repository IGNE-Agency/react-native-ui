import type { ReactNode } from "react";

import type { RequirednessVariant } from "../forms/field-state";
import { FieldAccessibilityView } from "./field-accessibility-view";

/**
 * The field state a platform can express on an accessibility node but React
 * Native cannot: the error as its own channel rather than folded into a hint,
 * and requiredness as a flag rather than a suffix on the label.
 */
export type FieldAccessibility = Readonly<{
	label: string;
	description: string | undefined;
	requiredness: RequirednessVariant;
	error: string | undefined;
	invalid: boolean;
}>;

type FieldControlProps = FieldAccessibility &
	Readonly<{ children: ReactNode }>;

type FieldStateDescriptionProps = Readonly<{
	stateDescription: string;
	children: ReactNode;
}>;

/**
 * Whether the native channels are reachable. When they are not, a field folds
 * its error into the accessible name instead, so the floor never moves.
 */
export const isFieldAccessibilityAvailable: boolean =
	FieldAccessibilityView !== undefined;

/**
 * The ancestor that carries a field's accessibility state to its control's
 * node. It paints nothing and lays nothing out.
 *
 * @example
 *   <FieldControl {...accessibility}>
 *   	<TextInput.Group>…</TextInput.Group>
 *   </FieldControl>
 */
export const FieldControl = ({
	children,
	error,
	invalid,
	label,
	requiredness,
}: FieldControlProps): ReactNode =>
	FieldAccessibilityView === undefined ? (
		children
	) : (
		<FieldAccessibilityView
			fieldLabel={label}
			fieldError={error}
			fieldInvalid={invalid}
			fieldRequired={requiredness === "required"}
			fieldStateDescription={undefined}>
			{children}
		</FieldAccessibilityView>
	);

/**
 * The ancestor that names a control's value the way the platform names its
 * own, so a rating reads as stars rather than as a percentage.
 *
 * @example
 *   <FieldStateDescription stateDescription={m.rating_stars({ count })}>
 *   	<Rating.Slider />
 *   </FieldStateDescription>
 */
export const FieldStateDescription = ({
	children,
	stateDescription,
}: FieldStateDescriptionProps): ReactNode =>
	FieldAccessibilityView === undefined ? (
		children
	) : (
		<FieldAccessibilityView
			fieldLabel={undefined}
			fieldError={undefined}
			fieldInvalid={false}
			fieldRequired={false}
			fieldStateDescription={stateDescription}>
			{children}
		</FieldAccessibilityView>
	);
