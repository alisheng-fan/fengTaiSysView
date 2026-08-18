import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { usePermissionStore } from '@/stores/permission'
import { perm } from './perm'

describe('directives/perm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('有权限时保留元素', () => {
    usePermissionStore().perms = ['system:user:add']
    const wrapper = mount({ template: `<div><button v-perm="'system:user:add'">新增</button></div>` }, { global: { directives: { perm } } })
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('无权限时移除元素', () => {
    usePermissionStore().perms = []
    const wrapper = mount({ template: `<div><button v-perm="'system:user:add'">新增</button></div>` }, { global: { directives: { perm } } })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('多权限任一命中即保留', () => {
    usePermissionStore().perms = ['system:user:edit']
    const wrapper = mount(
      { template: `<div><button v-perm="['system:user:add','system:user:edit']">操作</button></div>` },
      { global: { directives: { perm } } },
    )
    expect(wrapper.find('button').exists()).toBe(true)
  })
})
