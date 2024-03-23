import { goProTelemetry } from "gopro-telemetry";
import { NextResponse } from "next/server";
import { unzlibSync } from "fflate/node";
export async function POST(req) {
  try {
    const fd = await req.formData();
    const file = await fd.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "The request does not contain a file" },
        { status: 422 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const decompressedArray = unzlibSync(buffer);
    const decompressedBuffer = Buffer.from(decompressedArray);

    const telemetry = await goProTelemetry(
      { rawData: decompressedBuffer },
      {
        stream: ["GPS"],
        GPSFix: 3,
        preset: "geojson",
      }
    );

    return NextResponse.json({ data: telemetry }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
