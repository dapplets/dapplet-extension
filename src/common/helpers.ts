import { browser, Tabs } from "webextension-polyfill-ts";

export function getHostName(url: string): string {
  return new URL(url).hostname;
}

/**
 * Merges and deduplicates arrays of arrays
 * @param input arrays of arrays
 */
export function mergeDedupe<T>(input: T[][]): T[] {
  return [...new Set(mergeArrays(input))];
}

/**
 * Merges arrays of arrays
 * @param input arrays of arrays
 */
export function mergeArrays<T>(input: T[][]): T[] {
  return [].concat(...input);
}

/**
 * Compares name, branch and version of A and B
 * @param a manifest's part A
 * @param a manifest's part B
 */
export function areModulesEqual(
  a: { name: string, branch: string, version: string },
  b: { name: string, branch: string, version: string }
): boolean {
  return (
    a.name === b.name &&
    a.branch === b.branch &&
    a.version === b.version
  );
}

export enum UriTypes {
  Unknown = 0,
  Http,
  Swarm,
  Ipfs,
  Ethereum,
  Ens
}

/**
 * Recognizes a type of URI
 */
export function typeOfUri(uri: string): UriTypes {

  const uriLower = uri.toLowerCase()

  if (uriLower.indexOf('http://') === 0 || uriLower.indexOf('https://') === 0) {
    return UriTypes.Http
  }

  if (uriLower.indexOf('bzz://') === 0) {
    return UriTypes.Swarm
  }

  if (uriLower.indexOf('ipfs://') === 0) {
    return UriTypes.Ipfs
  }

  // ToDo: add Ethereum address validator
  if (uriLower.indexOf('0x') === 0 && uriLower.length === 42) {
    return UriTypes.Ethereum;
  }

  if (uriLower.lastIndexOf('.eth') === uriLower.length - 4) {
    return UriTypes.Ens;
  }

  return UriTypes.Unknown;
}

/**
 * Assert function for filtering of fullfilled Promises with .filter()
 */
export function assertFullfilled<T>(item: PromiseSettledResult<T>): item is PromiseFulfilledResult<T> {
  return item.status === "fulfilled";
}

/**
 * Assert function for filtering of rejected Promises with .filter()
 */
export function assertRejected<T>(item: PromiseSettledResult<T>): item is PromiseRejectedResult {
  return item.status === "rejected";
}

export function allSettled($) {
  'use strict';
  var self = this;
  return self.all(
    $.map(
      function (value) {
        return self.resolve(value).then(this.$, this._);
      },
      {
        $: function (value) {
          return { status: 'fulfilled', value: value };
        },
        _: function (reason) {
          return { status: 'rejected', reason: reason };
        }
      }
    )
  );
};

export function timeoutPromise<T>(ms: number, promise: Promise<T>, timeoutCallback?: Function) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      timeoutCallback?.();
      reject(new Error("promise timeout"));
    }, ms);
    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  })
}

export async function getCurrentTab(): Promise<Tabs.Tab> {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true });
  const tab = tabs[0];
  const popupUrl = browser.extension.getURL('popup.html');
  
  if (tab.url.indexOf(popupUrl) !== -1) {
    const params = new URLSearchParams(new URL(tab.url).search); // For automated testing open popup in separated tab with URL /popup.html?tabUrl=https://example.com
    const url = params.get('tabUrl');
    if (url) {
      const [currentTab] = await browser.tabs.query({ url: url });
      return currentTab;
    }
  }

  return tab;
}