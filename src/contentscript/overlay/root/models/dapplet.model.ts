import { IUser } from "./user.model";

export interface IDapplet {
	_id: string;
	image: string;
	title: string;
	description: string;
	isFavourites: boolean;
	users: IUser[];
	author: string;
	website: string;
}
