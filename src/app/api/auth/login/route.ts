import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cache Supabase client untuk performa lebih baik
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables not configured");
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseClient;
}

export async function POST(request: NextRequest) {
  try {
    // Validasi environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[API /api/auth/login] ❌ Missing environment variables!");
      return NextResponse.json(
        { 
          error: "Server configuration error", 
          details: "Environment variables not configured properly" 
        },
        { status: 500 }
      );
    }

    // Gunakan cached Supabase client
    const supabase = getSupabaseClient();

    const body = await request.json();
    const { username, password } = body;

    // Validasi input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password harus diisi" },
        { status: 400 }
      );
    }

    // Sanitasi input - cegah SQL injection (walaupun Supabase sudah protect)
    const sanitizedUsername = username.trim();
    const sanitizedPassword = password.trim();

    console.log(`[API /api/auth/login] 🔍 Login attempt: ${sanitizedUsername}`);

    // Query ke tabel user dengan timeout
    const queryPromise = supabase
      .from("user")
      .select("USERNAME, PASSWORD, ROLE")
      .eq("USERNAME", sanitizedUsername)
      .eq("PASSWORD", sanitizedPassword)
      .single();

    // Timeout 10 detik untuk handle Supabase downtime
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database timeout")), 10000)
    );

    const { data, error } = await Promise.race([
      queryPromise,
      timeoutPromise
    ]).catch((err) => {
      console.error("[API /api/auth/login] ❌ Query timeout or error:", err);
      return { data: null, error: err };
    }) as any;

    if (error) {
      console.error("[API /api/auth/login] ❌ Supabase error:", {
        code: error.code,
        message: error.message
      });
      
      // Jika timeout atau connection error
      if (error.message === "Database timeout" || !error.code) {
        return NextResponse.json(
          { 
            error: "Server sedang mengalami gangguan", 
            details: "Silakan coba beberapa saat lagi" 
          },
          { status: 503 } // Service Unavailable
        );
      }
      
      // Jika data tidak ditemukan
      if (error.code === "PGRST116") {
        console.log("[API /api/auth/login] ⚠️ Invalid credentials");
        return NextResponse.json(
          { error: "Username atau password salah" },
          { status: 401 }
        );
      }

      // Error lainnya
      return NextResponse.json(
        { error: "Gagal melakukan login", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.log("[API /api/auth/login] ⚠️ No data returned");
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    console.log(`[API /api/auth/login] ✅ Login successful: ${sanitizedUsername} (${data.ROLE})`);

    return NextResponse.json({
      success: true,
      user: {
        username: data.USERNAME,
        role: data.ROLE
      }
    });

  } catch (error) {
    console.error("[API /api/auth/login] ❌ Unexpected error:", error);
    
    // Jangan expose internal error ke client
    return NextResponse.json(
      { 
        error: "Terjadi kesalahan pada server", 
        details: process.env.NODE_ENV === "development" ? String(error) : "Silakan hubungi administrator"
      },
      { status: 500 }
    );
  }
}
