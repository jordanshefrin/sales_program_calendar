import { NextResponse } from "next/server";
import { querySnowflake } from "@/lib/snowflake";

// Sample query — update this to match your actual Snowflake schema
const PERFORMANCE_QUERY = `
  SELECT
    program_name,
    revenue,
    leads,
    conversion_rate,
    period
  FROM sales_program_performance
  ORDER BY period DESC
  LIMIT 50
`;

export async function GET() {
  // If Snowflake isn't configured, return sample data for development
  if (!process.env.SNOWFLAKE_ACCOUNT) {
    return NextResponse.json(getSampleData());
  }

  try {
    const rows = await querySnowflake(PERFORMANCE_QUERY);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Snowflake query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}

function getSampleData() {
  const programs = ["Enterprise Outbound", "SMB Inbound", "Partner Channel", "PLG Self-Serve"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return programs.flatMap((program) =>
    months.map((month) => ({
      program_name: program,
      revenue: Math.round(50000 + Math.random() * 150000),
      leads: Math.round(100 + Math.random() * 500),
      conversion_rate: +(5 + Math.random() * 20).toFixed(1),
      period: month,
    }))
  );
}
