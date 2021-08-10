---
title: UniswapV2ERC20
date: 2021-01-16
categories:
 - 智能合约
 - Uniswap
tags:
 - 智能合约
 - Uniswap
---

[UniswapV2ERC20](https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2ERC20.sol)是一个继承了 [IUniswapV2ERC20](https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/interfaces/IUniswapV2ERC20.sol) 接口的[ERC20](https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/interfaces/IERC20.sol)标准代币智能合约，而IUniswapV2ERC20是一个兼容了ERC20标准的接口文件，同时又增加声明了4个自定义的函数或变量。它是交易对合约的父合约，主要实现了ERC20代币功能并增加了对线下签名进行授权的支持。
 
## UniswapV2ERC20源码
<<< @/dapp/uniswap/v2/source-code/contracts/core/UniswapV2ERC20.sol

## UniswapV2ERC20源码解析

### 1. pragma
```sol
pragma solidity = 0.5.16;
```
第一行就是告诉大家源代码使用Solidity版本0.5.16写的。Solidity是一种智能合约高级语言，运行在Ethereum虚拟机（EVM）之上的。指定版本是为了确保合约不会在新的编译器版本中突然行为异常。关键字 pragma 的含义是，一般来说，pragmas（编译指令）是告知编译器如何处理源代码的指令的（例如， pragma once ）。

### 2. import
```sol
import "./interfaces/IUniswapV2ERC20.sol";
import "./libraries/SafeMath.sol";
```
这两行导入了该合约必须实现的接口IUniswapV2ERC20.sol和一个防溢出的数学工具库SafeMath。
* 在0.8.0以前，Solidity是检测不到数值溢出的。数值是可以无限大的，但是存储位数是有限的。例如最大256位，因此最大的无符号整数就是是2**256-1。再大就会溢出，这时就会得到预期外的结果。所以一般我们都会导入一个防溢出数学工具库。其次在Solidity中，应用最多的是无符号整数，如果减法得到了负数，根据二进制的表示法，结果会被认为成另一个无符号整数。在早期的智能合约中，例如BEC和SMT项目，存在溢出漏洞或者得到负值而遭受损失的情况。当前编写的智能合约一般都会防范这种问题的发生，使用SafeMath工具库是最常见的预防手段。注意，该库里只有加、减和乘三种计算，没有除法。因为除法不会有溢出；如果被零除，Solidity语言本身会报错重置整个交易，不需要额外处理。当然现在0.8.0及以上版本已经能够处理溢出的情况了，但是这个溢出的内在逻辑我们还是应该有一个清晰的认识。以下是关于溢出漏洞的实战讲解：[以太坊智能合约漏洞实战详解：整数溢出攻击](https://www.jianshu.com/p/1620779ee75e)

### 3. 继承或接口实现
```sol
contract UniswapV2ERC20 is IUniswapV2ERC20 {
```
这一行定义了该合约必须实现导入的IUniswapV2ERC20接口。该接口是由标准ERC20接口加上自定义的线下签名消息支持接口组成，所以UniswapV2ERC20也是一个ERC20代币合约。最后一个花括号是作用域开始。

### 4. SafeMath安全函数
 ```sol   
 using SafeMath for uint256;
 ```
代表在uint256(uint是它的同名)类型上使用SafeMath库。Solidity中库函数在指定调用，实例时（例如本例中的.sub等)和Rust语言中的结构体的方法类似，实例自动作为库函数中的第一个参数。

### 5. ERC20标准 public公共变量
```sol
string public constant name = "Uniswap V2";
string public constant symbol = "UNI-V2";
uint8 public constant decimals = 18;
```
这三行指定了代币的名称和符号以及精度（小数点位数）。这是ERC20标准规定的，这些常量用于和其他代币区分，但这种区分仅仅只是表面的，真正的区分是通过合约地址来的。即便是两个名字、符号和精度一摸一样的代币，只要合约地址不一样，则他们是不一样的代币的。由于该合约为交易对合约的父合约，而交易对合约是可以创建无数个的，所以这无数个交易对合约中的ERC20代币的名称、符号和精度都一样。但是他们是不一样的代币的。

