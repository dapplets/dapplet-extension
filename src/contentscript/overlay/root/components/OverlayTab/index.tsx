import React, { DetailedHTMLProps, HTMLAttributes, ReactElement } from "react";
import styles from "./OverlayTab.module.scss";

import { ReactComponent as Close } from "../../assets/svg/close.svg";

import cn from "classnames";
import { IMenu } from "../../models/menu.model";
import { IOverlay } from "../../../interfaces";

export interface OverlayTabProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	activeTab?: boolean;
	nameSelectedMenu?: string;
	image?: string;
	notification?: boolean;
	menu: IMenu[];
	onSelectedMenu: (selected: string) => void;
	removeTab?: () => void;
	notificationSetting?: boolean;
}

export const OverlayTab = (props: OverlayTabProps): ReactElement => {
	const {
		activeTab,
		image,
		id,
		nameSelectedMenu,
		notification,
		notificationSetting,
		className,
		menu,
		onSelectedMenu,
		onClick,
		removeTab,
		...anotherProps
	} = props;

	const handlerClick = (title: string) => (): void => nameSelectedMenu !== title && onSelectedMenu(title);

	console.log(removeTab);


	return (
		<div className={cn(styles.tab, className)} {...anotherProps}>
			<div className={styles.top}>
				<span
					className={cn(styles.image, { [styles.cursor]: !activeTab })}
					style={{ backgroundImage: `url(${image})` }}
					onClick={onClick}
				/>
				{!activeTab && typeof removeTab !== "undefined" && <Close className={styles.close} onClick={removeTab} />}
			</div>

			{activeTab && (
				<ul className={styles.list}>
					{menu && menu.map(({ _id, icon: Icon, title }) => {
						return (
							<li
								key={_id}
								title={title}
								onClick={handlerClick(title)}
								className={cn(styles.item, {
									[styles.notification]: notification,
									[styles.notificationSetting]: notificationSetting,
									[styles.selected]: nameSelectedMenu === title,
								})}
							>
								<Icon className={styles.icon} />
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
};
