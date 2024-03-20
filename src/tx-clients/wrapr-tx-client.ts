const BigNum = require('bn.js')
import { readFileSync } from 'fs'
import {
  makeSmartContractDeploy,
  makeContractCall,
  TransactionVersion,
  FungibleConditionCode,

  serializeCV,
  deserializeCV,
  standardPrincipalCV,
  uintCV,

  BooleanCV,
  // PrincipalCV,
  UIntCV,

  ChainID,
  makeStandardSTXPostCondition,
  makeContractSTXPostCondition,
  StacksTestnet,
  broadcastTransaction,

  PostConditionMode,
} from '@stacks/transactions'

import {
  wait,
  waitForTX,
} from '../tx-utils'
import { replaceString } from '../utils'



export class WraprTXClient {
  keys: any
  network: any
  contract_name: string

  constructor(keys, network) {
    this.keys = keys
    this.network = network
    this.contract_name = 'wrapr'
  }

  async deployContract() {
    const fee = new BigNum(2555)
    const contract_wrapr_body = replaceString(readFileSync('./contracts/wrapr.clar').toString(), 'SP2TPZ623K5N2WYF1BWRMP5A93PSBWWADQGKJRJCS', this.keys.stacksAddress)

    console.log("deploying wrapr contract")
    const transaction_deploy_trait = await makeSmartContractDeploy({
      contractName: this.contract_name,
      codeBody: contract_wrapr_body,
      senderKey: this.keys.secretKey,
      network: this.network,
      fee,
      // nonce: new BigNum(0),
    })
    const tx_id = await broadcastTransaction(transaction_deploy_trait, this.network)
    const tx = await waitForTX(this.network.coreApiUrl, tx_id, 10000)

    const result = deserializeCV(Buffer.from(tx.tx_result.hex.substr(2), "hex"))
    return result
  }

  async wrap( amount: number, params: { keys_sender: any }) {
    console.log("wrap", params.keys_sender.stacksAddress, amount)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "wrap",
      functionArgs: [uintCV(amount)],
      senderKey: params.keys_sender.secretKey,
      network: this.network,
      postConditions: [
        makeStandardSTXPostCondition(
          params.keys_sender.stacksAddress,
          FungibleConditionCode.Equal,
          new BigNum(amount)
        ),
        // makeStandardFungiblePostCondition(
        // ),
      ],
      fee,
      // nonce: new BigNum(0),
    })
    const tx_id = await broadcastTransaction(transaction, this.network)
    const tx = await waitForTX(this.network.coreApiUrl, tx_id, 10000)

    const result = deserializeCV(Buffer.from(tx.tx_result.hex.substr(2), "hex"))
    return result
  }

  async unwrap(amount: number, params: { keys_sender: any }) {
    console.log("unwrap", params.keys_sender.stacksAddress, amount)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "unwrap",
      functionArgs: [uintCV(amount)],
      senderKey: params.keys_sender.secretKey,
      network: this.network,
      postConditionMode: PostConditionMode.Allow,
      postConditions: [
        // makeStandardSTXPostCondition(  // TODO(psq): should be the other way around
        //   keys_sender.stacksAddress,
        //   FungibleConditionCode.Equal,
        //   new BigNum(amount)
        // ),
        // makeStandardFungiblePostCondition(
        // ),
      ],
      fee,
      // nonce: new BigNum(0),
    })
    const tx_id = await broadcastTransaction(transaction, this.network)
    const tx = await waitForTX(this.network.coreApiUrl, tx_id, 10000)

    const result = deserializeCV(Buffer.from(tx.tx_result.hex.substr(2), "hex"))
    return result
  }

  async transfer(key_recipient, amount: number, params: { keys_sender: any }) {
    console.log("transfer", key_recipient.stacksAddress, amount, params.keys_sender.stacksAddress)
    const fee = new BigNum(256)
    const transaction = await makeContractCall({
      contractAddress: this.keys.stacksAddress,
      contractName: this.contract_name,
      functionName: "transfer",
      functionArgs: [standardPrincipalCV(key_recipient.stacksAddress), uintCV(amount)],
      senderKey: params.keys_sender.secretKey,
      network: this.network,
      postConditionMode: PostConditionMode.Allow,
      postConditions: [
        // makeStandardSTXPostCondition(  // TODO(psq): should be the other way around
        //   keys_sender.stacksAddress,
        //   FungibleConditionCode.Equal,
        //   new BigNum(amount)
        // ),
        // makeStandardFungiblePostCondition(
        // ),
      ],
      fee,
      // nonce: new BigNum(0),
    })
    const tx_id = await broadcastTransaction(transaction, this.network)
    const tx = await waitForTX(this.network.coreApiUrl, tx_id, 10000)

    const result = deserializeCV(Buffer.from(tx.tx_result.hex.substr(2), "hex"))
    return result
  }

  async totalSupply(params: { keys_sender: any }) {
    console.log("totalSupply with sender", params.keys_sender.stacksAddress)
    const function_name = "get-total-supply"

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"sender":"${params.keys_sender.stacksAddress}","arguments":[]}`,
    }
    const response = await fetch(`${this.network.coreApiUrl}/v2/contracts/call-read/${this.keys.stacksAddress}/${this.contract_name}/${function_name}`, options)

    if (response.ok) {
      const result = await response.json()
      if (result.okay) {
        const result_value = deserializeCV(Buffer.from(result.result.substr(2), "hex"))
        const result_data = result_value as UIntCV
        // console.log(function_name, result_data.value.value.toString())
        // @ts-ignore
        return result_data.value.value
      } else {
        console.log(result)
        return 0
      }
    } else {
      console.log("not 200 response", response)
      throw new Error(`not 200 response ${response}`)
    }
  }

  // read only
  async balanceOf(keys_owner, params: { keys_sender: any }) {
    console.log("balanceOf with sender", keys_owner.stacksAddress, params.keys_sender.stacksAddress)
    const function_name = "balance-of"

    const owner = serializeCV(standardPrincipalCV(keys_owner.stacksAddress))

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"sender":"${params.keys_sender.stacksAddress}","arguments":["0x${owner.toString("hex")}"]}`,
    }
    const response = await fetch(`${this.network.coreApiUrl}/v2/contracts/call-read/${this.keys.stacksAddress}/${this.contract_name}/${function_name}`, options)

    if (response.ok) {
      const result = await response.json()
      if (result.okay) {
        const result_value = deserializeCV(Buffer.from(result.result.substr(2), "hex"))
        const result_data = result_value as UIntCV
        // console.log(function_name, result_data.value.value.toString())
        // @ts-ignore
        return result_data.value.value
      } else {
        console.log(result)
      }
    } else {
      console.log("not 200 response", response)
    }

  }


}

