export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/BrowseMenuList/index',
    'pages/ShoppingCart/index',
    'pages/PlaceAnOrderPayment/index',
    'pages/CheckOrderStatus/index',
    'pages/EditProfile/index',
    'pages/OrderDetail/index',
    'pages/SearchDish/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#424141ff',
    selectedColor: '#000000ff',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home_active.png'
      },
      {
        pagePath: 'pages/BrowseMenuList/index',
        text: '菜单',
        iconPath: 'assets/tabbar/shopping-bag.png',
        selectedIconPath: 'assets/tabbar/shopping-bag_active.png'
      },
      {
        pagePath: 'pages/ShoppingCart/index',
        text: '订单记录',
        iconPath: 'assets/tabbar/view-list.png',
        selectedIconPath: 'assets/tabbar/view-list_active.png'
      },
      {
        pagePath: 'pages/CheckOrderStatus/index',
        text: '个人中心',
        iconPath: 'assets/tabbar/user.png',
        selectedIconPath: 'assets/tabbar/user_active.png'
      }
    ]
  }
})
