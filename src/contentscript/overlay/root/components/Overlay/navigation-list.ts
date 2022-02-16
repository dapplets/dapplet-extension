
//import { ReactComponent as Card } from "../../assets/svg/card.svg";
import { ReactComponent as Home } from "../../assets/svg/home-toolbar.svg";
import { ReactComponent as Settings } from "../../assets/svg/setting-toolbar.svg";
import { ReactComponent as Notification } from "../../assets/svg/notification.svg";
import { ReactComponent as Airplay } from "../../assets/svg/airplay.svg";
import { IMenu } from "../../models/menu.model";

export const NAVIGATION_LIST = [
	{ _id: "0", title: "Main" },
	{ _id: "1", title: "Advanced" },
	{ _id: "2", title: "Developer" },
];

export const MENU: IMenu[] = [
	{ _id: "0", icon: Home, title: "Dapplets" },
	{ _id: "1", icon: Notification, title: "Wallets" },
	{ _id: "2", icon: Settings, title: "Settings" },
	{ _id: "3", icon: Airplay, title: "Developer" },
]
