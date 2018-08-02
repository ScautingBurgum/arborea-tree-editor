const _ = require('lodash')

const isNode = (x) => x instanceof Node

const $nodes = Symbol('nodes')
const $tree = Symbol('tree')

class Node {

  constructor (descriptor = {}) {
    this.id = descriptor.id
    this.title = descriptor.title || ''
    this.content = descriptor.content || ''
    this.children = descriptor.children || []
    this.parent = ('parent' in descriptor) ? descriptor.parent : null
  }

  appendChild (node) {
    if (!isNode(node)) throw new TypeError('Provided argument is not a valid Node')
    if (isNode(node.parent)) node.parent.removeChild(node)
    node.parent = this
    this.children.push(node)
    return this
  }

  removeChild (node) {
    if (!isNode(node)) throw new TypeError('Provided argument is not a valid Node')
    if (node.parent !== this) throw new Error('Provided Node is not a child of this Node')
    this.children.splice(this.children.indexOf(node), 1)
    node.parent = null
  }

  createChild (content, title) { // create in tree and append to this
    const node = this[$tree].createNode(content, title)
    this.appendChild(node)
    return node
  }

  deleteChild (node) { // remove as child and delete from tree
    this.removeChild(node)
    this[$tree].deleteNode(node)
  }

}

module.exports = class Tree {

  constructor (nodes) {
    if (_.isUndefined(nodes)) {
      this.root = new Node({id: 0})
      this.root[$tree] = this
      this[$nodes] = [this.root]
    } else {
      this[$nodes] = this.import(nodes)
      this.root = this[$nodes][0]
    }
  }

  _getOrphans () {
    return this[$nodes].filter(x => _.isNull(x.parent))
  }

  _getNode (id) {
    if (_.isInteger(id)) {
      return this[$nodes].find(i => i.id === id)
    }
  }

  _getHighestId () {
    let highest = 0
    for (const i of this[$nodes]) if (i.id > highest) highest = i.id
    return highest
  }

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

  deleteNode (node) {
    if (!isNode(node)) return
    if (node.children.length > 0) throw new Error('That Node still has children')
    if (!_.isNull(node.parent)) throw new Error('That Node is still child to another Node')
    this[$nodes].splice(this[$nodes].indexOf(node), 1)
  }

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
    const nodes = data.map(node => this._importNode(node))
    // replace parent and children id's with the nodes themselves
    const getNode = (id) => nodes.find(x => x.id === id)
    for (const node of nodes) {
      if (!_.isNull(node.parent)) node.parent = getNode(node.parent)
      node.children = node.children.map(child => getNode(child))
    }
    return nodes
  }

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
