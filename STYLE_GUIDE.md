## Coding Style Guide

This section defines a style guide which should be followed by all code that is written in Dapplets Extension. Being consistent with this style will make the code easier to read, debug, and maintain. To ensure your code is style compliant, consider using tools for complying with coding style.

> Note: Many of the files in the repository were written before this style guide, or did not follow it precisely. If you find style errors, go ahead and change it and submit a pull request.

We use the following tools for code linting and formatting, please follow them.

- [ESLint](https://eslint.org/) rules for linting of TypeScript and TSX code are defined in [the `.eslintrc.json` file](https://github.com/dapplets/dapplet-extension/blob/master/.eslintrc.json)
- [Stylelint](https://stylelint.io/) rules for linting of SCSS code are defined in [the `.stylelintrc` file](https://github.com/dapplets/dapplet-extension/blob/master/.stylelintrc)
- [Prettier](https://prettier.io/) rules for code formatting are defined in [the `.prettierrc.json` file](https://github.com/dapplets/dapplet-extension/blob/master/.prettierrc.json)

For better coding experience, it is recommended to use IDE extensions.

The Visual Studio Code marketplace has a lot of great extensions. We have already [set up some for you](https://github.com/dapplets/dapplet-extension/blob/master/.vscode/). You can install them manually or automatically when you open the repository for the first time:

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [vscode-stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

We recommend don't use custom configurations to avoid meaningless merge conflicts.
