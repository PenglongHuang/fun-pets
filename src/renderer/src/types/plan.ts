export interface Plan {
  id: string
  title: string
  startDate: string
  endDate: string | null
  filePath: string
  color: string
  planType: PlanType
  createdAt: string
  updatedAt: string
}

export type PlanType = 'daily' | 'weekly' | 'monthly' | 'neutral'
