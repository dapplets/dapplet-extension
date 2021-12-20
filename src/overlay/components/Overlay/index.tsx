import React, { FC, ReactElement } from 'react';
import { Close } from '../Close';
import styles from './Overlay.module.scss';
import ArrowLeft from '../../assests/arrow-left.svg';
import ArrowRight from '../../assests/arrow-right.svg';

interface Props {
	children?: ReactElement[];
	step?: [number, number];
	onCloseClick?: () => void;
	title?: string;
	subtitle?: string;
}

interface State {
	currentTabIndex: number;
}

export class Overlay extends React.Component<Props, State> {

	constructor(props: Props) {
		super(props);
		this.state = {
			currentTabIndex: 0
		};
	}

	componentDidUpdate(): void {
		const currentIndex = this.state.currentTabIndex;
		const lastIndex = this.props.children.length - 1;
		
		if (currentIndex > lastIndex) {
			this.setState({
				currentTabIndex: lastIndex
			});
		}
	}

	backButtonClickHandler() {
		const i = this.state.currentTabIndex;
		const lastIndex = this.props.children.length - 1;
		this.setState({ currentTabIndex: (i === 0) ? lastIndex : (i - 1) });
	}

	nextButtonClickHandler() {
		const i = this.state.currentTabIndex;
		const lastIndex = this.props.children.length - 1;
		this.setState({ currentTabIndex: (i === lastIndex) ? 0 : i + 1 });
	}

	render() {
		const p = this.props;
		const s = this.state;

		return (
			<div className={styles.wrapper}>
				<header className={styles.header}>
					<div className={styles.step}>
						<img src={ArrowLeft} onClick={this.backButtonClickHandler.bind(this)}/>
						<span>{s.currentTabIndex + 1} of {p.children.length}</span>
						<img src={ArrowRight} onClick={this.nextButtonClickHandler.bind(this)}/>
					</div>
					<h2 className={styles.title}>
						{p.title}<br/>{p.subtitle}
					</h2>
					{(p.onCloseClick) ? <Close onClick={p.onCloseClick} /> : <div style={{ width: '20px' }}></div>}
				</header>

				<div className={styles.body}>
					{p.children.map((x, i) => <div style={(i === s.currentTabIndex) ? undefined : { display: 'none' }} key={i}>{x}</div>)}
				</div>
			</div>
		);
	}
}