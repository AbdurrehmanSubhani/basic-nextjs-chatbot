import { streamText, convertToModelMessages, tool, embed, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: openai("gpt-4o"),
      system:
        "You are a helpful assistant. Use the searchDocuments tool to retrieve relevant information from uploaded documents when answering questions.",
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(3),
      tools: {
        searchDocuments: tool({
          description:
            "Retrieve relevant information from uploaded PDF documents by performing a semantic search using vector embeddings. This tool helps provide accurate, document-based answers to user questions by finding the most semantically similar content.",
          inputSchema: z.object({
            query: z
              .string()
              .describe("A detailed search query that captures the key concepts, entities, and context from the user's question. Include specific terms and topics to maximize retrieval accuracy for vector-based semantic search."),
          }),
          execute: async ({ query }: { query: string }) => {
            
            console.log('Searching documents for query:', query);

            const { embedding } = await embed({
              model: openai.textEmbeddingModel("text-embedding-3-small"),
              value: query,
            });
            
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: docs } = await supabase.rpc("get_relevant_chunks", {
              query_vector: embedding,
              match_threshold: 0.0,
              match_count: 1,
            });

            return (
              docs?.map((doc: any) => doc.content).join("\n") ||
              "No relevant documents found."
            );
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    throw new Response("Internal server error", { status: 500 });
  }
}
