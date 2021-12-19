import React, { FC, ReactElement } from 'react';
import styles from './Loading.module.scss';
import base from '../Base.module.scss';
import cn from 'classnames';
import { Button } from '../Button';

interface LoadingProps {
	title: string;
	subtitle: string;
	content?: ReactElement;
	onBackButtonClick: () => void;
}

export const Loading: FC<LoadingProps> = ({ title, subtitle, content, onBackButtonClick }: LoadingProps) => {
	return (
		<div className={styles.wrapper}>
			<h2 className={base.title}>{title}</h2>
			<p className={cn(base.subtitle, styles.subtitle)}>{subtitle}</p>

			{content ?? <div className={styles.loading} />}
			
			<Button basic onClick={onBackButtonClick}>Back</Button>
		</div>
	);
};