import { View, Button, Text } from '@tarojs/components'

import useCounterStore from '../../store/counter'

import './index.scss'

function Index() {
  const { num, add, minus, asyncAdd } = useCounterStore()

  return (
    <View className='index'>
      <Button className='add_btn' onClick={add}>+</Button>
      <Button className='dec_btn' onClick={minus}>-</Button>
      <Button className='dec_btn' onClick={asyncAdd}>async</Button>
      <View><Text>{num}</Text></View>
      <View><Text>你好呀我叫沈思婕</Text></View>
    </View>
  )
}

export default Index
