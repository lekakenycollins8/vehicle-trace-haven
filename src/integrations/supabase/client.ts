// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://nwrckkjeexcwrvlkulxf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cmNra2plZXhjd3J2bGt1bHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNjk1OTYsImV4cCI6MjA0Nzk0NTU5Nn0.8RlVKXOw-7ooJmcQWU4S6mGQdrjF0pEQbT2twPn3LkY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);