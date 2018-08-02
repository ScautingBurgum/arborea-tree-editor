const _ = require('lodash')

const isNode = (x) => x instanceof Node

const $nodes = Symbol('nodes')
const $tree = Symbol('tree')
const $id = Symbol('id')
const $root = Symbol('root')
const $children = Symbol('children')
const $parent = Symbol('parent')

/**
  * Main class
  * @property {Node} root - The root {@link Node} of the tree
  */

class Tree {
  /**
    * Create a new tree or import one
    * @param {string|Array} [nodes] - Nodes to be imported. If a string is provided, it will be parsed as JSON. If no value is provided, a new Tree with a root {@link Node} will be created.
    */
  constructor (nodes) {
    if (_.isUndefined(nodes)) {
      this[$root] = new Node({id: 0})
      this[$root][$tree] = this
      this[$nodes] = [this.root]
    } else {
      this.import(nodes)
    }
  }

  get root () {
    return this[$root]
  }

  _findOrphans () {
    return this[$nodes].filter(x => _.isNull(x.parent))
  }

  /**
    * Takes a Node ID and returns the corresponding node.
    * @param {number} [id] - Node ID
    * @return {Node} The Node that got got
    */
  getNode (id) {
    if (_.isInteger(id)) {
      return this[$nodes].find(i => i.id === id)
    }
  }

  _getHighestId () {
    let highest = 0
    for (const i of this[$nodes]) if (i.id > highest) highest = i.id
    return highest
  }

  /**
   * Creates a new {@link Node} in the tree.
   * @param {string} [title] - Node title. Defaults to ''.
   * @param {string} [content] - Node content. Defaults to ''.
   * @return {Node} The created Node
   */

  createNode (title = '', content = '') {
    const node = new Node({
      id: this._getHighestId() + 1,
      title: String(title),
      content: String(content),
      parent: null
    })
    this[$nodes].push(node)
    node[$tree] = this
    return node
  }

  _importNode (descriptor) {
    const node = new Node(descriptor)
    node[$tree] = this
    return node
  }

  /**
    * Deletes passed node from the tree.
    * @param {Node|number} node - The {@link Node} to be deleted or its ID
    * @param {boolean} recursive - If set to true, child nodes will also be deleted. If set to false, existing child nodes will throw an error. Defaults to false.
    */
  deleteNode (node, recursive = false) {
    if (_.isInteger(node)) node = this.getNode(node)
    if (!isNode(node)) return false
    if (node === this.root) throw new Error('Cannot delete root node')
    if (node.children.length > 0) {
      if (recursive === true) {
        for (const child of node.children) this.deleteNode(child, true)
      } else {
        throw new Error('That Node still has children')
      }
    }
    if (!_.isNull(node.parent)) node.parent.removeChild(node)
    this[$nodes].splice(this[$nodes].indexOf(node), 1)
    return true
  }

  /**
    * Imports a tree structure to replace the current one. If a string is provided, it will be parsed as JSON. This method is automatically called if an argument is provided to the Tree constructor.
    @param {string|Array} nodes - The Nodes to be imported. Typically parsed JSON.
    */

  import (data) {
    if (_.isString(data)) {
      try {
        data = JSON.parse(data)
      } catch (err) {
        throw new TypeError('Provided value is not valid JSON')
      }
    }
    if (!(_.isArray(data) && data[0] && data[0].id === 0)) {
      throw new TypeError('Parsed data is not a valid tree')
    }
    this[$nodes] = data.map(node => this._importNode(node))
    // replace parent and children id's with the nodes themselves
    for (const node of this[$nodes]) {
      if (!_.isNull(node.parent)) node[$parent] = this.getNode(node.parent)
      node[$children] = node.children.map(child => this.getNode(child))
    }
    this[$root] = this[$nodes][0]
  }

  /**
    * Exports the nodes in the tree as a JSON string. Data of this type can later be imported to recreate the tree.
    * @return {string} Nodes in JSON format.
    */
  export () {
    // clone array and replace parent and children with their id's
    const nodes = this[$nodes].map(node => ({
      id: node.id,
      title: node.title,
      content: node.content,
      children: node.children.map(child => child.id),
      parent: node.parent ? node.parent.id : null
    }))
    return JSON.stringify(nodes, null, 2)
  }

}

module.exports = Tree

/**
  * A node inside a tree. Nodes are created by instances of {@link Tree}; do not use this constructor to create Nodes!

  * @property {number} id - Node ID
  * @property {string} title - Node title
  * @property {string} content - Node content
  * @property {Node[]} children - Child Nodes
  * @property {Node} parent - Parent Node
*/
class Node {

  constructor (descriptor = {}) {
    this[$id] = descriptor.id
    this.title = descriptor.title || ''
    this.content = descriptor.content || ''
    this[$children] = (descriptor.children || []).slice()
    this[$parent] = ('parent' in descriptor) ? descriptor.parent : null
  }

  get id () {
    return this[$id]
  }

  get children () {
    return this[$children].slice()
  }

  get parent () {
    return this[$parent]
  }

  /**
    * Appends the passed Node to this Node. If passed Node is child to another Node, it will be removed as a child from that one.
    * @param {Node} node - the Node to be made child
    */

  appendChild (node) {
    if (!isNode(node)) throw new TypeError('Provided argument is not a valid Node')
    let ancestor = this
    while (ancestor !== null) {
      if (ancestor === node) throw new Error('A node cannot be its own ancestor')
      ancestor = ancestor.parent
    }
    if (isNode(node.parent)) node.parent.removeChild(node)
    node[$parent] = this
    this[$children].push(node)
    return this
  }

  /**
  * Removes the passed Node as a child from this Node. The Node is *not* deleted from the {@link Tree}.
  * @param {Node} node - the Node to be orphaned
  */

  removeChild (node) {
    if (!isNode(node)) throw new TypeError('Provided argument is not a valid Node')
    if (node.parent !== this) throw new Error('Provided Node is not a child of this Node')
    this[$children].splice(this[$children].indexOf(node), 1)
    node[$parent] = null
  }

  /**
    * Creates a new Node in the {@link Tree} and appends it as a child to this Node.
    * @param {string} [title] - Node title. Defaults to ''.
    * @param {string} [content] - Node content. Defaults to ''.
    * @return {Node} The created Node
    */

  createChild (content, title) { // create in tree and append to this
    const node = this[$tree].createNode(content, title)
    this.appendChild(node)
    return node
  }

  /**
    * Removes the passed Node as a child from this Node and deletes it from the {@link Tree}.
    * @param {Node} node - the Node to be deleted
    */

  deleteChild (node) { // remove as child and delete from tree
    this.removeChild(node)
    this[$tree].deleteNode(node)
  }

}
