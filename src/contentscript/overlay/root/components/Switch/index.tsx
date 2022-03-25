import React, { FC } from "react";
import { InputHTMLAttributes, DetailedHTMLProps } from "react";
import cn from "classnames";
import styles from "./Switch.module.scss";

export interface SwitchProps
	extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
	checked?: boolean;
}

export const Switch: FC<SwitchProps> = ({ checked = false, onChange, ...props }) => {
	return (
		<label className={cn(styles.wrapper)}>
			<input className={cn(styles.input)} type="checkbox" onChange={onChange} {...props} />
			<span
				className={cn(styles.inputCheckbox, {
					[styles.active]: checked,
				})}
			/>
		</label>
	);
};
