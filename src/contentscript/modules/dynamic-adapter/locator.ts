import Core from '../../core'

/**
 * The Locator is responsible for finding dynamic contexts.
 * It handles mutations from the MutationObserver
 * and performs a full DOM scan on Dynamic Adapter initialization.
 */
export class Locator {
  private _locators = this._core.getContentDetectors()
  private _map = new Map<string, Set<Element>>()

  constructor(private _core: Core) {}

  public handleMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      for (const addedNode of Array.from(mutation.addedNodes) as Element[]) {
        for (const locator of this._locators) {
          if (addedNode.matches && addedNode.matches(locator.selector)) {
            this._addElement(addedNode, locator.contextId)
          } else if (addedNode.querySelectorAll) {
            const elements = addedNode.querySelectorAll(locator.selector)
            elements.forEach((el) => this._addElement(el, locator.contextId))
          }
        }
      }

      for (const removedNode of Array.from(mutation.removedNodes) as Element[]) {
        for (const locator of this._locators) {
          if (removedNode.matches && removedNode.matches(locator.selector)) {
            this._removeElement(removedNode, locator.contextId)
          } else if (removedNode.querySelectorAll) {
            const elements = removedNode.querySelectorAll(locator.selector)
            elements.forEach((el) => this._removeElement(el, locator.contextId))
          }
        }
      }
    }
  }

  public scanDocument() {
    for (const locator of this._locators) {
      const nodes = document.querySelectorAll(locator.selector)
      nodes.forEach((x) => this._addElement(x, locator.contextId))
    }
  }

  private _addElement(el: Element, contextId: string) {
    if (!this._map.has(contextId)) this._map.set(contextId, new Set())
    this._map.get(contextId).add(el)
    if (this._map.get(contextId).size === 1) {
      this._core.contextStarted([contextId])
    }
  }

  private _removeElement(el: Element, contextId: string) {
    if (!this._map.has(contextId)) return
    this._map.get(contextId).delete(el)
    if (this._map.get(contextId).size === 0) {
      this._map.delete(contextId)
      this._core.contextFinished([contextId])
    }
  }
}
