---
title: UniswapV2Router02
date: 2021-02-07
categories:
 - 智能合约
 - Uniswap
tags:
 - 智能合约
 - Uniswap
---

[UniswapV2Router02](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/UniswapV2Router02.sol)一个路由智能合约，是无状态的并且不拥有任何代币。 因此必要的时候它们可以安全升级。当发现更高效的合约模式或者添加更多的功能时就可能升级它。因为这个原因，Router合约具有版本号，从01开始，当前推荐的版本是02。而Router2仅仅只是比Router1多了几个函数而已，所以此处只是讲解Router2合约。

## UniswapV2Router02源码
<<< @/dapp/uniswap/v2/source-code/contracts/periphery/UniswapV2Router02.sol

## UniswapV2Router02源码解析

### 1. factory和WETH常量
```sol
address public immutable override factory;
address public immutable override WETH;
```
这两行代码使用两个状态变量分别记录了factory合约的地址和WETH合约的地址。这里有两个关键词immutable和override需要深入学习一下。
* immutable，不可变的。类似别的语言的final变量。也就是它初始化后值就无法再改变了。它和constant（常量）类似，但又有些不同。主要区别在于：常量在编译时就是确定值，而immutable状态变量除了在定义的时候初始化外，还可以在构造器中初始化（合约创建的时候），并且在构造器中只能初始化，是读取不了它们的值的。并不是所有数据类型都可以为immutable变量或者常量的类型，当前只支持值类型和字符串类型(string)。
* override这个很常见。通常用于函数定义中，代表它重写了一个父函数。例如也可以用于函数修饰符来代表它被重写，不过应用于状态变量却稍有不同。
> Public state variables can override external functions if the parameter and return types of the function matches the getter function of the variable:

这句话的意思是：如果external函数的参数和返回值同公共状态变量的getter函数相符的话，这个公共状态变量可以重写该函数。但是状态变量本身却不能被重写。我们来找一下它到底重写了哪个函数，在它实现的接口IUniswapV2Router02中，有这么一个函数定义：
```sol
function factory() external pure returns (address);
```
可见factory公共状态变量重写了其接口的external同名函数。

这里有人可能会问，Router2接口定义中不是没有这个函数吗？因为Router2接口继承了Router1接口，Router1接口定义了该函数，Router2接口就自动拥有该函数。

### 2. receive函数
```sol
receive() external payable {
  assert(msg.sender == WETH); // only accept ETH via fallback from the WETH contract
}
```
receive是一个接收ETH的函数。从Solidity 0.6.0起，没有匿名回调函数了。它拆分成两个，一个专门用于接收ETH，就是这个receive函数。另外一个在找不到匹配的函数时调用，叫fallback函数。该receive函数限定只能从WETH合约直接接收ETH，也就是在WETH提取为ETH时。注意仍然有可以有别的方式来向此合约直接发送以太币，例如设置为矿工地址等，这里不展开阐述。

### 3. _addLiquidity函数和addLiquidity函数
```sol
// **** ADD LIQUIDITY ****
function _addLiquidity(
  address tokenA,
  address tokenB,
  uint amountADesired,
  uint amountBDesired,
  uint amountAMin,
  uint amountBMin
) internal virtual returns (uint amountA, uint amountB) {
  // create the pair if it doesn't exist yet
  if (IUniswapV2Factory(factory).getPair(tokenA, tokenB) == address(0)) {
      IUniswapV2Factory(factory).createPair(tokenA, tokenB);
  }
  (uint reserveA, uint reserveB) = UniswapV2Library.getReserves(factory, tokenA, tokenB);
  if (reserveA == 0 && reserveB == 0) {
      (amountA, amountB) = (amountADesired, amountBDesired);
  } else {
      uint amountBOptimal = UniswapV2Library.quote(amountADesired, reserveA, reserveB);
      if (amountBOptimal <= amountBDesired) {
          require(amountBOptimal >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
          (amountA, amountB) = (amountADesired, amountBOptimal);
      } else {
          uint amountAOptimal = UniswapV2Library.quote(amountBDesired, reserveB, reserveA);
          assert(amountAOptimal <= amountADesired);
          require(amountAOptimal >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
          (amountA, amountB) = (amountAOptimal, amountBDesired);
      }
  }
}

function addLiquidity(
  address tokenA,
  address tokenB,
  uint amountADesired,
  uint amountBDesired,
  uint amountAMin,
  uint amountBMin,
  address to,
  uint deadline
) external virtual override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
  (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
  address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
  TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
  TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
  liquidity = IUniswapV2Pair(pair).mint(to);
}
```
#### _addLiquidity函数。
看名字为增加流动性，为一个internal函数，提供给多个外部接口调用。它主要功能是计算拟向交易对合约注入的代币数量。
* 该函数以下划线开头，根据约定一般它为一个内部函数。六个输入参数分别为交易对中两种代币的地址，计划注入的两种代币数量和注入代币的最小值（否则重置）。返回值为优化过的实际注入的代币数量。
* 函数的前三行，注释说的很清楚，如果交易对不存在（获取的地址为零值），则创建之。
* 函数的第四行获取交易对资产池中两种代币reserve数量，当然如果是刚创建的，就都是0。
* 第五行到结束是一个if - else语句。如果是刚创建的交易对，则拟注入的代币全部转化为流动性，初始流动性计算公式及初始流动性燃烧见我的核心合约学习三那篇文章。如果交易对已经存在，由于注入的两种代币的比例和交易对中资产池中的代币比例可能不同，再用一个if - else语句来选择以哪种代币作为标准计算实际注入数量。（如果比例不同，总会存在一种代币多一种代币少，肯定以代币少的计算实际注入数量）。

这里可以这样理解，假定A/B交易对，然后注入了一定数量的A和B。根据交易对当前的比例，如果以A计算B，B不够，此时肯定不行；只能反过来，以B计算A，这样A就会有多余的，此时才能进行实际注入（这样注入的A和B数量都不会超过拟注入数量）。

那为什么要按交易对的比例来注入两种代币呢？在核心合约学习三那篇文章里有提及，流动性的增加数量是分别根据注入的两种代币的数量进行计算，然后取最小值。如果不按比例交易对比例来充，就会有一个较大值和一个较小值，取最小值流行性提供者就会有损失。如果按比例充，则两种代币计算的结果一样的，也就是理想值，不会有损失。

该函数也涉及到了部分UniswapV2Library库函数的调用，可以看上一篇文章周边合约工具库学习。

#### addLiquidity函数。
学习了前面的_addLiquidity函数，这个就比较好理解了。它是一个external函数，也就是用户调用的接口。函数参数和_addLiquidity函数类似，只是多了一个接收流动性代币的地址和最迟交易时间。

