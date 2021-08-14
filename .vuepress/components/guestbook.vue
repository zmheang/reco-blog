<template>
  <div style="width: 100%;">
    <div class="loading-box" v-show="loading">
      <transition name="fade">
        <LoadingPage class="loading" :style="{ top: top }" />
      </transition>
    </div>

    <div class="guestbook-box" id="guest-box">
      <div>当前留言板基于EOSIO区块链，使用kylin网络部署智能合约。</div>
      <div>该留言板为DAPP即去中心化应用，用户可以随意添加、修改、删除各个留言。</div>
      <div>所有留言均可在<a href="https://kylin.eosq.app/account/yijiaxunkeji" target="_blank">kylin网络</a>查看到，记录不可篡改和伪造，请谨慎留言。</div>
      <div>kylin测试网区块链浏览器：
        <a href="https://kylin.eosq.app/account/yijiaxunkeji" target="_blank">区块浏览器地址1</a>
        <a href="https://kylin.eosx.io/account/yijiaxunkeji" target="_blank">区块浏览器地址2</a>
      </div>
    </div>

    <div class="guestbook-box">
      <div class="title">发布留言</div>
      <div class="head">
        <input type="text" placeholder="请输入留言者昵称" maxlength="10" v-model="name">
        <div class="btn" @click="addGuest" data-type="add">
          发布
        </div>
      </div>
      <textarea type="text" placeholder="请输入留言内容" maxlength="100" v-model="content" />
      <div class="tx"><a :href="`https://kylin.eosq.app/tx/${tx}`" target="_blank">{{ tx ? `交易哈希: ${tx}` : "" }}</a></div>
      <div>
        留言
      </div>
      <div class="content" v-for="(item, index) in list" :key="index" :style="{ marginTop: index === 0 ? '20px' : 0 }">
        <img src="../public/head.jpg" alt="" v-if="!isMobile">
        <div class="body">
          <div class="time">{{item.name}}<span v-show="!isMobile">&emsp;{{item.time}}</span></div>
          <div class="time" v-show="isMobile">{{item.time}}</div>
          <div class="value">{{item.value || "-"}}</div>
          <div class="operate" data-type="operation" v-if="isMobile" :style="{color: item.isDone ? 'red' : '', marginTop: '10px' }" @click="item.isDone ? removeGuest(item.id) : doneGuest(item.id)">{{ item.isDone ? "删除" : "标记已阅" }}</div>
        </div>
        <div class="operate" data-type="operation" v-if="!isMobile" :style="{color: item.isDone ? 'red' : '' }" @click="item.isDone ? removeGuest(item.id) : doneGuest(item.id)">{{ item.isDone ? "删除" : "标记已阅" }}</div>
      </div>

      <div class="more">
        <span @click="getNextList" data-type="next">{{ more && list.length !== 0 ? "下一页" : "你都快刨到我家祖坟啦，已经没有留言了哦！"}}</span>
      </div>
    </div>
  </div>
