import { defineStore } from 'pinia'
import { getProjectList } from '@shared/api/system'
import type { ProjectItem } from '@shared/types'

/** 项目 store */
export const useProjectStore = defineStore('project', {
  state: () => ({ projects: [] as ProjectItem[] }),
  actions: {
    async loadProjects() {
      this.projects = await getProjectList()
    },
  },
})