这里deadline从UniswapV1就开始存在了，主要是保护用户，不让交易过了很久才执行，超过用户预期。函数返回值是实际注入的两种代币数量和得到的流动性代币数量。

* 函数的第一行是调用_addLiquidity函数计算需要向交易对合约转移（注入）的实际代币数量。
* 函数的第二行是获取交易对地址（注意，如果交易对不存在，在对_addLiquidity调用时会创建）。注意，它和_addLiquidity函数获取交易对地址略有不同，一个是调用factory合约的接口得到（这里不能使用根据salt创建合约的方式计算得到，因为不管合约是否存在，总能得到该地址）；另一个是根据salt创建合约的方式计算得到。虽然两者用起来都没有问题，个人猜想本函数使用salt方式计算是因为调用的库函数是pure的，不读取状态变量，并且为内部调用，能节省gas；而调用factory合约接口是个外部EVM调用，有额外的开销。个人猜想，未必正确。
* 第三行和第四行是将实际注入的代币转移至交易对。
* 第五行是调用交易对合约的mint函数来给接收者增发流动性。

对于这个合约接口（外部函数），Uniswap文档也提到了三点注意事项：
* 为了覆盖所有场景，调用者需要给该Router合约一定额度的两种代币授权。因为注入的资产为ERC20代币，第三方合约如果不得到授权（或者授权额度不够），就无法转移你的代币到交易对合约中去。
* 总是按理想的比例注入代币（因为计算比例和注入在一个交易内进行），具体取决于交易执行时的价格，这一点在介绍_addLiquidity函数时已经讲了。
* 如果交易对不存在，则会自动创建，拟注入的代币数量就是真正注入的代币数量。

### 4. addLiquidityETH函数
```sol
function addLiquidityETH(
  address token,
  uint amountTokenDesired,
  uint amountTokenMin,
  uint amountETHMin,
  address to,
  uint deadline
) external virtual override payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
  (amountToken, amountETH) = _addLiquidity(
      token,
      WETH,
      amountTokenDesired,
      msg.value,
      amountTokenMin,
      amountETHMin
  );
  address pair = UniswapV2Library.pairFor(factory, token, WETH);
  TransferHelper.safeTransferFrom(token, msg.sender, pair, amountToken);
  IWETH(WETH).deposit{value: amountETH}();
  assert(IWETH(WETH).transfer(pair, amountETH));
  liquidity = IUniswapV2Pair(pair).mint(to);
  // refund dust eth, if any
  if (msg.value > amountETH) TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
}
```
addLiquidityETH函数和addLiquidity函数类似，不过这里有一种初始注入资产为ETH。因为UniswapV2交易对都是ERC20交易对，所以注入ETH会先自动转换为等额WETH（一种ERC20代币，通过智能合约自由兑换，比例1:1）。这样就满足了ERC20交易对的要求，因此真实交易对为WETH/ERC20交易对。

本函数的参数和addLiquidity函数的参数相比，只是将其中一种代币换成了ETH。注意这里没有拟注入的amountETHDesired，因为随本函数发送的ETH数量就是拟注入的数量，所以该函数必须是payable的，这样才可以接收以太币。

* 函数的第一行仍旧是调用_addLiquidity函数来计算优化后的注入代币值。正如前面分析的那样，它使用WETH地址代替另一种代币地址，使用msg.value来代替拟注入的另一种代币（因为WETH与ETH是等额兑换）数量。当然，如果WETH/TOKEN交易对不存在，则先创建之。
* 函数的第二行是获取交易对地址。注意它获取的方式仍然是计算得来。
* 第三行是将其中一种代币token转移到交易对中（转移的数量为由第一行计算得到）
* 第四行是将ETH兑换成WETH，它调用了WETH合约的兑换接口，这些接口在IWETH.sol中定义。兑换的数量也在第一行中计算得到。当然，如果ETH数量不够，则会重置整个交易。
* 第五行将刚刚兑换的WETH转移至交易对合约，注意它直接调用的WETH合约，因此不是授权交易，不需要授权。另外由于WETH合约开源，可以看到该合约代码中转移资产成功后会返回一个true，所以使用了assert函数进行验证。
* 第六行是调用交易对合约的mint方法来给接收者增发流动性。
* 最后一行是如果调用进随本函数发送的ETH数量msg.value有多余的（大于amountETH,也就是兑换成WETH的数量），那么多余的ETH将退还给调用者。

### 5. removeLiquidity函数
```sol
// **** REMOVE LIQUIDITY ****
function removeLiquidity(
  address tokenA,
  address tokenB,
  uint liquidity,
  uint amountAMin,
  uint amountBMin,
  address to,
  uint deadline
) public virtual override ensure(deadline) returns (uint amountA, uint amountB) {
  address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
  IUniswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity); // send liquidity to pair
  (uint amount0, uint amount1) = IUniswapV2Pair(pair).burn(to);
  (address token0,) = UniswapV2Library.sortTokens(tokenA, tokenB);
  (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
  require(amountA >= amountAMin, 'UniswapV2Router: INSUFFICIENT_A_AMOUNT');
  require(amountB >= amountBMin, 'UniswapV2Router: INSUFFICIENT_B_AMOUNT');
}

```
removeLiquidity函数。移除（燃烧）流动性（代币），从而提取交易对中注入的两种代币。该函数的7个参数分别为两种代币地址，燃烧的流动性数量，提取的最小代币数量（保护用户），接收者地址和最迟交易时间。它的返回参数是提取的两种代币数量。该函数是virtual的，可被子合约重写。正如前面所讲，本合约是无状态的，是可以升级和替代的，因此本合约所有的函数都是virtual的，方便新合约重写它。
* 函数的第一行计算两种代币的交易对地址，注意它是计算得来，而不是从factory合约查询得来，所以就算该交易对不存在，得到的地址也不是零地址。
* 函数的第二行调用交易对合约的授权交易函数，将要燃烧的流动性转回交易对合约。如果该交易对不存在，则第一行代码计算出来的合约地址的代码长度就为0，调用其transferFrom函数就会报错重置整个交易，所以这里不用担心交易对不存在的情况。
* 函数的第三行调用交易对的burn函数，燃烧掉刚转过去的流动性代币，提取相应的两种代币给接收者。
* 第四行和第五行是将结果排下序（因为交易对返回的提取代币数量的前后顺序是按代币地址从小到大排序的），使输出参数匹配输入参数的顺序。
* 第六行和第七行是确保提取的数量不能小于用户指定的下限，否则重置交易。为什么会有这个保护呢，因为提取前可以存在多个交易，使交易对的两种代币比值（价格）和数量发生改变，从而达不到用户的预期值。

