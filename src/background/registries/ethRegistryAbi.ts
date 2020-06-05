export default [
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
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "uint8",
                        "name": "moduleType",
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
                        "internalType": "bytes32",
                        "name": "owner",
                        "type": "bytes32"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "branch",
                                "type": "string"
                            },
                            {
                                "internalType": "uint32",
                                "name": "major",
                                "type": "uint32"
                            },
                            {
                                "internalType": "uint32",
                                "name": "minor",
                                "type": "uint32"
                            },
                            {
                                "internalType": "uint32",
                                "name": "patch",
                                "type": "uint32"
                            },
                            {
                                "internalType": "uint96",
                                "name": "flags",
                                "type": "uint96"
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
                                "internalType": "bytes32[]",
                                "name": "dependencies",
                                "type": "bytes32[]"
                            },
                            {
                                "internalType": "bytes32[]",
                                "name": "interfaces",
                                "type": "bytes32[]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.VersionInfo[]",
                        "name": "versions",
                        "type": "tuple[]"
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
                "internalType": "string[]",
                "name": "contextIds",
                "type": "string[]"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "uint8",
                        "name": "moduleType",
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
                        "internalType": "bytes32",
                        "name": "owner",
                        "type": "bytes32"
                    },
                    {
                        "components": [
                            {
                                "internalType": "string",
                                "name": "branch",
                                "type": "string"
                            },
                            {
                                "internalType": "uint32",
                                "name": "major",
                                "type": "uint32"
                            },
                            {
                                "internalType": "uint32",
                                "name": "minor",
                                "type": "uint32"
                            },
                            {
                                "internalType": "uint32",
                                "name": "patch",
                                "type": "uint32"
                            },
                            {
                                "internalType": "uint96",
                                "name": "flags",
                                "type": "uint96"
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
                                "internalType": "bytes32[]",
                                "name": "dependencies",
                                "type": "bytes32[]"
                            },
                            {
                                "internalType": "bytes32[]",
                                "name": "interfaces",
                                "type": "bytes32[]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.VersionInfo[]",
                        "name": "versions",
                        "type": "tuple[]"
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
                        "internalType": "uint32",
                        "name": "major",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "minor",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "patch",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint96",
                        "name": "flags",
                        "type": "uint96"
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
                        "internalType": "bytes32[]",
                        "name": "dependencies",
                        "type": "bytes32[]"
                    },
                    {
                        "internalType": "bytes32[]",
                        "name": "interfaces",
                        "type": "bytes32[]"
                    }
                ],
                "internalType": "struct DappletRegistry.VersionInfo",
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
        "name": "getModules",
        "outputs": [
            {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
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
            }
        ],
        "name": "getVersions",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "major",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "minor",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "patch",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct DappletRegistry.Version[]",
                "name": "",
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
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "branch",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "uint32",
                        "name": "major",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "minor",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "patch",
                        "type": "uint32"
                    }
                ],
                "internalType": "struct DappletRegistry.Version",
                "name": "version",
                "type": "tuple"
            }
        ],
        "name": "resolveToManifest",
        "outputs": [
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
                        "internalType": "uint32",
                        "name": "major",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "minor",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint32",
                        "name": "patch",
                        "type": "uint32"
                    },
                    {
                        "internalType": "uint8",
                        "name": "moduleType",
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
                        "internalType": "bytes32",
                        "name": "owner",
                        "type": "bytes32"
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
                        "internalType": "bytes32[]",
                        "name": "dependencies",
                        "type": "bytes32[]"
                    }
                ],
                "internalType": "struct DappletRegistry.ResolveToManifestOutput",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    }
]