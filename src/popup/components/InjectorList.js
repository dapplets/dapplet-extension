import React from "react";
import { withStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import Switch from "@material-ui/core/Switch";
import Typography from "@material-ui/core/Typography";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import store from "../store";
import Badge from "@material-ui/core/Badge";

const styles = theme => ({
  root: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  inline: {
    display: "inline"
  },
  injectorName: {
    marginInlineEnd: "8px",
    float: "left"
  },
  margin: {
    margin: theme.spacing.unit * 2
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

  async componentDidMount() {
    var backgroundFunctions = await initBGFunctions(chrome);
    const { getInjectorsByHostname } = backgroundFunctions;

    var injectors = await getInjectorsByHostname(store.currentHostname);

    this.setState({
      injectors: injectors,
      totalCount: injectors.length
    });
  }

  async handleSwitchChange(injector, value) {
    var backgroundFunctions = await initBGFunctions(chrome);
    const { setActiveInjector } = backgroundFunctions;

    await setActiveInjector(injector, store.currentHostname, value);

    this.setState(state => {
      const injectors = state.injectors.map(item => {
        if (item.id == injector.id) {
          item.isActive = value;
          return item;
        } else {
          return item;
        }
      });

      return {
        injectors
      };
    });
  }

  render() {
    const { injectors, totalCount } = this.state;
    const { classes } = this.props;

    return (
      <List
        subheader={
          <ListSubheader>Found {totalCount} injector(s).</ListSubheader>
        }
      >
        {injectors.map(injector => (
          <ListItem key={injector.id} divider>
            {injector.hasUpdate ? (
              <Badge badgeContent={"UPD"} color="secondary">
                <ListItemAvatar>
                  <Avatar
                    alt={injector.description}
                    src={injector.icons["128"]}
                  />
                </ListItemAvatar>
              </Badge>
            ) : (
              <ListItemAvatar>
                <Avatar
                  alt={injector.description}
                  src={injector.icons["128"]}
                />
              </ListItemAvatar>
            )}
            <ListItemText
              primary={
                <React.Fragment>
                  <div className={classes.injectorName}>{injector.name}</div>
                  <Typography
                    component="span"
                    className={classes.inline}
                    variant="caption"
                  >
                    {injector.version}
                  </Typography>
                </React.Fragment>
              }
              secondary={
                <React.Fragment>
                  {injector.description}
                  <br />
                  Author: {injector.author}
                </React.Fragment>
              }
            />
            <ListItemSecondaryAction>
              <Switch
                onChange={() =>
                  this.handleSwitchChange(injector, !injector.isActive)
                }
                checked={injector.isActive}
              />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    );
  }
}

export default withStyles(styles)(InjectorList);
