import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const kawasan = searchParams.get("kawasan");

    console.log(`[API /api/gedung] Fetching data for kawasan: ${kawasan || "ALL"}`);

    // Build query
    let query = supabase.from("gedung").select("*");

    // Filter by kawasan if provided
    if (kawasan) {
      // Convert URL parameter to uppercase to match database values
      const kawasanUpper = kawasan.toUpperCase().replace("-", "");
      query = query.eq("kawasan", kawasanUpper);
    }

    // Order by kode_gedung
    query = query.order("kode_gedung", { ascending: true });

    // Fetch all data with pagination
    const batchSize = 1000;
    let allData: any[] = [];
    let fetchedCount = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error, count } = await query
        .range(fetchedCount, fetchedCount + batchSize - 1);

      if (error) {
        console.error("[API /api/gedung] Supabase error:", error);
        return NextResponse.json(
          { error: "Failed to fetch data from database", details: error.message },
          { status: 500 }
        );
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        fetchedCount += data.length;
        console.log(`[API /api/gedung] Batch fetched: ${data.length} records (total: ${fetchedCount})`);

        // If we got less than batchSize, we've reached the end
        if (data.length < batchSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`[API /api/gedung] Total records fetched: ${allData.length}`);

    return NextResponse.json({
      success: true,
      data: allData,
      total: allData.length,
      kawasan: kawasan || "ALL"
    });

  } catch (error) {
    console.error("[API /api/gedung] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
