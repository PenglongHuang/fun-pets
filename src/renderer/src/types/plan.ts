export interface Plan {
  id: string
  title: string
  startDate: string
  endDate: string | null
  filePath: string
  color: string
  planType: PlanType
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export type PlanType = 'daily' | 'weekly' | 'monthly' | 'neutral'
