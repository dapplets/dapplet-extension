import React, { FC } from 'react';
import styles from './Close.module.scss';
import Icon from '../../assests/close.svg';
import { CloseProps } from './Close.props';
import cn from 'classnames';

export const Close: FC<CloseProps> = ({ className, ...props }: CloseProps) => {
	return (
		<button
			className={cn(styles.close, className)}
			{...props}
		>
			{/* <img src={Icon} /> */}
		</button>
	);
};