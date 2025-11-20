import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return new Response("No file uploaded", { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({
      data: buffer,
    });
    const result = await parser.getText();
    const pdfText = result.text;

    console.log("Extracted PDF Text:", pdfText);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 512,
      chunkOverlap: 100,
    });

    const chunks = await splitter.splitText(pdfText);

    for await (const chunk of chunks) {

      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: chunk,
      });

      const { error } = await supabase.from("chunks").insert({
        content: chunk,
        vector: embedding,
      });

      if (error) {
        console.error("Error inserting chunk:", error);
      }
    }

    return new Response(
      `File uploaded and processed successfully. Extracted text: ${pdfText.substring(
        0,
        100
      )}`,
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response("Internal server error", { status: 500 });
  }
}
