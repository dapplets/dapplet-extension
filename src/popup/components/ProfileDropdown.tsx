import React from "react";
import { Button, Dropdown, Icon, Input } from "semantic-ui-react";
import { Label, Menu, Modal } from "semantic-ui-react";
import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { typeOfUri, UriTypes } from "../../common/helpers";

interface Props {
  profiles: {
    id: string;
    text: string;
  }[];

  currentProfileId: string;

  onRefresh: Function;
}

interface State {
  isRenaming: boolean;
  isImporting: boolean;
  isDeleteing: boolean;
  isImportLoading: boolean;
  importError: string;
  isExportUploading: boolean;
  isExportCopied: boolean;
  exportError: string;
  isShareUploading: boolean;
  isShareCopied: boolean;
  shareError: string;
}

export class ProfileDropdown extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isRenaming: false,
      isImporting: false,
      isDeleteing: false,
      isImportLoading: false,
      importError: null,
      isExportUploading: false,
      isExportCopied: false,
      exportError: null,
      isShareUploading: false,
      isShareCopied: false,
      shareError: null,
    };
  }

  cloneHandler = async () => {
    let newProfileId = null;

    const { copyProfile, setActiveProfile } = await initBGFunctions(browser);
    const sourceProfileName = this.props.currentProfileId;
    await copyProfile(null, sourceProfileName);
    await setActiveProfile(newProfileId);

    this.props.onRefresh();
  };

  renameHandler = () => {
    this.setState({ isRenaming: true });
  };

  deleteHandler = () => {
    this.setState({ isDeleteing: true });
  };

  importHandler = () => {
    this.setState({ isImporting: true });
  };

  exportHandler = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState({ isExportUploading: true });

    try {
      const { exportProfile } = await initBGFunctions(browser);
      const url = await exportProfile(this.props.currentProfileId);
      await navigator.clipboard.writeText(url);
      this.setState({ isExportUploading: false, isExportCopied: true });
      await new Promise((r) => setTimeout(r, 3000));
      this.setState({ isExportCopied: false });
    } catch (err) {
      this.setState({ isExportUploading: false, exportError: err });
      await new Promise((r) => setTimeout(r, 3000));
      this.setState({ exportError: null });
    }
  };

  shareHandler = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.setState({ isShareUploading: true });

    try {
      const { createShareLink } = await initBGFunctions(browser);
      const url = await createShareLink(this.props.currentProfileId);
      await navigator.clipboard.writeText(url);
      this.setState({ isShareUploading: false, isShareCopied: true });
      await new Promise((r) => setTimeout(r, 3000));
      this.setState({ isShareCopied: false });
    } catch (err) {
      this.setState({ isShareUploading: false, shareError: err });
      await new Promise((r) => setTimeout(r, 3000));
      this.setState({ shareError: null });
    }
  };

  saveRenameHandler = () => {
    this.setState({ isRenaming: false });
  };

  cancelRenameHandler = () => {
    this.setState({ isRenaming: false });
  };

  confirmDeletionHandler = () => {
    this.setState({ isDeleteing: false });
  };

  cancelDeletionHandler = () => {
    this.setState({ isDeleteing: false });
  };

  loadImportHandler = async () => {
    this.setState({ isImportLoading: true });

    try {
      await new Promise((res, rej) =>
        setTimeout(() => rej("Invalid profile"), 1000)
      );
      this.setState({ isImporting: false, isImportLoading: false });
    } catch (err) {
      this.setState({ isImportLoading: false, importError: err });
    }
  };

  cancelImportHandler = () => {
    this.setState({ isImporting: false });
  };

  dropdownCloseHandler = () => {
    this.setState({ exportError: null });
  };

  render() {
    const p = this.props;
    const s = this.state;

    const modal = s.isDeleteing ? (
      <Modal open={true} size="mini" dimmer="inverted">
        <Modal.Header>Delete Profile?</Modal.Header>
        <Modal.Content>
          Deleting the <b>Ethereum</b> profile permanently remove it from
          extension.
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

    if (s.isImporting) {
      return (
        <>
          <Input
            type="text"
            placeholder="Swarm address..."
            action
            size="mini"
            fluid
            disabled={s.isImportLoading}
            error={!!s.importError}
            onChange={() => this.setState({ importError: null })}
          >
            <input />
            <Button
              primary
              size="mini"
              onClick={this.loadImportHandler}
              loading={s.isImportLoading}
              disabled={s.isImportLoading}
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
        </>
      );
    }

    if (s.isRenaming) {
      return (
        <Input type="text" placeholder="Rename..." action size="mini" fluid>
          <input />
          <Button primary size="mini" onClick={this.saveRenameHandler}>
            Save
          </Button>
          <Button size="mini" onClick={this.cancelRenameHandler}>
            Cancel
          </Button>
        </Input>
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
            text={p.profiles.find((x) => x.id === p.currentProfileId)?.text}
          >
            <Dropdown.Menu style={{ maxHeight: "17rem", overflowY: "auto" }}>
              <Dropdown.Item
                text="Clone"
                icon="clone"
                onClick={this.cloneHandler}
              />
              <Dropdown.Item
                text="Rename"
                icon="text cursor"
                onClick={this.renameHandler}
              />
              <Dropdown.Item
                text="Delete"
                icon="trash"
                onClick={this.deleteHandler}
              />
              <Dropdown.Divider style={{ margin: "unset" }} />
              <Dropdown.Item
                text="Import"
                icon="cloud download"
                onClick={this.importHandler}
              />

              {s.isExportUploading ? (
                <Dropdown.Item
                  text="Uploading"
                  icon={<Icon loading name="spinner" />}
                  disabled
                />
              ) : s.isExportCopied ? (
                <Dropdown.Item
                  text="Copied to clipboard"
                  icon="check"
                  disabled
                />
              ) : s.exportError ? (
                <Dropdown.Item
                  icon={<Icon name="exclamation triangle" color="red" />}
                  disabled
                  content={
                    <span style={{ color: "#9f3a38" }}>{s.exportError}</span>
                  }
                />
              ) : (
                <Dropdown.Item
                  text="Export"
                  icon="cloud upload"
                  onClick={this.exportHandler}
                />
              )}

              {s.isShareUploading ? (
                <Dropdown.Item
                  text="Uploading"
                  icon={<Icon loading name="spinner" />}
                  disabled
                />
              ) : s.isShareCopied ? (
                <Dropdown.Item
                  text="Copied to clipboard"
                  icon="check"
                  disabled
                />
              ) : s.shareError ? (
                <Dropdown.Item
                  icon={<Icon name="exclamation triangle" color="red" />}
                  disabled
                  content={
                    <span style={{ color: "#9f3a38" }}>{s.shareError}</span>
                  }
                />
              ) : (
                <Dropdown.Item
                  text="Share Extension"
                  icon="share"
                  onClick={this.shareHandler}
                />
              )}

              <Dropdown.Divider style={{ margin: "unset" }} />
              {p.profiles.map((x) => (
                <Dropdown.Item key={x.id} text={x.text} />
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Menu>
        {modal}
      </>
    );
  }
}
