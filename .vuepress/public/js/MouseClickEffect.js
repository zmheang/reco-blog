var a_idx = 0;
var global = window

function getRandom(max, min) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
jQuery(document).ready(function ($) {
    $("body").click(function (e) {
        var a = new Array("非对称加密", "UTXO", "智能合约", "EVM", "闪电贷", "Defi", "DAPP", "P2P", "IPFS", 
        "EOS", "ETH", "Uniswap", "闪电网络", "扩容", "区块", "共识机制", "POW", "POS", "DPOS", "分叉", "哈希", 
        "Layer 2", "web 3.0", "BTC", "中本聪", "V神", "BM", "大空翼", "Blockchain", "节点", "预言机", "去中心化",
        "时间戳", "图灵完备", "DAO", "零知识证明", "私钥", "公钥", "冷钱包", "挖矿", "矿工", "矿池", "侧链",
        "跨链", "Gas", "女巫攻击", "创世", "拜占庭将军问题", "超级节点", "归零", "销毁", "增发", "签名", "隐私币", );
        var $i = $("<span/>").text(a[a_idx]);
        a_idx = (a_idx + 1) % a.length;
        var x = e.pageX,
            y = e.pageY;
        $i.css({
            "z-index": 999999999999999999999999999999999999999999999999999999999999999999999,
            "top": y - 20,
            "left": x,
            "position": "absolute",
            "font-weight": "bold",
            "color": `rgb(${getRandom(255,0)},${getRandom(255,0)},${getRandom(255,0)})`,
            "user-select": 'none',
            "cursor": 'default'
        });
        $("body").append($i);
        $i.animate({
                "top": y - 180,
                "opacity": 0
            },
            1500,
            function () {
                $i.remove();
            });
    });
});