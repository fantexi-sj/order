# API 使用文档

## 登录流程

### 1. 用户点击登录按钮

```typescript
import { auth } from '../utils/auth'
import useUserStore from '../store/user'

const { setUserInfo } = useUserStore()

const handleLogin = async () => {
  try {
    // 调用登录
    const loginRes = await auth.login()
    
    // 更新用户信息到全局状态
    setUserInfo({
      id: loginRes.user.id,
      name: loginRes.user.name,
      gender: loginRes.user.gender,
      avatarUrl: loginRes.user.avatar_url,
      birthday: loginRes.user.birthday.split('T')[0]
    })
    
    console.log('登录成功！')
  } catch (error) {
    console.error('登录失败:', error)
  }
}
```

### 2. 登录接口详情

**请求地址**: `POST /api/user/wx-login`

**请求参数**:
```json
{
  "code": "wx.login返回的code",
  "merchant_id": 1
}
```

**响应数据**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "name": "范特西",
      "gender": "male",
      "avatar_url": "https://img.3dmgame.com/uploads/images/news/20190120/1547978611_651168.jpg",
      "birthday": "2000-05-19T16:00:00.000Z"
    }
  }
}
```

## 用户信息管理

### 获取用户信息

```typescript
import { userApi } from '../api/user'

const getUserInfo = async () => {
  try {
    const res = await userApi.getUserInfo()
    console.log('用户信息:', res.data)
  } catch (error) {
    console.error('获取失败:', error)
  }
}
```

### 更新用户信息

```typescript
import { userApi } from '../api/user'

const updateUserInfo = async () => {
  try {
    const res = await userApi.updateUserInfo({
      name: '新昵称',
      gender: 'male',
      birthday: '2000-01-01'
    })
    console.log('更新成功:', res.data)
  } catch (error) {
    console.error('更新失败:', error)
  }
}
```

### 上传头像

```typescript
import { userApi } from '../api/user'
import Taro from '@tarojs/taro'

const uploadAvatar = async () => {
  try {
    // 选择图片
    const res = await Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album']
    })
    
    // 上传头像
    const avatarUrl = await userApi.uploadAvatar(res.tempFilePaths[0])
    console.log('头像地址:', avatarUrl)
  } catch (error) {
    console.error('上传失败:', error)
  }
}
```

## 请求工具使用

### GET 请求

```typescript
import request from '../utils/request'

const res = await request.get('/user/info')
```

### POST 请求

```typescript
import request from '../utils/request'

const res = await request.post('/user/update', {
  name: '新昵称'
})
```

### PUT 请求

```typescript
import request from '../utils/request'

const res = await request.put('/user/update', {
  name: '新昵称'
})
```

### DELETE 请求

```typescript
import request from '../utils/request'

const res = await request.delete('/user/delete', {
  id: 1
})
```

## 本地存储使用

### 保存数据

```typescript
import { storage } from '../utils/storage'

// 保存 token
await storage.setToken('your-token')

// 保存用户信息
await storage.setUserInfo({
  id: 1,
  name: '范特西',
  gender: 'male',
  avatarUrl: 'https://...',
  birthday: '2000-01-01'
})
```

### 获取数据

```typescript
import { storage } from '../utils/storage'

// 获取 token
const token = await storage.getToken()

// 获取用户信息
const userInfo = await storage.getUserInfo()
```

### 清除数据

```typescript
import { storage } from '../utils/storage'

// 清除所有登录信息
await storage.clearAll()
```

## 认证工具使用

### 登录

```typescript
import { auth } from '../utils/auth'

const loginRes = await auth.login()
```

### 退出登录

```typescript
import { auth } from '../utils/auth'

await auth.logout()
```

### 检查登录状态

```typescript
import { auth } from '../utils/auth'

const isLoggedIn = await auth.checkLogin()
```

### 获取 token

```typescript
import { auth } from '../utils/auth'

const token = await auth.getToken()
```

## 全局状态管理使用

### 获取用户信息

```typescript
import useUserStore from '../store/user'

function Component() {
  const { userInfo, isLoggedIn } = useUserStore()
  
  console.log('用户信息:', userInfo)
  console.log('是否登录:', isLoggedIn)
}
```

### 更新用户信息

```typescript
import useUserStore from '../store/user'

function Component() {
  const { setUserInfo } = useUserStore()
  
  const handleUpdate = () => {
    setUserInfo({
      id: 1,
      name: '新昵称',
      gender: 'male',
      avatarUrl: 'https://...',
      birthday: '2000-01-01'
    })
  }
}
```

### 退出登录

```typescript
import useUserStore from '../store/user'

function Component() {
  const { logout } = useUserStore()
  
  const handleLogout = () => {
    logout()
  }
}
```

## 注意事项

1. **token 自动携带**: 所有请求（除了登录接口）都会自动携带 token
2. **401 自动处理**: token 过期会自动跳转到登录页
3. **错误统一处理**: 所有错误都会统一处理并提示
4. **merchant_id**: 登录时会自动传递 merchant_id = 1
5. **日期格式**: 后端返回的日期是 ISO 格式，前端需要使用 `.split('T')[0]` 转换为 YYYY-MM-DD 格式
