<template>
  <div class="customer-component">
    <div class="left">{{count}}</div>
    <div class="center">123</div>
    <div class="right">123</div>
  </div>
</template>
<script>
import { getTableDataList } from "../api/fetch"
export default {
  data() {
    return {
      count: 0
    }
  },
  mounted() {
    //import('./lib-that-access-window-on-import').then(module => {
    setInterval(() => {
      this.count++
    }, 1000)
    console.log(getTableDataList)
    getTableDataList()
    //})
  }
}
</script>
<style lang="stylus">
.customer-component {
  height: calc(100vh - 60px);
  display: flex;
  background-color: #333;
  color: #fff;

  & > div {
    flex: 0 0 200px;
    width: 200px;
    text-align: center;
  }

  .left {
    background-color: #58a;
  }

  .center {
    flex: 1;
    background-color: #fb3;
  }

  .right {
    background-color: #58a;
  }
}
</style>
