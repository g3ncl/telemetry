import { goProTelemetry } from "gopro-telemetry";
import { NextResponse } from "next/server";
export async function POST(req) {
  try {
    const { binaryData } = await req.json();

    const binaryDataBuffer = Buffer.from(binaryData, "base64");
    const uint8Array = new Uint8Array(binaryDataBuffer);
    const geojsonData = await goProTelemetry(
      { rawData: uint8Array },
      {
        stream: ["GPS"],
        GPSFix: 2,
        preset: "geojson",
      }
    );
    return NextResponse.json({ data: geojsonData }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
