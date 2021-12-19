import React, { FC, ReactElement } from 'react';
import { Close } from '../Close';
import styles from './Overlay.module.scss';
import ArrowLeft from '../../assests/arrow-left.svg';
import ArrowRight from '../../assests/arrow-right.svg';

interface OverlayProps {
	children?: ReactElement;
	step?: [number, number];
	onCloseClick?: () => void;
	title?: string;
	subtitle?: string;
}

export const Overlay: FC<OverlayProps> = ({ children, step, onCloseClick, title, subtitle }: OverlayProps) => {
	return (
		<div className={styles.wrapper}>
			<header className={styles.header}>
				<div className={styles.step}>
					{/* <img src={ArrowLeft} />
					<span>1 of 2</span>
					<img src={ArrowRight} /> */}
				</div>
				<h2 className={styles.title}>
					{title}<br/>{subtitle}
				</h2>
				{(onCloseClick) ? <Close onClick={onCloseClick} /> : <div style={{ width: '20px' }}></div>}
			</header>

			<div className={styles.body}>
				{children}
			</div>
		</div>
	);
};