import React, { FC } from "react";
import cn from "classnames";
import styles from "./CardTitle.module.scss";
import { ReactComponent as Up } from "../../assets/icons/up-mini.svg";

export interface TitleCardProps {
	title: string;
	isShowDescription: boolean;
}
export const CardTitle: FC<TitleCardProps> = (props: TitleCardProps) => {
	const { title, isShowDescription = false } = props;

	return (
		<div className={cn(styles.BlockTitleCard)}>
			<h2 className={cn(styles.titleCard)}>{title}</h2>
			<span
				className={cn(styles.iconCard, {
					[styles.isShowDescription]: isShowDescription,
				})}
			>
				<Up />
			</span>
		</div>
	);
};
