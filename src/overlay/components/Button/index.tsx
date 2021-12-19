import React, { FC } from 'react';
import { ButtonProps } from './Button.props';
import styles from './Button.module.scss';
import cn from 'classnames';

export const Button: FC<ButtonProps> = ({ className, children, basic, ...props }: ButtonProps) => {
	return (
		<button
			className={(basic === true) ? cn(styles.basic, className) :  cn(styles.button, className)}
			{...props}
		>
			{children}
		</button>
	);
};