用户调用该函数之前同样需要给Router合约交易对流动性代币的一定授权额度，因为中间使用到了授权交易transferFrom。

### 6. removeLiquidityETH函数
```sol
function removeLiquidityETH(
    address token,
    uint liquidity,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
) public virtual override ensure(deadline) returns (uint amountToken, uint amountETH) {
    (amountToken, amountETH) = removeLiquidity(
        token,
        WETH,
        liquidity,
        amountTokenMin,
        amountETHMin,
        address(this),
        deadline
    );
    TransferHelper.safeTransfer(token, to, amountToken);
    IWETH(WETH).withdraw(amountETH);
    TransferHelper.safeTransferETH(to, amountETH);
}
```
removeLiquidityETH函数，同removeLiquidity函数类似，函数名多了ETH。它代表着用户希望最后接收到ETH，也就意味着该交易对必须为一个TOKEN/WETH交易对。只有交易对中包含了WETH代币，才能提取交易对资产池中的WETH，然后再将WETH兑换成ETH给接收者。
因为WETH的地址公开且已知，所以函数的输入参数就只有一个ERC20代币地址。相应的，其中的一个Token文字值也换成了ETH。
* 函数的第一行直接调用上一个函数removeLiquidity来进行流动性移除操作，只不过将提取资产的接收地址改为本合约。为什么呢？因为提取的是WETH，用户希望得到ETH，所以不能直接提取给接收者，还要多一步WETH/ETH兑换操作。
> 注意，在调用本合约的removeLiquidity函数过程中，msg.sender保持不变（在另一种智能合约编程语言Vyper语言中，这种场景下msg.sender会发生变化）。
* 函数的第二行将燃烧流动性提取的另一种ERC20代币（非WETH）转移给接收者。
* 第三行将燃烧流动性提取的WETH换成ETH。
* 第四行将兑换的ETH发送给接收乾。

因为调用了removeLiquidity函数，同样需要用户事先进行授权，见removeLiquidity函数分析。

### 7. removeLiquidityWithPermit函数
```sol
function removeLiquidityWithPermit(
    address tokenA,
    address tokenB,
    uint liquidity,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline,
    bool approveMax, uint8 v, bytes32 r, bytes32 s
) external virtual override returns (uint amountA, uint amountB) {
    address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);
    uint value = approveMax ? uint(-1) : liquidity;
    IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
    (amountA, amountB) = removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
}

```
removeLiquidityWithPermit函数。同样也是移除流动性，同时提取交易对资产池中的两种ERC20代币。它和removeLiquidity函数的区别在于本函数支持使用线下签名消息来进行授权验证，从而不需要提前进行授权（这样会有一个额外交易），授权和交易均发生在同一个交易里。参考系列文章中的核心合约学习二中的permit函数学习。
和removeLiquidity函数相比，它输入参数多了bool approveMax及uint8 v, bytes32 r, bytes32 s。approveMax的含义为是否授权为uint256最大值(2 ** 256 -1)，如果授权为最大值，在授权交易时有特殊处理，不再每次交易减少授权额度，相当于节省gas。这个核心合约学习二中也有提及。v,r,s用来和重建后的签名消息一起验证签名者地址，具体见核心合约学习二中的permit函数学习。
* 函数的第一行照例是计算交易对地址，注意不会为零地址。
* 函数的第二行用来根据是否为最大值设定授权额度。
* 函数的第三行调用交易对合约的permit函数进行授权。
* 函数的第四行调用removeLiquidity函数进行燃烧流动性从而提取代币的操作。因为在第三行代码里已经授权了，所以这里和前两个函数有区别，不需要用户提前进行授权了。

### 8. removeLiquidityETHWithPermit函数
```sol
function removeLiquidityETHWithPermit(
    address token,
    uint liquidity,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline,
    bool approveMax, uint8 v, bytes32 r, bytes32 s
) external virtual override returns (uint amountToken, uint amountETH) {
    address pair = UniswapV2Library.pairFor(factory, token, WETH);
    uint value = approveMax ? uint(-1) : liquidity;
    IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
    (amountToken, amountETH) = removeLiquidityETH(token, liquidity, amountTokenMin, amountETHMin, to, deadline);
}

```
removeLiquidityETHWithPermit函数，功能同removeLiquidityWithPermit类似，只不过将最后提取的资产由TOKEN变为ETH。

### 9. removeLiquidityETHSupportingFeeOnTransferTokens函数
```sol
// **** REMOVE LIQUIDITY (supporting fee-on-transfer tokens) ****
function removeLiquidityETHSupportingFeeOnTransferTokens(
    address token,
    uint liquidity,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
) public virtual override ensure(deadline) returns (uint amountETH) {
  (, amountETH) = removeLiquidity(
      token,
      WETH,
      liquidity,
      amountTokenMin,
      amountETHMin,
      address(this),
      deadline
  );
  TransferHelper.safeTransfer(token, to, IERC20(token).balanceOf(address(this)));
  IWETH(WETH).withdraw(amountETH);
  TransferHelper.safeTransferETH(to, amountETH);
}

```
removeLiquidityETHSupportingFeeOnTransferTokens函数。名字很长，从函数名字中可以看到，它支持使用转移的代币支付手续费（支持包含此类代币交易对）。

