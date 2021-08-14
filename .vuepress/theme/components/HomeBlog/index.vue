<template>
  <div class="home-blog">
    <div class="hero" style="display: flex; justify-content: center; position: relative;">
      <canvas id="canvas-home-bg"></canvas>
      <div style="position: absolute; top: 40vh">
        <ModuleTransition>
          <img class="hero-img" v-if="recoShowModule && $frontmatter.heroImage" :style="heroImageStyle || {}" :src="$withBase($frontmatter.heroImage)" alt="hero" />
        </ModuleTransition>

        <h1 class="animated rollIn" style="text-align: center" v-if="recoShowModule && $frontmatter.heroText !== null">
          {{ $frontmatter.heroText || $title || 'vuePress-theme-reco' }}
        </h1>

        <ModuleTransition delay="0.08">
          <p v-if="recoShowModule && $frontmatter.tagline !== null" class="description">
            {{ $frontmatter.tagline || $description || 'Welcome to your vuePress-theme-reco site' }}
          </p>
        </ModuleTransition>
      </div>
    </div>

    <ModuleTransition delay="0.16">
      <div v-show="recoShowModule" class="home-blog-wrapper">
        <div class="blog-list" data-wow-duration="1s">
          <!-- 博客列表 -->
          <note-abstract :data="$recoPosts" @paginationChange="paginationChange" />
        </div>
        <div class="info-wrapper">
          <PersonalInfo />
          <h4>
            <reco-icon icon="reco-category" /> {{$recoLocales.category}}
          </h4>
          <ul class="category-wrapper">
            <li class="category-item wow lightSpeedIn" data-wow-duration="1s" v-for="(item, index) in this.$categories.list" :key="index">
              <router-link :to="item.path">
                <span class="category-name">{{ item.name }}</span>
                <span class="post-num" :style="{ 'backgroundColor': getOneColor() }">{{ item.pages.length }}</span>
              </router-link>
            </li>
          </ul>
          <hr>
          <h4 v-if="$tags.list.length !== 0">
            <reco-icon icon="reco-tag" /> {{$recoLocales.tag}}
          </h4>
          <TagList @getCurrentTag="getPagesByTags" />
          <h4 v-if="$themeConfig.friendLink && $themeConfig.friendLink.length !== 0">
            <reco-icon icon="reco-friend" /> {{$recoLocales.friendLink}}
          </h4>
          <FriendLink />
        </div>
      </div>
    </ModuleTransition>

    <ModuleTransition delay="0.24">
      <Content v-show="recoShowModule" class="home-center" custom />
    </ModuleTransition>
  </div>
</template>

<script>
import { defineComponent, toRefs, reactive, computed, getCurrentInstance, onMounted } from 'vue-demi'
import TagList from '@theme/components/TagList'
import FriendLink from '@theme/components/FriendLink'
import NoteAbstract from '@theme/components/NoteAbstract'
import { ModuleTransition, RecoIcon } from '@vuepress-reco/core/lib/components'
import PersonalInfo from '@theme/components/PersonalInfo'
import { getOneColor } from '@theme/helpers/other'
import About from "@theme/components/About"
import { add } from "@theme/api/fetch"
import { getTimeNum } from "@theme/helpers/utils"

