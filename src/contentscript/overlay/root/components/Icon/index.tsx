import React, { FC, FunctionComponent } from "react";
import cn from "classnames";
import styles from "./Icon.module.scss";

export interface IconsTitleProps {
	icon: FunctionComponent;
	size: "small" | "big";
}
export const Icon: FC<IconsTitleProps> = (props: IconsTitleProps) => {
	const { icon: Icon, size, ...anotherProps } = props;
	return (
		// <Img {...anotherProps} />
		<div
			className={cn(styles.iconsTitle, {
				[styles.smail]: size === "small",
				[styles.big]: size === "big",
			})}
			{...anotherProps}
		>
			<Icon />
		</div>
	);
};