### 6. ERC20标准totalSupply
```sol
uint256 public totalSupply;
```
这行是记录代币发行总量的状态变量。为什么是访问权限是public的呢？主要是利用编译器的自动构造同名函数功能来实现相应接口。另外总量totalSupply是可以变化的，可以增发也可以销毁，当然也可以指定总量为恒定的。此时totalSupply就是一个常量了。

### 7. ERC20标准的地址和授权map
```sol
mapping(address => uint256) public balanceOf;
mapping(address => mapping(address => uint256)) public allowance;
```
以上两行是用一个map结构来记录每个地址的余额以及每个地址的授权分布。关于授权，它适用于非直接转移代币（例如调用第三方合约来转移）。为什么要授权后才能转移代币呢？这里打个比方，代币合约就相当于银行，你直接去银行转账（代币）是不需要授权的。但是如果你使用微信充值，将银行卡里的钱充值到微信钱包，微信必须得到你的授权（包括额度），这样微信才能在你的授权额度范围内转移你银行卡内的钱。如果没有授权机制而可以直接转钱的话，微信就可能把你的银行卡悄无声息的掏空了。同样，如果你访问第三方合约（非代币合约），第三方合约没有得到你的授权就无法转移你的代币。否则，遇到个恶意合约，一下就把你所有的代币都偷走了。但是对于信任的并且会大量操作的合约，例如uniswap合约，我们对于它的合约地址A需要多次大量的用到usdt代币，那么我们可以把自己的授权额度设置为无限大，这样只需要授权一次，就可以进行一直操作的。避免了多次授权的gas消耗。

