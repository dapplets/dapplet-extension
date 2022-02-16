declare module "*.png" {
    const value: any;
    export default value;
}

declare module "*.jpg" {
    const value: any;
    export default value;
}

declare module "*.jpeg" {
    const value: any;
    export default value;
}

declare module "*.svg" {
    const value: any;
    export default value;
}

declare module "*.css" {
    const value: any;
    export default value;
}

declare module '*.svg' {
    const content: any;
    export default content;
}

declare module '*.svg' {
    import React = require('react')
    export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
    const src: string
    export default src
}

declare module "*.module.scss" {
    const value: any;
    export default value;
}

declare var EXTENSION_VERSION: string;
declare var EXTENSION_ENV: 'development' | 'production';

interface ObjectConstructor {
    /**
     * Returns an object created by key-value entries for properties and methods
     * @param entries An iterable object that contains key-value entries for properties and methods.
     */
    fromEntries<T = any>(entries: Iterable<readonly [PropertyKey, T]>): { [k in PropertyKey]: T };

    /**
     * Returns an object created by key-value entries for properties and methods
     * @param entries An iterable object that contains key-value entries for properties and methods.
     */
    fromEntries(entries: Iterable<readonly any[]>): any;
}