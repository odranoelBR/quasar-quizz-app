// import langEn from 'quasar/lang/en-us' // change to any language you wish! => this breaks wallaby :(
// this is mapped in jest.config.js to resolve @vue/test-utils
import { createLocalVue, shallowMount } from 'test-utils'

import Vuex from 'vuex'
import VueRouter from 'vue-router'
import * as All from 'quasar'
import Vue from 'vue'
Vue.use(Vuex)
const { Quasar } = All

const components = Object.keys(All).reduce((object, key) => {
  const val = All[key]
  if (val && val.component && val.component.name != null) {
    object[key] = val
  }
  return object
}, {})

Vue.use(Quasar, { components })

const mockSsrContext = () => {
  return {
    req: {
      headers: {}
    },
    res: {
      setHeader: () => undefined
    }
  }
}

// https://eddyerburgh.me/mock-vuex-in-vue-unit-tests
export const mountQuasar = (component, componentOptions, options = {}) => {
  const localVue = createLocalVue()
  const app = {}

  localVue.use(Vuex)
  localVue.use(VueRouter)
  localVue.use(Quasar)
  localVue.use(Quasar, { components })
  const store = new Vuex.Store({})
  const router = new VueRouter()

  if (options) {
    const ssrContext = options.ssr ? mockSsrContext() : null

    if (options.cookies) {
      const cookieStorage = ssrContext ? Cookies.parseSSR(ssrContext) : Cookies
      const cookies = options.cookies
      Object.keys(cookies).forEach(key => {
        cookieStorage.set(key, cookies[key])
      })
    }

    if (options.plugins) {
      options.plugins.forEach(plugin => {
        plugin({ app, store, router, Vue: localVue, ssrContext })
      })
    }
  }

  // mock vue-i18n
  const $t = () => { }
  const $tc = () => { }
  const $n = () => { }
  const $d = () => { }

  return shallowMount(component, {
    localVue,
    ...componentOptions,
    router,
    mocks: { $t, $tc, $n, $d },
    // Injections for Components with a QPage root Element
    provide: {
      pageContainer: true,
      layout: {
        header: {},
        right: {},
        footer: {},
        left: {}
      }
    }
  })
}
