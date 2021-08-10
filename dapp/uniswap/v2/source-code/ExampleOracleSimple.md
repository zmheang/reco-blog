---
title: ExampleOracleSimple
date: 2021-02-21
categories:
 - 智能合约
 - Uniswap
tags:
 - 智能合约
 - Uniswap
---

[ExampleOracleSimple](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleOracleSimple.sol)是一个以UniswapV2交易对作为价格预言机的示例合约。由于智能合约没有定时机制，所以必须每隔一段时间（周期）来更新价格。

因为这一个示例合约涉及到了[UniswapV2](/uniswap/v2/source-code/)中的价格表示，希望没有读过UniswapV2介绍的读者能读一下，对它的价格机制有一个大致了解。同时也需要阅读一下序列文章中核心合约学习中交易对学习的[UniswapV2Pair](/uniswap/v2/source-code/UniswapV2Pair)章节，那里面对价格计算及溢出机制有详细的学习。

## ExampleOracleSimple源码
<<< @/dapp/uniswap/v2/source-code/contracts/periphery/examples/ExampleOracleSimple.sol

## ExampleOracleSimple源码解析

### 1. 注入浮点数工具库
```sol
using FixedPoint for *;
```
在所有类型上使用[自定义浮点数工具库函数](https://github.com/Uniswap/uniswap-lib/blob/master/contracts/libraries/FixedPoint.sol)，实际上是在几个整数类型（结构）上使用。

### 2. 平均价格的取值周期
```sol
uint public constant PERIOD = 24 hours;
```
定义平均价格的取值周期，周期太短是无法反映一段时间的平均价格的，这个取值多少可以自己定义。注意本行中出现的hours是时间单位，就是字面值1小时，转化成秒就是3600秒。当然这里是整数，只是取的数值，没有后面的秒。

### 3. 构造器
```sol
constructor(address factory, address tokenA, address tokenB) public {
    IUniswapV2Pair _pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, tokenA, tokenB));
    pair = _pair;
    token0 = _pair.token0();
    token1 = _pair.token1();
    price0CumulativeLast = _pair.price0CumulativeLast(); // fetch the current accumulated price value (1 / 0)
    price1CumulativeLast = _pair.price1CumulativeLast(); // fetch the current accumulated price value (0 / 1)
    uint112 reserve0;
    uint112 reserve1;
    (reserve0, reserve1, blockTimestampLast) = _pair.getReserves();
    require(reserve0 != 0 && reserve1 != 0, 'ExampleOracleSimple: NO_RESERVES'); // ensure that there's liquidity in the pair
}
```
constructor构造器，输入参数为V2版本的factory地址和交易对的两种代币地址。
* 1-2行先由工具库函数计算交易对的地址，然后实例化成一个临时变量，再将临时变量赋值给状态变量。为什么要使用一个临时变量，个人猜想是因为后面要参与到大量计算，不用重复读取状态变量，可以节省gas吧（类似的用法在前面的学习中例如核心合约学习多次出现）。
* 3-4行获取交易对排过序的两种代币地址并赋值给相应状态变量。这里和构造器参数输入的代币地址略有不同，输入的地址是乱序的；这里得到的是排过充的，其中token0对应的就是price0,amount0,reserve0等等。
* 5-6行获取当前交易对两种资产（ERC20代币）的价格，注意价格为一个比值。
* 7-9行用来获取当前交易对两种资产值及最近更新的区块时间（就是合约部署时最近更新价格的区块时间）。因为使用元组赋值，元组内的变量必须提前定义。
* 最后一行注释讲了，该交易对必须有流动性，不能为空交易对。

> 由参数我们可以看出，当前合约只是追踪了当前factory中的token0和token1交易对之间的价格比。也就是只记录了一个交易对的价格。当需要记录其他价格的时候，则需要重新部署合约。

### 4. update函数
```sol
function update() external {
  (uint price0Cumulative, uint price1Cumulative, uint32 blockTimestamp) =
      UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
  uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

  // ensure that at least one full period has passed since the last update
  require(timeElapsed >= PERIOD, 'ExampleOracleSimple: PERIOD_NOT_ELAPSED');

  // overflow is desired, casting never truncates
  // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
  price0Average = FixedPoint.uq112x112(uint224((price0Cumulative - price0CumulativeLast) / timeElapsed));
  price1Average = FixedPoint.uq112x112(uint224((price1Cumulative - price1CumulativeLast) / timeElapsed));

  price0CumulativeLast = price0Cumulative;
  price1CumulativeLast = price1Cumulative;
  blockTimestampLast = blockTimestamp;
}
```
update函数，用来更新记录的平均价格。通过外部调用来更新记录最新的价格。
* 1-2行使用库函数来计算交易对当前区块的两种累计价格和获取当前区块时间（具体实现逻辑需要查看[UniswapV2OracleLibrary](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/libraries/UniswapV2OracleLibrary.sol)合约源码）。这个为什么使用库函数计算呢，因为交易对的记录的是上一次发生交易所在区块的累计价格和区块时间，并不是当前区块的（因为当前区块可能在查询时还未发生过交易对的交易）。在UniswapV2OracleLibrary对应的函数中有将这个区块差补上来的逻辑，注意，价格累计在每个交易区块只更新一次。
* 第3行用计算当前区块时间和上一次本合约记录的区块时间间隔，注意它是考虑到溢出了的。详情见序列文章中核心合约交易对的学习。
* 第4行验证这个时间间隔必须大于一个周期。必须统计超过一个周期的价格平均值。
* 5-6行来更新当前价格平均值（平均价格由累计价格差值除于时间差值得到）。注意FixedPoint.uq112x112()语法代表实例化一个结构。uint224()语法代表类型转换。这里注释也讲了，直接使用了截断来转化为价格，为什么这么做呢？参考一下交易对合约学习中的分析，因为就算有溢出，平均价格的计算总是正确的，而平均价格为uq112x112类型，高位用不上（累计价格高位用得上，代表溢出），所以这里直接截断转化为uint224类型（个人理解也许不对）。
* 7-9行更新当前合约保存的最新的价格累计值及最近更新区块时间。

### 5. consult函数
```sol
// note this will always return 0 before update has been called successfully for the first time.
function consult(address token, uint amountIn) external view returns (uint amountOut) {
  if (token == token0) {
      amountOut = price0Average.mul(amountIn).decode144();
  } else {
      require(token == token1, 'ExampleOracleSimple: INVALID_TOKEN');
      amountOut = price1Average.mul(amountIn).decode144();
  }
}
```
consult函数是价格查询函数，利用当前保存的最新平均价格，输入一种代币的数量（和地址），计算另一种代币的数量。函数使用了一个if - else语句来判断输入的代币是token0还是token1，使用相应的平均价格计算。注意，这里计算的结果还有模拟的小数部分，因为最后输出必须为一个整数（代币数量为uint系列类型，没有小数，注意不要和精度的概念弄混），所以调用了decode144()函数，直接将模拟小数的较低112位移走了（右移112位）。

注意这里的语法price1Average.mul(amountIn).decode144()中的mul，它不是普通SafeMath中的用于uint的mul，而是FixedPoint中自定义的mul。它返回一个uq144x112，所以才能接着调用decode144函数。

## 引用及知识拓展
* [充分利用 CREATE2](https://ethfans.org/posts/getting-the-most-out-of-create2)
* [CREATE2 在广义状态通道中的使用](https://learnblockchain.cn/2019/10/23/create2-statechannel/)
* [CREATE2](https://ctf-wiki.org/blockchain/ethereum/attacks/create2/)
* [Solidity原理（三）：abi编码以及与EVM交互的原理](https://blog.csdn.net/Programmer_CJC/article/details/80190058?utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromMachineLearnPai2%7Edefault-1.control&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromMachineLearnPai2%7Edefault-1.control)
* [solidity学习过程 --- abi编码](https://blog.csdn.net/qq_35434814/article/details/104682616)