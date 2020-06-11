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
                        "internalType": "uint8",
                        "name": "flags",
                        "type": "uint8"
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
                        "internalType": "bytes32[]",
                        "name": "interfaces",
                        "type": "bytes32[]"
                    }
                ],
                "internalType": "struct DappletRegistry.VersionInfoDto[]",
                "name": "vInfos",
                "type": "tuple[]"
            },
            {
                "internalType": "bytes32",
                "name": "userId",
                "type": "bytes32"
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
                        "internalType": "uint8",
                        "name": "flags",
                        "type": "uint8"
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
                        "internalType": "bytes32[]",
                        "name": "interfaces",
                        "type": "bytes32[]"
                    }
                ],
                "internalType": "struct DappletRegistry.VersionInfoDto",
                "name": "vInfo",
                "type": "tuple"
            },
            {
                "internalType": "bytes32",
                "name": "userId",
                "type": "bytes32"
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
                        "internalType": "uint8",
                        "name": "flags",
                        "type": "uint8"
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
                        "internalType": "bytes32[]",
                        "name": "interfaces",
                        "type": "bytes32[]"
                    }
                ],
                "internalType": "struct DappletRegistry.VersionInfoDto[]",
                "name": "vInfo",
                "type": "tuple[]"
            },
            {
                "internalType": "bytes32[]",
                "name": "userId",
                "type": "bytes32[]"
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
                        "internalType": "uint8",
                        "name": "flags",
                        "type": "uint8"
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
                        "internalType": "bytes32[]",
                        "name": "interfaces",
                        "type": "bytes32[]"
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
                "name": "oldUserId",
                "type": "bytes32"
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
            },
            {
                "internalType": "bytes32",
                "name": "userId",
                "type": "bytes32"
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
            },
            {
                "internalType": "bytes32",
                "name": "userId",
                "type": "bytes32"
            }
        ],
        "name": "removeContextId",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]