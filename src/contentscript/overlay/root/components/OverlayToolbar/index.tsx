import React, { DetailedHTMLProps, HTMLAttributes, ReactElement } from "react";
import styles from "./OverlayToolbar.module.scss";
//import { ReactComponent as Coolicon } from "../../assets/svg/coolicon.svg";
import { OverlayTab } from "../OverlayTab";
import cn from "classnames";
import { ITab, TSelectedSettings } from "../../App";

export interface OverlayToolbarProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	tabs: ITab[];
	nameSelectedSetting?: TSelectedSettings;
	idSelectedTab: number;
	toggle: () => void;
	//onNameSelectedSetting: (selected: TSelectedSettings) => void;
	//onIdSelectedChange: (id: number) => void;
	//onRemoveTag: (id: number) => void;
}

const ToggleOverlay = ({ toggle }: Pick<OverlayToolbarProps, "toggle">): ReactElement => {
	return (
		<button className={styles.toggleOverlay} onClick={toggle}>
			{/*<Coolicon />*/}
			⇄
		</button>
	);
};

export const OverlayToolbar = (props: OverlayToolbarProps): ReactElement => {
	const {
		tabs,
		nameSelectedSetting,
		idSelectedTab,
		className,
		toggle,
		//onRemoveTag,
		//onNameSelectedSetting,
		//onIdSelectedChange,
		...anotherProps
	} = props;

	//const handlerTab = (id: number) => (): void => onIdSelectedChange(id);
	//const handlerRemoveTab = (id: number) => (): void => onRemoveTag(id);

	return (
		<div className={cn(styles.toolbar, className)} {...anotherProps}>
			<div className={styles.inner}>
				<ToggleOverlay toggle={toggle} />

				<div className={styles.tabs}>
					{tabs &&
						tabs.map(({ id, notification, name }) => {
							const active = id === idSelectedTab;

							return (
								<OverlayTab
									key={id}
									nameSelectedSetting={nameSelectedSetting}
									//onNameSelectedSetting={onNameSelectedSetting}
									activeTab={active}
									//removeTab={handlerRemoveTab(id)}
									//onClick={handlerTab(id)}
									className={cn({ [styles.active]: active })}
									notification={notification}
									title={name}
								/>
							);
						})}
				</div>
			</div>
		</div>
	);
};
