import React from "react"
import { Dropdown } from "../../components/Dropdown"
import { DROPDOWN_LIST } from "../../components/Dropdown/dropdown-list"
import { DappletsProps } from "./Dapplets.props"
import styles from './Dapplets.module.scss';
import { Card } from "../../components/Card";
import { useSelected } from "../../hooks/useSelected";
import { IDropdown } from "../../models/dropdown.model";

export const Dapplets = ({ dapplets }: DappletsProps) => {
	const [sorting, setSorting] = useSelected<IDropdown | null>(null);
	const [worklist, setWorklist] = useSelected<IDropdown | null>(null);

	const onChangeSorting = (value: IDropdown) => setSorting(value);
	const onChangeWorklist = (value: IDropdown) => setWorklist(value);

	return (
		<>
			<div className={styles.wrapper}>
				<Dropdown
					list={DROPDOWN_LIST}
					title="Sort by:"
					style={{ marginRight: 10 }}
					value={sorting}
					handlerChangeValue={onChangeSorting}
				/>
				<Dropdown
					list={DROPDOWN_LIST}
					title="Worklist:"
					value={worklist}
					handlerChangeValue={onChangeWorklist}
				/>
			</div>
			{dapplets && dapplets.map((dapplet) => {
				const {
					title,
					description,
					author,
					isActive,
					name,
					icon
				} = dapplet;

				return (
					<Card
						key={name}
						title={title}
						author={author}
						description={description}
						isFavourites={false}
						isActive={isActive}
						website={""}
						image={icon}
					/>
				)
			})}
		</>
	)
}