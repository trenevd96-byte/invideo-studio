import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createSupabaseClient = () => createClientComponentClient()

export const createSupabaseServerClient = () => createServerComponentClient({ cookies })