</template>
<script>
import { getTableDataList, add, done, remove } from "@theme/api/fetch"
import { getTimeNum, checkIsMobile } from "@theme/helpers/utils"
import LoadingPage from '@theme/components/LoadingPage'
export default {
  components: { LoadingPage },
  data() {
    return {
      name: "",
      content: "",
      timeBase: 1628870400, // 2021-08-14 00:00:00 秒数
      next_key: "",
      list: [],
      more: false,
      pageSize: 10,
      loading: false,
      top: 0,
      tx: "",
      isMobile: false
    }
  },
  created() {
    this.getList(this.next_key, this.pageSize)
    this.isMobile = checkIsMobile()
  },
  mounted() {
    window.addEventListener("click", (e) => {
      const type = e.target.dataset.type
      if (type) {
        if (type === "add" && !this.content) return
        if (type === "next" && !this.more) return
        this.loading = true
        this.top = `calc(${e.pageY - e.clientY - 100}px) !important`
      }
    })
  },
  methods: {
    getNextList() {
      if (!this.more) return
      this.getList(this.next_key, this.pageSize)
    },

    async getAllList() {
      const data = await getTableDataList("", this.list.length)
      this.next_key = data?.next_key
      this.list = data.list
      this.more = data?.more
      this.loading = false
    },

    async getList(next_key, pageSize) {
      const data = await getTableDataList(next_key, pageSize)
      this.next_key = data?.next_key
      this.list = this.list.concat(data.list)
      this.more = data?.more
      this.loading = false
    },

    addGuest() {
      if (!this.content) {
        alert("留言内容不能为空！")
        return
      }
      const timeDiff = getTimeNum(new Date()) - this.timeBase * 1000
      const content = `${this.name ? this.name + "|" : ""}${parseInt(timeDiff / 1000)}|${this.content}`
      add(content).then((res) => {
        this.tx = res.transaction_id
        this.getAllList()
        this.name = ""
        this.content = ""
      })
    },

    doneGuest(id) {
      done(id).then(() => {
        this.getAllList()
      })
    },

    removeGuest(id) {
      remove(id).then(() => {
        this.getAllList()
      })
    },
  }
}
</script>
<style lang="stylus">
.loading-box {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);

  .loading {
    position: fixed !important;
    z-index: 22;
    top: 0;
    left: 0;
    height: calc(100vh) !important;
    overflow: hidden;
  }
}

.guestbook-box {
  padding: 20px;
  background: black;
  border-radius: 5px;
  margin-bottom: 30px;
  background: transparent;
  box-shadow: var(--box-shadow);

  &>div {
    font-size: 1em;
    margin-bottom: 10px;
  }

  .title {
    font-size: 1.3em;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;

    input {
      width: 200px;
    }

    .btn {
      border-radius: 4px;
      padding: 10px 20px;
      width 50px
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      color: var(--text-color);
      box-shadow: var(--box-shadow-hover);
      cursor: pointer;
      overflow: hidden;
      -webkit-transition: all 0.15s ease-in;
      transition: all 0.15s ease-in;
      position: relative;
    }

    .btn:before {
      content: ' ';
      position: absolute;
      background: #fff;
      width: 25px;
      height: 50px;
      top: 0;
      left: -80px;
      opacity: 0.3;
      -webkit-transition: all 0.25s ease-out;
      transition: all 0.25s ease-out;
      -webkit-transform: skewX(-25deg);
      transform: skewX(-25deg);
    }

    .btn:hover:before {
      width: 45px;
      left: 150px;
    }
  }

  textarea {
    width: calc(100% - 20px);
    height: 80px;
    margin-bottom: 10px;
  }

  .tx {
    margin-bottom: 20px;
    min-height: 20px;
  }

  input, textarea {
    background: transparent;
    border: 1px solid var(--text-color);
    border-radius: 4px;
    color: $accentColor;
    padding: 10px;
    line-height: 20px;
    outline: none;
    resize: none;
  }

  .content {
    border-top: 1px solid rgba(0, 0, 0, 0.5);
    display: flex;
    margin-bottom: 0;
    padding: 15px 10px;

    &:hover {
      box-shadow: var(--box-shadow-hover);
    }

    img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      margin-right: 20px;
    }

    .body {
      flex: 1;
      margin-right: 10px;
    }

    .operate {
      width: 70px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      cursor: pointer;
      font-size: 0.8em;
      box-shadow: var(--box-shadow);

      &:hover {
        box-shadow: var(--box-shadow-hover);
        color: $accentColor;
      }
    }
  }

  .time {
    font-size: 0.8em;
    margin: 10px 0;
  }

  .value {
  }

  .more {
    margin: 10px;
    text-align: center;

    span {
      cursor: pointer;

      &:hover {
        color: $accentColor;
      }
    }
  }
}
</style>
