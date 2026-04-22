export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/BrowseMenuList/BrowseMenuList',
    'pages/ShoppingCart/ShoppingCart',
    'pages/PlaceAnOrderPayment/PlaceAnOrderPayment',
    'pages/CheckOrderStatus/CheckOrderStatus',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#000000ff',
    selectedColor: '#1989fa',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: '../../assets/tabbar/home.png',
        selectedIconPath: '../../assets/tabbar/home_active.png'
      },
      {
        pagePath: 'pages/BrowseMenuList/BrowseMenuList',
        text: '菜单',
        iconPath: '../../assets/tabbar/shopping-bag.png',
        selectedIconPath: '../../assets/tabbar/shopping-bag_active.png'
      },
      {
        pagePath: 'pages/ShoppingCart/ShoppingCart',
        text: '订单记录',
        iconPath: '../../assets/tabbar/view-list.png',
        selectedIconPath: '../../assets/tabbar/view-list_active.png'
      },
      {
        pagePath: 'pages/CheckOrderStatus/CheckOrderStatus',
        text: '个人中心',
        iconPath: '../../assets/tabbar/user.png',
        selectedIconPath: '../../assets/tabbar/user_active.png'
      }
    ]
  }
})
