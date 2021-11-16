import * as React from "react";
import { Button, List, Label } from "semantic-ui-react";
import ModuleInfo from "../../background/models/moduleInfo";
import VersionInfo from "../../background/models/versionInfo";
import { StorageRefImage } from "./StorageRefImage";
import TopologicalSort from "topological-sort";
import { DEFAULT_BRANCH_NAME } from "../../common/constants";

interface Props {
  modules: {
    module: ModuleInfo;
    versions: VersionInfo[];
    isDeployed: boolean[];
  }[];
  onDetailsClick: Function;
}

interface State {}

export class DevModulesList extends React.Component<Props, State> {
  render() {
    const { modules } = this.props;
    
    // Topological sorting by dependencies
    const nodes = new Map<string, any>();
    modules.forEach(x => nodes.set((x.versions[0]) ? x.module.name + '#' + x.versions[0]?.branch : x.module.name, x));
    const sorting = new TopologicalSort(nodes);
    modules.forEach(x => {
        const deps = [...Object.keys(x.versions[0]?.dependencies || {}), ...Object.keys(x.versions[0]?.interfaces || {})];
        deps.forEach(d => {
          if (nodes.has(d + '#' + DEFAULT_BRANCH_NAME)) {
            sorting.addEdge(d + '#' + DEFAULT_BRANCH_NAME, x.module.name + '#' + x.versions[0]?.branch);
          }
        })
    });

    const sorted = [...sorting.sort().values()].map(x => x.node);

    return (
      <List divided relaxed verticalAlign="middle" size="small">
        {sorted.map((m, i) => (
          <List.Item key={i}>
            <List.Content floated="left" style={{ position: "relative" }}>
              <StorageRefImage storageRef={m.module.icon} style={{ width: '26px', height: '26px', borderRadius: '5px' }} />
              {m.isDeployed?.[0] === true ? (
                <Label
                  color="green"
                  floating
                  style={{ padding: "4px", top: "18px", left: "18px" }}
                />
              ) : null}
            </List.Content>
            <List.Content floated="right">
              <Button
                size="mini"
                compact
                color="blue"
                onClick={() => this.props.onDetailsClick(m.module, m.versions[0])}
              >
                Details
              </Button>
            </List.Content>
            <List.Content>
              <List.Header>
                {m.module.name}
                {m.isDeployed?.[0] === false ? (
                  <Label style={{ marginLeft: "4px" }} size="mini" horizontal>
                    NOT DEPLOYED
                  </Label>
                ) : null}
              </List.Header>
              {(m.versions[0]) ? `${m.versions[0].branch} v${m.versions[0].version}` : 'Under construction'}
            </List.Content>
          </List.Item>
        ))}
      </List>
    );
  }
}
