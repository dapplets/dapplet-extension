import React, { FC, DetailedHTMLProps, HTMLAttributes } from "react";
import cn from "classnames";
import styles from "./Card.module.scss";
import { CardImage } from "../CardImage";
import { Icon } from "../Icon";
import { Switch } from "../Switch";
import { SquaredButton } from "../SquaredButton";
import { CardTitle } from "../CardTitle";
import { CardInfo } from "../CardInfo";
import { ReactComponent as Installed } from "../../assets/icons/installed.svg";
import { ReactComponent as Update } from "../../assets/icons/update.svg";
import { ReactComponent as HomeIcon } from "../../assets/svg/home.svg";
import { ReactComponent as SettingsIcon } from "../../assets/svg/settings.svg";
import { ReactComponent as CloudsIcon } from "../../assets/svg/clouds.svg";
import { ReactComponent as SearchIcon } from "../../assets/svg/search.svg";
import { ReactComponent as DeleteIcon } from "../../assets/svg/delete.svg";
import { useToggle } from "../../hooks/useToggle";
import { Avatar } from "../Avatar";
import { IUser } from "../../models/user.model";
import { StorageRef } from "../../../../../background/registries/registry";

export interface CardProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	title: string;
	description: string;
	isFavourites: boolean;
	isActive: boolean
	users?: IUser[];
	author: string;
	website: string;
	image: StorageRef;
}

export const Card: FC<CardProps> = (props: CardProps) => {
	const [isShowDescription, onShowDescription] = useToggle(false);

	const {
		title,
		description,
		isFavourites = false,
		author,
		users,
		website,
		image,
		className,
		isActive,
		...anotherProps
	} = props;

	return (
		<div className={cn(styles.wrapperCard, className)} {...anotherProps}>
			<CardImage isFavourites={isFavourites} storageRef={image} />

			<div className={cn(styles.wrapperBlock)}>
				<div className={styles.header} onClick={onShowDescription}>
					<div className={cn(styles.blockTop)}>
						<CardTitle isShowDescription={isShowDescription} title={title} />

						<div className={cn(styles.blockIcons)}>
							<Icon size="small" icon={Installed} />
							<Icon size="small" icon={Update} />
						</div>

						<Switch checked={isActive} />
					</div>

					<div className={cn(styles.blockText)}>{description}</div>
				</div>

				{isShowDescription && (
					<div className={styles.description}>
						<div className={styles.descriptionTop}>
							{users && (
								<>
									<div className={styles.avatars}>
										<ul className={styles.avatarsList}>
											{users.slice(0, 3).map(({ _id, avatar }) => {
												return (
													<li className={styles.avatarsItem} key={_id}>
														<Avatar avatar={avatar} size="small" />
													</li>
												);
											})}
										</ul>
										<span className={styles.avatarsAnother}>+{users.length} more lists</span>
									</div>
								</>
							)}
							{users && <p className={styles.activeUsers}>{users.length} active users</p>}
						</div>
						<div className={styles.descriptionBottom}>
							{author && <CardInfo title="Author" value={author} />}
							{website && <CardInfo title="Website" value={website} appearance="link" />}
						</div>
					</div>
				)}

				<div className={cn(styles.blockBottom)}>
					<div className={cn(styles.firstButtons)}>
						<SquaredButton appearance="smail" icon={HomeIcon} className={styles.squareButton} />
						<SquaredButton appearance="smail" icon={SettingsIcon} className={styles.squareButton} />
						<SquaredButton appearance="smail" icon={SearchIcon} className={styles.squareButton} />
						<SquaredButton appearance="smail" icon={CloudsIcon} className={styles.squareButton} />

						{!isShowDescription && (
							<CardInfo title="Author" value={author} className={styles.cardInfo} />
						)}
					</div>

					<div className={cn(styles.lastButton)}>
						<SquaredButton appearance="smail" icon={DeleteIcon} />
					</div>
				</div>
			</div>
		</div>
	);
};
