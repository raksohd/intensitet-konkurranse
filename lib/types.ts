export type Profile = {
  id: string
  full_name: string
  is_admin: boolean
  is_active: boolean
  created_at: string
}
 
export type Registration = {
  id: string
  user_id: string
  date: string
  minutes: number
  created_at: string
  updated_at: string
}
