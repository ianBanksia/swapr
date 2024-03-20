import { Clarinet, Tx, types } from 'https://deno.land/x/clarinet@v0.6.0/index.ts'
// import { Clarinet, Tx, types } from './clarinet.ts'
import { assertEquals, assertExists } from 'https://deno.land/std@0.90.0/testing/asserts.ts'
import { unwrapList, unwrapOK, unwrapTuple, unwrapUInt, parse } from './utils.js'

Clarinet.test({
  name: "Ensure that <...> - swapr",
  async fn(chain, accounts) {
    const wallet_1 = accounts.get("wallet_1")
    const wallet_2 = accounts.get("wallet_2")

    const asset_map = chain.getAssetsMaps()
    console.log("asset_map", asset_map)

    let block = chain.mineBlock([

      Tx.contractCall('swapr', 'create-pair', [
        types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.plaid-token'),
        types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.stx-token'),
        types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.plaid-stx-token'),
        types.ascii('plaid-stx-token'),
        types.uint(10000000),
        types.uint(15000000),
      ], wallet_1.address),

    ])
    assertEquals(block.receipts.length, 1)
    assertEquals(block.height, 2)



    block.receipts[0].result.expectOk().expectBool(true);

    const result_get_pair_count = chain.callReadOnlyFn('swapr', 'get-pair-count', [], wallet_1.address).result
    const count = result_get_pair_count.expectOk().expectUint(1)

    const result_get_pair_contracts = chain.callReadOnlyFn('swapr', 'get-pair-contracts', [types.uint(1)], wallet_1.address).result
    const pair1 = result_get_pair_contracts.expectTuple()

    pair1['token-x'].expectPrincipal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.plaid-token')
    pair1['token-y'].expectPrincipal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.stx-token')

    const result_get_pair_details = chain.callReadOnlyFn('swapr', 'get-pair-details', [types.principal(pair1['token-x']), types.principal(pair1['token-y'])], wallet_1.address).result
    const pair1_details = result_get_pair_details.expectTuple()

    pair1_details['balance-x'].expectUint(10000000)
    pair1_details['balance-y'].expectUint(15000000)
    pair1_details['fee-balance-x'].expectUint(0)
    pair1_details['fee-balance-y'].expectUint(0)
    pair1_details['fee-to-address'].expectNone()
    pair1_details.name.expectAscii('plaid-stx-token')
    pair1_details['shares-total'].expectUint(12247448)
    pair1_details['swapr-token'].expectPrincipal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.plaid-stx-token')


    const result_pair1_get_balances = chain.callReadOnlyFn('swapr', 'get-balances', [types.principal(pair1['token-x']), types.principal(pair1['token-y'])], wallet_1.address).result
    const pair1_balances = result_pair1_get_balances.expectOk().expectList()
    pair1_balances[0].expectUint(10000000)
    pair1_balances[1].expectUint(15000000)

    const result_stx_token_balance_1 = chain.callReadOnlyFn('stx-token', 'get-balance-of', [types.principal(wallet_1.address)], wallet_1.address).result
    const stx_token_balance_1 = result_stx_token_balance_1.expectOk().expectUint(999985000000)

    const result_plaid_token_balance_1 = chain.callReadOnlyFn('plaid-token', 'get-balance-of', [types.principal(wallet_1.address)], wallet_1.address).result
    const plaid_token_balance_1 = result_plaid_token_balance_1.expectOk().expectUint(999999900000)

    block = chain.mineBlock([

      // swap-x-for-y (token-x-trait <sip-010-token>) (token-y-trait <sip-010-token>) (dx uint) (min-dy uint)
      Tx.contractCall('swapr', 'swap-x-for-y', [
        types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.plaid-token'),
        types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.stx-token'),
        types.uint(10000),
        types.uint(14900),
      ], wallet_1.address),

    ])
    assertEquals(block.receipts.length, 1)
    assertEquals(block.height, 3)

    const swap_result = block.receipts[0].result.expectOk().expectList();
    swap_result[0].expectUint(10000)
    swap_result[1].expectUint(14940)

    const result_pair1_get_balances_2 = chain.callReadOnlyFn('swapr', 'get-balances', [types.principal(pair1['token-x']), types.principal(pair1['token-y'])], wallet_1.address).result
    const pair1_balances_2 = result_pair1_get_balances_2.expectOk().expectList()
    pair1_balances_2[0].expectUint(10010000)
    pair1_balances_2[1].expectUint(14985060)

    const result_stx_token_balance_2 = chain.callReadOnlyFn('stx-token', 'get-balance-of', [types.principal(wallet_1.address)], wallet_1.address).result
    const plaid_balance_2 = result_stx_token_balance_2.expectOk().expectUint(999985014940)
    const result_plaid_token_balance_2 = chain.callReadOnlyFn('plaid-token', 'get-balance-of', [types.principal(wallet_1.address)], wallet_1.address).result
    const stx_balance_2 = result_plaid_token_balance_2.expectOk().expectUint(99999989990000)

    assertEquals(plaid_balance_2 - plaid_token_balance_1, -14885060)
    assertEquals(stx_balance_2 - stx_token_balance_1, 99000004990000)

    block = chain.mineBlock([

      // swap-x-for-y (token-x-trait <sip-010-token>) (token-y-trait <sip-010-token>) (dx uint) (min-dy uint)
      Tx.contractCall('swapr', 'swap-y-for-x', [
        types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.plaid-token'),
        types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.stx-token'),
        types.uint(30000),
        types.uint(19900),
      ], wallet_1.address),

    ])
    assertEquals(block.receipts.length, 1)
    assertEquals(block.height, 4)

    const swap_result_3 = block.receipts[0].result.expectOk().expectList();
    swap_result_3[0].expectUint(19940)
    swap_result_3[1].expectUint(30000)


    const result_pair1_get_balances_3 = chain.callReadOnlyFn('swapr', 'get-balances', [types.principal(pair1['token-x']), types.principal(pair1['token-y'])], wallet_1.address).result
    const pair1_balances_3 = result_pair1_get_balances_3.expectOk().expectList()
    pair1_balances_3[0].expectUint(9990060)
    pair1_balances_3[1].expectUint(15015060)

    block = chain.mineBlock([

      Tx.contractCall('swapr', 'add-to-position', [
        types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.plaid-token'),
        types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.stx-token'),
        types.principal('ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE.plaid-stx-token'),
        types.uint(5000000),
        types.uint(7500000),
      ], wallet_2.address),

    ])
    assertEquals(block.receipts.length, 1)
    assertEquals(block.height, 5)

    const result_plaid_stx_token_balance_wallet1 = chain.callReadOnlyFn('plaid-stx-token', 'get-balance-of', [types.principal(wallet_1.address)], wallet_1.address).result
    const result_plaid_stx_token_balance_wallet2 = chain.callReadOnlyFn('plaid-stx-token', 'get-balance-of', [types.principal(wallet_2.address)], wallet_2.address).result
    console.log("result_plaid_stx_token_balance_wallet1", result_plaid_stx_token_balance_wallet1)
    console.log("result_plaid_stx_token_balance_wallet2", result_plaid_stx_token_balance_wallet2)
    const result_pair1_get_balances_4 = chain.callReadOnlyFn('swapr', 'get-balances', [types.principal(pair1['token-x']), types.principal(pair1['token-y'])], wallet_1.address).result
    console.log("result_pair1_get_balances_4", result_pair1_get_balances_4)
    const pair1_balances_4 = result_pair1_get_balances_4.expectOk().expectList()
    pair1_balances_4[0].expectUint(5000000 + 9990060)
    pair1_balances_4[1].expectUint(Math.floor(5000000 * 15015060 / 9990060) + 15015060)  //(/ (* x balance-y) balance-x)



// result_pair1_get_balances_4 (ok [u14990060, u22530059])
    // assertEquals()
    // TODO(psq): need multiple tests adding a bunch of liquidity, then try to withdraw everything is different order (biggests first, smallests first, ...)

  },
})
