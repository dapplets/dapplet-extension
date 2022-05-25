import { useEffect, useState } from "react";
import React from "react";
import { StorageRef } from "../../../../../background/registries/registry";
import { initBGFunctions } from "chrome-extension-message-wrapper";
import { browser } from "webextension-polyfill-ts";
import { StorageRefImage } from "../DevModulesList";

export interface ModuleIconProps {
    moduleName: string;
    registryUrl: string;
    className?: string;
    onClick?: (x) => void;
}

export const ModuleIcon: React.FC<ModuleIconProps> = (props) => {
    const { moduleName, registryUrl, className, onClick } = props;

    const [storageRef, setStorageRef] = useState<StorageRef>(null);

    useEffect(() => {
        (async () => {
            const { getModuleInfoByName } = await initBGFunctions(browser);
            const mi = await getModuleInfoByName(registryUrl, moduleName);
            setStorageRef(mi.icon);
        })();
    }, []);

    return (
        <StorageRefImage
            storageRef={storageRef}
            className={className}
            onClick={onClick}
        />
    );
};
