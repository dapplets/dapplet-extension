import React from "react";
import { Button, Dropdown, Icon, Input } from "semantic-ui-react";
import { Label, Menu, Modal } from "semantic-ui-react";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { typeOfUri, UriTypes } from "../../common/helpers";

interface Props {
  profiles: { id: string; text: string }[];
  currentProfileId: string;
  onRefresh: Function;
}

interface State {
  currentMode: CurrentMode;
  isImportLoading: boolean;
  importError: string;
  isExportUploading: boolean;
  isExportCopied: boolean;
  exportError: string;
  isShareUploading: boolean;
  isShareCopied: boolean;
  shareError: string;
  deletingProfileId: string;
  renamingValue: string;
  importInputValue: string;
}

enum CurrentMode {
  DEFAULT,
  RENAMING,
  IMPORTING,
  DELETING,
}

export class ProfileDropdown extends React.Component<Props, State> {
  constructor(p: Props) {
    super(p);
    this.state = {
      currentMode: CurrentMode.DEFAULT,
      isImportLoading: false,
      importError: null,
      isExportUploading: false,
      isExportCopied: false,
      exportError: null,
      isShareUploading: false,
      isShareCopied: false,
      shareError: null,
      deletingProfileId: null,
      renamingValue: "",
      importInputValue: "",
    };
  }

  getCurrentProfile() {
    const p = this.props;
    return p.profiles.find((x) => x.id === p.currentProfileId);
  }

  cloneHandler = async () => {
    const { copyProfile } = await initBGFunctions(browser);
    const sourceProfileName = this.props.currentProfileId;
    await copyProfile(sourceProfileName, true);
    this.props.onRefresh();
  };

  renameModeHandler = () => {
    const p = this.props;
    this.setState({
      currentMode:
        this.state.currentMode !== CurrentMode.RENAMING
          ? CurrentMode.RENAMING
          : CurrentMode.DEFAULT,
      renamingValue: this.getCurrentProfile()?.text ?? "",
    });
  };

  renameChangeHandler = (e) => {
    this.setState({ renamingValue: e.target.value });
  };

  deleteHandler = (e, { id }) => {
    e.stopPropagation();
    e.preventDefault();

    this.setState({
      currentMode:
        this.state.currentMode !== CurrentMode.DELETING
          ? CurrentMode.DELETING
          : CurrentMode.DEFAULT,
      deletingProfileId: id,
    });
  };

  importModeHandler = () => {
    this.setState({
      currentMode:
        this.state.currentMode !== CurrentMode.IMPORTING
          ? CurrentMode.IMPORTING
          : CurrentMode.DEFAULT,
    });
  };

  exportHandler = async (e) => {
    this.setState({ isExportUploading: true });

    try {
      const { exportProfile } = await initBGFunctions(browser);
      const url = await exportProfile(this.props.currentProfileId);
      await navigator.clipboard.writeText(url);
      this.setState({ isExportUploading: false, isExportCopied: true });
      await new Promise((r) => setTimeout(r, 3000));
      this.setState({ isExportCopied: false });
    } catch (err) {
      this.setState({
        isExportUploading: false,
        exportError: err instanceof Error ? err.message : err,
      });
      await new Promise((r) => setTimeout(r, 3000));
      this.setState({ exportError: null });
    }
  };

  resetExportHandler = async () => {
    this.setState({
      exportError: null,
      isExportCopied: false,
      isExportUploading: false,
    });
  };

  resetShareHandler = async () => {
    this.setState({
      shareError: null,
      isShareCopied: false,
      isShareUploading: false,
    });
  };

  shareHandler = async (e) => {
    this.setState({ isShareUploading: true });

    try {
      const { createShareLink } = await initBGFunctions(browser);
      const url = await createShareLink(this.props.currentProfileId);
      await navigator.clipboard.writeText(url);
      this.setState({ isShareUploading: false, isShareCopied: true });
      await new Promise((r) => setTimeout(r, 3000));
      this.setState({ isShareCopied: false });
    } catch (err) {
      this.setState({
        isShareUploading: false,
        shareError: err instanceof Error ? err.message : err,
      });
      await new Promise((r) => setTimeout(r, 3000));
      this.setState({ shareError: null });
    }
  };

