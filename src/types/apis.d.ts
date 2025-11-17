export interface Food {
  id: string
  name: string
  category: string
  purine: number
  level: string
  image: string
  description: string
}

export interface UricAcidRecord {
  id: string
  user_id: string
  date: string | number // 日期
  uric_acid: number // 尿酸值
  note: string // 备注
}