为什么会有使用转移的代币支付手续费这种提法呢？假定用户有某种代币，他想转给别人，但他还必须同时有ETH来支付手续费，也就是它需要有两种币，转的币和支付手续费的币，这就大大的提高了人们使用代币的门槛。于是有人想到，可不可以使用转移的代币来支付手续费呢？有人也做了一些探索，由此衍生了一种新类型的代币，[ERC865](https://github.com/ethereum/EIPs/issues/865)代币，它也是ERC20代币的一个变种。

然而本合约中的可支付转移手续费的代币却并未指明是ERC865代币，但是不管它是什么代币，我们可以简化为一点：此类代币在转移过程中可能发生损耗（损耗部分发送给第三方以支付整个交易的手续费），因此用户发送的代币数量未必就是接收者收到的代币数量。

本函数的功能和removeLiquidityETH函数相同，但是支持使用token支付费用。我们将它的代码和removeLiquidityETH函数的代码相比较，只有稍微不同：

函数返回参数及removeLiquidity函数返回值中没有了amountToken。因为它的一部分可能要支付手续费，所以removeLiquidity函数的返回值不再为当前接收到的代币数量。不管损耗多少，它把本合约接收到的所有此类TOKEN直接发送给接收者。WETH不是可支付转移手续费的代币，因此它不会有损耗。

### 10. removeLiquidityETHWithPermitSupportingFeeOnTransferTokens函数
```sol
function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
      address token,
      uint liquidity,
      uint amountTokenMin,
      uint amountETHMin,
      address to,
      uint deadline,
      bool approveMax, uint8 v, bytes32 r, bytes32 s
  ) external virtual override returns (uint amountETH) {
      address pair = UniswapV2Library.pairFor(factory, token, WETH);
      uint value = approveMax ? uint(-1) : liquidity;
      IUniswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, v, r, s);
      amountETH = removeLiquidityETHSupportingFeeOnTransferTokens(
          token, liquidity, amountTokenMin, amountETHMin, to, deadline
      );
  }

```
removeLiquidityETHWithPermitSupportingFeeOnTransferTokens函数。功能同removeLiquidityETHSupportingFeeOnTransferTokens函数相同，但是支持使用链下签名消息进行授权。

### 11. _swap函数
```sol
// requires the initial amount to have already been sent to the first pair
function _swap(uint[] memory amounts, address[] memory path, address _to) internal virtual {
  for (uint i; i < path.length - 1; i++) {
    (address input, address output) = (path[i], path[i + 1]);
    (address token0,) = UniswapV2Library.sortTokens(input, output);
    uint amountOut = amounts[i + 1];
    (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
    address to = i < path.length - 2 ? UniswapV2Library.pairFor(factory, output, path[i + 2]) : _to;
    IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output)).swap(
        amount0Out, amount1Out, to, new bytes(0)
    );
  }
}
```
该函数是一个internal函数，它也是其它资产交易接口的核心，它把交易资产的核心逻辑抽象出来独立为一个内部函数，方便各个资产交易外部接口调用（代码复用），此函数为内部函数，用户无法直接调用。从注释中我们可以知道，需要事先将初始数量的代币发送到第一个交易对（ 这是UniswapV2的先转移后交易特性决定的）。可以看到它有两个输入参数 amounts和path，分别为uint及地址数组，那么它们代表什么含义呢？

在系列文章的周边合约工具库学习时已经提到，UniswapV2支持交易链模式。也就假定有A/B 和B/C 这两个交易对（但不是存在A/C交易对），我们可以在一个交易内先将A总换成B，然后再将B兑换成C，这样就相当于A兑换成了C。整个交换流程为：A => B => C ，顺序涉及的三种代币为A,B,C。path顾名思义就指这条路径的，它的内容是交易链中依次出现的各代币地址。因此，path的内容为[addressA,addressB,addressC]。amounts代表什么呢，它代表整个交易过程中交易链依次涉及的代币数量。在A => B => C 交易链中，amounts的内容为：[amountA,amountB,amountC]。因为初始资产只能卖出，所以amounts[0]代表卖出的初始资产数量，在本例中为amountA。而最终得到的资产只能买进，所以amounts数组的最后一个元素代表买进的最终资产数量，例如amountC。数组中间的元素代表涉及到的中间代币的数量，例如amountB，它们是前一个交易对（A/B交易对）的买进值，同时也是下一个交易对（B/C交易对）的卖出值。

下面的解释仍然以 A => B => C 交易链为例（假定当前没有直接A到C的交易对）。

函数体是一个for循环，虽然我们的path长度为3，但是交易对数量只有2个，为什么呢。其实很简单，大家想一想五线谱中的间与线的数量关系是什么？是五线四间，而这里是三个地址两个交易对。这里面的关系图是不是一样的? 😉😉😉😊😊😊。所以循环的判定条件不是通常的i < path.length，而要少一次，为i < path.length - 1。

* 循环内的第一行用来获取当前交易对中的两种代币地址。以i = 0来讲，input就是A，output就是B。
* 循环内的第二行用来获取较小的代币地址，因为交易对内的代币地址及对应的代币数量是排序过的（按地址大小从小到大排列）。
* 循环内的第三行用来从amounts中获取当前交易对的买进值（同时也是下一交易对的卖出值，如果还有交易对的话）。
* 循环内的第四行用来判断如果input（A）是较小值（交易对排过序后的较小地址为A），那么当前交易对买进的两种代币数量分别为（0，amountOut），也就是卖出A，得到amountOut数量的B；如果output（B）是较小值（交易对排过序后的较小地址为B），当前交易对买进的两种代币数量分别为（amountOut，0），同样也为卖出A，得到amountOut数量的B。这么做的原因是在UniswapV2中，交易对合约的swap函数的前两个参数对应的代币地址是从小到大排序的。详情见核心合约学习三中对swap函数的额外说明。
* 循环内的第五行用来计算当前交易对的接收地址。因为UniswapV2是一个交易代币先行转入系统，所以下一个交易对就直接是前一个交易对的接收地址了（如果还有下一个交易对）。这里如果i循环到最后一次i == path.length - 2,那么后面没有交易对了，其接收地址为用户指定的接收者地址；如果未到最后一次（后面还有交易对），那么接收地址就是通过工具库计算的下一个交易对的地址。
* 循环内的最后一行代码先是计算了当前交易对的地址，然后调用了该地址交易对合约的swap接口，将指定买进的代币数量和接收地址及空负载（不执行回调）作为参数传给该函数。

理解了_swap函数这个核心，再学习资产交易部分的其它外部接口（被用户直接调用的函数）就很简单了，因为它们基本上都是对本函数的调用。

### 12. swapExactTokensForTokens函数
```sol
function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external virtual override ensure(deadline) returns (uint[] memory amounts) {
    amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
    require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
    TransferHelper.safeTransferFrom(
        path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
    );
    _swap(amounts, path, to);
}
```
从函数名称可以看出它是指定卖出固定数量的某种资产，买进另一种资产，该值由计算得来，同时支持交易对链（也就是上面讲到的 A => B => C模式)。
其参数分别为卖出的初始资产数量，买进的另一种资产的最小值，交易对链，接收者地址和最迟交易时间。返回值amounts的含义见_swap函数。

* 函数代码的第一行用来计算当前该交易的amounts，注意它使用了自定义工具库的getAmountsOut函数进行链上实时计算的，所以得出的值是准确的最新值。amounts[0]就是卖出的初始资产数量，也就是amountIn。
* 函数的第二行用来验证最终买进的代币数量不能小于用户限定的最小值（防止价格波动较大，超出用户的预期）。
* 函数的第三行将拟卖出的初始资产转移到第一个交易对中去，这正好映证了_swap函数的注释，必须先转移卖出资产到交易对。
* 函数的第四行调用_swap函数进行交易操作。

