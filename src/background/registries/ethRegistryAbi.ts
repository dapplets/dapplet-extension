export default [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "string[]",
                "name": "contextIds",
                "type": "string[]"
            },
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "owner",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "uint32",
                "name": "moduleIndex",
                "type": "uint32"
            }
        ],
        "name": "ModuleInfoAdded",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "modsByContextType",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "moduleIdxs",
        "outputs": [
            {
                "internalType": "uint32",
                "name": "",
                "type": "uint32"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "modules",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "moduleType",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "bytes32",
                "name": "owner",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "flags",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "versionNumbers",
        "outputs": [
            {
                "internalType": "bytes",
                "name": "",
                "type": "bytes"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "versions",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "modIdx",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "branch",
                "type": "string"
            },
            {
                "internalType": "uint8",
                "name": "major",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "minor",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "patch",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "title",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "bytes32",
                        "name": "hash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes[]",
                        "name": "uris",
                        "type": "bytes[]"
                    }
                ],
                "internalType": "struct DappletRegistry.StorageRef",
                "name": "icon",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "bytes32",
                        "name": "hash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes[]",
                        "name": "uris",
                        "type": "bytes[]"
                    }
                ],
                "internalType": "struct DappletRegistry.StorageRef",
                "name": "binary",
                "type": "tuple"
            },
            {
                "internalType": "uint8",
                "name": "flags",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "string[]",
                "name": "ctxIds",
                "type": "string[]"
            },
            {
                "internalType": "bytes32[]",
                "name": "users",
                "type": "bytes32[]"
            },
            {
                "internalType": "uint32",
                "name": "maxBufLen",
                "type": "uint32"
            }
        ],
        "name": "getModuleInfoBatch",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "moduleType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "owner",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "interfaces",
                        "type": "string[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "flags",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct DappletRegistry.ModuleInfo[][]",
                "name": "mod_info",
                "type": "tuple[][]"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "ctxId",
                "type": "string"
            },
            {
                "internalType": "bytes32[]",
                "name": "users",
                "type": "bytes32[]"
            },
            {
                "internalType": "uint32",
                "name": "maxBufLen",
                "type": "uint32"
            }
        ],
        "name": "getModuleInfo",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "moduleType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "owner",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "interfaces",
                        "type": "string[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "flags",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct DappletRegistry.ModuleInfo[]",
                "name": "mod_info",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "mod_name",
                "type": "string"
            }
        ],
        "name": "getModuleInfoByName",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "moduleType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "owner",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "interfaces",
                        "type": "string[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "flags",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct DappletRegistry.ModuleInfo",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "string[]",
                "name": "contextIds",
                "type": "string[]"
            },
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "moduleType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "owner",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "interfaces",
                        "type": "string[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "flags",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct DappletRegistry.ModuleInfo",
                "name": "mInfo",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "branch",
                        "type": "string"
                    },
                    {
                        "internalType": "uint8",
                        "name": "major",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "minor",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "patch",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "components": [
                            {
                                "internalType": "bytes32",
                                "name": "hash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes[]",
                                "name": "uris",
                                "type": "bytes[]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.StorageRef",
                        "name": "icon",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "bytes32",
                                "name": "hash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes[]",
                                "name": "uris",
                                "type": "bytes[]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.StorageRef",
                        "name": "binary",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "branch",
                                "type": "string"
                            },
                            {
                                "internalType": "uint8",
                                "name": "major",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "minor",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "patch",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct DappletRegistry.DependencyDto[]",
                        "name": "dependencies",
                        "type": "tuple[]"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "branch",
                                "type": "string"
                            },
                            {
                                "internalType": "uint8",
                                "name": "major",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "minor",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "patch",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct DappletRegistry.DependencyDto[]",
                        "name": "interfaces",
                        "type": "tuple[]"
                    },
                    {
                        "internalType": "uint8",
                        "name": "flags",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct DappletRegistry.VersionInfoDto[]",
                "name": "vInfos",
                "type": "tuple[]"
            }
        ],
        "name": "addModuleInfo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "mod_name",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "branch",
                        "type": "string"
                    },
                    {
                        "internalType": "uint8",
                        "name": "major",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "minor",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "patch",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "components": [
                            {
                                "internalType": "bytes32",
                                "name": "hash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes[]",
                                "name": "uris",
                                "type": "bytes[]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.StorageRef",
                        "name": "icon",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "bytes32",
                                "name": "hash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes[]",
                                "name": "uris",
                                "type": "bytes[]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.StorageRef",
                        "name": "binary",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "branch",
                                "type": "string"
                            },
                            {
                                "internalType": "uint8",
                                "name": "major",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "minor",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "patch",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct DappletRegistry.DependencyDto[]",
                        "name": "dependencies",
                        "type": "tuple[]"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "branch",
                                "type": "string"
                            },
                            {
                                "internalType": "uint8",
                                "name": "major",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "minor",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "patch",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct DappletRegistry.DependencyDto[]",
                        "name": "interfaces",
                        "type": "tuple[]"
                    },
                    {
                        "internalType": "uint8",
                        "name": "flags",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct DappletRegistry.VersionInfoDto",
                "name": "vInfo",
                "type": "tuple"
            }
        ],
        "name": "addModuleVersion",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string[]",
                "name": "mod_name",
                "type": "string[]"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "branch",
                        "type": "string"
                    },
                    {
                        "internalType": "uint8",
                        "name": "major",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "minor",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "patch",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "components": [
                            {
                                "internalType": "bytes32",
                                "name": "hash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes[]",
                                "name": "uris",
                                "type": "bytes[]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.StorageRef",
                        "name": "icon",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "bytes32",
                                "name": "hash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes[]",
                                "name": "uris",
                                "type": "bytes[]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.StorageRef",
                        "name": "binary",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "branch",
                                "type": "string"
                            },
                            {
                                "internalType": "uint8",
                                "name": "major",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "minor",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "patch",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct DappletRegistry.DependencyDto[]",
                        "name": "dependencies",
                        "type": "tuple[]"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "branch",
                                "type": "string"
                            },
                            {
                                "internalType": "uint8",
                                "name": "major",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "minor",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "patch",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct DappletRegistry.DependencyDto[]",
                        "name": "interfaces",
                        "type": "tuple[]"
                    },
                    {
                        "internalType": "uint8",
                        "name": "flags",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct DappletRegistry.VersionInfoDto[]",
                "name": "vInfo",
                "type": "tuple[]"
            }
        ],
        "name": "addModuleVersionBatch",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "branch",
                "type": "string"
            }
        ],
        "name": "getVersionNumbers",
        "outputs": [
            {
                "internalType": "bytes",
                "name": "",
                "type": "bytes"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "branch",
                "type": "string"
            },
            {
                "internalType": "uint8",
                "name": "major",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "minor",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "patch",
                "type": "uint8"
            }
        ],
        "name": "getVersionInfo",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "branch",
                        "type": "string"
                    },
                    {
                        "internalType": "uint8",
                        "name": "major",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "minor",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint8",
                        "name": "patch",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "components": [
                            {
                                "internalType": "bytes32",
                                "name": "hash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes[]",
                                "name": "uris",
                                "type": "bytes[]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.StorageRef",
                        "name": "icon",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "bytes32",
                                "name": "hash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "bytes[]",
                                "name": "uris",
                                "type": "bytes[]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.StorageRef",
                        "name": "binary",
                        "type": "tuple"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "branch",
                                "type": "string"
                            },
                            {
                                "internalType": "uint8",
                                "name": "major",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "minor",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "patch",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct DappletRegistry.DependencyDto[]",
                        "name": "dependencies",
                        "type": "tuple[]"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "name",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "branch",
                                "type": "string"
                            },
                            {
                                "internalType": "uint8",
                                "name": "major",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "minor",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint8",
                                "name": "patch",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct DappletRegistry.DependencyDto[]",
                        "name": "interfaces",
                        "type": "tuple[]"
                    },
                    {
                        "internalType": "uint8",
                        "name": "flags",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct DappletRegistry.VersionInfoDto",
                "name": "dto",
                "type": "tuple"
            },
            {
                "internalType": "uint8",
                "name": "moduleType",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "mod_name",
                "type": "string"
            },
            {
                "internalType": "bytes32",
                "name": "newUserId",
                "type": "bytes32"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "mod_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "contextId",
                "type": "string"
            }
        ],
        "name": "addContextId",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "mod_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "contextId",
                "type": "string"
            }
        ],
        "name": "removeContextId",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]