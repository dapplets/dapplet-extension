export default [
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
        "name": "accounts",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "domainId",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "enum IdRegistry.AccountStatus",
                "name": "status",
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
        "name": "claimIdxByAccount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
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
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "claimIdxByOracle",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
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
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "domainId",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    }
                ],
                "internalType": "struct IdRegistry.AccountDto",
                "name": "oldAccount",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "domainId",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    }
                ],
                "internalType": "struct IdRegistry.AccountDto",
                "name": "newAccount",
                "type": "tuple"
            }
        ],
        "name": "addAccount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "domainId",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    }
                ],
                "internalType": "struct IdRegistry.AccountDto",
                "name": "account",
                "type": "tuple"
            }
        ],
        "name": "getAccounts",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "domainId",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "enum IdRegistry.AccountStatus",
                        "name": "status",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct IdRegistry.Account[]",
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
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "domainId",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    }
                ],
                "internalType": "struct IdRegistry.AccountDto",
                "name": "oldAccount",
                "type": "tuple"
            },
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "domainId",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    }
                ],
                "internalType": "struct IdRegistry.AccountDto",
                "name": "newAccount",
                "type": "tuple"
            }
        ],
        "name": "removeAccount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "claimTypes",
                "type": "uint8"
            },
            {
                "internalType": "bytes",
                "name": "link",
                "type": "bytes"
            },
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "domainId",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    }
                ],
                "internalType": "struct IdRegistry.AccountDto",
                "name": "account",
                "type": "tuple"
            },
            {
                "internalType": "address",
                "name": "oracle",
                "type": "address"
            }
        ],
        "name": "createClaim",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "cancelClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "approveClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }
        ],
        "name": "rejectClaim",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "domainId",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    }
                ],
                "internalType": "struct IdRegistry.AccountDto",
                "name": "account",
                "type": "tuple"
            }
        ],
        "name": "getClaimsByAccount",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "claimTypes",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes",
                        "name": "link",
                        "type": "bytes"
                    },
                    {
                        "internalType": "address",
                        "name": "oracle",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "author",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "accountIdx",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "enum IdRegistry.ClaimStatus",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct IdRegistry.Claim[]",
                "name": "output",
                "type": "tuple[]"
            },
            {
                "internalType": "uint256[]",
                "name": "indexes",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "oracle",
                "type": "address"
            }
        ],
        "name": "getClaimsByOracle",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint8",
                        "name": "claimTypes",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bytes",
                        "name": "link",
                        "type": "bytes"
                    },
                    {
                        "internalType": "address",
                        "name": "oracle",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "author",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "accountIdx",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "enum IdRegistry.ClaimStatus",
                        "name": "status",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    }
                ],
                "internalType": "struct IdRegistry.Claim[]",
                "name": "output",
                "type": "tuple[]"
            },
            {
                "internalType": "uint256[]",
                "name": "indexes",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function",
        "constant": true
    }
]