该函数将用户欲卖出的资产转移到了第一个交易对合约中，该资产是一种ERC20代币，因此必须先得到用户的授权。

那么这里可不可以采用移除流动性的permit方式实行线下签名消息授权呢？答案是不能。因为采用这种方式授权时permit函数必须包含在ERC20代币的合约代码中。在UniswapV2中，交易对本身就是ERC20代币合约(本交易对流动性代币的合约)，它里面是包含了permit函数的。但是交易对里面的两种资产（ERC20代币）却是外部的ERC20代币合约，基本上没有这个permit函数。

### 13. swapTokensForExactTokens函数
```sol
function swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
) external virtual override ensure(deadline) returns (uint[] memory amounts) {
    amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
    require(amounts[0] <= amountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
    TransferHelper.safeTransferFrom(
        path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
    );
    _swap(amounts, path, to);
}
```
从函数名称可以看出它是指定交易时买进的资产数量，而卖出的资产数量则不指定，该值可以通过计算得来。结合函数2我们可以看到，函数接口可以分为指定买进（本函数）和指定卖出（函数2）两种类型。那么为什么会有这两种方式呢？因为Uniswap交易对采用了恒定乘积算法，它的价格是个曲线，不是线性的。因此指定买进和指定卖出计算的方式是不一样的。于是这里便有了这两种接口（函数），然而它们的底层实现却是统一的逻辑（_swap函数）。函数的参数同函数2类似，只不过前两个参数变成了拟买进的资产的数量和指定卖入资产的最大值（保护用户，防止价格波动过大从而使卖出资产数量大大超过用户预期）。返回值amounts的含义和前面一样，这里不再重复阐述了。

* 函数的第一行调用库函数来计算返回值amounts，因为它是同一个交易里合约实时计算，所以不必担心时效性问题，总是交易时的最新值。
* 第二行验证计算得到的卖出的初始资产数量要小于用户限定的最大值。
* 第三行将初始资产转入第一个交易对中，转移数量在第一行中计算得到。
* 最后一行调用_swap函数进行交易操作。

该函数也需要事先得到用户授权以转移初始卖出资产到交易对合约。

### 14. swapExactETHForTokens函数
```sol
function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
    external
    virtual
    override
    payable
    ensure(deadline)
    returns (uint[] memory amounts)
{
    require(path[0] == WETH, 'UniswapV2Router: INVALID_PATH');
    amounts = UniswapV2Library.getAmountsOut(factory, msg.value, path);
    require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
    IWETH(WETH).deposit{value: amounts[0]}();
    assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
    _swap(amounts, path, to);
}
```
swapExactETHForTokens函数同swapExactTokensForTokens类似，只不过将初始卖出的Token换成了ETH。在上一篇文章学习流动性供给时已经介绍了ETH/WETH的相互兑换，这里就不再阐述了。注意这里函数参数不再有amountInMax，因为随方法发送的ETH数量就是用户指定的最大值（WETH与ETH是等额1:1兑换的）。如果计算的结果超了则ETH会不足，抛出错误重置整个交易。

* 函数的第一行验证第一个代币地址必须为WETH地址。因为Uniswap交易对为ERC20/ERC20交易对，卖出ETH之前会自动转换成为等额WETH（一种ERC20代币）。第一个交易对实质上是WETH/ERC20交易对，需要在此卖出WETH，所以第一个地址（卖出的初始资产地址）必须为WETH。
* 第二行用来计算amounts。
* 第三行，验证最终买进的资产数量必须大于用户指定的值，防止价格波动太大。
* 第四行，将ETH兑换成WETH
* 第五行，将WETH转移到第一个交易对合约中。WETH代币合约源码已经公开了，该合约的资产转移函数transfer会返回一个bool值，所以不需要再调用自定义库中的safeTransferFrom函数，直接使用assert函数来断言该值必须为true即可。
* 第六行调用_swap函数进行交易操作。

本函数没有转移用户的ERC20代币，所以没有授权操作。ETH兑换后的WETH就在本合约里，是合约自己的资产，所以调用了WETH合约的transfer方法而不是transferFrom方法。

### 15. swapTokensForExactETH函数
```sol
function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
    external
    virtual
    override
    ensure(deadline)
    returns (uint[] memory amounts)
{
    require(path[path.length - 1] == WETH, 'UniswapV2Router: INVALID_PATH');
    amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
    require(amounts[0] <= amountInMax, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
    TransferHelper.safeTransferFrom(
        path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
    );
    _swap(amounts, path, address(this));
    IWETH(WETH).withdraw(amounts[amounts.length - 1]);
    TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
}
```
swapTokensForExactETH函数同swapTokensForExactTokens类似，只不过指定买进的不是Token（ERC20代币），而是ETH。所以交易链的最后一个代币地址必须为WETH，这样才会买进WETH，然后再将它兑换成等额ETH。
* 函数的第一行验证path中最后一个必须是WETH地址。
* 第二行通过库函数计算amounts，含义同上。
* 第三行验证计算得到的卖出资产数量必须小于用户限定的最大值，价格保护。
* 第四行，将欲卖出的资产转移到第一个交易对中。
* 第五行，调用_swap函数进行交易操作，注意接收者地址为本合约地址。因为从最后一个交易对得到的是WETH，并不是用户想要的ETH。
* 第六行，将本合约接收的WETH转成ETH。
* 第七行，将兑换好的ETH发送给用户指定的接收者to。

此函数在转移卖出资产到第一个交易对时也需要事先授权。

### 16. swapExactTokensForETH函数
```sol
function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)
    external
    virtual
    override
    ensure(deadline)
    returns (uint[] memory amounts)
{
    require(path[path.length - 1] == WETH, 'UniswapV2Router: INVALID_PATH');
    amounts = UniswapV2Library.getAmountsOut(factory, amountIn, path);
    require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
    TransferHelper.safeTransferFrom(
        path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]
    );
    _swap(amounts, path, address(this));
    IWETH(WETH).withdraw(amounts[amounts.length - 1]);
    TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
}
```
swapExactTokensForETH函数同swapExactTokensForTokens函数类似，只不过将最后获取的ERC20代币改成ETH了。因此，交易链的最后一个代币地址必须为WETH，这样才能卖进WETH然后再兑换成等额ETH。该函数同上一个函数swapTokensForExactETH也类似，只不过一个是指定买进多少ETH，另一个是指定卖出多少资产。

