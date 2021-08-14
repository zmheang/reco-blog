module.exports = {
  "title": "UTXO",
  "description": "投身区块链，寻找中本聪",
  "dest": "public",
  base: '/reco-blog/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'viewport', content: 'width=device-width,initial-scale=1,user-scalable=no' }],
    ['meta', { name: 'theme-color', content: 'red' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['meta', { name: 'msapplication-TileColor', content: '#000000' }],
    ["link", {
      "rel": "stylesheet",
      "href": "https://cdn.jsdelivr.net/npm/animate.css@3.5.1"
    }],
    ["script", {
      "language": "javascript",
      "type": "text/javascript",
      "src": "https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js"
    }],
    // 引入鼠标点击脚本
    ["script", {
      "language": "javascript",
      "type": "text/javascript",
      "src": "/js/MouseClickEffect.js"
    }],
    ["script", {
      "language": "javascript",
      "type": "text/javascript",
      "src": "https://wowjs.uk/dist/wow.min.js"
    }],
  ],
  //"theme": "reco",
  "plugins": [
    /* ['@vuepress-reco/vuepress-plugin-bulletin-popover', {
      title: '公告',
      body: [
        {
          type: 'title',
          content: '欢迎加我的QQ/vx 🎉🎉🎉',
          style: 'text-aligin: center;',
        },
        {
          type: 'text',
          src: '/head.jpg'
        },
        {
          type: 'text',
          content: '喜欢的主题特效可以去个人信息',
          style: 'text-align: center;'
        },
        {
          type: 'text',
          content: '友链或疑问均可在留言板给我留言',
          style: 'text-align: center;'
        }
      ],
      footer: [
        {
          type: 'button',
          text: '打赏',
          link: '/blog/donate'
        },
      ]
    }], */
    [
      "@vuepress-reco/vuepress-plugin-bgm-player", {
        audios: [
          // 本地文件示例
          // {
          //   name: '장가갈 수 있을까',
          //   artist: '咖啡少年',
          //   url: '/bgm/1.mp3',
          //   cover: '/bgm/1.jpg'
          // },
          // 网络文件示例
          {
            name: '강남역 4번 출구',
            artist: 'Plastic / Fallin` Dild',
            url: 'https://assets.smallsunnyfox.com/music/2.mp3',
            cover: 'https://assets.smallsunnyfox.com/music/2.jpg'
          }
        ]
      }
    ],
  ],
  locales: {
    '/': {
      lang: 'zh-CN'
    }
  },
  themeConfig: {
    type: "blog",//"customerComponent",
    huawei: false,
    nav: [
      { text: '首页', link: '/', icon: 'reco-home' },
      {
        text: 'DAPP开发', icon: 'reco-document', items: [
          { text: 'DAPP教程', link: '/dapp/tutorial/junior/explain/' },
          //{ text: 'Solidity', link: '/solidity/' },
          //{ text: '智能合约开发', link: "/contract/" },
          { text: 'Uniswap', link: "/dapp/uniswap/v2/whitepaper/" },
        ]
      },
      {
        text: 'TodoList', icon: 'reco-suggestion', items: [
          { text: 'vue_js', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/vue_js' },  //done
          { text: 'vue_js_vuex', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/vue_js_vuex' }, //done
          { text: 'react_ts', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/react_ts' },  //done
          //{ text: 'react_ts_hook', link: '/contact/' }, 
          { text: 'react_ts_mobx', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/react_ts_mobx' }, //done
          //{ text: 'react_ts_redux', link: '/contact/' },
          { text: 'react-native_ts ', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/react-native_ts' },  //done
          { text: 'react-native_ts_mobx', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/react-native_ts_mobx' },  //done
          //{ text: 'flutter', link: '/declare/' },
          //{ text: 'wechat_miniprogram', link: '/declare/' },
          { text: 'react_ts_mobx_eos', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/react_ts_mobx_eos' }, //done
          //{ text: 'react_ts_mobx_eos_ipfs', link: '/contact/' },
          { text: 'vue_js_vuex_eos', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/vue_js_vuex_eos' },  //done
          { text: 'vue_js_vuex_eos_ipfs', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/vue_js_vuex_eos_ipfs' }, //done
          { text: 'vue_js_vuex_eos_chrome_extensions', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/vue_js_vuex_eos_chrome' },  //done
          { text: 'react-native_ts_mobx_eos', link: 'https://github.com/xiangzhengfeng/todolist/tree/master/react-native_ts_mobx_eos' }
        ]
      },
      { text: '时间轴', link: '/timeline/', icon: 'reco-date' },
      { text: '留言板', link: '/guestbook/', icon: 'reco-suggestion' },
      { text: '关于', link: '/about/', icon: 'reco-account' },
      {
        text: '仓库', items: [
          { text: 'Github', link: 'https://github.com/xiangzhengfeng/reco-blog' },
          { text: '码云', link: 'https://gitee.com/qianduanxinlv/vuepress_blog' },
        ], icon: 'reco-github'
      },
    ],
    friendLink: [
      {
        title: '午后南杂',
        desc: 'Enjoy when you can, and endure when you must.',
        email: '1156743527@qq.com',
        link: 'https://www.recoluan.com'
      },
      {
        title: 'vuepress-theme-reco',
        desc: 'A simple and beautiful vuepress Blog & Doc theme.',
        avatar: "https://vuepress-theme-reco.recoluan.com/icon_vuepress_reco.png",
        link: 'https://vuepress-theme-reco.recoluan.com'
      },
    ],
    // 博客设置
    blogConfig: {
      category: {
        location: 2, // 在导航栏菜单中所占的位置，默认2
        text: '分类' // 默认 “分类”
      },
      tag: {
        location: 3, // 在导航栏菜单中所占的位置，默认3
        text: '标签' // 默认 “标签”
      }
    },
    logo: '/head.jpg',
    // 搜索设置
    search: true,
    searchMaxSuggestions: 10,
    // 自动形成侧边导航
    subSidebar: 'auto',
    sidebarDepth: 1,
    displayAllHeaders: false,
    sidebar: {
      '/dapp/tutorial/': [
        {
          title: 'DAPP开发初级教程',
          collapsable: true,
          children: [
            'junior/explain/',
            'junior/contract/',
            'junior/develop/',
            'junior/ipfs/',
            'junior/think/'
          ]
        },/* 
        {
          title: 'DAPP开发中级教程',
          collapsable: true,
          children: [
          ]
        },
        {
          title: 'DAPP开发高级教程',
          collapsable: true,
          children: [
          ]
        }, */
      ],
      "/dapp/uniswap/": [
        {
          title: 'Uniswap-V2',
          collapsable: true,
          children: [
            'v2/whitepaper/',
            'v2/explain/',
            'v2/source-code/',
            'v2/source-code/UniswapV2ERC20',
            'v2/source-code/UniswapV2Pair',
            'v2/source-code/UniswapV2Factory',
            'v2/source-code/UniswapV2Router02',
            'v2/source-code/UniswapV2Migrator',
            'v2/source-code/ExampleOracleSimple',
            'v2/source-code/ExampleSlidingWindowOracle',
            'v2/source-code/ExampleSwapToPrice',
            'v2/source-code/ExampleCombinedSwapAddRemoveLiquidity'
          ]
        },
      ]
    },
    // 最后更新时间
    //lastUpdated: 'Last Updated',
    // 作者
    author: '我不是中本聪',
    authorAvatar: '/head.jpg',
    // 项目开始时间
    startYear: '2017',
    mode: "dark",
    // 密钥
    keyPage: {
      keys: ['4178F7AE2F746A46FA885D01962F756A'], // 1.3.0 版本后需要设置为密文 32位的 md5 加密密文
    }
  },
  "markdown": {
    "lineNumbers": true
  },
}