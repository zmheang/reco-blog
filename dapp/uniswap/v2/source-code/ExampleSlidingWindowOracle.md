---
title: ExampleSlidingWindowOracle
date: 2021-03-07
categories:
 - 智能合约
 - Uniswap
tags:
 - 智能合约
 - Uniswap
---

[ExampleSlidingWindowOracle](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleSlidingWindowOracle.sol)该合约同上一篇文章中学习的[ExampleOracleSimple](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleOracleSimple.sol)合约一样，都是使用UniswapV2做为价格预言机。但两者应用的场景不同:

* ExampleOracleSimple合约用于固定视窗模式，在该模式下历史数据不重要，当前价格拥有历史价格相同的权重。因此，每个周期记录（更新）一次平均价格就可以了。
* ExampleSlidingWindowOracle用于滑动视窗模式，你可以在一个周期内多次记录价格相关信息。滑动视窗模式也分两种类别，一种是简单移动平均值，也就是说每次价格计算都是等权重的。另一种是指数移动平均值，最近的价格计算有更大的权重值。
* 本合约就是简单移动平均值的实现示例。有关使用UniswapV2作为价格预言机的更多内容请阅读其文档[Buiding an Oracle](https://uniswap.org/docs/v2/smart-contract-integration/building-an-oracle/)。该文档也对价格计算中的溢出问题作了详细阐述。

## ExampleSlidingWindowOracle源码
<<< @/dapp/uniswap/v2/source-code/contracts/periphery/examples/ExampleSlidingWindowOracle.sol

## ExampleSlidingWindowOracle源码解析

### 1. 合约注释说明
```sol
// sliding window oracle that uses observations collected over a window to provide moving price averages in the past
// `windowSize` with a precision of `windowSize / granularity`
// note this is a singleton oracle and only needs to be deployed once per desired parameters, which
// differs from the simple oracle which must be deployed once per pair.
contract ExampleSlidingWindowOracle {}
```
滑动视窗采用了观察者模式。观察的窗口大小（时间）为windowSize，精度为windowSize / granularity。这里granularity字面值是粒度，其实也就是阶段的意思。这里假定windowSize为24小时，也就是观察窗口为24小时。粒度为8，那么精度为3小时，也就是一个周期内可以记录8次平均价格，从而更容易看出价格趋势。本合约对于固定的参数来讲，只需要部署一次就行了，是个单例合约。上一篇文章里那个固定视窗模式每个交易对需要部署一个合约。


### 2. 其他状态变量
```sol
address public immutable factory;
// the desired amount of time over which the moving average should be computed, e.g. 24 hours
uint public immutable windowSize;
// the number of observations stored for each pair, i.e. how many price observations are stored for the window.
// as granularity increases from 1, more frequent updates are needed, but moving averages become more precise.
// averages are computed over intervals with sizes in the range:
//   [windowSize - (windowSize / granularity) * 2, windowSize]
// e.g. if the window size is 24 hours, and the granularity is 24, the oracle will return the average price for
//   the period:
//   [now - [22 hours, 24 hours], now]
uint8 public immutable granularity;
// this is redundant with granularity and windowSize, but stored for gas savings & informational purposes.
uint public immutable periodSize;
```
接下来是四个状态变量定义，分别为factory,windowSize,granularity,periodSize。它们的含义分别为V2的factory合约地址、观察的窗口大小、粒度，观察窗口精度（就是窗口大小除以粒度）。这里的注释也提到了不少内容，例如粒度越大，更新的就越频繁，移动平均价格就越精确。还有提到了，本来可以通过granularity 和 windowSize来计算periodSize，但为了更直观和节省gas，也记录为一个状态变量。


### 3. 构造器
```sol
constructor(address factory_, uint windowSize_, uint8 granularity_) public {
  require(granularity_ > 1, 'SlidingWindowOracle: GRANULARITY');
  require(
      (periodSize = windowSize_ / granularity_) * granularity_ == windowSize_,
      'SlidingWindowOracle: WINDOW_NOT_EVENLY_DIVISIBLE'
  );
  factory = factory_;
  windowSize = windowSize_;
  granularity = granularity_;
}
```
* 首先验证粒度不能为0，因为要作除数的。虽然不验证时被零除也会报错重置交易，但使用require涵义更明确。
* 接着验证观察窗口能被粒度整除，同时给periodSize赋值。这个是显然的，不然观察窗口会有空档期了。注意这里的语法，(periodSize = windowSize_ / granularity_) * granularity_ == windowSize_,等式左端使用一个表达式作为乘数。这在某些编程语言里是不受支持的，表达式不能和值混在一起。但是在JavaScript等一系列支持的语言中，表达式左边的值就是表达式的值。虽然在Solidity中很少使用这样的语法，但这说明它也是受支持的。
* 接下来设置前面定义的状态变量的值（观察参数）。注意，granularity为uint8类型的，也就是一个容器内最多可以记录255次，足够了。

> 此处的窗口/容器可以理解成为时间区间，人们用于观察的区间。

### 4. observationIndexOf函数
```sol
// returns the index of the observation corresponding to the given timestamp
function observationIndexOf(uint timestamp) public view returns (uint8 index) {
  uint epochPeriod = timestamp / periodSize;
  return uint8(epochPeriod % granularity);
}
```
函数observationIndexOf，用来获取给定时间的观察者索引。它首先是除于periodSize来得到余数，假定叫着E（也就是包含多少个精度）。因为granularity为uint8大小的，不可能记录下所有E个数据。所以只有取模来循环利用。因为一个uint与uint8操作还是一个uint，所以最后需要转换为uint8。

### 5. getFirstObservationInWindow函数
```sol
// returns the observation from the oldest epoch (at the beginning of the window) relative to the current time
function getFirstObservationInWindow(address pair) private view returns (Observation storage firstObservation) {
  uint8 observationIndex = observationIndexOf(block.timestamp);
  // no overflow issue. if observationIndex + 1 overflows, result is still zero.
  uint8 firstObservationIndex = (observationIndex + 1) % granularity;
  firstObservation = pairObservations[pair][firstObservationIndex];
}
```
getFirstObservationInWindow函数，为一个私有函数。注释中提到是得到当前新窗口的第一个观察者。它的索引在当前区块记录的索引上加了1。

为什么会加1呢，因为观察者是循环的，如果最新的索引加1，那么它位置要么为空，要么就有旧值，有旧值就相当于回到了一个窗口周期内最开始的地方。这个函数用于后面的计算中，这样计算时当前区块时间减去这个窗口周期开始的时间，刚好就是一个窗口周期。

这里防止溢出，采用了取模的方式，当然和直接类型转是等同的。这个在核心合约交易对学习时也有提及。最后需要注意的是，因为它是一个私有函数，内部使用。所以返回了一个storage的Observation类型的变量，这样进行传递时就会传递其引用，避免复制对象的开销。

### 6. update函数
```sol
// update the cumulative price for the observation at the current timestamp. each observation is updated at most
// once per epoch period.
function update(address tokenA, address tokenB) external {
  address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);

  // populate the array with empty observations (first call only)
  for (uint i = pairObservations[pair].length; i < granularity; i++) {
      pairObservations[pair].push();
  }

  // get the observation for the current period
  uint8 observationIndex = observationIndexOf(block.timestamp);
  Observation storage observation = pairObservations[pair][observationIndex];

  // we only want to commit updates once per period (i.e. windowSize / granularity)
  uint timeElapsed = block.timestamp - observation.timestamp;
  if (timeElapsed > periodSize) {
      (uint price0Cumulative, uint price1Cumulative,) = UniswapV2OracleLibrary.currentCumulativePrices(pair);
      observation.timestamp = block.timestamp;
      observation.price0Cumulative = price0Cumulative;
      observation.price1Cumulative = price1Cumulative;
  }
}
```
update函数。更新当前区块观察者的累计价格。注释中提到每个period（精度）最多更新一次。函数参数为交易对的两种代币地址。

* 首先利用UniswapV2工具库计算交易对地址。
* 接下来是一个for循环，如果此时交易对的观察者数组未初始化，则使用空数据初始化。初始化后数组的长度就和granularity相同了，所以就不会再初始化第二次。
* 接下来两行代码获取当前区块记录的观察者信息。
* 接下来timeElapsed用来计算当前区块时间和当前观察者记录的时间差（这里当前记录的时间也可以为0，也就是未记录过）。
* 接下来是一个if语句，用来判断这个时间差是否大于指定的精度（一个精度内最多记录一次）。如果满足条件，则通过UniswapV2工具库计算当前区块的价格累计值并更新当前观察者记录。这样就更新了当前区块观察者的价格累计值及区块时间（如果满足时间间隔要求）。这里还是要注意：观察者是循环利用的，新的会覆盖旧的。

### 7. computeAmountOut函数
```sol
// given the cumulative prices of the start and end of a period, and the length of the period, compute the average
// price in terms of how much amount out is received for the amount in
function computeAmountOut(
  uint priceCumulativeStart, uint priceCumulativeEnd,
  uint timeElapsed, uint amountIn
) private pure returns (uint amountOut) {
  // overflow is desired.
  FixedPoint.uq112x112 memory priceAverage = FixedPoint.uq112x112(
      uint224((priceCumulativeEnd - priceCumulativeStart) / timeElapsed)
  );
  amountOut = priceAverage.mul(amountIn).decode144();
}
```
computeAmountOut函数。也是一个私有函数，利用平均价格计算某种资产得到数量。注意，平均价格的计算方式和上一篇文章中提到的一致，也就是价格累计值差除于时间间隔（和计算平均速度的公式相似）。

### 8. consult查询函数
```sol
// returns the amount out corresponding to the amount in for a given token using the moving average over the time
// range [now - [windowSize, windowSize - periodSize * 2], now]
// update must have been called for the bucket corresponding to timestamp `now - windowSize`
function consult(address tokenIn, uint amountIn, address tokenOut) external view returns (uint amountOut) {
  address pair = UniswapV2Library.pairFor(factory, tokenIn, tokenOut);
  Observation storage firstObservation = getFirstObservationInWindow(pair);

  uint timeElapsed = block.timestamp - firstObservation.timestamp;
  require(timeElapsed <= windowSize, 'SlidingWindowOracle: MISSING_HISTORICAL_OBSERVATION');
  // should never happen.
  require(timeElapsed >= windowSize - periodSize * 2, 'SlidingWindowOracle: UNEXPECTED_TIME_ELAPSED');

  (uint price0Cumulative, uint price1Cumulative,) = UniswapV2OracleLibrary.currentCumulativePrices(pair);
  (address token0,) = UniswapV2Library.sortTokens(tokenIn, tokenOut);

  if (token0 == tokenIn) {
      return computeAmountOut(firstObservation.price0Cumulative, price0Cumulative, timeElapsed, amountIn);
  } else {
      return computeAmountOut(firstObservation.price1Cumulative, price1Cumulative, timeElapsed, amountIn);
  }
}
```
consult查询函数。根据整个窗口期间的平均价格，给定一种代币的数量，计算另一种代币的数量。它的参数分别为输入代币的地址、数量，拟计算的代币的地址。

函数注释中提到了不少信息，例如查询时使用的平均价格的时间范围。另外，对应的时间段必须更新过价格。
* 函数的第一行用来计算交易对地址。
* 第二行得到新窗口第一个观察者。
* 第三行计算当前区块时间和新窗口第一个观察者记录的时间差。
* 第四行验证这个时间差必须小于一个窗口周期，也就是不能太久未更新。
* 第五行用来验证时间差的下限。
* 第六行用来获取当前区块的价格累计差。
* 第七行用来对输入参数的两种代币地址进行排序。
* 函数最后根据输入的是token0还是token1，分别进行获取代币数量的计算。这里什么要用新窗口的第一个索引计算呢，参考getFirstObservationInWindow函数说明。

## 总结
注意：虽然在窗口周期内根据粒度划分了精度（阶段），每个阶段记录了观察者区块时间和当时的累计价格，它的作用一是用来反映价格滑动，二是可以不用同的累计价格点（非固定，相对于上一篇文章的固定累计价格点）来计算平均价格。但平均价格还是计算的一整个窗口期的平均价格，而不是一个精度内的平均价格。

每次查询时，查询的窗口期间就会在period上向右滑动一格（一个粒度），所以很形象的叫着滑动窗口。

使用此类预言机必须每个period都必须更新价格累计值，循环往复；否则窗口期间的开始位置在此period时，会出现查询间隔大于窗口期间的情况，导致查询失败。不过只要再次更新此period的观察者信息，就可以恢复查询了。

## 引用及知识拓展
* [充分利用 CREATE2](https://ethfans.org/posts/getting-the-most-out-of-create2)
* [CREATE2 在广义状态通道中的使用](https://learnblockchain.cn/2019/10/23/create2-statechannel/)
* [CREATE2](https://ctf-wiki.org/blockchain/ethereum/attacks/create2/)
* [Solidity原理（三）：abi编码以及与EVM交互的原理](https://blog.csdn.net/Programmer_CJC/article/details/80190058?utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromMachineLearnPai2%7Edefault-1.control&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromMachineLearnPai2%7Edefault-1.control)
* [solidity学习过程 --- abi编码](https://blog.csdn.net/qq_35434814/article/details/104682616)