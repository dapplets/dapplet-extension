import React, { DetailedHTMLProps, HTMLAttributes, ReactElement } from "react";
import styles from "./OverlayTab.module.scss";

import { ReactComponent as Close } from "../../assets/svg/close.svg";

import cn from "classnames";
import { IMenu } from "../../models/menu.model";

export interface OverlayTabProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	activeTab?: boolean;
	nameSelectedMenu?: string;
	image?: string;
	notification?: boolean;
	menu: IMenu[];
	notificationSetting?: boolean;
	isSystemDapplets?: boolean;
	onSelectedMenu: (selected: string) => void;
	removeTab?: () => void;
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
		isSystemDapplets,
		onSelectedMenu,
		onClick,
		removeTab,
		...anotherProps
	} = props;

	const handlerClick = (title: string) => (): void => nameSelectedMenu !== title && onSelectedMenu(title);

	const showRemoveTab = (!activeTab || (activeTab && isSystemDapplets)) && typeof removeTab !== "undefined";
	const showMenu = activeTab && !isSystemDapplets && (menu && menu.length > 0);

	return (
		<div className={cn(styles.tab, className)} {...anotherProps}>
			<div className={styles.top}>
				<span
					className={cn(styles.image, { [styles.cursor]: !activeTab })}
					style={{ backgroundImage: `url(${image})` }}
					onClick={onClick}
				/>
				{showRemoveTab && <Close className={styles.close} onClick={removeTab} />}
			</div>

			{showMenu && (
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