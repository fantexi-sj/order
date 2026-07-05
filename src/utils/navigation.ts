import Taro from '@tarojs/taro'

interface NavigateToOptions {
  url: string
  animationType?: 'slide-in-right' | 'slide-in-left' | 'slide-in-top' | 'slide-in-bottom' | 'zoom-in' | 'zoom-out' | 'fade-in' | 'fade-out'
  animationDuration?: number
}

interface RedirectToOptions {
  url: string
}

interface SwitchTabOptions {
  url: string
}

interface ReLaunchOptions {
  url: string
}

interface NavigateBackOptions {
  delta?: number
}

interface WeixinNavigateToOption {
  url: string
  animationType?: string
  animationDuration?: number
}

const DEFAULT_ANIMATION_TYPE: NavigateToOptions['animationType'] = 'slide-in-right'
const DEFAULT_ANIMATION_DURATION = 300

export const navigation = {
  navigateTo: (options: NavigateToOptions) => {
    const navigateOptions: WeixinNavigateToOption = {
      url: options.url,
      animationType: options.animationType || DEFAULT_ANIMATION_TYPE,
      animationDuration: options.animationDuration || DEFAULT_ANIMATION_DURATION
    }
    return (Taro as any).navigateTo(navigateOptions)
  },

  redirectTo: (options: RedirectToOptions) => {
    return Taro.redirectTo({
      url: options.url
    })
  },

  switchTab: (options: SwitchTabOptions) => {
    return Taro.switchTab({
      url: options.url
    })
  },

  reLaunch: (options: ReLaunchOptions) => {
    return Taro.reLaunch({
      url: options.url
    })
  },

  navigateBack: (options?: NavigateBackOptions) => {
    return Taro.navigateBack({
      delta: options?.delta || 1
    })
  }
}
