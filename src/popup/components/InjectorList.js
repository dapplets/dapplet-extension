import React from 'react';
import { makeStyles } from '@material-ui/styles';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  inline: {
    display: 'inline',
  },
  injectorName: {
    marginInlineEnd: '8px',
    float: 'left'
  }
});

class InjectorList extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      injectors: [],
      totalCount: 0
    };
  }

  componentDidMount() {
    // TODO replace static json to api
    fetch('/resources/twitter.com.json')
      .then(response => response.json())
      .then(data => this.setState({ injectors: data.data, totalCount: data.total }));
  }

  render() {
    const { injectors, totalCount } = this.state;
    const { classes } = this.props;

    return (
      <List subheader={<ListSubheader>Found {totalCount} injector(s).</ListSubheader>} >
        {injectors.map(injector =>
          <ListItem key={injector.id} divider>
            <ListItemAvatar>
              <Avatar alt={injector.description} src={injector.icons['128']} />
            </ListItemAvatar>
            <ListItemText 
              primary={
                <React.Fragment>
                  <div className={classes.injectorName}>{injector.name}</div>
                  <Typography component="span" className={classes.inline} variant="caption">
                    {injector.version}
                  </Typography>
                </React.Fragment>
              }
              secondary={
                <React.Fragment>
                  {injector.description}<br/>
                  Author: {injector.author}
                </React.Fragment>
              }
            />
            <ListItemSecondaryAction>
              <Switch />
            </ListItemSecondaryAction>
          </ListItem>
        )}
      </List>
    );
  }
}

export default withStyles(styles)(InjectorList);