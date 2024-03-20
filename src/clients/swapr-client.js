import clarity from '@blockstack/clarity'

const { Client, Provider, Receipt, Result } = clarity

import {
  ClarityParseError,
  NoLiquidityError,
  NotOwnerError,
  NotOKErr,
  NotSomeErr,
} from '../errors.js'

import {
  parse,
  unwrapXYList,
  unwrapSome,
  unwrapOK,
} from '../utils.js'

export class SwaprClient extends Client {
  constructor(provider) {
    super(
      'SP138CBPVKYBQQ480EZXJQK89HCHY32XBQ0T4BCCD.swapr',
      './clarinet/contracts/swapr',
      provider
    )
  }

  async createPair(token_x, token_y, token_swapr, name, x, y, params) {
    console.log("createPair", token_x, token_y, token_swapr, name, x, y)
    const tx = this.createTransaction({
      method: { name: "create-pair", args: [`'${token_x}`, `'${token_y}`, `'${token_swapr}`, `"${name}"`, `u${x}`, `u${y}`] }
      })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log(receipt)
    console.log(receipt.debugOutput)
    const result = Result.unwrap(receipt)
    return result.startsWith('Transaction executed and committed. Returned: true')
  }

  async addToPosition(token_x, token_y, token_swapr, x, y, params) {
    const tx = this.createTransaction({
      method: { name: "add-to-position", args: [`'${token_x}`, `'${token_y}`, `'${token_swapr}`, `u${x}`, `u${y}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log(receipt.debugOutput)
    const result = Result.unwrap(receipt)
    return result.startsWith('Transaction executed and committed. Returned: true')
  }

  async reducePosition(percent, params) {
    const tx = this.createTransaction({
      method: { name: "reduce-position", args: [`u${percent}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log("debugOutput", receipt.debugOutput)
    const result = Result.unwrap(receipt)

    if (result.startsWith('Transaction executed and committed. Returned: ')) {
      const start_of_list = result.substring('Transaction executed and committed. Returned: '.length)  // keep a word so unwrapXYList will behave like it was with 'ok'
      const parsed = parse(start_of_list.substring(0, start_of_list.indexOf(')') + 1))
      return unwrapXYList(parsed)
    }
    throw new NotOKErr()
  }

  async swapXforY(dx, params) {
    const tx = this.createTransaction({
      method: { name: "swap-x-for-y", args: [`u${dx}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log("debugOutput", receipt.debugOutput)
    const result = Result.unwrap(receipt)

    if (result.startsWith('Transaction executed and committed. Returned: ')) {
      const start_of_list = result.substring('Transaction executed and committed. Returned: '.length)  // keep a word so unwrapXYList will behave like it was with 'ok'
      const parsed = parse(start_of_list.substring(0, start_of_list.indexOf(')') + 1))
      return unwrapXYList(parsed)
    }
    throw new NotOKErr()
  }

  async swapXforExactY(dy, params) {
    const tx = this.createTransaction({
      method: { name: "swap-x-for-exact-y", args: [`u${dy}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log("debugOutput", receipt.debugOutput)
    const result = Result.unwrap(receipt)

    if (result.startsWith('Transaction executed and committed. Returned: ')) {
      const start_of_list = result.substring('Transaction executed and committed. Returned: '.length)  // keep a word so unwrapXYList will behave like it was with 'ok'
      const parsed = parse(start_of_list.substring(0, start_of_list.indexOf(')') + 1))
      return unwrapXYList(parsed)
    }
    throw new NotOKErr()
  }

  async swapYforX(dy, params) {
    const tx = this.createTransaction({
      method: { name: "swap-y-for-x", args: [`u${dy}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log("debugOutput", receipt.debugOutput)
    const result = Result.unwrap(receipt)

    if (result.startsWith('Transaction executed and committed. Returned: ')) {
      const start_of_list = result.substring('Transaction executed and committed. Returned: '.length)  // keep a word so unwrapXYList will behave like it was with 'ok'
      const parsed = parse(start_of_list.substring(0, start_of_list.indexOf(')') + 1))
      return unwrapXYList(parsed)
    }
    throw new NotOKErr()
  }

  async swapYforExactX(dx, params) {
    const tx = this.createTransaction({
      method: { name: "swap-y-for-exact-x", args: [`u${dx}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    console.log("debugOutput", receipt.debugOutput)
    const result = Result.unwrap(receipt)

    if (result.startsWith('Transaction executed and committed. Returned: ')) {
      const start_of_list = result.substring('Transaction executed and committed. Returned: '.length)  // keep a word so unwrapXYList will behave like it was with 'ok'
      const parsed = parse(start_of_list.substring(0, start_of_list.indexOf(')') + 1))
      return unwrapXYList(parsed)
    }
    throw new NotOKErr()
  }

  async positionOf(owner) {
    const query = this.createQuery({
      method: {
        name: 'get-position-of',
        args: [`'${owner}`],
      },
    })
    const receipt = await this.submitQuery(query)
    return Result.unwrapUInt(receipt)
  }

  async balances() {
    const query = this.createQuery({
      method: {
        name: 'get-balances',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    return unwrapXYList(unwrapOK(parse(Result.unwrap(receipt))))
  }

  async positions() {
    const query = this.createQuery({
      method: {
        name: 'get-positions',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    return Result.unwrapUInt(receipt)
  }

  async balancesOf(owner) {
    const query = this.createQuery({
      method: {
        name: 'get-balances-of',
        args: [`'${owner}`],
      },
    })
    const receipt = await this.submitQuery(query)
    // console.log("balancesOf", receipt)
    const result = Result.unwrap(receipt)
    if (result.startsWith('(err')) {
      throw new NoLiquidityError()
    } else {
      return unwrapXYList(unwrapOK(parse(result)))
    }
  }

  async setFeeTo(address, params) {
    const tx = this.createTransaction({
      method: { name: "set-fee-to-address", args: [`'${address}`] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log("receipt", receipt)
    // console.log("debugOutput", receipt.debugOutput)
    if (receipt.success) {
      const result = Result.unwrap(receipt)
      // console.log("result", result)
      if (result.startsWith('Transaction executed and committed. Returned: ')) {
        const start = result.substring('Transaction executed and committed. Returned: '.length)
        const extracted = start.substring(0, start.indexOf('\n'))
        // console.log("extracted", `=${extracted}=`)
        if (extracted === 'true') {
          return true
        }
      }
    }
    throw new NotOwnerError()
  }

  async resetFeeTo(params) {
    const tx = this.createTransaction({
      method: { name: "reset-fee-to-address", args: [] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log("receipt", receipt)
    // console.log("debugOutput", receipt.debugOutput)
    if (receipt.success) {
      const result = Result.unwrap(receipt)
      // console.log("result", result)
      if (result.startsWith('Transaction executed and committed. Returned: ')) {
        const start = result.substring('Transaction executed and committed. Returned: '.length)
        const extracted = start.substring(0, start.indexOf('\n'))
        // console.log("extracted", `=${extracted}=`)
        if (extracted === 'true') {
          return true
        }
      }
    }
    throw new NotOwnerError()
  }

  async collectFees(params) {
    const tx = this.createTransaction({
      method: { name: "collect-fees", args: [] }
    })
    await tx.sign(params.sender)
    const receipt = await this.submitTransaction(tx)
    // console.log("receipt", receipt)
    console.log("debugOutput", receipt.debugOutput)
    if (receipt.success) {
      const result = Result.unwrap(receipt)
      // console.log("result", result)
      if (result.startsWith('Transaction executed and committed. Returned: ')) {
        const start_of_list = result.substring('Transaction executed and committed. Returned: '.length)  // keep a word so unwrapXYList will behave like it was with 'ok'
        const parsed = parse(start_of_list.substring(0, start_of_list.indexOf(')') + 1))
        return unwrapXYList(parsed)
      }
    }
    throw new NotOwnerError()
  }

  async getFeeTo() {
    const query = this.createQuery({
      atChaintip: true,
      method: { name: "get-fee-to-address", args: [] }
    })
    const result = await this.submitQuery(query)
    // console.log("getFeeTo", Result.unwrap(result))
    const value = unwrapOK(parse(Result.unwrap(result)))
    return (value === 'none' ? null : unwrapSome(value))
  }

  async fees() {
    const query = this.createQuery({
      method: {
        name: 'get-fees',
        args: [],
      },
    })
    const receipt = await this.submitQuery(query)
    return unwrapXYList(unwrapOK(parse(Result.unwrap(receipt))))
  }

}
