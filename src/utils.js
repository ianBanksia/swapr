const {
  ClarityParseError,
  NoLiquidityError,
  NotOwnerError,
  NotOKErr,
  NotSomeErr,
} = require('./errors.js')

function parse(value) {
  let index = 0
  function sub() {
    const keywords = []
    let current = index
    function saveKeyword() {
      if (index - 1 > current) {
        // @ts-ignore
        keywords.push(value.slice(current, index - 1))
      }
    }
    while (index < value.length) {
      const c = value[index++]
      // console.log("c", c, index)
      if (c === '(') {
        // @ts-ignore
        keywords.push(sub())
        current = index
      } else if (c === ')') {
        saveKeyword()
        return keywords
      } else if (c === ' ') {
        saveKeyword()
        current = index
      }
    }
    saveKeyword()
    return keywords
  }
  return sub()[0]
}

function unwrapList(tree) {
  // console.log("unwrapList", tree)
  return tree
}

function unwrapXYList(tree) {
  // console.log("unwrapXYList", tree)
  return {
    x: parseInt(tree[0].substring(1)),
    y: parseInt(tree[1].substring(1)),
  }
}

function unwrapSome(tree) {
  // console.log("unwrapSome", tree)
  if (tree[0] === 'some') {
    return tree[1]
  } else {
    throw NotSomeErr
  }
}

function unwrapOK(tree) {
  // console.log("unwrapOK", tree)
  if (tree[0] === 'ok') {
    return tree[1]
  } else {
    throw NotOKErr
  }
}

function replaceString(body, original, replacement) {
  const regexp = new RegExp(original, 'g')  // limited to principal and contract names with . and - should work
  return body.replace(regexp, replacement)
}

module.exports = {
  parse,
  unwrapList,
  unwrapXYList,
  unwrapSome,
  unwrapOK,
  replaceString,
}