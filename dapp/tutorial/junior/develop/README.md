---
title: 前端与智能合约的交互
date: 2019-01-22
categories:
 - DAPP
tags:
 - DAPP开发
 - EOS
 - 智能合约
sticky: 
  - description: 我的文章置顶
  - type: 100
  - sort type: 1
---

## 前端页面
Todolist Dapp 前端页面主要有输入框、添加事项按钮、事项列表展示框、完成和删除按钮等。基本样式如下：

获取前端与EOS智能合约交互的项目代码请点击[vue_js_vuex_eos](https://github.com/xiangzhengfeng/todolist/tree/master/vue_js_vuex_eos)或[react_ts_mobx_eos](https://github.com/xiangzhengfeng/todolist/tree/master/react_ts_vuex_eos)

## 合约交互
1. package.json文件中引入eosjs库
```
yarn add eosjs
```

2. 导入Api, JsonRpc等到[config.js](https://github.com/xiangzhengfeng/todolist/tree/master/blob/master/vue_js_vuex_eos/src/api/config.js)中，并配置api和网络等
```javascript
import { Api, JsonRpc } from 'eosjs'
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

const contract = 'yijiaxunkeji';  //部署智能合约的账户名

// jungle testnet
/* const network = {
  blockchain: 'eos',
  protocol: 'https',
  host: 'jungle2.cryptolions.io',  
  port: 443,
  chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
}; */

// kylin testnet
const network = {
  blockchain: 'eos',
  protocol: 'https',
  host: 'kylin.eos.dfuse.io',
  port: 443,
  chainId: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
};

// mainnet
// const network = {
//   blockchain: 'eos',
//   protocol: 'https',
//   host: 'api.eosnewyork.io',
//   port: 80,
//   chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
// };

/* 当前demo由于是在测试网络部署，并且考虑到部分同学注册EOS账户名和操作
钱包插件较为不易。此处使用私钥直接签名，若是EOS主网，请在提交线上仓库之
前删除私钥。否则账户中的资产丢失的风险很大。另外当前的私钥仅仅是EOS的麒
麟测试链的账户，里面的资产没有价值。为了方便其他同学学习，请不要私自更改
私钥。并且当前的私钥仅仅是active权限的，所以希望同学们互相理解。如果有
需要测试链账户的，我可以免费为其进行注册和发送必要的开发的EOS和相关的
ram、net等资源。 */
const defaultPrivateKey = "5JSAusb6xRiunAo5x9qCwk7MMATxLEEKHWDa5FmLpXVLoXBbCsU"; 
// defaultPrivateKey为你的智能合约部署账户的私钥
const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);
const url = network.protocol + '://' + network.host + ':' + network.port;

const rpc = new JsonRpc(url, { fetch })
const api = new Api({
  rpc,
  signatureProvider,
  chainId: network.chainId,
  textDecoder: new TextDecoder(),
  textEncoder: new TextEncoder(),
});

export { api, rpc, network, contract }
```

3. 编写网络请求文件[fetch.js](https://github.com/xiangzhengfeng/blob/master//vue_js_vuex_eos/src/api/fetch.js)
```javascript
import { api, contract, rpc } from "./config"

export const pushAction = async (props) => {
  const {
    actor = contract,
    permission = "active",
    action,
    data,
  } = props
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: actor,
            name: action,
            authorization: [
              {
                actor,
                permission,
              },
            ],
            data,
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    )
    return result
  } catch (error) {
    return {}
  }
}

export const getTableData = async (table, pageKey, pageSize = 15) => {

  try {
    const res = await rpc.get_table_rows({
      json: true,
      code: contract,
      scope: contract,
      table,
      limit: pageSize,
      reverse: true,
      key_type: 'i64',
      upper_bound: pageKey,  //索引参数的上限是什么
      index_position: 1
    })
    return res
  } catch (error) {
    return {}
  }
}
```

4. 编写添加函数和获取表数据的函数等
```javascript
export const add = (content) =>
  pushAction({ action: "add", data: { content } })
    .then((res) => {
      return res
    })

export const remove = (id) =>
  pushAction({ action: "remove", data: { id } })
    .then((res) => {
      return res
    })

export const done = (id) =>
  pushAction({ action: "done", data: { id } })
    .then((res) => {
      return res
    })
```
```javascript
async getTableDataList(next_key) {
  const res = await getTableData('todotable', next_key);
  console.log(res) //打印结果如下
}
```

```javascript
data: {
  more: true
  next_key: "2"
  rows: [
    0: {id: 18, content: "123123", is_done: 0}
    1: {id: 17, content: "11111", is_done: 0}
    2: {id: 15, content: "我的", is_done: 0}
    3: {id: 14, content: "3434", is_done: 0}
    4: {id: 13, content: "的", is_done: 0}
    5: {id: 12, content: "232342", is_done: 0}
    6: {id: 11, content: "12312", is_done: 0}
    7: {id: 10, content: "可能", is_done: 0}
    8: {id: 9, content: "fdsa", is_done: 0}
    9: {id: 8, content: "333", is_done: 0}
    10: {id: 7, content: "啦啦", is_done: 0}
    11: {id: 6, content: "2222", is_done: 0}
    12: {id: 5, content: "哈哈", is_done: 0}
    13: {id: 4, content: "222", is_done: 0}
    14: {id: 3, content: "12", is_done: 0}
  ]
}
```

```javascript
//获取表格函数的参数如下
  code: "yijiaxunkeji"  //合约地址
  index_position: 1  //索引是什么 就是合约中写的那个主索引即primary_key
  json: true
  key_type: "i64"
  limit: 15       //返回的条数
  lower_bound: ""  // 下限
  reverse: true
  scope: "yijiaxunkeji" 
  show_payer: false
  table: "todotable"  //获取的表
  table_key: ""
  upper_bound: ""  //上限  
  /* 
    下一次获取的时候  upper_bound的值就成了上面返回的next_key的'2'，
    意思是从id为2的开始返回，more的值代表了是否获取完了。
  */
```

5. 最终把相应的交互函数和页面按钮点击事件绑定起来，并对功能进行优化，加入分页和下拉刷新、上滑加载更多以及分类显示，一个本地的去中心化应用就完成了。完整代码[请点击此处](https://github.com/xiangzhengfeng/todolist/tree/master/vue_js_vuex_eos)可以获取。

现在，我们已经学习了如何通过前端页面和智能合约交互，但是编写和打包出来的文件如何进一步操作呢？接下来，我们将学习如何通过IPFS的工具包将项目打包出来的文件部署到去中心化网络中。