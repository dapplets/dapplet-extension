import { useState } from "react";

export const useSelected = <T>(initialValue: T): [isToggle: T, onSelected: (value: T) => void] => {
	const [selected, setSelected] = useState<T>(initialValue);

	const onSelected = (value: T): void => setSelected(value);

	return [selected, onSelected];
};
