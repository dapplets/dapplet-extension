import React, { FC } from 'react';
import styles from './Session.module.scss';
import { SessionProps } from './Session.props';
import ReactTimeAgo from 'react-time-ago';

export const Session: FC<SessionProps> = (p: SessionProps) => {
	return (
		<div className={styles.session}>
			<div className={styles.wrapper}>
				<img className={styles.iconLogin} src={p.accountIcon} />

				<div className={styles.inner}>
					<h3 className={styles.hash}>{p.account}</h3>

					<div className={styles.info}>
						<ul className={styles.icons}>
							<img src={p.providerIcon} className={styles.icon} />
							<img src={p.walletIcon} className={styles.icon} />
						</ul>
						<span className={styles.time}>
							<ReactTimeAgo date={new Date(p.lastUsage)} locale="en-US" />
						</span>
					</div>
				</div>
			</div>

			<div className={styles.buttons}>
				{
					Array.isArray(p.buttons)
						? p.buttons.map((item, index) => <div key={index}>{item}</div>)
						: p.buttons
				}
			</div>
		</div>
	);
};
