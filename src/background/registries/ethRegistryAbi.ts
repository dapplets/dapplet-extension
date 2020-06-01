export default [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "branch",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "version",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "bool",
                        "name": "initialized",
                        "type": "bool"
                    },
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
                        "internalType": "string",
                        "name": "version",
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
                        "internalType": "string",
                        "name": "mod_type",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "author",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "distHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "distUris",
                        "type": "string[]"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "iconHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "iconUris",
                        "type": "string[]"
                    },
                    {
                        "internalType": "string[2][]",
                        "name": "dependencies",
                        "type": "string[2][]"
                    }
                ],
                "indexed": false,
                "internalType": "struct DappletRegistry.Manifest",
                "name": "manifest",
                "type": "tuple"
            }
        ],
        "name": "ModuleAdded",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "infoByName",
        "outputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
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
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "modulesByLocation",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
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
                "name": "location",
                "type": "string"
            }
        ],
        "name": "getManifests",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "bool",
                        "name": "initialized",
                        "type": "bool"
                    },
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
                        "internalType": "string",
                        "name": "version",
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
                        "internalType": "string",
                        "name": "mod_type",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "author",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "distHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "distUris",
                        "type": "string[]"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "iconHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "iconUris",
                        "type": "string[]"
                    },
                    {
                        "internalType": "string[2][]",
                        "name": "dependencies",
                        "type": "string[2][]"
                    }
                ],
                "internalType": "struct DappletRegistry.Manifest[]",
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
            }
        ],
        "name": "getVersions",
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
            },
            {
                "internalType": "string",
                "name": "version",
                "type": "string"
            }
        ],
        "name": "resolveToManifest",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "bool",
                        "name": "initialized",
                        "type": "bool"
                    },
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
                        "internalType": "string",
                        "name": "version",
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
                        "internalType": "string",
                        "name": "mod_type",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "author",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "distHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "distUris",
                        "type": "string[]"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "iconHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "iconUris",
                        "type": "string[]"
                    },
                    {
                        "internalType": "string[2][]",
                        "name": "dependencies",
                        "type": "string[2][]"
                    }
                ],
                "internalType": "struct DappletRegistry.Manifest",
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
                "internalType": "string",
                "name": "version",
                "type": "string"
            },
            {
                "components": [
                    {
                        "internalType": "bool",
                        "name": "initialized",
                        "type": "bool"
                    },
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
                        "internalType": "string",
                        "name": "version",
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
                        "internalType": "string",
                        "name": "mod_type",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "author",
                        "type": "string"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "distHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "distUris",
                        "type": "string[]"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "iconHash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string[]",
                        "name": "iconUris",
                        "type": "string[]"
                    },
                    {
                        "internalType": "string[2][]",
                        "name": "dependencies",
                        "type": "string[2][]"
                    }
                ],
                "internalType": "struct DappletRegistry.Manifest",
                "name": "manifest",
                "type": "tuple"
            }
        ],
        "name": "addModule",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
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
                        "internalType": "string",
                        "name": "version",
                        "type": "string"
                    },
                    {
                        "components": [
                            {
                                "internalType": "bool",
                                "name": "initialized",
                                "type": "bool"
                            },
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
                                "internalType": "string",
                                "name": "version",
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
                                "internalType": "string",
                                "name": "mod_type",
                                "type": "string"
                            },
                            {
                                "internalType": "string",
                                "name": "author",
                                "type": "string"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "distHash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "string[]",
                                "name": "distUris",
                                "type": "string[]"
                            },
                            {
                                "internalType": "bytes32",
                                "name": "iconHash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "string[]",
                                "name": "iconUris",
                                "type": "string[]"
                            },
                            {
                                "internalType": "string[2][]",
                                "name": "dependencies",
                                "type": "string[2][]"
                            }
                        ],
                        "internalType": "struct DappletRegistry.Manifest",
                        "name": "manifest",
                        "type": "tuple"
                    }
                ],
                "internalType": "struct DappletRegistry.AddModulesInput[]",
                "name": "input",
                "type": "tuple[]"
            }
        ],
        "name": "addModules",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "moduleName",
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
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
                "name": "location",
                "type": "string"
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
                "name": "moduleName",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "location",
                "type": "string"
            }
        ],
        "name": "addLocation",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "moduleName",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "location",
                        "type": "string"
                    }
                ],
                "internalType": "struct DappletRegistry.AddLocationsInput[]",
                "name": "input",
                "type": "tuple[]"
            }
        ],
        "name": "addLocations",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "location",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "moduleNameIndex",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "moduleName",
                "type": "string"
            }
        ],
        "name": "removeLocation",
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
            },
            {
                "internalType": "string",
                "name": "version",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "distUri",
                "type": "string"
            }
        ],
        "name": "addDistUri",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
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
                        "internalType": "string",
                        "name": "version",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "distUri",
                        "type": "string"
                    }
                ],
                "internalType": "struct DappletRegistry.AddHashUrisInput[]",
                "name": "input",
                "type": "tuple[]"
            }
        ],
        "name": "addDistUris",
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
            },
            {
                "internalType": "string",
                "name": "version",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "distUri",
                "type": "string"
            }
        ],
        "name": "removeHashUri",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "a",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "b",
                "type": "string"
            }
        ],
        "name": "areEqual",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "pure",
        "type": "function",
        "constant": true
    }
]