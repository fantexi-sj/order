import { Component, PropsWithChildren } from 'react'
import { View, Button, Text } from '@tarojs/components'

import useCounterStore from '../../store/counter'

import './index.scss'

class Index extends Component<PropsWithChildren> {
  componentWillReceiveProps(nextProps) {
    console.log(this.props, nextProps)
  }

  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }

  render() {
    const { num, add, minus, asyncAdd } = useCounterStore()

    return (
      <View className='index'>
        <Button className='add_btn' onClick={add}>+</Button>
        <Button className='dec_btn' onClick={minus}>-</Button>
        <Button className='dec_btn' onClick={asyncAdd}>async</Button>
        <View><Text>{num}</Text></View>
        <View><Text>Hello, World</Text></View>
      </View>
    )
  }
}

export default Index