export default defineComponent({
  components: { NoteAbstract, TagList, FriendLink, ModuleTransition, PersonalInfo, RecoIcon, About },
  data() {
    return {
      recoShow: false,
      currentPage: 1,
      tags: [],
      bubbles: null
    }
  },
  setup(props, ctx) {
    const instance = getCurrentInstance().proxy

    const state = reactive({
      recoShow: false,
      heroHeight: 0
    })

    const recoShowModule = computed(() => instance && instance.$parent.recoShowModule)

    const heroImageStyle = computed(() => instance.$frontmatter.heroImageStyle || {})

    const bgImageStyle = computed(() => {
      const url = instance.$frontmatter.bgImage
        ? instance.$withBase(instance.$frontmatter.bgImage)
        : require('../../images/bg.svg')

      const initBgImageStyle = {
        textAlign: 'center',
        overflow: 'hidden',
        background: `url(${url}) center/cover no-repeat`
      }

      const { bgImageStyle } = instance.$frontmatter

      return bgImageStyle ? { ...initBgImageStyle, ...bgImageStyle } : initBgImageStyle
    })
    onMounted(() => {

      state.heroHeight = document.querySelector('.hero').clientHeight
      state.recoShow = true
    })

    return { recoShowModule, heroImageStyle, bgImageStyle, ...toRefs(state), getOneColor }
  },
  mounted() {
    import('vue-canvas-effect/src/components/bubbles').then(module => {
      this.bubbles = module.default
    })
    this.recoShow = true
    this.setHomeBg()
    new WOW().init();
    this.addGuest()
    //this._setPage(this._getStoragePage())
  },
  methods: {
    addGuest() {
      if (localStorage.getItem("user")) return
      const timeDiff = getTimeNum(new Date()) - 1628870400 * 1000
      const content = `我不是中本聪|${parseInt(timeDiff / 1000)}|欢迎大佬来到我的博客站，你可以在此留下你想发布的内容。`
      add(content).then(() => {
        localStorage.setItem("user", "true")
      })
    },
    paginationChange(page) {
      setTimeout(() => {
        window.scrollTo(0, this.heroHeight)
      }, 100)
    },
    getPagesByTags(tagInfo) {
      this.$router.push({ path: tagInfo.path })
    },
    setHomeBg: () => {
      var isMoblie = /Android|webOS|iPhone|iPod|BlackBerry/i.test(window.navigator.userAgent)
      var canvas = document.getElementById('canvas-home-bg')
      if (!canvas) return
      var ctx = canvas.getContext('2d'),
        w = canvas.width = isMoblie ? window.innerWidth / 1.1 : window.innerWidth / 1.4,
        h = canvas.height = window.innerHeight,

        hue = 217,
        stars = [],
        count = 0,
        maxStars = 1400;

      // Cache gradient
      var canvas2 = document.createElement('canvas'),
        ctx2 = canvas2.getContext('2d');
      canvas2.width = 100;
      canvas2.height = 100;
      var isMoblie = /Android|webOS|iPhone|iPod|BlackBerry/i.test(window.navigator.userAgent)
      var half = canvas2.width / 2,
        gradient2 = ctx2.createRadialGradient(half, half, 0, half, half, half);
      gradient2.addColorStop(0.025, '#fff');
      gradient2.addColorStop(0.1, 'hsl(' + hue + ', 61%, 33%)');
      gradient2.addColorStop(0.25, 'hsl(' + hue + ', 64%, 6%)');
      gradient2.addColorStop(1, 'transparent');

      ctx2.fillStyle = gradient2;
      ctx2.beginPath();
      ctx2.arc(half, half, half, 0, Math.PI * 2);
      ctx2.fill();

      // End cache

      function random(min, max) {
        if (arguments.length < 2) {
          max = min;
          min = 0;
        }

        if (min > max) {
          var hold = max;
          max = min;
          min = hold;
        }

        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      var Star = function () {

        this.orbitRadius = random(w / 2 - 50);
        this.radius = random(100, this.orbitRadius) / 10;
        this.orbitX = w / 2;
        this.orbitY = h / 2;
        this.timePassed = random(0, maxStars);
        this.speed = random(this.orbitRadius) / 100000;
        this.alpha = random(2, 10) / 10;

        count++;
        stars[count] = this;
      }

      Star.prototype.draw = function () {
        var x = Math.sin(this.timePassed + 1) * this.orbitRadius + this.orbitX,
          y = Math.cos(this.timePassed) * this.orbitRadius / 2 + this.orbitY,
          twinkle = random(10);

        if (twinkle === 1 && this.alpha > 0) {
          this.alpha -= 0.05;
        } else if (twinkle === 2 && this.alpha < 1) {
          this.alpha += 0.05;
        }

        ctx.globalAlpha = this.alpha;
        ctx.drawImage(canvas2, x - this.radius / 2, y - this.radius / 2, this.radius, this.radius);
        this.timePassed += this.speed;
      }

      for (var i = 0; i < maxStars; i++) {
        new Star();
      }

      function animation() {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#1c1c28" //'hsla(' + hue + ', 64%, 6%, 1)';
        ctx.fillRect(0, 0, w, h)

        ctx.globalCompositeOperation = 'lighter';
        for (var i = 1, l = stars.length; i < l; i++) {
          stars[i].draw();
        };

        window.requestAnimationFrame(animation);
      }

      animation();
    }
  }
})
</script>

<style lang="stylus">
.home-blog {
  padding: 0;
  margin: 0px auto;

  .hero {
    margin: 0 auto 0;
    position: relative;
    box-sizing: border-box;
    padding: 0 20px;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;

    .hero-img {
      max-width: 300px;
      margin: 0 auto 1.5rem;
    }

    h1 {
      display: block;
      margin: 0 auto 1.8rem;
      font-size: 2.5rem;
    }

    .description {
      margin: 1.8rem auto;
      font-size: 1.6rem;
      line-height: 1.3;
    }
  }

  .home-blog-wrapper {
    display: flex;
    align-items: flex-start;
    margin: 20px auto 0;
    padding: 0 20px;
    max-width: $homePageWidth;

    .blog-list {
      flex: auto;
      width: 0;

      .abstract-wrapper {
        .abstract-item:last-child {
          margin-bottom: 0px;
        }
      }
    }

    .info-wrapper {
      position: -webkit-sticky;
      position: sticky;
      top: 70px;
      overflow: hidden;
      transition: all 0.3s;
      margin-left: 15px;
      flex: 0 0 300px;
      height: auto;
      box-shadow: var(--box-shadow);
      border-radius: $borderRadius;
      box-sizing: border-box;
      padding: 0 15px;
      background: var(--background-color);

      &:hover {
        box-shadow: var(--box-shadow-hover);
      }

      h4 {
        color: var(--text-color);
      }

      .category-wrapper {
        list-style: none;
        padding-left: 0;

        .category-item {
          margin-bottom: 0.4rem;
          padding: 0.4rem 0.8rem;
          transition: all 0.5s;
          border-radius: $borderRadius;
          box-shadow: var(--box-shadow);
          background-color: var(--background-color);

          &:hover {
            transform: scale(1.04);

            a {
              color: $accentColor;
            }
          }

          a {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--text-color);

            .post-num {
              width: 50px;
              height: 1.6rem;
              text-align: center;
              line-height: 1.6rem;
              border-radius: $borderRadius;
              background: #eee;
              box-shadow: var(--box-shadow);
              font-size: 13px;
              color: #fff;
            }
          }
        }
      }
    }
  }
}