* 第一行验证path中的最后一个代币地址为WETH地址。
* 第二行通过库函数计算amounts，含义同上。
* 第三行验证交易链最终买进的的WETH数量（会兑换成等额ETH）不能小于用户的限定值。
* 第四行将用户拟卖出的资产转入到第一个交易对中。
* 第七行调用_swap进行交易操作，注意接收者地址为本合约地址。因为最后从交易对得到的是WETH，并不是用户想要的ETH。
* 第八行，将本合约接收的WETH转成ETH。
* 第九行，将兑换好的ETH发送给用户指定的接收者to。

此函数在转移卖出资产到第一个交易对时也需要事先授权。

### 17. swapETHForExactTokens函数
```sol
function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
    external
    virtual
    override
    payable
    ensure(deadline)
    returns (uint[] memory amounts)
{
    require(path[0] == WETH, 'UniswapV2Router: INVALID_PATH');
    amounts = UniswapV2Library.getAmountsIn(factory, amountOut, path);
    require(amounts[0] <= msg.value, 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT');
    IWETH(WETH).deposit{value: amounts[0]}();
    assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amounts[0]));
    _swap(amounts, path, to);
    // refund dust eth, if any
    if (msg.value > amounts[0]) TransferHelper.safeTransferETH(msg.sender, msg.value - amounts[0]);
}
```
swapETHForExactTokens函数。卖出一定数量的ETH，买进指定数量的资产（TOKEN）。因为前面已经学习了好几个类似的函数，再学习这个函数就很简单了，这里可以直接列出该函数的大致逻辑：

要卖出ETH，所以第一个地址必定为WETH地址。因为是指定买进资产，肯定是利用工具库函数反向遍历来计算amounts。又因为第一个交易对是包含WETH的交易对，所以交易前必须将拟卖出的ETH兑换成WETH到本合约，然后将WETH从合约发送到第一个交易对。接着会调用_swap函数进行交易，最后将多余的ETH退回给调用者。

通过对照可以发现猜想的逻辑只是少了一个验证计算得到的卖出ETH数量。虽然不验证时，如果amounts[0] > msg.value的话，在兑换WETH时会因为ETH不足而出错重置。但万一由于某种原因导致合约本身的ETH数量不为0，那么此时就有可能通过了（相当于用合约已有的ETH帮你支付）。所以这里还是需要验证amounts[0] <= msg.value。

### 18. _swapSupportingFeeOnTransferTokens函数
```sol
// **** SWAP (supporting fee-on-transfer tokens) ****
// requires the initial amount to have already been sent to the first pair
function _swapSupportingFeeOnTransferTokens(address[] memory path, address _to) internal virtual {
  for (uint i; i < path.length - 1; i++) {
    (address input, address output) = (path[i], path[i + 1]);
    (address token0,) = UniswapV2Library.sortTokens(input, output);
    IUniswapV2Pair pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, input, output));
    uint amountInput;
    uint amountOutput;
    { // scope to avoid stack too deep errors
    (uint reserve0, uint reserve1,) = pair.getReserves();
    (uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    amountInput = IERC20(input).balanceOf(address(pair)).sub(reserveInput);
    amountOutput = UniswapV2Library.getAmountOut(amountInput, reserveInput, reserveOutput);
    }
    (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
    address to = i < path.length - 2 ? UniswapV2Library.pairFor(factory, output, path[i + 2]) : _to;
    pair.swap(amount0Out, amount1Out, to, new bytes(0));
  }
}
```
_swapSupportingFeeOnTransferTokens函数。这个函数从名称上看，和_swap函数的区别是支持使用转移的代币支付手续费。在上一篇文章流动性供给时已经提到了使用转移代币支付手续费，笔者以此也不熟悉，现实中也未接触或者使用过。但是可以简单认为此类代币（拓展的ERC20代币）在资产转移时可能会有损耗（部分资产转移到一个协议地址来支付手续费），转移的数量未必就是最后接收的数量。这是笔者的个人理解，未必正确，请大家见谅，也请大家留言指出使用转移的代币支付手续费的正确理解方式。

相比_swap函数，从输入参数来看，少了一个amounts，也就是涉及到的此类资产数量不能再由自定义的工具库函数计算得到了。函数体内同样是一个for循环，用来遍历每个交易对进行交易。

* 循环体内的第一行获取当前交易对的两种代币地址。
* 循环体内的第二行将这两种代币地址进行排序（排序的作用在_swap函数中已经讲过)。
* 循环体内的第三行用来得到当前交易对合约的实例。
* 循环体内的第4-5行定义两个临时变量，一个代表卖出资产数量，一个代表买进资产的数量，使用Input和Output便于阅读。
* 循环体内的第6行和第11行是使用一对{}将变量进行scope，防止堆栈过深问题。相关的内容在序列文章核心合约学习（三）中已经介绍过了。
* 循环体内的第7行用来获取交易对资产池中两种资产的值（用于恒定乘积计算的），注意这两个值是按代币地址（不是按代币数量）从小到大排过序的。
* 循环体内的第8行用来将交易对资产池中两种资产的值和第一行中获取的两个代币地址对应起来，并保存在两个带有input和output的临时reserve变量中，含义更加明显，便于阅读。
* 循环体内的第9行用来计算当前交易对卖出资产的数量（交易对地址的代币余额减去交易对资产池中的值）
* 循环体内的第10行根据恒定乘积算法来计算当前交易对买进的资产值 。为什么要计算得买进的资产值呢？因为交易对合约的swap函数的输入参数为买进的两种代币资产值而不是卖出的两种代币资产值。（这么做个人认为第一方面是因为UniswapV2是先行转入卖出资产系统，卖出的数量通过比较合约地址的代币余额与合约资产池中的相应值可以得到；第二方面是交易对合约的swap函数是个先借后还系统，函数参数为买进的资产数量可以方便的先借出相应资产）。
* 循环体内的第12行将计算得到的买进资产值和零值按代币地址从小到大的顺序排序，这样就会和交易对中swap函数的输入参数顺序保持一致。另一个为什么是零值呢？很显然，在交易链模式中，每个交易对只会卖出其中一种资产来买进另一种资产，而不会两种资产全买进。
* 循环体内的第13行是计算接收地址，计算过程同_swap函数。
* 循环体内的最后一行调用交易对合约的swap函数进行实际交易。

该函数和本合约的_swap主要区别就是交易链交易过程中转移的资产数量不再提前使用工具库函数计算好，而是在函数内部根据实际数值计算。因为资产在实际转移过程可能会有部分损耗来支付交易费用，到底损耗多少是未知的，每种资产也是不一样的，所以无法提前通过统一库函数来计算得到。实际计算卖出资产的数量的方法为：在交易对中卖出的资产数量等于交易对合约地址的资产余额减去交易对合约资产池中相应的数值，假设该方法叫M。

