import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "campaigns.json");

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all campaigns metadata
export async function GET() {
  try {
    const data = readData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

// POST new campaign metadata
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description } = body;

    if (id === undefined || !name || !description) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const data = readData();
    data[id] = { name, description };
    writeData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to write data" }, { status: 500 });
  }
}
