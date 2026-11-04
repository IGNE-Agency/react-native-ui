import { useEffect, useRef, useState } from "react";

/**
 * Escalating phases of a wait.
 * - `fresh`: not busy, or busy for less than `busyAfter`.
 * - `busy`: busy longer than `busyAfter`.
 * - `slow`: busy longer than `slowAfter`.
 * - `stuck`: busy longer than `stuckAfter`.
 */
export type BusyPhase = "fresh" | "busy" | "slow" | "stuck";

export type BusyPhaseOptions = Readonly<{
	/** Whether the work is in flight. */
	busy: boolean;
	/** Ms of `busy` before leaving `fresh`. */
	busyAfter?: number;
	/** Ms a phase past `fresh` holds once reached, even if the work finishes sooner. */
	busyMinDuration?: number;
	/** Ms of `busy` before reaching `slow`. */
	slowAfter?: number;
	/** Ms of `busy` before reaching `stuck`. */
	stuckAfter?: number;
}>;

/**
 * The late-announcement bargain: a wait shows nothing until it has lasted
 * `busyAfter`, then holds for at least `busyMinDuration` and escalates.
 *
 * @example
 *   const phase = useBusyPhase({ busy: query.isFetching });
 */
export const useBusyPhase = ({
	busy,
	busyAfter = 150,
	busyMinDuration = 200,
	slowAfter = 4000,
	stuckAfter = 8000,
}: BusyPhaseOptions): BusyPhase => {
	const [phase, setPhase] = useState<BusyPhase>("fresh");
	const shownAt = useRef<number | null>(null);

	useEffect(() => {
		if (busy) {
			const timers = [
				setTimeout(() => {
					shownAt.current = Date.now();
					setPhase("busy");
				}, busyAfter),
				setTimeout(() => setPhase("slow"), slowAfter),
				setTimeout(() => setPhase("stuck"), stuckAfter),
			];

			return () => {
				for (const timer of timers) {
					clearTimeout(timer);
				}
			};
		}

		const shown = shownAt.current;
		const settle = () => {
			shownAt.current = null;
			setPhase("fresh");
		};

		if (shown === null) {
			settle();
			return undefined;
		}

		const remaining =
			busyMinDuration - (Date.now() - shown);

		if (remaining <= 0) {
			settle();
			return undefined;
		}

		const settling = setTimeout(settle, remaining);

		return () => clearTimeout(settling);
	}, [
		busy,
		busyAfter,
		busyMinDuration,
		slowAfter,
		stuckAfter,
	]);

	return phase;
};
