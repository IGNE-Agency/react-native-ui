import type { ReactNode } from "react";

import { Wheel, type WheelProps } from "../wheel/wheel";

/** What a `WheelPicker` takes: a wheel's props and the texts past either end. */
export type WheelPickerProps = WheelProps &
	Readonly<{
		/** What shows past the first row when the drum is pulled beyond it. */
		before?: string;
		/** What shows past the last row when the drum is pulled beyond it. */
		after?: string;
		/** `testID` goes on the wheel's adjustable node and `${testID}-${item.key}` on each row. */
		testID?: string;
	}>;

/**
 * One value picked on a drum, assembled: the centre band and the rows, each
 * its label and annotations.
 *
 * @example
 *   <WheelPicker
 *   	items={items}
 *   	value={key}
 *   	onChange={setKey}
 *   	accessibilityLabel={m.start_time()}
 *   	incrementLabel={m.wheel_increment()}
 *   	decrementLabel={m.wheel_decrement()}
 *   />
 */
export const WheelPicker = ({
	before,
	after,
	testID,
	items,
	...wheel
}: WheelPickerProps): ReactNode => (
	<Wheel.Root
		{...wheel}
		items={
			testID === undefined
				? items
				: items.map(item => ({
						...item,
						testID: `${testID}-${item.key}`,
					}))
		}
		testID={testID}>
		<Wheel.Band />
		<Wheel.Drum after={after} before={before} />
	</Wheel.Root>
);
