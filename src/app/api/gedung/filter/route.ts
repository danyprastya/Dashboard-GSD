import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[API /api/gedung/filter] Missing environment variables");
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kawasan = searchParams.get("kawasan");
    const bulan = searchParams.get("bulan"); // Comma-separated: "Januari,Februari"
    const period1 = searchParams.get("period_1_20");
    const period2 = searchParams.get("period_21_30");

    console.log(`[API /api/gedung/filter] Filters:`, {
      kawasan,
      bulan,
      period_1_20: period1,
      period_21_30: period2
    });

    // Jika tidak ada filter status sama sekali, gunakan endpoint biasa
    if (!bulan && !period1 && !period2) {
      console.log("[API /api/gedung/filter] No status filters, fetching all gedung");
      
      let query = supabase.from("gedung").select("*");
      
      if (kawasan) {
        const kawasanUpper = kawasan.toUpperCase().replace("-", "");
        query = query.eq("kawasan", kawasanUpper);
      }
      
      query = query.order("kode_gedung", { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        data: data || [],
        total: data?.length || 0,
        filters: { kawasan, bulan, period_1_20: period1, period_21_30: period2 }
      });
    }

    // Query dengan filter status - gunakan approach tanpa JOIN
    // Step 1: Ambil gedung berdasarkan kawasan
    let gedungQuery = supabase.from("gedung").select("*");
    
    if (kawasan) {
      const kawasanUpper = kawasan.toUpperCase().replace("-", "");
      gedungQuery = gedungQuery.eq("kawasan", kawasanUpper);
    }
    
    gedungQuery = gedungQuery.order("kode_gedung", { ascending: true });
    
    const { data: gedungData, error: gedungError } = await gedungQuery;
    
    if (gedungError) {
      console.error("[API /api/gedung/filter] Error fetching gedung:", gedungError);
      throw gedungError;
    }

    if (!gedungData || gedungData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        filters: { kawasan, bulan, period_1_20: period1, period_21_30: period2 }
      });
    }

    // Step 2: Ambil status_bulanan dengan filter
    const kodeGedungList = gedungData.map(g => g.kode_gedung);
    
    let statusQuery = supabase
      .from("status_bulanan")
      .select("id_gedung, month, period_1_20, period_21_30")
      .in("id_gedung", kodeGedungList);

    // Filter bulan
    if (bulan) {
      const months = bulan.split(",").map(m => m.trim()).filter(m => m);
      if (months.length > 0) {
        statusQuery = statusQuery.in("month", months);
      }
    }

    // Filter period_1_20
    if (period1 && period1 !== "SEMUA") {
      statusQuery = statusQuery.eq("period_1_20", period1);
    }

    // Filter period_21_30
    if (period2 && period2 !== "SEMUA") {
      statusQuery = statusQuery.eq("period_21_30", period2);
    }

    const { data: statusData, error: statusError } = await statusQuery;

    if (statusError) {
      console.error("[API /api/gedung/filter] Error fetching status:", statusError);
      throw statusError;
    }

    // Step 3: Combine gedung dengan status untuk return
    // Create mapping dari statusData
    const statusMap = new Map<string, any>();
    statusData?.forEach(s => {
      const key = `${s.id_gedung}_${s.month}`;
      statusMap.set(key, s);
    });

    // Combine gedung data dengan status data
    const combinedData = gedungData
      .map(gedung => {
        // Find matching status for this gedung
        const matchingStatus = statusData?.find(s => s.id_gedung === gedung.kode_gedung);
        
        if (matchingStatus) {
          return {
            ...gedung,
            period_1_20: matchingStatus.period_1_20,
            period_21_30: matchingStatus.period_21_30,
            month: matchingStatus.month
          };
        }
        return null;
      })
      .filter(item => item !== null);

    // Remove duplicates if any
    const uniqueGedung = Array.from(
      new Map(combinedData.map(item => [item.kode_gedung, item])).values()
    );

    console.log(`[API /api/gedung/filter] Found ${uniqueGedung.length} buildings matching filters`);

    return NextResponse.json({
      success: true,
      data: uniqueGedung,
      total: uniqueGedung.length,
      filters: {
        kawasan,
        bulan,
        period_1_20: period1,
        period_21_30: period2
      }
    });

  } catch (error) {
    console.error("[API /api/gedung/filter] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Endpoint untuk mendapatkan list bulan yang tersedia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kawasan } = body;

    console.log(`[API /api/gedung/filter POST] Getting available months for kawasan: ${kawasan || "ALL"}`);

    // Jika ada kawasan, filter berdasarkan kawasan
    if (kawasan) {
      const kawasanUpper = kawasan.toUpperCase().replace("-", "");
      
      // Ambil semua kode_gedung dari kawasan tersebut
      const { data: gedungData, error: gedungError } = await supabase
        .from("gedung")
        .select("kode_gedung")
        .eq("kawasan", kawasanUpper);

      if (gedungError) {
        console.error("[API /api/gedung/filter POST] Error fetching gedung:", gedungError);
        return NextResponse.json(
          { error: "Failed to fetch gedung", details: gedungError.message },
          { status: 500 }
        );
      }

      const kodeGedungList = gedungData?.map(g => g.kode_gedung) || [];

      // Ambil bulan dari status_bulanan dengan filter kode_gedung (yang di DB disebut id_gedung)
      const { data: statusData, error: statusError } = await supabase
        .from("status_bulanan")
        .select("month")
        .in("id_gedung", kodeGedungList);

      if (statusError) {
        console.error("[API /api/gedung/filter POST] Error fetching status:", statusError);
        return NextResponse.json(
          { error: "Failed to fetch months", details: statusError.message },
          { status: 500 }
        );
      }

      // Get unique months dan sort
      const uniqueMonths = [...new Set(statusData?.map(item => item.month) || [])].sort((a, b) => {
        const monthOrder = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
      });

      console.log(`[API /api/gedung/filter POST] Found months:`, uniqueMonths);

      return NextResponse.json({
        success: true,
        months: uniqueMonths
      });
    } else {
      // Tanpa filter kawasan, ambil semua bulan
      const { data, error } = await supabase
        .from("status_bulanan")
        .select("month");

      if (error) {
        console.error("[API /api/gedung/filter POST] Error:", error);
        return NextResponse.json(
          { error: "Failed to fetch months", details: error.message },
          { status: 500 }
        );
      }

      // Get unique months dan sort
      const uniqueMonths = [...new Set(data?.map(item => item.month) || [])].sort((a, b) => {
        const monthOrder = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
      });

      console.log(`[API /api/gedung/filter POST] Found months:`, uniqueMonths);

      return NextResponse.json({
        success: true,
        months: uniqueMonths
      });
    }

  } catch (error) {
    console.error("[API /api/gedung/filter POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