@media (max-width: $MQMobile) {
  .home-blog {
    .hero {
      height: 450px;

      img {
        max-height: 210px;
        margin: 2rem auto 1.2rem;
      }

      h1 {
        margin: 0 auto 1.8rem;
        font-size: 2rem;
      }

      .description {
        font-size: 1.2rem;
      }

      .action-button {
        font-size: 1rem;
        padding: 0.6rem 1.2rem;
      }
    }

    .home-blog-wrapper {
      display: block !important;

      .blog-list {
        width: auto;
      }

      .info-wrapper {
        // display none!important
        margin-left: 0;

        .personal-info-wrapper {
          display: none;
        }
      }
    }
  }
}

@media (max-width: $MQMobileNarrow) {
  .home-blog {
    .hero {
      height: 450px;

      img {
        max-height: 210px;
        margin: 2rem auto 1.2rem;
      }

      h1 {
        margin: 0 auto 1.8rem;
        font-size: 2rem;
      }

      h1, .description, .action {
        // margin: 1.2rem auto;
      }

      .description {
        font-size: 1.2rem;
      }

      .action-button {
        font-size: 1rem;
        padding: 0.6rem 1.2rem;
      }
    }

    .home-blog-wrapper {
      display: block !important;

      .blog-list {
        width: auto;
      }

      .info-wrapper {
        // display none!important
        margin-left: 0;

        .personal-info-wrapper {
          display: none;
        }
      }
    }
  }

  .leaderboard ol li mark {
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 18px 10px 18px 50px;
    margin: 0;
    background: none;
    color: #fff;
  }

  .leaderboard ol li mark::before, .leaderboard ol li mark::after {
    content: '';
    position: absolute;
    z-index: 1;
    bottom: -11px;
    left: -9px;
    border-top: 10px solid #c24448;
    border-left: 10px solid transparent;
    -webkit-transition: all 0.1s ease-in-out;
    transition: all 0.1s ease-in-out;
    opacity: 0;
  }

  .leaderboard ol li mark::after {
    left: auto;
    right: -9px;
    border-left: none;
    border-right: 10px solid transparent;
  }

  .leaderboard ol li small {
    position: relative;
    z-index: 2;
    display: block;
    text-align: right;
  }

  .leaderboard ol li::after {
    content: '';
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #fa6855;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.08);
    -webkit-transition: all 0.3s ease-in-out;
    transition: all 0.3s ease-in-out;
    opacity: 0;
  }
}
</style>