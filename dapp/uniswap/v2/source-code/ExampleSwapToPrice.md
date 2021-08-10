---
title: ExampleSwapToPrice
date: 2021-03-14
categories:
 - 智能合约
 - Uniswap
tags:
 - 智能合约
 - Uniswap
---

[ExampleSwapToPrice](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleSwapToPrice.sol)合约的主要目的就是通过交易，让UniswapV2交易对里的资产价格和外部价格达成一致，形成套利形为，使交易的利益最大化。当然，因为这里进行了套利，所以做市商会有无常损失，不过套利形成交易对内外价格一致却是提供价格预言机的基础。

## ExampleSwapToPrice源码
<<< @/dapp/uniswap/v2/source-code/contracts/periphery/examples/ExampleSwapToPrice.sol

## ExampleSwapToPrice源码解析

### 1. computeProfitMaximizingTrade函数
```sol
// computes the direction and magnitude of the profit-maximizing trade
function computeProfitMaximizingTrade(
  uint256 truePriceTokenA,
  uint256 truePriceTokenB,
  uint256 reserveA,
  uint256 reserveB
) pure internal returns (bool aToB, uint256 amountIn) {
  aToB = FullMath.mulDiv(reserveA, truePriceTokenB, reserveB) < truePriceTokenA;

  uint256 invariant = reserveA.mul(reserveB);

  uint256 leftSide = Babylonian.sqrt(
      FullMath.mulDiv(
          invariant.mul(1000),
          aToB ? truePriceTokenA : truePriceTokenB,
          (aToB ? truePriceTokenB : truePriceTokenA).mul(997)
      )
  );
  uint256 rightSide = (aToB ? reserveA.mul(1000) : reserveB.mul(1000)) / 997;

  if (leftSide < rightSide) return (false, 0);

  // compute the amount that must be sent to move the price to the profit-maximizing price
  amountIn = leftSide.sub(rightSide);
}
```
computeProfitMaximizingTrade函数是[UniswapV2LiquidityMathLibrary](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/libraries/UniswapV2LiquidityMathLibrary.sol)合约的核心函数，用于计算交易的方向和最大利益时的交易量。我们来详细看这个函数：
* 函数输入参数为外部价格A，外部价格B，交易对中A的数量，交易对中B的数量。注意，这里的外部价格A和B是以A和B的比值表示的，和我们平常理解的价格有所不同。例如A/B = 2/1（代表两个A才可以兑换一个B），那么这里truePriceTokenA就是2，truePriceTokenB就是1。
* 函数的返回值：第一个aToB返回是否卖出A，买进B，也就是交易方向为 A => B。第二个amountIn返回卖出的资产数量。
* 函数的第一行比较两种价格的比值来确定是交易对内是A贵了还是B贵了。假定reserveA/reserveB < truePriceTokenA/truePriceTokenB，这说明什么呢？它说明在交易对里，不需要那么多的A就可以兑换相同数量的B了（例如为reserveA/reserveB = 1.5）。那么在内部A就要贵一些，使用1.5个A就能兑换一个B（在较小的区间内近似），而外部2个A才能兑换一个B。如果A贵了就会在交易对内卖出A，反之则卖出B。但函数的第一行却没有采用这个方式计算，使用了将truePriceTokenB乘到左边去再比较（显然truePriceTokenB > 0）。为什么这么做呢？个人觉得可能是为了提高精度，因为除法为地板除，乘于某个数再除会提高计算精度（参见UniswapV2中价格为uq112x112设计）。
* 函数的第二行计算当前恒定乘积的值。
* 函数的第三行，计算价格比例达到外部价格时，此时卖出的那种资产在恒定乘积中的数量。
* 函数的第四行，卖出的那种资产在恒定乘积中的初始数量。
* 最后一行，两者的差值就是卖进的数量。但为什么结果会有1000，997之类的，是因为这里要计算手续费，所以是原输入的1000/997。

其实这里leftside为什么这么算笔者还没有研究清楚，在github上也未看到答案，只能暂时跳过去,等以后哪天突然开悟了。
这里的测试见test目录下的ExampleSwapToPrice.spec.ts。

### 2. swapToPrice函数
swapToPrice函数，外部接口。主要功能利用上面的computeProfitMaximizingTrade函数计算出卖出的资产值，然后再验证是否符合用户要求。最后将符合要求后的值作为参数，调用Router合约的[swapExactTokensForTokens](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/UniswapV2Router02.sol#L224)方法进行交易。这中间还有授权，转移资产等，就不再详细介绍了。

## 引用及知识拓展
* [充分利用 CREATE2](https://ethfans.org/posts/getting-the-most-out-of-create2)
* [CREATE2 在广义状态通道中的使用](https://learnblockchain.cn/2019/10/23/create2-statechannel/)
* [CREATE2](https://ctf-wiki.org/blockchain/ethereum/attacks/create2/)
* [Solidity原理（三）：abi编码以及与EVM交互的原理](https://blog.csdn.net/Programmer_CJC/article/details/80190058?utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromMachineLearnPai2%7Edefault-1.control&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromMachineLearnPai2%7Edefault-1.control)
* [solidity学习过程 --- abi编码](https://blog.csdn.net/qq_35434814/article/details/104682616)