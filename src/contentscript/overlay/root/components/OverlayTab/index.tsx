import React, { DetailedHTMLProps, HTMLAttributes, ReactElement } from "react";
import styles from "./OverlayTab.module.scss";

//import { ReactComponent as Home } from "../../assets/svg/home-toolbar.svg";
//import { ReactComponent as Settings } from "../../assets/svg/setting-toolbar.svg";
//import { ReactComponent as Card } from "../../assets/svg/card.svg";
//import { ReactComponent as Notification } from "../../assets/svg/notification.svg";

//import { ReactComponent as Close } from "../../assets/svg/close.svg";

import cn from "classnames";
import { TSelectedSettings } from "../../App";

//const MENU = [
//	{ id: 0, icon: Home, title: "Home" },
//	{ id: 1, icon: Notification, title: "Notification" },
//	{ id: 2, icon: Card, title: "Card" },
//	{ id: 3, icon: Settings, title: "Settings" },
//];

export interface OverlayTabProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	activeTab?: boolean;
	nameSelectedSetting?: TSelectedSettings;
	image?: string;
	notification?: boolean;
	onNameSelectedSetting?: (selected: TSelectedSettings) => void;
	removeTab?: () => void;
	notificationSetting?: boolean;
}

export const OverlayTab = (props: OverlayTabProps): ReactElement => {
	const {
		activeTab,
		image,
		nameSelectedSetting,
		notification,
		notificationSetting,
		className,
		onNameSelectedSetting,
		onClick,
		removeTab,
		...anotherProps
	} = props;

	const handlerClick = (title: TSelectedSettings) => (): void => onNameSelectedSetting(title);

	return (
		<div className={cn(styles.tab, className)} {...anotherProps}>
			<div className={styles.top}>
				<span
					className={cn(styles.image, { [styles.cursor]: !activeTab })}
					style={{ backgroundImage: `url(${image})` }}
					onClick={onClick}
				/>
				{/*{!activeTab && <Close className={styles.close} onClick={removeTab} />}*/}
			</div>

			{activeTab && (
				<ul className={styles.list}>
					{/*{MENU.map(({ id, icon: Icon, title }) => {
						return (
							<li
								key={id}
								title={title}
								onClick={handlerClick(title as TSelectedSettings)}
								className={cn(styles.item, {
									[styles.notification]: notification,
									[styles.notificationSetting]: notificationSetting,
									[styles.selected]: nameSelectedSetting === title,
								})}
							>
								<Icon className={styles.icon} />
							</li>
						);
					})}*/}
				</ul>
			)}
		</div>
	);
};
