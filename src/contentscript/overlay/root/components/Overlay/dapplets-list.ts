import { IDapplet } from "../../models/dapplet.model";
import heart from "../../assets/images/heart.png";
import malevich from "../../assets/images/malevich.png";

export const TABS = [
	{ id: 0, name: "Tab 1", notification: true },
	{ id: 1, name: "Tab 2", notification: false },
	{ id: 2, name: "Tab 3", notification: false },
];

export const dapplets: IDapplet[] = [
	{
		_id: "0",
		image: heart,
		title: "Ethereum Contract Example",
		author: "0xC5Ee70E47Ef9f3bCDd6Be40160ad916DCef360Aa",
		description:
			"Feature adds tweets to Ethereum contract. Together we can give the economy and users new business models that are currently unattainable.",
		isFavourites: true,
		users: [
			{
				_id: "0",
				avatar:
					"https://rusinfo.info/wp-content/uploads/3/2/8/32874760a7fc72d2d9a627c9713366b8.jpg",
			},
			{ _id: "1", avatar: "https://uprostim.com/wp-content/uploads/2021/05/image032-6.jpg" },
			{
				_id: "2",
				avatar: "https://i.pinimg.com/originals/87/8f/ce/878fcef0c41b03f5f1605daad41d3a90.jpg",
			},
			{
				_id: "3",
				avatar:
					"https://rusinfo.info/wp-content/uploads/3/2/8/32874760a7fc72d2d9a627c9713366b8.jpg",
			},
		],
		website: "google.com",
	},
	{
		_id: "1",
		image: malevich,
		title: "Ethereum Contract Example",
		author: "0xC5Ee70E47Ef9f3bCDd6Be40160ad916DCef360Aa",
		description:
			"Feature adds tweets to Ethereum contract. Together we can give the economy and users new business models that are currently unattainable.",
		isFavourites: false,
		users: [
			{
				_id: "0",
				avatar:
					"https://rusinfo.info/wp-content/uploads/3/2/8/32874760a7fc72d2d9a627c9713366b8.jpg",
			},
			{ _id: "1", avatar: "https://uprostim.com/wp-content/uploads/2021/05/image032-6.jpg" },
			{
				_id: "2",
				avatar: "https://i.pinimg.com/originals/87/8f/ce/878fcef0c41b03f5f1605daad41d3a90.jpg",
			},
			{
				_id: "3",
				avatar:
					"https://rusinfo.info/wp-content/uploads/3/2/8/32874760a7fc72d2d9a627c9713366b8.jpg",
			},
		],
		website: "yandex.ru",
	},
	{
		_id: "2",
		image: heart,
		title: "Ethereum Contract Example",
		author: "0xC5Ee70E47Ef9f3bCDd6Be40160ad916DCef360Aa",
		description:
			"Feature adds tweets to Ethereum contract. Together we can give the economy and users new business models that are currently unattainable.",
		isFavourites: false,
		users: [
			{
				_id: "0",
				avatar:
					"https://rusinfo.info/wp-content/uploads/3/2/8/32874760a7fc72d2d9a627c9713366b8.jpg",
			},
			{ _id: "1", avatar: "https://uprostim.com/wp-content/uploads/2021/05/image032-6.jpg" },
			{
				_id: "2",
				avatar: "https://i.pinimg.com/originals/87/8f/ce/878fcef0c41b03f5f1605daad41d3a90.jpg",
			},
			{
				_id: "3",
				avatar:
					"https://rusinfo.info/wp-content/uploads/3/2/8/32874760a7fc72d2d9a627c9713366b8.jpg",
			},
		],
		website: "dapplets.org",
	},
];
