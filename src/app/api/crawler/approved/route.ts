/**
 * API Route: GET /api/crawler/approved
 * 
 * Endpoint untuk fetch data APPROVED dari database
 * Digunakan oleh crawler periode 21-30 untuk mendapatkan list gedung yang perlu di-check
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    // Validate API Key
    const apiKey = request.headers.get('X-API-Key');
    
    if (apiKey !== process.env.CRAWLER_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const month = searchParams.get('month');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    if (!area) {
      return NextResponse.json(
        { success: false, error: 'Area parameter required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Build query
    let query = supabase
      .from('status_bulanan')
      .select('*')
      .eq('area', area)
      .eq('year', year)
      .eq('period_1_20', 'APPROVED'); // Only APPROVED records

    // Optional: Filter by month
    if (month) {
      query = query.eq('month', month);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Database query failed' },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${data.length} APPROVED records for area: ${area}`);

    return NextResponse.json({
      success: true,
      records: data,
      count: data.length,
      filters: { area, month, year },
    });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