  saveRenameHandler = async () => {
    const newName = this.state.renamingValue;
    const { renameProfile } = await initBGFunctions(browser);
    await renameProfile(this.props.currentProfileId, newName);
    this.setState({ currentMode: CurrentMode.DEFAULT });
    this.props.onRefresh();
  };

  cancelRenameHandler = () => {
    this.setState({ currentMode: CurrentMode.DEFAULT, renamingValue: "" });
  };

  confirmDeletionHandler = async () => {
    const { deleteProfile } = await initBGFunctions(browser);
    await deleteProfile(this.state.deletingProfileId);
    this.setState({
      currentMode: CurrentMode.DEFAULT,
      deletingProfileId: null,
    });
    this.props.onRefresh();
  };

  cancelDeletionHandler = () => {
    this.setState({
      currentMode: CurrentMode.DEFAULT,
      deletingProfileId: null,
    });
  };

  importChangeHandler = (e) => {
    this.setState({ importError: null, importInputValue: e.target.value });
  };

  loadImportHandler = async () => {
    this.setState({ isImportLoading: true });

    try {
      const { importProfile } = await initBGFunctions(browser);
      await importProfile(this.state.importInputValue, true);
      this.setState({
        currentMode: CurrentMode.DEFAULT,
        isImportLoading: false,
        importInputValue: "",
      });
      this.props.onRefresh();
    } catch (err) {
      this.setState({
        isImportLoading: false,
        importError: err instanceof Error ? err.message : err,
        importInputValue: "",
      });
    }
  };

  cancelImportHandler = () => {
    this.setState({ currentMode: CurrentMode.DEFAULT, importInputValue: "" });
  };

  dropdownCloseHandler = () => {
    this.setState({ exportError: null });
  };

  selectProfileHandler = async (_, { id }) => {
    const { setActiveProfile } = await initBGFunctions(browser);
    await setActiveProfile(id);
    this.props.onRefresh();
  };

