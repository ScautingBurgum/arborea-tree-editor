import {select} from '../lib/v23'
import React, {Component} from 'react'

function Button (props) {
  const newProps = Object.assign({}, props)
  delete newProps.title
  return <button {...newProps}>{props.title}</button>
}

function Input (props) {
  const newProps = Object.assign({}, props)
  const {type, name, state} = props
  delete newProps.state
  newProps.value = state[name]
  newProps.onChange = (event) => {
    state.set({[name]: event.target.value})
  }
  return select(type, {
    textarea: <textarea {...newProps} />,
    default: <input {...newProps} />
  })
}

Input.Text = (props) => <Input type="text" {...props} />
Input.TextArea = (props) => <Input type="textarea" {...props} />

Input.DropDown = (props) => {
  delete props.size
  return <select {...props} />
}

Input.List = (props) => {
  if (!props.size) props.size = 10
  if (props.size === 1) props.size++
  return <select {...props} />
}

function Link (props) {
  const newProps = Object.assign({}, props)
  delete newProps.title
  return <a {...newProps}>{props.title}</a>
}

export {Button, Input, Link}
