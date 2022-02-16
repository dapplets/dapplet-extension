import React, { DetailedHTMLProps, HTMLAttributes, ReactElement } from "react";
import styles from "./OverlayToolbar.module.scss";
import { OverlayTab } from "../OverlayTab";
import cn from "classnames";
import { ReactComponent as Coolicon } from "../../assets/svg/coolicon.svg";
import { ITab } from "../../types/tab";
import { IMenu } from "../../models/menu.model";

// TODO: change element hiding from Margin to transform
export interface OverlayToolbarProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	tabs: ITab[];
	menu: IMenu[];
	nameSelectedMenu?: string;
	idActiveTab: string;
	isDevMode: boolean;
	toggle: () => void;
	onSelectedMenu: (selected: string) => void;
	onRemoveTab: (id: string) => void;
	onSelectedTab: (id: string) => void;
}

const ToggleOverlay = ({ toggle }: Pick<OverlayToolbarProps, "toggle">): ReactElement => {
	return (
		<button className={styles.toggleOverlay} onClick={toggle}>
			<Coolicon />
		</button>
	);
};

export const OverlayToolbar = (props: OverlayToolbarProps): ReactElement => {
	const {
		tabs,
		nameSelectedMenu,
		idActiveTab,
		className,
		isDevMode,
		menu,
		toggle,
		onSelectedMenu,
		onSelectedTab,
		onRemoveTab,
		...anotherProps
	} = props;

	const handlerSelectedTab = (id: string) => (): void => onSelectedTab(id);
	const handlerRemoveTab = (id: string) => (): void => onRemoveTab(id);

	const nonSystemTabs = tabs.filter(x => !x.uri.includes("/popup.html#"));
	const systemTabs = tabs.filter(x => x.uri.includes("/popup.html#"));
	const tab = tabs.filter(x => x.uri.includes("/popup.html#/dapplets"))[0];
	const isSystemTabActive = systemTabs.findIndex(x => x.id === idActiveTab) !== -1;

	return (
		<div className={cn(styles.toolbar, className)} {...anotherProps}>
			<div className={styles.inner}>
				<ToggleOverlay toggle={toggle} />

				<div className={styles.tabs}>
					<OverlayTab
						id={'system'}
						menu={menu}
						nameSelectedMenu={nameSelectedMenu}
						activeTab={isSystemTabActive}
						onSelectedMenu={onSelectedMenu}
						onClick={handlerSelectedTab(tab?.id)}
						className={cn({ [styles.active]: isSystemTabActive })}
						notification={false}
						title={'System'}
					/>

					<>
						{nonSystemTabs.length > 0 &&
							nonSystemTabs.map(({ id, title }) => {
								const active = id === idActiveTab;

								return (
									<OverlayTab
										id={id}
										menu={[]}
										key={id}
										nameSelectedMenu={nameSelectedMenu}
										activeTab={active}
										onSelectedMenu={onSelectedMenu}
										removeTab={handlerRemoveTab(id)}
										onClick={handlerSelectedTab(id)}
										className={cn({ [styles.active]: active })}
										notification={false}
										title={title}
									/>
								);
							})}
					</>
				</div>
			</div>
		</div>
	);
};
