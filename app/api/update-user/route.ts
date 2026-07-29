import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_FIELDS = ['name', 'bio', 'avatar_url', 'username', 'website', 'nationality', 'email', 'birth_date', 'categories', 'discipline', 'user_type'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auth_id, ...fields } = body;
    if (!auth_id) return NextResponse.json({ error: 'Missing auth_id' }, { status: 400 });

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user || user.id !== auth_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const safeFields = Object.fromEntries(
      Object.entries(fields).filter(([k]) => ALLOWED_FIELDS.includes(k))
    );
    if (Object.keys(safeFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
    }

    // Validazione lunghezza campi testo
    if (typeof safeFields.username === 'string' && (safeFields.username.length < 3 || safeFields.username.length > 30))
      return NextResponse.json({ error: 'Username must be 3-30 chars' }, { status: 400 });
    if (typeof safeFields.name === 'string' && safeFields.name.length > 80)
      return NextResponse.json({ error: 'Name too long' }, { status: 400 });
    if (typeof safeFields.bio === 'string' && safeFields.bio.length > 500)
      return NextResponse.json({ error: 'Bio too long' }, { status: 400 });
    if (typeof safeFields.website === 'string' && safeFields.website.length > 200)
      return NextResponse.json({ error: 'Website too long' }, { status: 400 });

    const { error } = await admin.from('users').update(safeFields).eq('auth_id', auth_id);
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
