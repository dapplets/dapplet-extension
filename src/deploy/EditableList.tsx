import React from 'react';
import { Icon, Input, InputOnChangeData, List } from 'semantic-ui-react';

interface Props {
    items: string[];
    onChange: (newItems: string[]) => void;
    style: any;
}

interface State {
    inputValue: string;
}

export class EditableList extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            inputValue: ''
        }
    }

    addButtonClickHandler = () => {
        const newItem = this.state.inputValue;
        const clonedItems = [...this.props.items];
        clonedItems.push(newItem);
        this.props.onChange(clonedItems);
        this.setState({ inputValue: '' });
    }

    removeButtonClickHandler = (_: string, i: number) => {
        const clonedItems = [...this.props.items];
        clonedItems.splice(i, 1);
        this.props.onChange(clonedItems);
    }

    inputChangeHandler = (_: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
        this.setState({ inputValue: data.value });
    }

    render() {
        const p = this.props;
        const s = this.state;

        return <div style={p.style}>
            <Input
                // size='mini'
                // icon='sitemap'
                // iconPosition='left'
                action={{
                    content: 'Add',
                    // size: 'mini',
                    onClick: this.addButtonClickHandler,
                    // disabled: !(isValidUrl(trustedUserInput) && !registries.find(r => r.url === trustedUserInput)),
                    // color: 'blue'
                }}
                fluid
                placeholder='Context ID (ex: example.com)'
                value={s.inputValue}
                onChange={this.inputChangeHandler}
            />

            <List divided relaxed size='small'>
                {p.items.map((item, i) => (
                    <List.Item key={i}>
                        <List.Content floated='right'>
                            <Icon link color='red' name='close' onClick={() => this.removeButtonClickHandler(item, i)} />
                        </List.Content>
                        <List.Content><a style={{ color: '#000', lineHeight: '1.4em' }}>{item}</a></List.Content>
                    </List.Item>
                ))}
            </List>
        </div>
    }
}