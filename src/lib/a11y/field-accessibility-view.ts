import {
	requireNativeView,
	requireOptionalNativeModule,
} from "expo";
import type { ComponentType, ReactNode } from "react";

/** The field state the native view projects onto its control descendant. */
export type FieldAccessibilityViewProps = Readonly<{
	fieldLabel: string | undefined;
	fieldError: string | undefined;
	fieldInvalid: boolean;
	fieldRequired: boolean;
	fieldStateDescription: string | undefined;
	children: ReactNode;
}>;

const moduleName = "FieldAccessibility";

/**
 * The unstyled native ancestor a control's accessibility state travels on, or
 * `undefined` when the native side is absent from the running binary.
 *
 * @example
 *   FieldAccessibilityView === undefined ? children : <FieldAccessibilityView … />
 */
export const FieldAccessibilityView:
	| ComponentType<FieldAccessibilityViewProps>
	| undefined =
	requireOptionalNativeModule<object>(moduleName) === null
		? undefined
		: requireNativeView<FieldAccessibilityViewProps>(
				moduleName,
				"FieldAccessibilityView",
			);
