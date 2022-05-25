import { browser } from "webextension-polyfill-ts";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import React, {
    DetailedHTMLProps,
    HTMLAttributes,
    ReactElement,
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from "react";
import cn from "classnames";
import styles from "./UserSettings.module.scss";
import { DefaultConfig, SchemaConfig } from "../../../../../common/types";
import ModuleInfo from "../../../../../background/models/moduleInfo";
import VersionInfo from "../../../../../background/models/versionInfo";
import { CONTEXT_ID_WILDCARD } from "../../../../../common/constants";
import { Message } from "../../components/Message";
import { SettingWrapper } from "../../components/SettingWrapper";
import { StorageRefImage } from "../../components/DevModulesList";
import { Bus } from "../../../../../common/bus";
import * as tracing from "../../../../../common/tracing";
import { SettingItem } from "../../components/SettingItem";
import { SettingsPage } from "../../../../../settings/SettingsPage";

type UserSettingsContext = {
    mi: ModuleInfo & {
        hostnames: string[];
        order: number;
        sourceRegistry: { url: string; isDev: boolean };
    };
    vi: VersionInfo;
    schemaConfig: SchemaConfig;
    defaultConfig: DefaultConfig;
};

export interface UserSettingsProps {
    dappletName: string;
    registryUrl: string;
}

export const UserSettings = (props: UserSettingsProps): ReactElement => {
    const [settingsContext, setSettingsContext] = useState(null);

    useEffect(() => {
        (async () => {
            const { getUserSettingsForOverlay } = await initBGFunctions(
                browser
            );

            const { mi, vi, schemaConfig, defaultConfig } =
                await getUserSettingsForOverlay(
                    props.registryUrl,
                    props.dappletName
                );

            setSettingsContext({ mi, vi, schemaConfig, defaultConfig });
        })();

        return () => {
            // _isMounted = false;
        };
    }, []);

    if (!settingsContext) return null;
    const { mi, vi, schemaConfig, defaultConfig } = settingsContext;


    return (
        <SettingsPage
            mi={mi}
            vi={vi}
            schemaConfig={schemaConfig}
            defaultConfig={defaultConfig}
        />
    );
};