买进的资产数量由恒定乘积算法算出，然而该值未必就是下一个交易对的资产卖出数量。因为此类资产在从当前交易对转移到下一个交易对的过程中，可能存在损耗，所以下一个交易对的卖进资产也是通过方法M计算（在for的下一个循环里）。

刚才说了一大堆估计大家都有点晕😂😂😂😂，让我们简单一点吧🤩🤩🤩🤩：

在不支持代币支付交易手续费的交易中，前一个交易对的买进资产数量就是后一个交易对的卖出资产数量（或者接收数量）；第一个交易对的卖出资产数量就是用户直接转移的资产数量.在支持代币支付交易手续费的交易中，因为资产转移过程中可能有损耗，所以每一个交易对的卖出资产数量必须由方法M计算得到，包含第一个交易对的卖出资产数量。


### 19. swapExactTokensForTokensSupportingFeeOnTransferTokens函数
```sol
function swapExactTokensForTokensSupportingFeeOnTransferTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external virtual override ensure(deadline) {
    TransferHelper.safeTransferFrom(
        path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amountIn
    );
    uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
    _swapSupportingFeeOnTransferTokens(path, to);
    require(
        IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
        'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'
    );
}
```
swapExactTokensForTokensSupportingFeeOnTransferTokens。有了上面的_swapSupportingFeeOnTransferTokens函数做铺垫，这个函数就比较好理解了。从名称上看，它和swapExactTokensForTokens函数相同，只不过多了支持FeeOnTransferTokens。
* 第一行将用户欲卖出的资产转入到第一个交易对中。
* 第四行用来记录接收者地址在交易链最后一个代币合约中的余额。假定 A => B => C，就是C代币的余额。
* 第五行调用可复用的内部函数（函数8）进行实际交易。
* 最后的require函数用来验证接收者买进的资产数量不能小于指定的最小值。

前面已经讲过，由于此类代币在转移过程中可能有损耗，所以最终接收者买进的资产数量不再等于恒定乘积公式计算出来的值，必须使用当前余额减去交易前余额来得到实际接收值。

转移卖出资产时需要提前授权，这个接下来不再重复提及了。


### 20. swapExactETHForTokensSupportingFeeOnTransferTokens函数
```sol
function swapExactETHForTokensSupportingFeeOnTransferTokens(
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
)
    external
    virtual
    override
    payable
    ensure(deadline)
{
    require(path[0] == WETH, 'UniswapV2Router: INVALID_PATH');
    uint amountIn = msg.value;
    IWETH(WETH).deposit{value: amountIn}();
    assert(IWETH(WETH).transfer(UniswapV2Library.pairFor(factory, path[0], path[1]), amountIn));
    uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
    _swapSupportingFeeOnTransferTokens(path, to);
    require(
        IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
        'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'
    );
}
```
swapExactETHForTokensSupportingFeeOnTransferTokens函数。同函数9类似，只不过将卖出的TOKEN改成了ETH。既然卖出ETH，它就又和函数swapExactETHForTokens类似。因此，逻辑上也很好理解，和普通TOKEN => TOKEN接口相比，多了一个计算并验证买进的资产数量并和WETH/ETH的相互兑换。
* 函数的第一行用来验证交易链第一个代币地址为WETH地址，原因前面已经讲过了。
* 第二行：随函数发送的ETH就是欲卖出的资产，ETH需要兑换成WETH。
* 第三行，将ETH兑换成WETH。
* 第四行，将WETH发送到第一个交易对，因为这里是发送本合约的WETH，所以无需授权交易。
* 第五行以后，同函数9。用来调用函数8进行交易操作。同时记录接收者地址交易前后最后一种代币的余额，从而计算出实际买进的数量，来验证它不能小于用户指定的最小值。

WETH这里不用考虑也不会有损耗，为什么呢？因为它是开源的，它是不支持转移代币支付手续费的。

### 21. swapExactTokensForETHSupportingFeeOnTransferTokens函数
```sol
function swapExactTokensForETHSupportingFeeOnTransferTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
)
    external
    virtual
    override
    ensure(deadline)
{
    require(path[path.length - 1] == WETH, 'UniswapV2Router: INVALID_PATH');
    TransferHelper.safeTransferFrom(
        path[0], msg.sender, UniswapV2Library.pairFor(factory, path[0], path[1]), amountIn
    );
    _swapSupportingFeeOnTransferTokens(path, address(this));
    uint amountOut = IERC20(WETH).balanceOf(address(this));
    require(amountOut >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
    IWETH(WETH).withdraw(amountOut);
    TransferHelper.safeTransferETH(to, amountOut);
}
```
有了前面的学习，这个函数也很简单了，就是卖出指定数量的初始TOKEN，最后得到一定数量的ETH，同时支持使用转移的代币支付手续费。
* 函数的第一行用来验证交易链最后一个地址为WETH地址，原因不再重复了。
* 第2-4行用来将初始资产发送给第一个交易对，注意这里需要提前授权。
* 第5行调用内部函数8进行交易操作。注意，此时的接收地址为本合约地址，因为用户买进的的是ETH，而这里得到的是WETH，不能直接让用户接收，需要转换成ETH。
* 第6行用来获取交易链中买进的资产（WETH）数量。因为周边合约本身不存有任何资产（交易前WETH余额为0），所以本合约地址当前WETH余额就是买进的WETH数量。
* 第7行验证买进的WETH数量要大于用户指定的最小值。
* 第8-9行，将WETH兑换成等额ETH并发送给接收者。

WETH并不会有损耗，原因同上。

### 22. quote函数
```sol
// **** LIBRARY FUNCTIONS ****
function quote(uint amountA, uint reserveA, uint reserveB) public pure virtual override returns (uint amountB) {
    return UniswapV2Library.quote(amountA, reserveA, reserveB);
}
```
quote函数。注释中可以看到，从该函数起，主要就是库函数功能了，它们都是直接调用库函数做一些计算。因为库函数一般是无状态的，所以它们基本上也都是pure类型的（和对应的库函数一致）。工具库函数的说明也可以参照序列文章中的周边合约学习（一）–工具库的学习。

该函数及接下来的几个函数都未在本合约使用，它们主要是直接包装了工具库函数提供给外部合约使用。为什么这么做呢？个人猜想是因为外部合约很大可能 不会使用UniswapV2这个自定义的工具库UniswapV2Library，所以周边合约提供了相应的接口方便外部合约使用这些库函数功能（当然也可以是链下调用而非合约调用）。

