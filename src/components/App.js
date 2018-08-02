import '../assets/sass/App.sass'
import React, {Component, Fragment} from 'react'

import Tree from 'arborea'
import {Button, Input, Link} from './Controls'
import Localization from '../lib/localization'

const fs = require('fs')
const util = require('util')
const {app, dialog} = require('electron').remote
const {shell} = require('electron')
const md = require('markdown-it')()

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const loc = new Localization()
for (const i of ['nl', 'en-US']) {
  // TODO: fix this shit
  let data
  try {
    data = fs.readFileSync(`src/assets/local/${i}.json`)
  } catch (err) {
    data = fs.readFileSync(`resources/app/src/assets/local/${i}.json`)
  }
  loc.addDictionary(i, JSON.parse(data))
}
loc.setLanguage('en-US')

export default class App extends Component {

  constructor (props) {
    super(props)

    const tree = new Tree()
    const node = tree.root
    node.title = loc.$('root')
    const {title, content} = node

    this.state = {
      tree, node, title, content,
      filename: null,
      language: 'en-US'
    }

    this.state.set = this.setState.bind(this)

    this.setLanguage = this.setLanguage.bind(this)
    this.goBack = this.goBack.bind(this)
    this.goToNode = this.goToNode.bind(this)
    this.addOption = this.addOption.bind(this)
    this.deleteOption = this.deleteOption.bind(this)
    this.newTree = this.newTree.bind(this)
    this.openFileDialog = this.openFileDialog.bind(this)
    this.saveFileDialog = this.saveFileDialog.bind(this)
    this.saveFile = this.saveFile.bind(this)
  }

  componentDidUpdate () {
    // prevent rendered <a>'s from opening external web pages in our app window
    // and have them opened externally instead
    for (const a of document.querySelectorAll('.render a')) {
      const url = a.href
      a.href = '#'
      a.addEventListener('click', () => {
        shell.openExternal(url)
      })
    }
  }

  setLanguage (language) {
    loc.setLanguage(language)
    this.setState({language})
  }

  goToNode (newNode) {
    const {tree, node, title, content} = this.state

    // make sure unsaved changes are remembered on navigation
    node.title = title
    node.content = content

    this.setState({
      node: newNode,
      title: newNode.title,
      content: newNode.content
    })
  }

  goBack () {
    const {node} = this.state
    this.goToNode(node.parent)
  }

  addOption () {
    const {tree, node} = this.state
    const newNode = node.createChild(loc.$('newOption'), '')
    this.goToNode(newNode)
  }

  deleteOption () {
    const {tree, node} = this.state
    if (node.children.length > 0) {
      return dialog.showMessageBox({
        type: 'error',
        title: loc.$('error'),
        message: loc.$('subOptionsRemaining')
      })
    }
    const {parent} = node
    parent.deleteChild(node)
    this.goToNode(parent)
  }

  newTree () {
    const tree = new Tree()
    const node = tree.root
    node.title = loc.$('root')
    const {title, content} = node
    this.setState({
      tree, node, title, content,
      filename: null,
    })
  }

  openFileDialog () {
    const selection = dialog.showOpenDialog({
      defaultPath: app.getPath('home'),
      filters: [{name: loc.$('jsonFiles'), extensions: ['json']}]
    })
    if (selection) {
      readFile(selection[0])
      .then(data => new Tree(data.toString()))
      .then(tree => {
        const node = tree.root
        const {title, content} = node
        this.setState({
          tree, node, title, content,
          filename: selection[0]
        })
      })
    }
  }

  saveFile () {
    const {tree, node, title, content, filename} = this.state
    node.title = title
    node.content = content
    if (!filename) this.saveFileDialog()
    else writeFile(filename, tree.export())
         .then(() => this.setState({node}))
  }

  saveFileDialog () {
    const {tree, node, title, content, filename} = this.state
    node.title = title
    node.content = content
    this.setState({node})
    const newFilename = dialog.showSaveDialog({
      defaultPath: filename || app.getPath('home'),
      filters: [{name: loc.$('jsonFiles'), extensions: ['json']}]
    })
    if (newFilename) {
      writeFile(newFilename, tree.export())
      .then(() => this.setState({filename: newFilename}))
    }
  }

  render () {
    const {tree, node, content, filename, language} = this.state
    const otherLang = (language === 'nl') ? 'en-US' : 'nl'
    const langButton = <Button title={otherLang}
      onClick={() => this.setLanguage(otherLang)} />
    const backButton = (node === tree.root) ? null :
      <Button title="&larr;" onClick={this.goBack} />
    const deleteButton = (node === tree.root) ? null :
      <Button title={loc.$('deleteOption')} onClick={this.deleteOption} />
    const options = node.children.map(child =>
      <Button title={child.title} key={child.id}
      onClick={() => this.goToNode(child)} />)
    const saveAsButton = (!filename) ? null :
      <Button title={loc.$('saveAs')} onClick={this.saveFileDialog} />
    const historyItems = []
    let historyNode = node
    while (historyNode.parent !== null) {
      const n = historyNode
      historyItems.unshift(
        <Item key={n.id}>
          <NodeLink title={n.title} onClick={() => this.goToNode(n)} />
        </Item>
      )
      historyNode = historyNode.parent
    }

    const rendered = {__html: md.render(content)}

    return (
      <Fragment>
        <Menu>
          <Button title={loc.$('new')} onClick={this.newTree} />
          <Button title={loc.$('open')} onClick={this.openFileDialog} />
          <Button title={loc.$('save')} onClick={this.saveFile} />
          {saveAsButton}
          {langButton}
        </Menu>
        <Editor>
          <TreeViewer>
            <Display>{filename || loc.$('unnamedTree')}</Display>
            <Input.Text name="title" state={this.state} />
            <Input.TextArea name="content" state={this.state} />
            <Render dangerouslySetInnerHTML={rendered} />
            <Options>
              {options}
              <Button title="&#43;" onClick={this.addOption} />
            </Options>
            <Options>{deleteButton}</Options>
            <Options>{backButton}</Options>
          </TreeViewer>
          <History>
            <NodeLink title={tree.root.title}
              onClick={() => this.goToNode(tree.root)}/>
            <List>{historyItems}</List>
          </History>
        </Editor>

      </Fragment>
    )
  }
}

const Editor = (props) => <div className="editor" {...props} />
const TreeViewer = (props) => <div className="tree-viewer" {...props} />
const Menu = (props) => <div className="menu" {...props} />
const Display = (props) => <div className="display" {...props} />
const Render = (props) => <div className="render" {...props} />
const Options = (props) => <div className="options" {...props} />
const History = (props) => <div className="history" {...props} />
const NodeLink = (props) => <Link href="#" {...props} />
const List = (props) => <ul {...props} />
const OrderedList = (props) => <ol {...props} />
const Item = (props) => <li {...props} />
