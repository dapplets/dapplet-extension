import { useState } from "react";

export const useToggle = (initialValue = false): [isToggle: boolean, toggle: () => void] => {
	const [isToggle, setToggle] = useState<boolean>(initialValue);

	const toggle = (): void => setToggle(!isToggle);

	return [isToggle, toggle];
};