该函数的功能为根据交易对中两种资产比例，给出一种代币数值，计算另一种代币数值。本合约在流动性供给计算时直接使用了相同功能的工具库函数。

### 23. getAmount等类型的函数
```sol
function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountOut)
    {
        return UniswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut)
        public
        pure
        virtual
        override
        returns (uint amountIn)
    {
        return UniswapV2Library.getAmountIn(amountOut, reserveIn, reserveOut);
    }

    function getAmountsOut(uint amountIn, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return UniswapV2Library.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint amountOut, address[] memory path)
        public
        view
        virtual
        override
        returns (uint[] memory amounts)
    {
        return UniswapV2Library.getAmountsIn(factory, amountOut, path);
    }
```
getAmountOut函数，根据恒定乘积算法，指定卖出资产的数量，计算买进资产的数量。计算时考虑了手续费，仅适用于单个交易对。

getAmountIn函数，根据恒定乘积算法，指定买进资产的数量，计算卖出资产的数量。计算时考虑了手续费，仅适用于单个交易对。

这里有一点需要提一下，其函数代码为（超级简单）：
注意：官方文档提到Router1合约有一个低风险的Bug，就是指这个函数。那么到底是什么Bug呢？我们来对照一下Router1合约中相应的代码：

```sol
function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) public pure override returns (uint amountIn) {
    return UniswapV2Library.getAmountOut(amountOut, reserveIn, reserveOut);
}
```
😄😄😄，该bug是一处笔误，将UniswapV2Library.getAmountIn写成了UniswapV2Library.getAmountOut。然而该函数周边合约本身并未调用，只是作为接口提供给外部使用，因此为低风险的。但是由于合约部署之后无法更改，所以只能等到Router2来更改过来了。

getAmountsOut函数。多了一个s，代表多个，意味着它用于交易链的计算中，指定卖出资产数量，计算涉及到的每种资产数量并顺序保存在一个数组中。

getAmountsIn函数。多了一个s，代表多个，意味着它用于交易链的计算中，指定买进资产数量，反向推导计算出涉及到的每种资产数量并顺序保存在一个数组中。


## 资产交易函数分类
上面这么多swap函数，大家肯定看得眼花缭乱了👻👻👻。下面我们根据交易资产的种类和指定的是卖出资产数量/买进资产数量，对它们做一个简单的分类：

### 1. TOKEN => TOKEN
就是两种ERC20代币交易，可分为：

指定卖出代币数量，得到另一种代币，函数为swapExactTokensForTokens。
指定买进代币数量，卖出另一种代币，函数为swapTokensForExactTokens。

### 2. ETH => TOKEN
ETH兑换成ERC20代币，也分为两种：

指定卖出ETH数量，得到另一种ERC20代币，函数为swapExactETHForTokens。
指定买进ERC20代币数量，卖出ETH，函数为swapETHForExactTokens。

### 3. TOKEN => ETH
ERC20代币兑换成ETH。等等，有人会说这不是和 ETH => TOKEN 一样的么，既然能通过交易链实现 ETH => TOKEN，那么必能反向通过该交易链实现 TOKEN => ETH。

是这样的没错，但是因为不能直接交易ETH，所以会涉及到一个ETH和WETH的相兑换（转换发生在不同方向的交易链的不同阶段），因此实现逻辑还是不同的，所以这里提供了另外两个接口。

指定卖出ERC20代币数量，得到ETH，函数为swapExactTokensForETH。
指定买进ETH数量，卖出另一种ERC20代币，函数为swapTokensForExactETH。

### 4. 支持FeeOnTransferTokens函数
此外还有三个支持FeeOnTransferTokens函数，分别为函数9、函数10，函数11。注意它们的函数名称，均表示指定卖出资产数量。也就是说它们只能用于交易链中指定卖出资产数量这种场景，不支持指定买进资产的场景中进行的反向交易链数值计算，因此只有3个该类函数。

为什么会这样呢？

个人认为是因为此类资产在转移过程中可能会有损耗，但损耗到底多少是无法知晓的。因此指定买进资产数量反推卖出资产数量的话，是无法得到的。因为该值为计算得到的值加上损耗值。如果指定卖出资产数量的话，每个交易对的实际卖出资产数量和最终接收的买进资产数量均可以通过比较相应地址交易前后的资产余额来计算出，因此此种交易场景是可行的。

因此1 2 3三种交易类型每种类型只有一个支持FeeOnTransferTokens函数，分别为：

TOKEN => TOKEN 为 swapExactTokensForTokensSupportingFeeOnTransferTokens函数。
ETH => TOKEN 为swapExactETHForTokensSupportingFeeOnTransferTokens函数。
TOKEN => ETH 为swapExactTokensForETHSupportingFeeOnTransferTokens函数。
综合得到Router2合约用于资产交易的对外接口共分四类9个接口。

## 总结
从前面的学习中可以看出，虽然资产交易对外提供了四类共9个接口，但来回就是对两个核心_swap函数的调用。其中支持使用转移的代币支付手续费的接口中，转移资产的实际数量不再等于根据恒定乘积计算出来的结果值，而需要根据相应地址的两次资产余额相减计算出来。交易链中如果有涉及到ETH交易的，需要在交易链的对应阶段（开始或者结束阶段）进行ETH/WETH的兑换。因为UniswapV2交易对全部为ERC20/ERC20交易对，因此交易链中间流程不可能有ETH出现。

至此，UniswapV2Router02.sol合约源码学习（下）就到此结束了，计划下一次进行周边合约中的UniswapV2Migrator.sol的源码学习。

由于个人能力有限，难免有理解错误或者不正确的地方，还请大家多多留言指正。

在UniswapV2合约的源码学习过程中，UniswapV2Router02.sol合约篇幅最长，也比较复杂。因此本合约的学习记录（上/下篇）的撰写也比较耗时，更新时间较久。

## 引用及知识拓展
* [充分利用 CREATE2](https://ethfans.org/posts/getting-the-most-out-of-create2)
* [CREATE2 在广义状态通道中的使用](https://learnblockchain.cn/2019/10/23/create2-statechannel/)
* [CREATE2](https://ctf-wiki.org/blockchain/ethereum/attacks/create2/)
* [Solidity原理（三）：abi编码以及与EVM交互的原理](https://blog.csdn.net/Programmer_CJC/article/details/80190058?utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromMachineLearnPai2%7Edefault-1.control&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7EBlogCommendFromMachineLearnPai2%7Edefault-1.control)
* [solidity学习过程 --- abi编码](https://blog.csdn.net/qq_35434814/article/details/104682616)