import { Component, PropsWithChildren } from 'react'
import useUserStore from './store/user'
import { storage } from './utils/storage'

import './app.scss'

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    this.restoreUserState()
  }

  componentDidShow() { }

  componentDidHide() { }

  restoreUserState = async () => {
    try {
      const token = await storage.getToken()
      const userInfo = await storage.getUserInfo()
      
      if (token && userInfo) {
        const { initUserInfo } = useUserStore.getState()
        initUserInfo(userInfo)
      }
    } catch (error) {
      console.error('恢复用户状态失败:', error)
    }
  }

  render() {
    return this.props.children
  }
}

export default App