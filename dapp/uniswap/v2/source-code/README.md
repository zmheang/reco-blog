---
title: Uniswap V2 源码浅析
date: 2021-01-12
categories:
 - Uniswap
tags:
 - Uniswap
---

## Uniswap V2 代码结构

```
Uniswap V2 Code
│
└───uniswap-v2-core
│   │ 
│   └───UniswapV2ERC20.sol
│   └───UniswapV2Pair.sol
│   └───UniswapV2Factory.sol
│   │   
│   └───interfaces
│   │       └───IERC20.sol
│   │       └───IUniswapV2Callee.sol
│   │       └───IUniswapV2ERC20.sol
│   │       └───IUniswapV2Factory.sol
│   │       └───IUniswapV2Pair.sol
│   │
│   └───libraries
│           └───Math.sol
│           └───SafeMath.sol
│           └───UQ112x112.sol
│   
└───uniswap-v2-periphery
    │ 
    └───UniswapV2Migrator.sol
    └───UniswapV2Router01.sol
    └───UniswapV2Router02.sol
    │   
    └───interfaces
    │       └───IERC20.sol
    │       └───IUniswapV2Migrator.sol
    │       └───IUniswapV2Router01.sol
    │       └───IUniswapV2Router02.sol
    │       └───IWETH.sol
    │       │   
    │       └───V1
    │           └───IUniswapV1Exchange.sol
    │           └───IUniswapV1Factory.sol
    │           
    └───libraries
            └───UniswapV2Library.sol
            └───SafeMath.sol
            └───UniswapV2LiquidityMathLibrary.sol
            └───UniswapV2OracleLibrary.sol
```


Uniswap 智能合约代码由两个 github 项目组成。一个是 core，一个是 periphery。

[https://github.com/Uniswap/uniswap-v2-core.git](https://github.com/Uniswap/uniswap-v2-core.git)

[https://github.com/Uniswap/uniswap-v2-periphery.git](https://github.com/Uniswap/uniswap-v2-periphery.git)

core 偏核心逻辑，单个 swap 的逻辑。periphery 偏外围服务，一个个 swap 的基础上构建服务。单个 swap，两种代币形成的交易对，俗称“池子”。每个交易对有一些基本属性：reserve0/reserve1 以及 total supply。reserve0/reserve1 是交易对的两种代币的储存量。total supply 是当前流动性代币的总量。每个交易对都对应一个流动性代币（LPT - liquidity provider token）。简单的说，LPT 记录了所有流动性提供者的贡献。所有流动性代币的总和就是 total supply。Uniswap 协议的思想是 reserve0*reserve1 的乘积不变。

## Uniswap-v2-core
UniswapV2核心合约主要由factory合约（UniswapV2Factory.sol）、交易对模板合约（UniswapV2Pair.sol）及辅助工具库与接口定义等三部分组成。

引用
* [Uniswap - 智能合约 V2 代码导读](https://www.chainnews.com/articles/611741523815.htm)
* [uniswap v2 core源码解析系列](https://www.cnblogs.com/zccst/p/14822893.html)