### 8. 签名
```sol
bytes32 public DOMAIN_SEPARATOR;
// keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
bytes32 public constant PERMIT_TYPEHASH = 
    0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
mapping(address => uint256) public nonces;
```
以上三行是用来签名使用的，也是当前合约与通常的ERC20标准代币合约不同的地方。DOMAIN_SEPARATOR用在不同Dapp之间区分相同结构和内容的签名消息，该值也有助于用户辨识哪些为信任的Dapp，具体可见[EIP-712](https://eips.ethereum.org/EIPS/eip-712)提案。而PERMIT_TYPEHASH根据事先约定使用permit函数的部分定义计算哈希值，重建消息签名时使用。nonces则是记录合约中每个地址使用链下签名消息交易的数量，用来防止重放攻击。

### 9. 构造器
```sol
constructor() public {
  uint256 chainId;
  assembly {
    chainId := chainid
  }
  DOMAIN_SEPARATOR = keccak256(
    abi.encode(
      keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
      ),
      keccak256(bytes(name)),
      keccak256(bytes("1")),
      chainId,
      // this指的是当前的合约对象
      address(this)
    )
  );
}
```
以上是一个构造函数，在合约部署的时候执行。只执行一次。在这个函数里面，事实上只是计算了DOMAIN_SEPARATOR的值。根据[EIP-712](https://eips.ethereum.org/EIPS/eip-712)的介绍，该值通过domainSeparator = hashStruct(eip712Domain)计算。这其中eip712Domain是一个名为EIP712Domain的结构，它可以有以下一个或者多个字段：
* string name 可读的签名域的名称，例如Dapp的名称，在本例中为代币名称。
* string version当前签名域的版本，本例中为"1"。
* uint256 chainId。当前链的ID，注意因为Solidity不支持直接获取该值，所以使用了内嵌汇编来获取。
* address verifyingContract验证合约的地址，在本例中就是本合约地址了。
* bytes32 salt用来消除歧义的salt，它可以用来作为DOMAIN_SEPARATOR的最后措施。

在本例中对'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'进行[keccak256](https://segmentfault.com/a/1190000017814463)运算后得到的哈希值。
注意：结构体本身无法直接进行hash运算，所以构造器中先进行了转换，hashStruct就是指将结构体转换并计算最终hash的过程。
> 关于汇编语言，可参考 [Solidity Assembly](https://www.tryblockchain.org/blockchain-solidity-assembly.html)、[Solidity 中编写内联汇编(assembly)的那些事[译]](https://learnblockchain.cn/article/675#%E6%9C%89%E5%93%AA%E4%BA%9B%E6%93%8D%E4%BD%9C%E7%A0%81)

### 10. transferFrom函数
```sol
function transferFrom(
  address from,
  address to,
  uint256 value
) external returns (bool) {
  if (allowance[from][msg.sender] != uint256(-1)) {
    allowance[from][msg.sender] = allowance[from][msg.sender].sub(value);
  }
  _transfer(from, to, value);
  return true;
}
```
代币授权转移函数，它是一个外部函数，主要是由第三方合约来调用。注意它的实现中（UniswapV2的实现）作了一个假定，如果你的授权额度为最大值（几乎用不完，相当于永久授权），为了减小操作步数和gas，调用时授权余额是不扣除相应的转移代币数量的。这里如果没有授权（授权额度为0），那么会怎样呢？库函数.sub(value)调用时无法通过SafeMath的require检查，会导致整个交易会被重置。所以如果没有授权，第三方合约是无法转移你的代币的，你不用担心你的资产被别的合约随便偷走。 
> uint256(-1) 就是 把 -1 强制转换成无符号的uint256的值，就是最大的那个uint256的值。

### 11. permit函数
```sol
function permit(
  address owner,
  address spender,
  uint256 value,
  uint256 deadline,
  uint8 v,
  bytes32 r,
  bytes32 s
) external {
  // 如果期限大于等于当前的区块的时间戳，那么就通过检查。
  require(deadline >= block.timestamp, "UniswapV2: EXPIRED");
  bytes32 digest = keccak256(
    abi.encodePacked(
      "\x19\x01",
      DOMAIN_SEPARATOR,
      keccak256(abi.encode(PERMIT_TYPEHASH,owner,spender,value,nonces[owner]++,deadline))
    )
  );
  address recoveredAddress = ecrecover(digest, v, r, s);
  require(
    recoveredAddress != address(0) && recoveredAddress == owner,
    "UniswapV2: INVALID_SIGNATURE"
  );
  _approve(owner, spender, value);
}
```
以上函数是预授权函数 permit，它使用线下签名消息进行链上验证。[abi.encodePacked](https://www.osgeo.cn/solidity/abi-spec.html)将参数进行数据编码，只是对小于32字节的数据不补0。而abi.encode 编码的数据需要32字节对齐。

通过keccak256将abi.encodePacked编码后的值进行哈希256计算后赋值给了digest，此时他是一个bytes32的数据。

通过ecrecover椭圆曲线加密函数将上述得到的digest以及传入的v, r, s进行加密后得到了签名者的公匙地址。如果签名者的地址不是空地址以及是当前传入的所有的地址，那么这个授权就通过了。

为什么会有使用线下签名然后再线上验证操作这种方式呢？首先线下签名不需要花费任何gas，然后任何其它账号或者智能合约可以验证这个签名后的消息，然后再进行相应的操作（这一步可能是需要花费gas的，签名本身是不花费gas的）。线下签名还有一个好处是减少以太坊上交易的数量，UniswapV2中使用线下签名消息主要是为了消除代币授权转移时对授权交易的需求。
> 在以太坊中，用keccak哈希算法来计算公钥的256位哈希，再截取这256位哈希的后160位哈希作为地址值。

## 知识拓展
### 1. 链下签名消息
链下签名消息相关知识可以参考Solidity官方文档中的Solidity by Example下的[Micropayment Channel 微支付通道](https://learnblockchain.cn/docs/solidity/solidity-by-example.html#id7)示例。根据应用场景的不同，签名的消息包含不同的内容，但一般都要包含一个防重放攻击的元素。通常使用和以太坊交易本身相同的技巧，即使用一个nonce记录账号进行交易的数量，智能合约检查该nonce以确保签名消息不被多次使用。本例中签名消息的内容包括：[PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline]。从代码nonces[owner]++中 可以看到，每调用一次permit，相应地址的nonce就会加1，这样再使用原来的签名消息就无法再通过验证了（重建的签名消息不正确了），也就防止了重放攻击。

在以太坊中，在ECDSA签名原有的r和s的基础上加了一个v，使用它们可以验证签名消息的账号。Solidity中有一个内置的函数ecrecover来获取消息的签名地址，它使用签名消息和r,s,v作为参数。

使用链下签名消息的常用流程是在首先链上根据输入参数重建整个签名消息，然后将重建的签名消息和输入的签名消息进行处理及比较对照，来进行相关判定和验证输入信息未受到篡改。

链下签名计算实质上是模拟的是Solidity中的keccak256及abi.encodePacked函数，因此本合约中消息签名的计算方式为bytes32 digest = keccak256（这行及接下来的代码。计算后得到一个hash值digest，利用这个值和函数参数中的，r,s,v，使用ecrecover函数就可以得到消息签名者的地址。将这个对址和owner相对比，就可以验证该消息是否由owner签名的（显而易见每个账号只能对本地址进行授权操作）。注意：签名内容包含了spender和value，如果签名内容的任意值做了更改，使用原来的r,s,v是无法通过验证的。

查看UniswapV2的前端代码可以发现，它使用了web3-react中的[eth_signTypedData_v4](https://github.com/Uniswap/uniswap-interface/blob/02d80e07dc42cf746452456d92d68a1b7b953a1e/src/hooks/useERC20Permit.ts#L223)方法来计算签名消息中的r,s,v的，最终传递给了permit函数作为参数。

### 2. EIP-712
该提案是用来增强链下签名消息在链上的可用性的。具体内容参见github上的EIP地址：[https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md)，它同时提供了一个测试示例[Example.sol](https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.sol)，本合约中DOMAIN_SEPARATOR的计算方法和示例中是一致的。因为原生的签名消息对用户不太友好，用户无法从中获取更多信息，使用EIP-712第一可以让用户了解消息签名的大致描述，第二可以让用户辨识哪些是信任的Dapp，哪些是高风险的Dapp，从而不随便签名消息让自己遭受损失（比如一个恶意Dapp进行伪装等）。

### 3. 为什么存在permit函数
UniswapV2的核心合约虽然功能完整，但对用户不友好，用户需要借助它的周边合约才能和核心合约交互。但是在涉及到流动性供给时，比如用户减少流动性，此时用户需要将自己的流动性代币（一种ERC20代币）燃烧掉。由于用户调用的是周边合约，周边合约未经授权是无法进行燃烧操作的。此时，如果按照常规操作，用户需要首先调用交易对合约对周边合约进行授权，再调用周边合约进行燃烧，这个过程实质上是调用两个不同合约的两个交易（无法合并到一个交易中），它分成了两步，用户需要交易两次才能完成。

使用线下消息签名后，可以减少其中一个交易，将所有操作放在一个交易里执行，确保了交易的原子性。在周边合约里，减小流动性来提取资产时，周边合约在一个函数内先调用交易对的permit函数进行授权，接着再进行转移流动性代币到交易对合约，提取代币等操作。所有操作都在周边合约的同一个函数中进行，达成了交易的原子性和对用户的友好性。

因此permit函数存在并且执行了授权操作的原因：

第三方合约在进行ERC20代币转移时（代币交易），用户首先需要调用代币合约进行授权（授权交易），然后才能调用第三方合约进行转移。这样整个过程将构成分阶段的两个交易，用户必须交易两次，失去了交易的原子性。使用线下消息签名线上验证的方式可以消除对授权交易的需求，permit就是进行线上验证并同时执行授权的函数。

当然如果用户会操作的话，也可以手动授权，不使用permit函数相关的周边合约接口进行交易。

### 4. 代币元数据
什么叫代币元数据，指的是代币名称，符号（简写）和精度。这三种元数据虽然存在于标准的ERC20协议中，必须得到实现，但是对于代币转移本身来讲却是没有任何作用或者意义的（代币转移函数transfer和transferFrom并未使用到它们）。它们属于对外展示的属性，所以在ERC1155协议中，不管是同质代币还是非同质代币（例如ERC721藏品）已经取消了这三种元数据，设法将它们放到了链下（不过放到链下就意味着需要一个额外的存储媒介）。然而当前钱包对ERC1155的支持并不太友好，并且ERC1155代币统一处理各种资产，无法同时满足多种场景需求。ERC1155提案虽然已变成Final状态两年了，始终未得到大规模应用。 

### 5. 修饰符
在Solidity中，函数修饰符规定了函数的行为、调用规则。在Solidity语言中预置的修饰符有如下一些：
#### 5.1 函数和状态变量可见性修饰符
* public:在外部和内部均可见（创建存储/状态变量的访问者函数），表示公有都可以使用，修饰的变量和函数，任何用户或者合约都能调用和访问。
* private:仅在当前合约中可见，表示只能被这个合约使用，修饰的变量和函数，只能在其所在的合约中调用和访问，即使是其子合约也没有权限访问。
* external（外部）: 只有外部可见（仅对函数）- external和public类似，但是不能被该合约使用，仅仅在消息调用中（通过this.fun），external函数被继承的时候，需要使用 this.functionName()来在内部调用，只不过这些函数只能在合约之外调用 - 它们不能被合约内的其他函数调用。
* internal（内部）: 只有内部可见，internal跟private比较类似，但是internal修饰的可以被继承的合约使用，不过， 如果某个合约继承自其父合约，这个合约即可以访问父合约中定义的“内部”函数。
#### 5.2 状态变量储存位置修饰符
* storage：变量储存在区块链中，状态变量默认是storage类型；
* memory：变量储临时存在内存中，局部变量默认是memory类型；
#### 5.3 接受Ether修饰符
* payable（可支付）：允许函数在调用同时接收Ether，在以太坊中可以在调用函数的时候付钱给另一个合约如：
```sol
contract OnlineStore { 
  function buySomething() external payable {
　　// 检查以确定0.001以太发送出去来运行函数:
　　require(msg.value == 0.001 ether);
　　// 如果为真，一些用来向函数调用者发送数字内容的逻辑
　　transferThing(msg.sender);
　}
}
```
#### 5.4 函数读取状态变量修饰符
* pure：不允许修改或访问状态变量-这还没有强制执行,表示只跟输出只跟输入有关，不但不在区块链写数据而且不会用里面的数据，只会用输入的数据
* view：不允许修改状态变量-这还没有强制执行,view表示这个函数不会修改和保存任何东西，
* constant（for function）：等同于view,不会消耗gas 也就是说不会做任何存储,constant在5.0以后的版本中被废弃
* constant（for state variables)：除了初始化之外，不允许赋值操作，类似JavaScript中的常量,则更严格一点 不会消耗gas 也不会使用函数的变量
#### 5.5 自定义修饰符
函数修改器(Function Modifiers): 修改器在其他语句执行前，为它先检验条件。关键字modifier（修饰符）。修改器常常用在函数的后面跟public和private等一个位置用来判断是否执行该函数，通常使用下划线结尾，如：
```sol
modifier olderThan(uint _age,uint _userId){
　require(age[_userID]>= _age);
　_;  //以_;结尾表示函数正常返回继续执行之前的功能
}
```

修改器(Modifiers)可以用来轻易的改变一个函数的行为。比如用于在函数执行前检查某种前置条件。修改器是一种合约属性，可被继承，同时还可被派生的合约重写(override)。

接下来我们将通过[OpenZeppelin库](https://github.com/OpenZeppelin/openzeppelin-contracts)的[Ownable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol)合约来学习一下modifier的准确用法。OpenZeppelin 是主打安保和社区审查的智能合约库，开发者可以在自己的 DApps中引用。在Ownable合约中，一般会进行以下操作：
* 合约创建，构造函数先行，将其 owner 设置为msg.sender（其部署者）为它加上一个修饰符 onlyOwner，它会限制陌生人的访问，将访问某些函数的权限锁定在 owner 上。允许将合约所有权转让给他人。
看一下源码：
```sol
/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
​
contract Ownable {
  address public owner;
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() public {
    owner = msg.sender;
  }
​
  /**
   * @dev Throws if called by any account other than the owner.
   */
​
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }
​
  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
​
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }
}
```

#### 我们来看一下函数修改器onlyOwner是怎么定义和使用的？
* 首先：要定义一个modifier，形式与函数很像，可以有参数，但是不需要返回值；
* 其次：特殊 _; 是必要的，它表示使用修改符的函数体的替换位置；
* 第三：使用将modifier置于参数后，返回值前即可。

#### 其他合约如何使用onlyOwner？
* 继承！函数修改器是可以继承的，只要新建的合约继承Ownable合约，即可使用这个修改器。合约之间的继承是通过 is 来实现的：

```sol
contract MyContract is Ownable {
  event LaughManiacally(string laughter);
​
  //注意！ onlyOwner 上场 :
  function likeABoss() external onlyOwner {
    LaughManiacally("Muahahahaha");
  }
}
```

#### 带参数的函数修改器 
之前我们已经读过一个简单的函数修饰符了：onlyOwner。函数修饰符也可以带参数。例如：

```sol
// 存储用户年龄的映射
mapping (uint => uint) public age;
// 限定用户年龄的修饰符
modifier olderThan(uint _age, uint _userId) {
  require(age[_userId] >= _age);
  _;
}
// 必须年满16周岁才允许开车 (至少在美国是这样的).
// 我们可以用如下参数调用`olderThan` 修饰符:
function driveCar(uint _userId) public olderThan(16, _userId) {
  // 其余的程序逻辑
}
```

使用修改器实现的一个防重复进入的例子。

```sol
pragma solidity ^0.4.0;
​
contract Mutex {
  bool locked;
  modifier noReentrancy() {
    if (locked) throw;
    locked = true;
    _;
    locked = false;
  }
  // This function is protected by a mutex, which means that
  // reentrant calls from within msg.sender.call cannot call f again.
  // The `return 7` statement assigns 7 to the return value but still
  // executes the statement `locked = false` in the modifier.
  function f() noReentrancy returns (uint) {
    if (!msg.sender.call()) throw;
    return 7;
  }
}
```
## 引用
* [UniswapV2核心合约学习（2）——UniswapV2ERC20.sol](https://blog.csdn.net/weixin_39430411/article/details/108965441)
* [Solidity函数修饰符](https://www.cnblogs.com/Sna1lGo/p/12384919.html)
* [solidity 学习笔记（3） 函数修饰符/继承](https://www.cnblogs.com/gzhlt/p/9949353.html)
* [solidity学习笔记（8）—— 函数修饰符及自定义修饰符](https://blog.csdn.net/lj900911/article/details/83037673)
* [区块链语言Solidity校验椭圆曲线加密数字签名（附实例）](https://me.tryblockchain.org/web3js-sign-ecrecover-decode.html)
* [【solidity】数学&hash&签名加密](https://segmentfault.com/a/1190000017814463)
* [Solidity中的ecrecover的应用](https://learnblockchain.cn/article/2701)

<!-- [UniswapV2核心合约学习（2）——UniswapV2ERC20.sol](https://www.codeleading.com/article/75394790994/) -->