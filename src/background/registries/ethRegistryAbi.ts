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
                "indexed": false,
                "internalType": "bytes32",
                "name": "manifestHash",
                "type": "bytes32"
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
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "name": "urisByHash",
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
        "name": "resolveToUris",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
            },
            {
                "internalType": "string[]",
                "name": "uris",
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
            },
            {
                "components": [
                    {
                        "internalType": "bytes32",
                        "name": "hash",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "string",
                        "name": "uri",
                        "type": "string"
                    }
                ],
                "internalType": "struct DappletRegistry.HashUri[]",
                "name": "hashUris",
                "type": "tuple[]"
            }
        ],
        "name": "addModuleWithObjects",
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
                                "internalType": "bytes32",
                                "name": "hash",
                                "type": "bytes32"
                            },
                            {
                                "internalType": "string",
                                "name": "uri",
                                "type": "string"
                            }
                        ],
                        "internalType": "struct DappletRegistry.HashUri[]",
                        "name": "hashUris",
                        "type": "tuple[]"
                    }
                ],
                "internalType": "struct DappletRegistry.AddModulesWithObjectsInput[]",
                "name": "input",
                "type": "tuple[]"
            }
        ],
        "name": "addModulesWithObjects",
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
                "internalType": "bytes32",
                "name": "manifestHash",
                "type": "bytes32"
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
                        "internalType": "bytes32",
                        "name": "manifestHash",
                        "type": "bytes32"
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
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
            }
        ],
        "name": "hashToUris",
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
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
            },
            {
                "internalType": "string",
                "name": "uri",
                "type": "string"
            }
        ],
        "name": "addHashUri",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "hash",
                "type": "bytes32"
            },
            {
                "internalType": "uint256",
                "name": "uriIndex",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "uri",
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