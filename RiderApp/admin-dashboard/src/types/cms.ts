export type CMSStatus = 'Published' | 'Draft' | 'Archived'
export type CMSType = 'FAQ' | 'Announcement' | 'Banner' | 'Legal'

export interface CMSItem {
  id: string
  title: string
  content: string
  category?: string
  image_url?: string
  views: number
  status: string
  type: string
  created_at: string
  updated_at: string
}

export interface CMSStat {
  label: string
  value: string
  icon: any // LucideIcon
  color: string // tailwind border color class e.g. 'border-orange-500'
  iconBg: string // tailwind bg color class
  iconColor: string // tailwind text color class
}
