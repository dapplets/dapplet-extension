import React, { FC } from "react";
import cn from "classnames";
import styles from "./Avatar.module.scss";

export interface AvatarProps {
	avatar: string;
	size: "small" | "big";
	className?: string;
}

export const Avatar: FC<AvatarProps> = (props: AvatarProps) => {
	const { avatar, size, className = "" } = props;
	return (
		<div
			className={cn(
				styles.usersAvatars,
				{
					[styles.small]: size === "small",
					[styles.big]: size === "big",
				},
				className,
			)}
		>
			<img src={avatar} alt="avatar" />
		</div>
	);
};
