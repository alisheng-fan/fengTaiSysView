import type { RouteRecordRaw } from 'vue-router'
import type { MenuNode } from '@/types'

/** 按组件路径懒加载 src/views 下的页面（相对路径 glob，避免 Windows 盘符大小写导致路径解析失败） */
const viewModules = import.meta.glob('../views/**/*.vue')

function resolveComponent(componentPath: string) {
  const key = Object.keys(viewModules).find((k) => k.endsWith(`/views/${componentPath}.vue`))
  // 视图文件尚未创建时返回 undefined（路由仍登记，供测试与后续页面复用）；
  // 断言仅用于满足 vue-router 的 component 类型，运行时行为与旧版一致。
  return (key ? viewModules[key] : undefined) as () => Promise<{ [key: string]: any }>
}

/**
 * 菜单树 → 动态路由（拍平）：
 * 组节点（component 为空）只递归其 children，不生成路由；
 * 子路由 path 使用绝对路径，直接挂在 Layout 下。
 */
export function buildRoutes(menus: MenuNode[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  for (const m of menus) {
    if (m.component) {
      routes.push({
        path: m.path,
        name: m.name,
        component: resolveComponent(m.component),
        meta: {
          title: m.title ?? m.name,
          icon: m.icon,
          perms: m.perms,
          nodeId: m.id,
          fields: m.fields,
        },
      })
    }
    if (m.children?.length) {
      routes.push(...buildRoutes(m.children))
    }
  }
  return routes
}