  render() {
    const p = this.props;
    const s = this.state;

    const modal =
      s.currentMode === CurrentMode.DELETING ? (
        <Modal open={true} size="mini" dimmer="inverted">
          <Modal.Header>Delete Profile?</Modal.Header>
          <Modal.Content>
            Deleting the <b>{s.deletingProfileId}</b> profile permanently remove
            it from extension.
          </Modal.Content>
          <Modal.Actions>
            <Button basic onClick={this.cancelDeletionHandler}>
              No, Keep Profile
            </Button>
            <Button color="red" onClick={this.confirmDeletionHandler}>
              Yes, Delete Profile
            </Button>
          </Modal.Actions>
        </Modal>
      ) : null;

    const panel = (
      <div>
        <Button
          size="mini"
          basic
          onClick={this.cloneHandler}
          icon="clone"
          content="Clone"
          title="Сreate a new profile based on the current one"
        />
        <Button
          size="mini"
          basic
          onClick={this.renameModeHandler}
          icon="text cursor"
          content="Rename"
          primary={s.currentMode === CurrentMode.RENAMING}
          title="Rename the current profile"
        />
        <Button
          size="mini"
          basic
          onClick={this.importModeHandler}
          icon="cloud upload"
          content="Import"
          primary={s.currentMode === CurrentMode.IMPORTING}
          title="Import a profile by Swarm link"
        />
        {s.isExportCopied ? (
          <Button
            size="mini"
            basic
            icon="check"
            content="Copied"
            onClick={this.resetExportHandler}
          />
        ) : s.exportError ? (
          <Button
            size="mini"
            basic
            icon="exclamation triangle"
            color="red"
            content="Error"
            title={s.exportError}
            onClick={this.resetExportHandler}
          />
        ) : (
          <Button
            title="Export the current profile to Swarm"
            size="mini"
            basic
            icon="cloud download"
            content="Export"
            onClick={this.exportHandler}
            disabled={s.isExportUploading}
            loading={s.isExportUploading}
          />
        )}
        {s.isShareCopied ? (
          <Button
            size="mini"
            basic
            icon="check"
            content="Copied"
            onClick={this.resetShareHandler}
          />
        ) : s.shareError ? (
          <Button
            size="mini"
            basic
            icon="exclamation triangle"
            color="red"
            content="Error"
            title={s.shareError}
            onClick={this.resetShareHandler}
          />
        ) : (
          <Button
            title="Share an extension link with your profile"
            size="mini"
            basic
            icon="share"
            content="Share"
            onClick={this.shareHandler}
            disabled={s.isShareUploading}
            loading={s.isShareUploading}
          />
        )}
      </div>
    );

    if (s.currentMode === CurrentMode.IMPORTING) {
      return (
        <>
          <div style={{ margin: "1rem 0" }}>
            <Input
              type="text"
              placeholder="Swarm address..."
              action
              size="mini"
              fluid
              disabled={s.isImportLoading}
              error={!!s.importError}
              onChange={this.importChangeHandler}
            >
              <input
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  typeOfUri(s.importInputValue) === UriTypes.Swarm &&
                  this.loadImportHandler()
                }
              />
              <Button
                primary
                size="mini"
                onClick={this.loadImportHandler}
                loading={s.isImportLoading}
                disabled={
                  s.isImportLoading ||
                  typeOfUri(s.importInputValue) !== UriTypes.Swarm
                }
              >
                Load
              </Button>
              <Button
                size="mini"
                onClick={this.cancelImportHandler}
                disabled={s.isImportLoading}
              >
                Cancel
              </Button>
            </Input>
            {s.importError ? (
              <Label basic color="red" pointing>
                {s.importError}
              </Label>
            ) : null}
          </div>
          {panel}
        </>
      );
    }

    if (s.currentMode === CurrentMode.RENAMING) {
      return (
        <>
          <Input
            type="text"
            placeholder="Rename..."
            action
            size="mini"
            fluid
            style={{ margin: "1rem 0" }}
          >
            <input
              value={s.renamingValue}
              onChange={this.renameChangeHandler}
              onKeyPress={(e) =>
                e.key === "Enter" &&
                s.renamingValue !== this.getCurrentProfile()?.text &&
                this.saveRenameHandler()
              }
            />
            <Button
              primary
              size="mini"
              onClick={this.saveRenameHandler}
              disabled={s.renamingValue === this.getCurrentProfile()?.text}
            >
              Save
            </Button>
            <Button size="mini" onClick={this.cancelRenameHandler}>
              Cancel
            </Button>
          </Input>
          {panel}
        </>
      );
    }

    return (
      <>
        <Menu size="mini" style={{ boxShadow: "none", border: "none" }}>
          <Dropdown
            fluid
            basic
            button
            className="mini"
            floating
            onClose={this.dropdownCloseHandler}
            text={this.getCurrentProfile()?.text}
          >
            <Dropdown.Menu style={{ maxHeight: "17rem", overflowY: "auto" }}>
              <Dropdown.Divider style={{ margin: "unset" }} />
              {p.profiles.map((x) => (
                <Dropdown.Item
                  selected={x.id === p.currentProfileId}
                  key={x.id}
                  id={x.id}
                  content={
                    <div style={{ display: "flex" }}>
                      <div style={{ flex: "auto" }}>{x.text}</div>
                      <div>
                        {x.id !== p.currentProfileId ? (
                          <Icon
                            link
                            color="red"
                            name="close"
                            id={x.id}
                            title="Delete the profile"
                            onClick={this.deleteHandler}
                          />
                        ) : null}
                      </div>
                    </div>
                  }
                  onClick={this.selectProfileHandler}
                />
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Menu>
        {panel}
        {modal}
      </>
    );
  }
}
